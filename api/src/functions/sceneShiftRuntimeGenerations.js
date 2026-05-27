const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('node:crypto');
const path = require('node:path');
const zlib = require('node:zlib');

const STATE_FAILED = 5;
const STATE_RUNTIME_BACKEND_SUBMITTED = 9;
const STATE_RUNTIME_MODEL_READY = 10;

const DEFAULT_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';
const DEFAULT_MODEL = 'doubao-seed3d-2-0-260328';
const DEFAULT_DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash';
const DEFAULT_APIMART_IMAGE_ENDPOINT = 'https://api.apimart.ai/v1/images/generations';
const DEFAULT_APIMART_TASK_ENDPOINT_BASE = 'https://api.apimart.ai/v1/tasks';
const DEFAULT_IMAGE2_MODEL = 'gpt-image-2';

function getSetting(name) {
  return process.env[name] || process.env[`APPSETTING_${name}`];
}

const containerName = getSetting('SCENESHIFT_UPLOAD_CONTAINER') || 'scene-shift';

function configuredProvider() {
  return (getSetting('SCENESHIFT_BACKEND_PROVIDER') || 'seed3d').toLowerCase().replace(/_/g, '-');
}

function isFullChainProvider(provider) {
  return [
    'full-chain',
    'fullchain',
    'deepseek-image2-seed3d',
    'deepseek-v4-image2-seed3d'
  ].includes(String(provider || '').toLowerCase().replace(/_/g, '-'));
}

function isSeed3DProvider(provider) {
  return String(provider || '').toLowerCase().replace(/_/g, '-') === 'seed3d';
}

function isSupportedProvider(provider) {
  return isSeed3DProvider(provider) || isFullChainProvider(provider);
}

function getFirstSetting(names) {
  for (const name of names) {
    const value = getSetting(name);
    if (value) return value;
  }
  return '';
}

function getContainer() {
  const conn = getSetting('AZURE_STORAGE_CONNECTION_STRING');
  if (!conn) throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING');
  return BlobServiceClient.fromConnectionString(conn).getContainerClient(containerName);
}

function utcNow() {
  return new Date().toISOString();
}

function safeId(value, fallback = 'job') {
  const cleaned = String(value || fallback).replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^[-._]+|[-._]+$/g, '');
  return (cleaned || fallback).slice(0, 80);
}

function shortUuid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function runtimeBlob(jobId, name) {
  return `runtime-generations/${jobId}/${name}`;
}

async function ensureContainer() {
  const container = getContainer();
  await container.createIfNotExists();
  return container;
}

async function uploadJson(container, blobName, payload) {
  await container.getBlockBlobClient(blobName).uploadData(Buffer.from(JSON.stringify(payload, null, 2)), {
    blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' }
  });
}

async function uploadText(container, blobName, text, contentType = 'text/plain; charset=utf-8') {
  await container.getBlockBlobClient(blobName).uploadData(Buffer.from(text || '', 'utf8'), {
    blobHTTPHeaders: { blobContentType: contentType }
  });
}

async function uploadBuffer(container, blobName, buffer, contentType) {
  await container.getBlockBlobClient(blobName).uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType || 'application/octet-stream' }
  });
}

async function readJson(container, blobName) {
  const blob = container.getBlockBlobClient(blobName);
  if (!(await blob.exists())) return null;
  const buffer = await blob.downloadToBuffer();
  return JSON.parse(buffer.toString('utf8'));
}

async function updateJob(container, jobId, changes) {
  const blobName = runtimeBlob(jobId, 'job.json');
  const existing = (await readJson(container, blobName)) || {};
  const updated = { ...existing, ...changes, updated_at: utcNow() };
  await uploadJson(container, blobName, updated);
  return updated;
}

function publicApiBase(request) {
  const configured = getSetting('SCENESHIFT_PUBLIC_API_BASE_URL');
  if (configured) return configured.replace(/\/+$/, '');
  return `${new URL(request.url).origin}/api`;
}

function statusUrl(jobId, request) {
  return `${publicApiBase(request)}/v1/runtime-generations/${encodeURIComponent(jobId)}`;
}

function fileUrl(jobId, fileName, request) {
  return `${publicApiBase(request)}/v1/runtime-generations/${encodeURIComponent(jobId)}/files/${encodeURIComponent(fileName)}`;
}

function resultFromJob(job, request) {
  const jobId = job.job_id || '';
  return {
    RequestId: job.request_id || '',
    ObjectId: job.object_id || '',
    ThemeId: job.theme_id || '',
    StyleVariantId: job.style_variant_id || 'preset',
    RuntimeBackendJobId: jobId,
    RuntimeBackendStatusUrl: jobId ? statusUrl(jobId, request) : '',
    RuntimeModelUrl: job.model_url || '',
    RuntimeModelMimeType: job.model_mime_type || '',
    RuntimeModelHash: job.model_hash || '',
    Progress01: Number(job.progress01 || 0),
    OutputState: Number(job.output_state || STATE_RUNTIME_BACKEND_SUBMITTED),
    FailureReason: job.failure_reason || '',
    StatusNote: job.status_note || '',
    CreatedAtIsoUtc: job.updated_at || utcNow()
  };
}

