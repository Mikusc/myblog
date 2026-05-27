const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('node:crypto');

const STATE_FAILED = 5;
const STATE_SURFACE_BACKEND_SUBMITTED = 9;
const STATE_SURFACE_TEXTURES_READY = 10;

const DEFAULT_APIMART_IMAGE_ENDPOINT = 'https://api.apimart.ai/v1/images/generations';
const DEFAULT_APIMART_TASK_ENDPOINT_BASE = 'https://api.apimart.ai/v1/tasks';
const DEFAULT_IMAGE2_MODEL = 'gpt-image-2';
const MAX_SURFACE_ENTRIES = 12;

function getSetting(name) {
  return process.env[name] || process.env[`APPSETTING_${name}`];
}

function getFirstSetting(names) {
  for (const name of names) {
    const value = getSetting(name);
    if (value) return value;
  }
  return '';
}

const containerName = getSetting('SCENESHIFT_UPLOAD_CONTAINER') || 'scene-shift';

function getContainer() {
  const conn = getSetting('AZURE_STORAGE_CONNECTION_STRING');
  if (!conn) throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING');
  return BlobServiceClient.fromConnectionString(conn).getContainerClient(containerName);
}

async function ensureContainer() {
  const container = getContainer();
  await container.createIfNotExists();
  return container;
}

function utcNow() {
  return new Date().toISOString();
}

function safeId(value, fallback = 'surface') {
  const cleaned = String(value || fallback).replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^[-._]+|[-._]+$/g, '');
  return (cleaned || fallback).slice(0, 96);
}

function shortUuid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function surfaceBlob(jobId, name) {
  return `surface-generations/${jobId}/${name}`;
}

function surfaceCacheBlob(requestId) {
  return `surface-generations/cache/${safeId(requestId)}.png`;
}

function publicApiBase(request) {
  const configured = getSetting('SCENESHIFT_PUBLIC_API_BASE_URL');
  if (configured) return configured.replace(/\/+$/, '');
  return `${new URL(request.url).origin}/api`;
}

function statusUrl(jobId, request) {
  return `${publicApiBase(request)}/v1/surface-generations/${encodeURIComponent(jobId)}`;
}

function fileUrl(jobId, fileName, request) {
  return `${publicApiBase(request)}/v1/surface-generations/${encodeURIComponent(jobId)}/files/${encodeURIComponent(fileName)}`;
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
  const blobName = surfaceBlob(jobId, 'job.json');
  const existing = (await readJson(container, blobName)) || {};
  const updated = { ...existing, ...changes, updated_at: utcNow() };
  await uploadJson(container, blobName, updated);
  return updated;
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
      'content-type': contentType || 'image/png',
      'cache-control': 'public, max-age=86400'
    },
    body: buffer
  };
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

