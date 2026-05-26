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

function getSetting(name) {
  return process.env[name] || process.env[`APPSETTING_${name}`];
}

const containerName = getSetting('SCENESHIFT_UPLOAD_CONTAINER') || 'scene-shift';

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
    provider: (getSetting('SCENESHIFT_BACKEND_PROVIDER') || 'seed3d').toLowerCase(),
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
  const prompt = metadata.PromptText || metadata.UserStyleIntent || 'Generate a coherent stylized furniture asset.';
  const size = `Target physical size: length=${metadata.TargetLengthMeters || 0}m, width=${metadata.TargetWidthMeters || 0}m, height=${metadata.TargetHeightMeters || 0}m, aspect=${metadata.TargetAspectRatio || 0}, verticalFit=${metadata.VerticalFitMode || ''}.`;
  const semantic = `Semantic target: ${metadata.SemanticLabel || ''}; function: ${metadata.FunctionTag || ''}.`;
  const subdivision = safeCommandToken(getSetting('SEED3D_SUBDIVISION_LEVEL') || 'medium');
  const fileFormat = safeCommandToken(getSetting('SEED3D_FILE_FORMAT') || 'glb');
  return `${prompt}\n${semantic}\n${size}\nGenerate one clean 3D model from the captured object image. Preserve footprint, bottom support/contact surfaces, dominant yaw, walkable clearance, and high-level furniture function for mixed-reality replacement. --subdivisionlevel ${subdivision} --fileformat ${fileFormat}`;
}

function safeCommandToken(value) {
  return String(value || '').replace(/[^A-Za-z0-9_.-]/g, '') || 'medium';
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

async function submitSeed3D(container, jobId, request) {
  let job = await readJson(container, runtimeBlob(jobId, 'job.json'));
  const provider = (getSetting('SCENESHIFT_BACKEND_PROVIDER') || 'seed3d').toLowerCase();
  if (provider !== 'seed3d') {
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

  if (!job.image_blob) {
    return updateJob(container, jobId, {
      output_state: STATE_FAILED,
      failure_reason: 'Quest upload did not include a readable image file.',
      status_note: 'Seed3D provider requires the captured crop image.',
      progress01: 0
    });
  }

  const containerClient = container;
  const imageBuffer = await containerClient.getBlockBlobClient(job.image_blob).downloadToBuffer();
  const metadata = (await readJson(container, runtimeBlob(jobId, 'metadata.json'))) || {};
  const prompt = buildSeed3DPrompt(metadata);
  const imageMime = job.image_mime_type || 'image/png';
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
        job = await submitSeed3D(container, jobId, request);
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

    if (Number(job.output_state) === STATE_RUNTIME_BACKEND_SUBMITTED && job.seed3d_task_id) {
      job = await pollSeed3DOnce(container, job, request);
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