function jsonResponse(status, body) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    },
    jsonBody: body
  };
}

function fileResponse(status, buffer, contentType) {
  return {
    status,
    headers: {
      'content-type': contentType || 'application/octet-stream',
      'cache-control': 'public, max-age=86400'
    },
    body: buffer
  };
}

function buildJobRecord(jobId, metadata, outputState, statusNote, extra = {}) {
  const now = utcNow();
  return {
    job_id: jobId,
    provider: configuredProvider(),
    request_id: metadata.RequestId || '',
    object_id: metadata.ObjectId || '',
    theme_id: metadata.ThemeId || '',
    style_variant_id: metadata.StyleVariantId || 'preset',
    output_state: outputState,
    status_note: statusNote,
    failure_reason: '',
    progress01: outputState === STATE_FAILED ? 0 : 0.05,
    created_at: now,
    updated_at: now,
    ...extra
  };
}

async function parseSubmission(request) {
  const contentType = request.headers.get('content-type') || '';
  const fields = {};
  let image = null;

  if (contentType.toLowerCase().includes('multipart/form-data')) {
    const form = await request.formData();
    for (const name of ['metadata', 'request_json', 'prompt_text']) {
      const value = form.get(name);
      if (typeof value === 'string') fields[name] = value;
    }

    const file = form.get('image');
    if (file && typeof file.arrayBuffer === 'function') {
      const buffer = Buffer.from(await file.arrayBuffer());
      image = {
        buffer,
        fileName: safeId(file.name || 'source.png', 'source.png'),
        mimeType: file.type || 'image/png'
      };
    }
  } else {
    const buffer = Buffer.from(await request.arrayBuffer());
    fields.metadata = buffer.toString('utf8');
  }

  const metadata = JSON.parse(fields.metadata || '{}');
  if (fields.request_json && !metadata.SourceRequestJson) metadata.SourceRequestJson = fields.request_json;
  if (fields.prompt_text && !metadata.PromptText) metadata.PromptText = fields.prompt_text;
  return { fields, metadata, image };
}

async function createJob(container, submission) {
  const metadata = submission.metadata;
  const requestId = metadata.RequestId || `request-${shortUuid()}`;
  const jobId = `${safeId(requestId)}-${shortUuid()}`;

  await uploadJson(container, runtimeBlob(jobId, 'metadata.json'), metadata);
  if (metadata.SourceRequestJson) {
    await uploadText(container, runtimeBlob(jobId, 'request.json'), metadata.SourceRequestJson, 'application/json; charset=utf-8');
  }
  if (metadata.PromptText) {
    await uploadText(container, runtimeBlob(jobId, 'prompt.txt'), metadata.PromptText);
  }

  const extra = {};
  if (submission.image) {
    const imageHash = sha256(submission.image.buffer);
    const imageName = safeId(submission.image.fileName || 'source.png', 'source.png');
    await uploadBuffer(container, runtimeBlob(jobId, imageName), submission.image.buffer, submission.image.mimeType);
    Object.assign(extra, {
      image_blob: runtimeBlob(jobId, imageName),
      image_file_name: imageName,
      image_mime_type: submission.image.mimeType,
      image_sha256: imageHash,
      image_byte_length: submission.image.buffer.length
    });

    const expectedHash = metadata.SourceImageSha256 || '';
    if (expectedHash && expectedHash.toLowerCase() !== imageHash) {
      const failed = buildJobRecord(
        jobId,
        metadata,
        STATE_FAILED,
        'Runtime backend rejected a corrupted image upload.',
        extra
      );
      failed.failure_reason = `Uploaded image hash mismatch: expected ${expectedHash}, got ${imageHash}.`;
      await uploadJson(container, runtimeBlob(jobId, 'job.json'), failed);
      return { jobId, job: failed };
    }
  }

  const job = buildJobRecord(
    jobId,
    metadata,
    STATE_RUNTIME_BACKEND_SUBMITTED,
    'Runtime backend accepted the Quest upload and queued generation.',
    extra
  );
  await uploadJson(container, runtimeBlob(jobId, 'job.json'), job);
  await uploadJson(container, runtimeBlob(jobId, 'submission.snapshot.json'), {
    metadata,
    fields: submission.fields,
    image: extra
  });
  return { jobId, job };
}

function buildSeed3DPrompt(metadata) {
  const subdivision = safeCommandToken(getSetting('SEED3D_SUBDIVISION_LEVEL') || 'low');
  const fileFormat = safeCommandToken(getSetting('SEED3D_FILE_FORMAT') || 'glb');
  return `--subdivisionlevel ${subdivision} --fileformat ${fileFormat}`;
}

function safeCommandToken(value) {
  return String(value || '').replace(/[^A-Za-z0-9_.-]/g, '') || 'low';
}