function shortenText(value, maxLength) {
  const text = String(value || '');
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
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

function parseSurfaceSubmission(payload) {
  const entries = Array.isArray(payload?.Entries) ? payload.Entries : [];
  if (entries.length === 0) {
    throw new Error('Surface generation request has no Entries.');
  }

  return {
    request_id: safeId(payload.RequestId || `${payload.ThemeId || 'theme'}-${payload.StyleVariantId || 'preset'}-${shortUuid()}`, 'surface-set'),
    theme_id: payload.ThemeId || '',
    theme_display_name: payload.ThemeDisplayName || '',
    theme_description: payload.ThemeDescription || '',
    style_variant_id: payload.StyleVariantId || 'preset',
    user_style_intent: payload.UserStyleIntent || '',
    style_intent_source: payload.StyleIntentSource || '',
    created_at_client: payload.CreatedAtIsoUtc || '',
    surfaces: entries.slice(0, MAX_SURFACE_ENTRIES).map((entry) => {
      const requestId = safeId(entry.RequestId || `${payload.ThemeId || 'theme'}-${entry.SemanticLabel || 'surface'}-${payload.StyleVariantId || 'preset'}`);
      const semanticLabel = entry.SemanticLabel || requestId;
      return {
        request_id: requestId,
        semantic_label: semanticLabel,
        surface_kind: entry.SurfaceKind,
        output_role: entry.OutputRole || semanticLabel,
        prompt_version: entry.PromptVersion || '',
        prompt: entry.Prompt || '',
        negative_prompt: entry.NegativePrompt || '',
        image_size: entry.ImageSize || (semanticLabel === 'window_vista' ? '16:9' : '1:1'),
        output_state: STATE_SURFACE_BACKEND_SUBMITTED,
        progress01: 0.05,
        status_note: 'Queued for surface texture generation.',
        failure_reason: ''
      };
    })
  };
}

function buildSurfacePrompt(surface, submission) {
  const prompt = surface.prompt || '';
  const negative = surface.negative_prompt || '';
  const styleContext = [
    submission.user_style_intent ? `Active user style intent: ${submission.user_style_intent}` : '',
    submission.theme_display_name ? `SceneShift style identity: ${submission.theme_display_name}` : '',
    submission.theme_description ? `Style description: ${submission.theme_description}` : ''
  ].filter(Boolean).join('\n');
  const guard = [
    'SceneShift mixed-reality surface asset.',
    'Keep the output spatially readable and suitable for applying to MRUK room anchors.',
    'Do not include people, logos, readable text, UI, watermarks, or perspective room mockups.'
  ].join('\n');
  const avoid = negative ? `\n\nAvoid: ${negative}` : '';
  return [styleContext, prompt, guard].filter(Boolean).join('\n\n') + avoid;
}

function buildImagePayload(surface, submission) {
  return {
    model: getSetting('APIMART_IMAGE_MODEL') || getSetting('IMAGE2_MODEL') || DEFAULT_IMAGE2_MODEL,
    prompt: buildSurfacePrompt(surface, submission),
    n: 1,
    size: surface.image_size || '1:1'
  };
}

async function submitSurfaceTask(container, jobId, surface, submission, request) {
  const cacheBlob = container.getBlockBlobClient(surfaceCacheBlob(surface.request_id));
  const fileName = `${safeId(surface.request_id)}.png`;
  if (await cacheBlob.exists()) {
    const properties = await cacheBlob.getProperties();
    return {
      ...surface,
      output_state: STATE_SURFACE_TEXTURES_READY,
      progress01: 1,
      output_image_url: fileUrl(jobId, fileName, request),
      output_image_mime_type: properties.contentType || 'image/png',
      status_note: 'Surface texture reused from backend cache.',
      failure_reason: ''
    };
  }

  const apiKey = getFirstSetting(['APIMART_API_KEY', 'IMAGE2_API_KEY']);
  if (!apiKey) {
    return {
      ...surface,
      output_state: STATE_FAILED,
      progress01: 0,
      status_note: 'Surface backend could not start.',
      failure_reason: 'APIMART_API_KEY or IMAGE2_API_KEY is not set in the Azure Function environment.'
    };
  }

  if (!surface.prompt) {
    return {
      ...surface,
      output_state: STATE_FAILED,
      progress01: 0,
      status_note: 'Surface backend rejected an empty prompt.',
      failure_reason: 'Surface prompt is empty.'
    };
  }

  const payload = buildImagePayload(surface, submission);
  await uploadJson(container, surfaceBlob(jobId, `requests/${surface.request_id}.image2.request.json`), payload);

  const endpoint = getSetting('APIMART_IMAGE_GENERATION_ENDPOINT') || getSetting('IMAGE2_GENERATION_ENDPOINT') || DEFAULT_APIMART_IMAGE_ENDPOINT;
  const response = await httpJson('POST', endpoint, payload, apiKey);
  await uploadJson(container, surfaceBlob(jobId, `responses/${surface.request_id}.image2.create.response.json`), response);

  const taskId = findFirstKey(response, ['task_id', 'id']);
  if (!taskId) {
    return {
      ...surface,
      output_state: STATE_FAILED,
      progress01: 0,
      status_note: 'Surface image task create failed.',
      failure_reason: `image2 create response did not include task_id/id: ${shortenText(JSON.stringify(response), 400)}`
    };
  }

  return {
    ...surface,
    backend_task_id: String(taskId),
    backend_task_endpoint_base: getSetting('APIMART_TASK_ENDPOINT_BASE') || getSetting('IMAGE2_TASK_ENDPOINT_BASE') || DEFAULT_APIMART_TASK_ENDPOINT_BASE,
    backend_model: payload.model,
    output_file_name: fileName,
    output_state: STATE_SURFACE_BACKEND_SUBMITTED,
    progress01: 0.12,
    status_note: `Surface image2 task ${taskId} submitted.`,
    failure_reason: ''
  };
}

async function downloadSurfaceImage(container, jobId, surface, sourceUrl, request) {
  const response = await fetch(sourceUrl, { headers: { 'user-agent': 'SceneShiftSurfaceAzureBackend/1.0' } });
  if (!response.ok) {
    throw new Error(`surface image download failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  const fileName = `${safeId(surface.request_id)}.png`;
  const jobBlob = surfaceBlob(jobId, `files/${fileName}`);
  const cacheBlob = surfaceCacheBlob(surface.request_id);
  await uploadBuffer(container, jobBlob, buffer, contentType);
  await uploadBuffer(container, cacheBlob, buffer, contentType);
  return {
    output_file_name: fileName,
    output_image_url: fileUrl(jobId, fileName, request),
    output_image_mime_type: contentType,
    output_image_hash: sha256(buffer),
    output_image_byte_length: buffer.length,
    cached_blob: cacheBlob,
    job_blob: jobBlob
  };
}

async function pollSurfaceTask(container, jobId, surface, request) {
  if (Number(surface.output_state) !== STATE_SURFACE_BACKEND_SUBMITTED || !surface.backend_task_id) {
    return surface;
  }

  const apiKey = getFirstSetting(['APIMART_API_KEY', 'IMAGE2_API_KEY']);
  if (!apiKey) {
    return {
      ...surface,
      output_state: STATE_FAILED,
      progress01: 0,
      status_note: 'Surface polling skipped because APIMART_API_KEY/IMAGE2_API_KEY is missing.',
      failure_reason: 'APIMART_API_KEY or IMAGE2_API_KEY is not set in the Azure Function environment.'
    };
  }

  try {
    const base = surface.backend_task_endpoint_base || getSetting('APIMART_TASK_ENDPOINT_BASE') || getSetting('IMAGE2_TASK_ENDPOINT_BASE') || DEFAULT_APIMART_TASK_ENDPOINT_BASE;
    const pollUrl = `${base.replace(/\/+$/, '')}/${encodeURIComponent(surface.backend_task_id)}`;
    const response = await httpJson('GET', pollUrl, null, apiKey);
    await uploadJson(container, surfaceBlob(jobId, `responses/${surface.request_id}.image2.poll.response.json`), response);

    const status = String(findFirstKey(response, ['status', 'state']) || '').toLowerCase();
    const nextAttempt = Number(surface.poll_attempts || 0) + 1;
    if (isFailureStatus(status)) {
      return {
        ...surface,
        output_state: STATE_FAILED,
        failure_reason: `image2 task failed with status '${status}'.`,
        status_note: `Surface polling attempt ${nextAttempt}; task failed.`,
        poll_attempts: nextAttempt
      };
    }

    if (!isSuccessStatus(status)) {
      return {
        ...surface,
        status_note: `Surface polling attempt ${nextAttempt}; status=${status || 'unknown'}.`,
        progress01: Math.min(0.92, 0.12 + nextAttempt * 0.06),
        poll_attempts: nextAttempt
      };
    }

    const imageUrl = findImageUrl(response);
    if (!imageUrl) throw new Error('image2 task succeeded but no image URL was found.');
    const prepared = await downloadSurfaceImage(container, jobId, surface, imageUrl, request);
    return {
      ...surface,
      ...prepared,
      source_image_url: imageUrl,
      output_state: STATE_SURFACE_TEXTURES_READY,
      progress01: 1,
      status_note: 'Surface texture cached by Azure backend and ready for Quest download.',
      failure_reason: '',
      poll_attempts: nextAttempt
    };
  } catch (error) {
    return {
      ...surface,
      status_note: `Surface polling deferred after transient error: ${String(error.message || error).slice(0, 500)}`,
      poll_attempts: Number(surface.poll_attempts || 0) + 1
    };
  }
}

function summarizeJob(job, request) {
  const surfaces = Array.isArray(job.surfaces) ? job.surfaces : [];
  const readyCount = surfaces.filter((surface) => Number(surface.output_state) === STATE_SURFACE_TEXTURES_READY).length;
  const failedCount = surfaces.filter((surface) => Number(surface.output_state) === STATE_FAILED).length;
  const totalCount = surfaces.length;
  const outputState = totalCount > 0 && readyCount === totalCount
    ? STATE_SURFACE_TEXTURES_READY
    : failedCount > 0 && readyCount + failedCount === totalCount
      ? STATE_FAILED
      : STATE_SURFACE_BACKEND_SUBMITTED;
  const progress = totalCount > 0
    ? surfaces.reduce((sum, surface) => sum + Number(surface.progress01 || 0), 0) / totalCount
    : 0;

  return {
    RequestId: job.request_id || '',
    ThemeId: job.theme_id || '',
    StyleVariantId: job.style_variant_id || 'preset',
    SurfaceBackendJobId: job.job_id || '',
    SurfaceBackendStatusUrl: job.job_id ? statusUrl(job.job_id, request) : '',
    Progress01: outputState === STATE_SURFACE_TEXTURES_READY ? 1 : progress,
    OutputState: outputState,
    FailureReason: failedCount > 0 ? `${failedCount} surface texture job(s) failed.` : '',
    StatusNote: outputState === STATE_SURFACE_TEXTURES_READY
      ? 'All surface textures are ready.'
      : `Surface textures ready=${readyCount}/${totalCount}, failed=${failedCount}.`,
    CreatedAtIsoUtc: job.updated_at || utcNow(),
    Surfaces: surfaces.map((surface) => ({
      RequestId: surface.request_id || '',
      SemanticLabel: surface.semantic_label || '',
      SurfaceKind: surface.surface_kind ?? 0,
      OutputRole: surface.output_role || '',
      OutputImageUrl: surface.output_image_url || '',
      OutputImageMimeType: surface.output_image_mime_type || '',
      OutputImageHash: surface.output_image_hash || '',
      Progress01: Number(surface.progress01 || 0),
      OutputState: Number(surface.output_state || STATE_SURFACE_BACKEND_SUBMITTED),
      FailureReason: surface.failure_reason || '',
      StatusNote: surface.status_note || ''
    }))
  };
}

async function pollJob(container, jobId, request) {
  const job = await readJson(container, surfaceBlob(jobId, 'job.json'));
  if (!job) return null;

  const surfaces = [];
  for (const surface of job.surfaces || []) {
    surfaces.push(await pollSurfaceTask(container, jobId, surface, request));
  }

  const updated = await updateJob(container, jobId, { surfaces });
  return updated;
}

app.http('submitSceneShiftSurfaceGeneration', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/surface-generations',
  handler: async (request) => {
    const container = await ensureContainer();
    let jobId = '';
    try {
      const payload = JSON.parse(await request.text());
      const submission = parseSurfaceSubmission(payload);
      jobId = `${safeId(submission.request_id)}-${shortUuid()}`;
      const now = utcNow();
      await uploadJson(container, surfaceBlob(jobId, 'submission.json'), payload);
      await uploadJson(container, surfaceBlob(jobId, 'normalized-submission.json'), submission);

      const surfaces = [];
      for (const surface of submission.surfaces) {
        surfaces.push(await submitSurfaceTask(container, jobId, surface, submission, request));
      }

      const job = {
        job_id: jobId,
        request_id: submission.request_id,
        theme_id: submission.theme_id,
        theme_display_name: submission.theme_display_name,
        theme_description: submission.theme_description,
        style_variant_id: submission.style_variant_id,
        user_style_intent: submission.user_style_intent,
        style_intent_source: submission.style_intent_source,
        surfaces,
        created_at: now,
        updated_at: now
      };
      await uploadJson(container, surfaceBlob(jobId, 'job.json'), job);
      return jsonResponse(200, summarizeJob(job, request));
    } catch (error) {
      if (jobId) {
        const job = await updateJob(container, jobId, {
          surfaces: [],
          failure_reason: String(error.message || error)
        });
        return jsonResponse(500, summarizeJob(job, request));
      }
      return jsonResponse(500, { error: String(error.message || error) });
    }
  }
});

app.http('getSceneShiftSurfaceGeneration', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/surface-generations/{jobId}',
  handler: async (request) => {
    const container = await ensureContainer();
    const jobId = request.params.jobId || '';
    const job = await pollJob(container, jobId, request);
    if (!job) return jsonResponse(404, { error: 'surface job not found' });
    return jsonResponse(200, summarizeJob(job, request));
  }
});

app.http('getSceneShiftSurfaceGenerationFile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/surface-generations/{jobId}/files/{fileName}',
  handler: async (request) => {
    const container = await ensureContainer();
    const jobId = request.params.jobId || '';
    const fileName = request.params.fileName || '';
    if (!/^[A-Za-z0-9_.-]+\.png$/i.test(fileName)) {
      return jsonResponse(400, { error: 'invalid surface file name' });
    }

    const jobBlob = container.getBlockBlobClient(surfaceBlob(jobId, `files/${fileName}`));
    if (await jobBlob.exists()) {
      const properties = await jobBlob.getProperties();
      return fileResponse(200, await jobBlob.downloadToBuffer(), properties.contentType || 'image/png');
    }

    const cacheBlob = container.getBlockBlobClient(`surface-generations/cache/${fileName}`);
    if (await cacheBlob.exists()) {
      const properties = await cacheBlob.getProperties();
      return fileResponse(200, await cacheBlob.downloadToBuffer(), properties.contentType || 'image/png');
    }

    return jsonResponse(404, { error: 'surface file not found' });
  }
});
