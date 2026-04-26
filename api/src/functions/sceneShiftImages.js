const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('node:crypto');

function getSetting(name) {
  return process.env[name] || process.env[`APPSETTING_${name}`];
}

const containerName = getSetting('SCENESHIFT_UPLOAD_CONTAINER') || 'scene-shift';

function getContainer() {
  const conn = getSetting('AZURE_STORAGE_CONNECTION_STRING');
  if (!conn) throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING');
  return BlobServiceClient.fromConnectionString(conn).getContainerClient(containerName);
}

function authOk(request) {
  const token = getSetting('SCENESHIFT_UPLOAD_TOKEN');
  const bearer = request.headers.get('authorization');
  const uploadToken = request.headers.get('x-sceneshift-upload-token');
  return token && (bearer === `Bearer ${token}` || uploadToken === token);
}

function isPng(buffer) {
  return buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 &&
    buffer[2] === 0x4e && buffer[3] === 0x47;
}

async function readUploadBuffer(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    let form;
    try {
      form = await request.formData();
    } catch {
      return { response: { status: 400, jsonBody: { error: 'invalid multipart body' } } };
    }

    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return { response: { status: 400, jsonBody: { error: 'missing file field' } } };
    }

    return { buffer: Buffer.from(await file.arrayBuffer()) };
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length === 0) {
    return { response: { status: 400, jsonBody: { error: 'missing request body' } } };
  }

  return { buffer };
}

app.http('uploadSceneShiftImage', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'scene-shift/upload',
  handler: async (request) => {
    if (!authOk(request)) {
      return { status: 401, jsonBody: { error: 'unauthorized' } };
    }

    const upload = await readUploadBuffer(request);
    if (upload.response) return upload.response;

    const buffer = upload.buffer;
    if (!isPng(buffer)) {
      return { status: 415, jsonBody: { error: 'only png is accepted' } };
    }

    const name = `${Date.now()}-${crypto.randomUUID()}.png`;
    const blobName = `seed3d/${name}`;

    const container = getContainer();
    await container.createIfNotExists();
    await container.getBlockBlobClient(blobName).uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: 'image/png' }
    });

    const base = getSetting('SCENESHIFT_PUBLIC_API_BASE_URL') || `${new URL(request.url).origin}/api`;
    return {
      status: 200,
      jsonBody: {
        url: `${base.replace(/\/+$/, '')}/scene-shift/seed3d/${name}`
      }
    };
  }
});

app.http('getSceneShiftImage', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'scene-shift/seed3d/{name}',
  handler: async (request) => {
    const name = request.params.name || '';
    if (!/^[a-zA-Z0-9._-]+\.png$/.test(name)) return { status: 400 };

    const blob = getContainer().getBlockBlobClient(`seed3d/${name}`);
    if (!(await blob.exists())) return { status: 404 };

    return {
      status: 200,
      headers: { 'content-type': 'image/png' },
      body: await blob.downloadToBuffer()
    };
  }
});