async function httpJson(method, url, payload, apiKey) {
  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${apiKey}`,
      ...(payload ? { 'content-type': 'application/json' } : {})
    },
    body: payload ? JSON.stringify(payload) : undefined
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${url} failed: ${response.status} ${text.slice(0, 800)}`);
  }
  return text.trim() ? JSON.parse(text) : {};
}

function findFirstKey(payload, keys) {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = findFirstKey(item, keys);
      if (found) return found;
    }
    return null;
  }
  if (payload && typeof payload === 'object') {
    for (const key of keys) {
      if (payload[key]) return payload[key];
    }
    for (const value of Object.values(payload)) {
      const found = findFirstKey(value, keys);
      if (found) return found;
    }
  }
  return null;
}

function findModelUrl(payload) {
  const found = findFirstKey(payload, ['file_url', 'model_url', 'download_url', 'url']);
  if (typeof found === 'string' && found.startsWith('http')) return found;
  const match = JSON.stringify(payload).match(/https?:\/\/[^"\\\s]+/);
  return match ? match[0] : '';
}

function findImageUrl(payload) {
  const found = findFirstKey(payload, ['image_url', 'image', 'file_url', 'download_url', 'url']);
  if (typeof found === 'string' && found.startsWith('http')) return found;
  const match = JSON.stringify(payload).match(/https?:\/\/[^"\\\s]+/);
  return match ? match[0] : '';
}

function isSuccessStatus(status) {
  return ['succeeded', 'success', 'completed', 'done'].includes(String(status || '').toLowerCase());
}

function isFailureStatus(status) {
  return ['failed', 'error', 'cancelled', 'canceled'].includes(String(status || '').toLowerCase());
}

function numberSetting(name, fallback) {
  const value = Number(getSetting(name));
  return Number.isFinite(value) ? value : fallback;
}

function booleanSetting(name, fallback) {
  const value = getSetting(name);
  if (value == null || value === '') return fallback;
  return !['0', 'false', 'no', 'off'].includes(String(value).toLowerCase());
}

function shortenText(value, maxLength) {
  const text = String(value || '');
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

function stripJsonFences(value) {
  let text = String(value || '').trim();
  if (text.startsWith('```')) {
    const firstNewline = text.indexOf('\n');
    if (firstNewline >= 0) text = text.slice(firstNewline + 1);
    const lastFence = text.lastIndexOf('```');
    if (lastFence >= 0) text = text.slice(0, lastFence);
  }
  return text.trim();
}

function buildDeepSeekSystemPrompt() {
  return [
    'You are the backend planner for SceneShift, a Meta Quest mixed-reality room stylization prototype.',
    'Convert the user intent and target-object metadata into concrete prompts for generating one replacement furniture asset.',
    'Output valid JSON only. Do not include Markdown or explanations.',
    'Preserve the real object function, footprint, proportions, bottom contact/support surfaces, dominant yaw, and room readability.',
    'Do not invent extra furniture, people, walls, floor, ceiling, labels, UI text, or unrelated background.',
    'The image_generation_prompt must describe a single isolated stylized object suitable as a reference image for Seed3D.',
    'For gpt-image-2, request an opaque plain white or light gray studio background. Do not request transparent backgrounds or green chroma-key backgrounds.',
    'The JSON schema is:',
    '{',
    '  "global_style_summary": "one concise sentence",',
    '  "style_keywords": ["5 to 8 visual keywords"],',
    '  "material_keywords": ["3 to 6 material keywords"],',
    '  "color_keywords": ["3 to 6 color or lighting keywords"],',
    '  "motif_keywords": ["3 to 6 motif/detail keywords"],',
    '  "negative_style_keywords": ["3 to 8 things to avoid"],',
    '  "object_style_directive": "one sentence preserving function and geometry",',
    '  "image_generation_prompt": "prompt for image2/gpt-image-2",',
    '  "negative_prompt": "compact negative prompt"',
    '}'
  ].join('\n');
}

function buildDeepSeekUserPrompt(metadata) {
  const promptData = {
    user_style_intent: metadata.UserStyleIntent || metadata.PromptText || metadata.ThemeId || '',
    theme_id: metadata.ThemeId || '',
    style_variant_id: metadata.StyleVariantId || '',
    semantic_label: metadata.SemanticLabel || '',
    function_tag: metadata.FunctionTag || '',
    object_id: metadata.ObjectId || '',
    target_length_meters: metadata.TargetLengthMeters || '',
    target_width_meters: metadata.TargetWidthMeters || '',
    target_height_meters: metadata.TargetHeightMeters || '',
    target_aspect_ratio: metadata.TargetAspectRatio || '',
    vertical_fit_mode: metadata.VerticalFitMode || '',
    original_prompt_text: metadata.PromptText || '',
    source_request_json_preview: shortenText(metadata.SourceRequestJson || '', 1800)
  };
  return `SceneShift target metadata:\n${JSON.stringify(promptData, null, 2)}`;
}

function extractDeepSeekContent(response) {
  const error = findFirstKey(response, ['message']);
  if (response && response.error && response.error.message) {
    throw new Error(response.error.message);
  }
  const content = response?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`DeepSeek response did not include assistant content: ${shortenText(JSON.stringify(response), 400)}`);
  }
  if (response?.error && error) throw new Error(String(error));
  return content;
}

async function requestDeepSeekPlan(container, jobId, metadata) {
  const apiKey = getSetting('DEEPSEEK_API_KEY');
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set in the Azure Function environment.');
  }

  const payload = {
    model: getSetting('DEEPSEEK_MODEL') || DEFAULT_DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: buildDeepSeekSystemPrompt() },
      { role: 'user', content: buildDeepSeekUserPrompt(metadata) }
    ],
    stream: false,
    temperature: numberSetting('DEEPSEEK_TEMPERATURE', 0.2),
    max_tokens: Math.max(256, Math.floor(numberSetting('DEEPSEEK_MAX_TOKENS', 900))),
    response_format: { type: 'json_object' }
  };
  if (booleanSetting('DEEPSEEK_DISABLE_THINKING', true)) {
    payload.thinking = { type: 'disabled' };
  }

  await uploadJson(container, runtimeBlob(jobId, 'deepseek.request.json'), payload);
  const endpoint = getSetting('DEEPSEEK_ENDPOINT_URL') || DEFAULT_DEEPSEEK_ENDPOINT;
  const response = await httpJson('POST', endpoint, payload, apiKey);
  await uploadJson(container, runtimeBlob(jobId, 'deepseek.response.json'), response);

  const content = stripJsonFences(extractDeepSeekContent(response));
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`DeepSeek content was not valid JSON: ${String(error.message || error)} | ${shortenText(content, 400)}`);
  }

  const plan = {
    global_style_summary: parsed.global_style_summary || '',
    style_keywords: Array.isArray(parsed.style_keywords) ? parsed.style_keywords : [],
    material_keywords: Array.isArray(parsed.material_keywords) ? parsed.material_keywords : [],
    color_keywords: Array.isArray(parsed.color_keywords) ? parsed.color_keywords : [],
    motif_keywords: Array.isArray(parsed.motif_keywords) ? parsed.motif_keywords : [],
    negative_style_keywords: Array.isArray(parsed.negative_style_keywords) ? parsed.negative_style_keywords : [],
    object_style_directive: parsed.object_style_directive || '',
    image_generation_prompt: parsed.image_generation_prompt || '',
    negative_prompt: parsed.negative_prompt || '',
    source: `deepseek_api:${payload.model}`,
    created_at: utcNow()
  };
  await uploadJson(container, runtimeBlob(jobId, 'deepseek.plan.json'), plan);
  return plan;
}

function buildFallbackImage2Prompt(metadata, plan) {
  const style = [
    plan.global_style_summary,
    ...(plan.style_keywords || []),
    ...(plan.material_keywords || []),
    ...(plan.color_keywords || []),
    ...(plan.motif_keywords || [])
  ].filter(Boolean).join(', ');
  const semantic = metadata.SemanticLabel || metadata.FunctionTag || 'furniture object';
  const size = `Preserve target proportions and footprint: length=${metadata.TargetLengthMeters || 0}m, width=${metadata.TargetWidthMeters || 0}m, height=${metadata.TargetHeightMeters || 0}m.`;
  return [
    `Create one isolated stylized ${semantic} replacement asset reference image.`,
    style ? `Visual direction: ${style}.` : '',
    plan.object_style_directive || metadata.PromptText || '',
    size,
    'Use an opaque plain white or light gray studio background.',
    'Preserve the original object role, dominant silhouette, bottom support/contact surfaces, and real-world usability.',
    'Do not include room background, walls, floors, other furniture, people, labels, UI, text, watermarks, multiple objects, transparent background, checkerboard background, or green chroma-key background.'
  ].filter(Boolean).join('\n');
}

function buildImage2Prompt(metadata, plan) {
  const primary = String(plan.image_generation_prompt || '').trim();
  const negative = String(plan.negative_prompt || '').trim();
  const prompt = primary || buildFallbackImage2Prompt(metadata, plan);
  const backgroundPolicy = [
    'Final background requirement: use an opaque plain white or light gray studio background.',
    'Do not use transparent alpha, fake checkerboard transparency, green chroma key, colored key screens, room backgrounds, floor planes, walls, or shadows cast onto a visible floor.'
  ].join(' ');
  const guardedPrompt = `${prompt}\n\n${backgroundPolicy}`;
  return negative ? `${guardedPrompt}\n\nAvoid: ${negative}` : guardedPrompt;
}

async function submitImage2(container, job, metadata, plan) {
  const apiKey = getFirstSetting(['APIMART_API_KEY', 'IMAGE2_API_KEY']);
  if (!apiKey) {
    throw new Error('APIMART_API_KEY or IMAGE2_API_KEY is not set in the Azure Function environment.');
  }
  if (!job.image_blob) {
    throw new Error('Quest upload did not include a readable image file for image2.');
  }

  const imageBuffer = await container.getBlockBlobClient(job.image_blob).downloadToBuffer();
  const imageMime = job.image_mime_type || 'image/png';
  const prompt = buildImage2Prompt(metadata, plan);
  await uploadText(container, runtimeBlob(job.job_id, 'image2.prompt.txt'), prompt);

  const payload = {
    model: getSetting('APIMART_IMAGE_MODEL') || getSetting('IMAGE2_MODEL') || DEFAULT_IMAGE2_MODEL,
    prompt,
    n: Math.max(1, Math.floor(numberSetting('APIMART_IMAGE_COUNT', 1))),
    size: getSetting('APIMART_IMAGE_SIZE') || getSetting('IMAGE2_SIZE') || '1:1'
  };
  if (booleanSetting('APIMART_INCLUDE_REFERENCE_IMAGE', true)) {
    payload.image_urls = [`data:${imageMime};base64,${imageBuffer.toString('base64')}`];
  }

  await uploadJson(container, runtimeBlob(job.job_id, 'image2.request.json'), payload);
  const endpoint = getSetting('APIMART_IMAGE_GENERATION_ENDPOINT') || getSetting('IMAGE2_GENERATION_ENDPOINT') || DEFAULT_APIMART_IMAGE_ENDPOINT;
  const response = await httpJson('POST', endpoint, payload, apiKey);
  await uploadJson(container, runtimeBlob(job.job_id, 'image2.create.response.json'), response);

  const taskId = findFirstKey(response, ['task_id', 'id']);
  if (!taskId) {
    throw new Error(`image2 create response did not include task_id/id: ${shortenText(JSON.stringify(response), 400)}`);
  }

  return updateJob(container, job.job_id, {
    image2_task_id: String(taskId),
    image2_task_endpoint_base: getSetting('APIMART_TASK_ENDPOINT_BASE') || getSetting('IMAGE2_TASK_ENDPOINT_BASE') || DEFAULT_APIMART_TASK_ENDPOINT_BASE,
    image2_model: payload.model,
    image2_prompt_blob: runtimeBlob(job.job_id, 'image2.prompt.txt'),
    status_note: `DeepSeek plan completed; image2 task ${taskId} submitted.`,
    progress01: 0.18
  });
}

async function submitFullChainInitial(container, jobId, request) {
  let job = await readJson(container, runtimeBlob(jobId, 'job.json'));
  const provider = job.provider || configuredProvider();
  if (!isFullChainProvider(provider)) {
    return updateJob(container, jobId, {
      output_state: STATE_FAILED,
      failure_reason: `Unsupported SCENESHIFT_BACKEND_PROVIDER '${provider}' for full-chain submit.`,
      status_note: 'Runtime backend provider configuration failed.',
      progress01: 0
    });
  }

  const missing = [];
  if (!getSetting('DEEPSEEK_API_KEY')) missing.push('DEEPSEEK_API_KEY');
  if (!getFirstSetting(['APIMART_API_KEY', 'IMAGE2_API_KEY'])) missing.push('APIMART_API_KEY or IMAGE2_API_KEY');
  if (!getSetting('ARK_API_KEY')) missing.push('ARK_API_KEY');
  if (missing.length > 0) {
    return updateJob(container, jobId, {
      output_state: STATE_FAILED,
      failure_reason: `Missing backend environment variable(s): ${missing.join(', ')}.`,
      status_note: 'Full-chain provider could not start.',
      progress01: 0
    });
  }

  if (!job.image_blob) {
    return updateJob(container, jobId, {
      output_state: STATE_FAILED,
      failure_reason: 'Quest upload did not include a readable image file.',
      status_note: 'Full-chain provider requires the captured crop image.',
      progress01: 0
    });
  }

  const metadata = (await readJson(container, runtimeBlob(jobId, 'metadata.json'))) || {};
  job = await updateJob(container, jobId, {
    status_note: 'Full-chain backend requesting DeepSeek style plan.',
    progress01: 0.08
  });
  const plan = await requestDeepSeekPlan(container, jobId, metadata);
  job = await updateJob(container, jobId, {
    deepseek_plan_blob: runtimeBlob(jobId, 'deepseek.plan.json'),
    status_note: 'DeepSeek style plan ready; submitting image2 job.',
    progress01: 0.12
  });
  return submitImage2(container, job, metadata, plan, request);
}

async function downloadGeneratedImageToBlob(container, job, imageUrl) {
  const response = await fetch(imageUrl, { headers: { 'user-agent': 'SceneShiftRuntimeAzureBackend/1.0' } });
  if (!response.ok) {
    throw new Error(`image2 output download failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = /jpe?g/i.test(contentType) ? 'jpg' : /webp/i.test(contentType) ? 'webp' : 'png';
  const fileName = `stylized-image.${extension}`;
  const blobName = runtimeBlob(job.job_id, fileName);
  await uploadBuffer(container, blobName, buffer, contentType);
  return {
    blobName,
    fileName,
    contentType,
    hash: sha256(buffer),
    byteLength: buffer.length
  };
}

async function pollImage2Once(container, job) {
  const apiKey = getFirstSetting(['APIMART_API_KEY', 'IMAGE2_API_KEY']);
  if (!apiKey) {
    return updateJob(container, job.job_id, {
      status_note: 'image2 polling skipped because APIMART_API_KEY/IMAGE2_API_KEY is missing.',
      failure_reason: 'APIMART_API_KEY or IMAGE2_API_KEY is not set in the Azure Function environment.',
      output_state: STATE_FAILED,
      progress01: 0
    });
  }

  const taskId = job.image2_task_id;
  if (!taskId) return job;

  try {
    const base = job.image2_task_endpoint_base || getSetting('APIMART_TASK_ENDPOINT_BASE') || getSetting('IMAGE2_TASK_ENDPOINT_BASE') || DEFAULT_APIMART_TASK_ENDPOINT_BASE;
    const pollUrl = `${base.replace(/\/+$/, '')}/${encodeURIComponent(taskId)}`;
    const response = await httpJson('GET', pollUrl, null, apiKey);
    await uploadJson(container, runtimeBlob(job.job_id, 'image2.poll.response.json'), response);

    const status = String(findFirstKey(response, ['status', 'state']) || '').toLowerCase();
    const nextAttempt = Number(job.image2_poll_attempts || 0) + 1;
    if (isFailureStatus(status)) {
      return updateJob(container, job.job_id, {
        output_state: STATE_FAILED,
        failure_reason: `image2 task failed with status '${status}'.`,
        status_note: `image2 polling attempt ${nextAttempt}; task failed.`,
        progress01: Number(job.progress01 || 0.18),
        image2_poll_attempts: nextAttempt
      });
    }

    if (!isSuccessStatus(status)) {
      return updateJob(container, job.job_id, {
        status_note: `image2 polling attempt ${nextAttempt}; status=${status || 'unknown'}.`,
        progress01: Math.min(0.5, 0.18 + nextAttempt * 0.03),
        image2_poll_attempts: nextAttempt
      });
    }

    const imageUrl = findImageUrl(response);
    if (!imageUrl) throw new Error('image2 task succeeded but no image URL was found.');
    const prepared = await downloadGeneratedImageToBlob(container, job, imageUrl);
    return updateJob(container, job.job_id, {
      stylized_image_url: imageUrl,
      stylized_image_blob: prepared.blobName,
      stylized_image_file_name: prepared.fileName,
      stylized_image_mime_type: prepared.contentType,
      stylized_image_sha256: prepared.hash,
      stylized_image_byte_length: prepared.byteLength,
      status_note: 'image2 stylized reference image cached; Seed3D submission is next.',
      progress01: 0.55,
      image2_poll_attempts: nextAttempt
    });
  } catch (error) {
    return updateJob(container, job.job_id, {
      status_note: `image2 polling deferred after transient error: ${String(error.message || error).slice(0, 500)}`,
      image2_poll_attempts: Number(job.image2_poll_attempts || 0) + 1
    });
  }
}

function resolveSeed3DImageBlob(job) {
  return job.stylized_image_blob || job.image_blob || '';
}

async function submitSeed3D(container, jobId, request) {
  let job = await readJson(container, runtimeBlob(jobId, 'job.json'));
  const provider = job.provider || configuredProvider();
  if (!isSupportedProvider(provider)) {
    return updateJob(container, jobId, {
      output_state: STATE_FAILED,
      failure_reason: `Unsupported SCENESHIFT_BACKEND_PROVIDER '${provider}' for Azure runtime function.`,
      status_note: 'Runtime backend provider configuration failed.',
      progress01: 0
    });
  }

  const apiKey = getSetting('ARK_API_KEY');
  if (!apiKey) {
    return updateJob(container, jobId, {
      output_state: STATE_FAILED,
      failure_reason: 'ARK_API_KEY is not set in the Azure Function environment.',
      status_note: 'Seed3D provider could not start.',
      progress01: 0
    });
  }

  const seed3dImageBlob = resolveSeed3DImageBlob(job);
  if (!seed3dImageBlob) {
    return updateJob(container, jobId, {
      output_state: STATE_FAILED,
      failure_reason: 'Quest upload did not include a readable image file.',
      status_note: 'Seed3D provider requires the captured crop image.',
      progress01: 0
    });
  }

  const containerClient = container;
  const imageBuffer = await containerClient.getBlockBlobClient(seed3dImageBlob).downloadToBuffer();
  const metadata = (await readJson(container, runtimeBlob(jobId, 'metadata.json'))) || {};
  const prompt = buildSeed3DPrompt(metadata);
  const imageMime = job.stylized_image_mime_type || job.image_mime_type || 'image/png';
  const payload = {
    model: getSetting('SEED3D_MODEL') || DEFAULT_MODEL,
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: `data:${imageMime};base64,${imageBuffer.toString('base64')}` } }
    ]
  };

  await uploadJson(container, runtimeBlob(jobId, 'seed3d.request.json'), payload);
  job = await updateJob(container, jobId, {
    status_note: 'Seed3D task create request sent.',
    progress01: 0.18
  });

  const endpoint = getSetting('SEED3D_TASK_ENDPOINT') || DEFAULT_ENDPOINT;
  const response = await httpJson('POST', endpoint, payload, apiKey);
  await uploadJson(container, runtimeBlob(jobId, 'seed3d.create.response.json'), response);

  const taskId = findFirstKey(response, ['task_id', 'id']);
  if (!taskId) throw new Error('Seed3D create response did not include task_id/id.');

  return updateJob(container, jobId, {
    seed3d_task_id: String(taskId),
    seed3d_endpoint: endpoint,
    runtime_backend_status_url: statusUrl(jobId, request),
    status_note: `Seed3D task ${taskId} submitted; polling from Quest status requests.`,
    progress01: 0.25
  });
}

async function pollSeed3DOnce(container, job, request) {
  const apiKey = getSetting('ARK_API_KEY');
  if (!apiKey) {
    return updateJob(container, job.job_id, {
      status_note: 'Seed3D polling skipped because ARK_API_KEY is missing.',
      failure_reason: 'ARK_API_KEY is not set in the Azure Function environment.',
      output_state: STATE_FAILED
    });
  }

  const endpoint = job.seed3d_endpoint || getSetting('SEED3D_TASK_ENDPOINT') || DEFAULT_ENDPOINT;
  const taskId = job.seed3d_task_id;
  if (!taskId) return job;

  try {
    const pollUrl = `${endpoint.replace(/\/+$/, '')}/${encodeURIComponent(taskId)}`;
    const response = await httpJson('GET', pollUrl, null, apiKey);
    await uploadJson(container, runtimeBlob(job.job_id, 'seed3d.poll.response.json'), response);

    const status = String(findFirstKey(response, ['status', 'state']) || '').toLowerCase();
    const nextAttempt = Number(job.seed3d_poll_attempts || 0) + 1;
    if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) {
      return updateJob(container, job.job_id, {
        output_state: STATE_FAILED,
        failure_reason: `Seed3D task failed with status '${status}'.`,
        status_note: `Seed3D polling attempt ${nextAttempt}; task failed.`,
        progress01: Number(job.progress01 || 0.25),
        seed3d_poll_attempts: nextAttempt
      });
    }

    if (!['succeeded', 'success', 'completed'].includes(status)) {
      return updateJob(container, job.job_id, {
        status_note: `Seed3D polling attempt ${nextAttempt}; status=${status || 'unknown'}.`,
        progress01: Math.min(0.9, 0.25 + nextAttempt * 0.03),
        seed3d_poll_attempts: nextAttempt
      });
    }

    const modelUrl = findModelUrl(response);
    if (!modelUrl) throw new Error('Seed3D task succeeded but no model URL was found.');
    return cacheModelAndFinish(container, job, modelUrl, request);
  } catch (error) {
    return updateJob(container, job.job_id, {
      status_note: `Seed3D polling deferred after transient error: ${String(error.message || error).slice(0, 500)}`,
      seed3d_poll_attempts: Number(job.seed3d_poll_attempts || 0) + 1
    });
  }
}

async function cacheModelAndFinish(container, job, sourceUrl, request) {
  try {
    const response = await fetch(sourceUrl, { headers: { 'user-agent': 'SceneShiftRuntimeAzureBackend/1.0' } });
    if (!response.ok) throw new Error(`model download failed: ${response.status}`);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const sourceBuffer = Buffer.from(await response.arrayBuffer());
    const sourceName = safeId(path.basename(new URL(sourceUrl).pathname) || `${job.job_id}.glb`, `${job.job_id}.glb`);
    const prepared = prepareModelBuffer(sourceBuffer, sourceName, contentType, job.job_id);

    await uploadBuffer(container, runtimeBlob(job.job_id, `files/${prepared.fileName}`), prepared.buffer, prepared.contentType);
    const digest = sha256(prepared.buffer);
    return updateJob(container, job.job_id, {
      output_state: STATE_RUNTIME_MODEL_READY,
      model_url: fileUrl(job.job_id, prepared.fileName, request),
      model_mime_type: prepared.contentType,
      model_hash: digest,
      source_model_url: sourceUrl,
      cached_model_blob: runtimeBlob(job.job_id, `files/${prepared.fileName}`),
      status_note: 'Seed3D generated model cached by Azure backend and ready for Quest runtime download.',
      failure_reason: '',
      progress01: 1
    });
  } catch (error) {
    return updateJob(container, job.job_id, {
      output_state: STATE_RUNTIME_MODEL_READY,
      model_url: sourceUrl,
      model_mime_type: 'model/gltf-binary',
      status_note: `Seed3D returned a model URL, but Azure backend caching failed: ${String(error.message || error).slice(0, 500)}`,
      failure_reason: '',
      progress01: 1
    });
  }
}

function prepareModelBuffer(buffer, sourceName, contentType, jobId) {
  if (isZip(buffer, sourceName, contentType)) {
    return extractModelFromZip(buffer, jobId);
  }

  let fileName = safeId(sourceName, `${jobId}.glb`);
  if (!/\.(glb|gltf)$/i.test(fileName)) {
    fileName = `${jobId}.glb`;
  }

  return {
    buffer,
    fileName,
    contentType: fileName.toLowerCase().endsWith('.gltf') ? 'model/gltf+json' : 'model/gltf-binary'
  };
}

function isZip(buffer, sourceName, contentType) {
  return /\.zip$/i.test(sourceName) ||
    /zip/i.test(contentType || '') ||
    (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04);
}

function extractModelFromZip(zipBuffer, jobId) {
  const eocdOffset = findEndOfCentralDirectory(zipBuffer);
  if (eocdOffset < 0) throw new Error('Zip package did not contain an end-of-central-directory record.');

  const entryCount = zipBuffer.readUInt16LE(eocdOffset + 10);
  const centralOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (zipBuffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Zip central directory is malformed.');
    }

    const method = zipBuffer.readUInt16LE(offset + 10);
    const compressedSize = zipBuffer.readUInt32LE(offset + 20);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 28);
    const extraLength = zipBuffer.readUInt16LE(offset + 30);
    const commentLength = zipBuffer.readUInt16LE(offset + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);
    const entryName = zipBuffer.toString('utf8', offset + 46, offset + 46 + fileNameLength);

    if (/\.(glb|gltf)$/i.test(entryName)) {
      const localNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = zipBuffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = zipBuffer.subarray(dataOffset, dataOffset + compressedSize);
      let modelBuffer;
      if (method === 0) {
        modelBuffer = Buffer.from(compressed);
      } else if (method === 8) {
        modelBuffer = zlib.inflateRawSync(compressed);
      } else {
        throw new Error(`Zip model entry uses unsupported compression method ${method}.`);
      }

      const baseName = safeId(path.basename(entryName), `${jobId}.glb`);
      return {
        buffer: modelBuffer,
        fileName: /\.(glb|gltf)$/i.test(baseName) ? baseName : `${jobId}.glb`,
        contentType: baseName.toLowerCase().endsWith('.gltf') ? 'model/gltf+json' : 'model/gltf-binary'
      };
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error('Seed3D zip did not contain .glb or .gltf.');
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 22 - 65535);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

app.http('submitSceneShiftRuntimeGeneration', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/runtime-generations',
  handler: async (request) => {
    const container = await ensureContainer();
    let jobId = '';
    try {
      const submission = await parseSubmission(request);
      const created = await createJob(container, submission);
      jobId = created.jobId;
      let job = created.job;
      if (job.output_state !== STATE_FAILED) {
        job = isFullChainProvider(job.provider)
          ? await submitFullChainInitial(container, jobId, request)
          : await submitSeed3D(container, jobId, request);
      }
      return jsonResponse(200, resultFromJob(job, request));
    } catch (error) {
      if (jobId) {
        const job = await updateJob(container, jobId, {
          output_state: STATE_FAILED,
          failure_reason: String(error.message || error),
          status_note: 'Runtime backend worker failed.',
          progress01: 0
        });
        return jsonResponse(500, resultFromJob(job, request));
      }
      return jsonResponse(500, { error: String(error.message || error) });
    }
  }
});

app.http('getSceneShiftRuntimeGeneration', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/runtime-generations/{jobId}',
  handler: async (request) => {
    const container = await ensureContainer();
    const jobId = request.params.jobId || '';
    let job = await readJson(container, runtimeBlob(jobId, 'job.json'));
    if (!job) return jsonResponse(404, { error: 'job not found' });

    if (Number(job.output_state) === STATE_RUNTIME_BACKEND_SUBMITTED) {
      if (isFullChainProvider(job.provider) && job.image2_task_id && !job.stylized_image_blob) {
        job = await pollImage2Once(container, job, request);
      }

      if (isFullChainProvider(job.provider) &&
          job.stylized_image_blob &&
          !job.seed3d_task_id &&
          Number(job.output_state) === STATE_RUNTIME_BACKEND_SUBMITTED) {
        job = await submitSeed3D(container, jobId, request);
      }

      if (job.seed3d_task_id && Number(job.output_state) === STATE_RUNTIME_BACKEND_SUBMITTED) {
        job = await pollSeed3DOnce(container, job, request);
      }
    }

    return jsonResponse(200, resultFromJob(job, request));
  }
});

app.http('getSceneShiftRuntimeGenerationFile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/runtime-generations/{jobId}/files/{fileName}',
  handler: async (request) => {
    const container = await ensureContainer();
    const jobId = request.params.jobId || '';
    const fileName = request.params.fileName || '';
    if (!/^[A-Za-z0-9_.-]+\.(glb|gltf)$/i.test(fileName)) {
      return jsonResponse(400, { error: 'invalid model file name' });
    }

    const blob = container.getBlockBlobClient(runtimeBlob(jobId, `files/${fileName}`));
    if (!(await blob.exists())) return jsonResponse(404, { error: 'model file not found' });

    const properties = await blob.getProperties();
    return fileResponse(200, await blob.downloadToBuffer(), properties.contentType);
  }
});
