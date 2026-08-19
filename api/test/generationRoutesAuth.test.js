const assert = require('node:assert/strict');
const test = require('node:test');
const { app } = require('@azure/functions');

const settingNames = [
  'SCENESHIFT_GENERATION_TOKENS',
  'SCENESHIFT_GENERATION_TOKEN',
  'SCENESHIFT_API_KEY',
  'APPSETTING_SCENESHIFT_GENERATION_TOKENS',
  'APPSETTING_SCENESHIFT_GENERATION_TOKEN',
  'APPSETTING_SCENESHIFT_API_KEY'
];
const limitSettingNames = [
  'SCENESHIFT_RUNTIME_MAX_REQUEST_BYTES',
  'SCENESHIFT_SURFACE_MAX_REQUEST_BYTES',
  'APPSETTING_SCENESHIFT_RUNTIME_MAX_REQUEST_BYTES',
  'APPSETTING_SCENESHIFT_SURFACE_MAX_REQUEST_BYTES'
];

function saveSettings(names) {
  return new Map(names.map((name) => [name, process.env[name]]));
}

function restoreSettings(saved) {
  for (const [name, value] of saved) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

function clearSettings(names) {
  for (const name of names) delete process.env[name];
}

function requestWithHeaders(headers = {}) {
  const normalized = new Map(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), String(value)])
  );
  return {
    headers: {
      get(name) {
        return normalized.get(String(name).toLowerCase()) || null;
      }
    }
  };
}

const savedLimits = saveSettings(limitSettingNames);
clearSettings(limitSettingNames);

const registrations = new Map();
const originalHttp = app.http;
app.http = (name, options) => registrations.set(name, options);
require('../src/functions/sceneShiftRuntimeGenerations');
require('../src/functions/sceneShiftSurfaceGenerations');
app.http = originalHttp;
restoreSettings(savedLimits);

const submitHandlers = [
  registrations.get('submitSceneShiftRuntimeGeneration').handler,
  registrations.get('submitSceneShiftSurfaceGeneration').handler
];

async function withTokenSetting(token, callback) {
  const saved = saveSettings(settingNames);
  clearSettings(settingNames);
  if (token !== undefined) process.env.SCENESHIFT_GENERATION_TOKEN = token;
  try {
    return await callback();
  } finally {
    restoreSettings(saved);
  }
}

test('both generation POST routes fail closed before storage when token is unconfigured', async () => {
  await withTokenSetting(undefined, async () => {
    for (const handler of submitHandlers) {
      const response = await handler(requestWithHeaders());
      assert.equal(response.status, 503);
    }
  });
});

test('both generation POST routes reject an incorrect bearer token before storage', async () => {
  await withTokenSetting('correct-token', async () => {
    for (const handler of submitHandlers) {
      const response = await handler(requestWithHeaders({ authorization: 'Bearer wrong-token' }));
      assert.equal(response.status, 401);
    }
  });
});

test('both generation POST routes reject oversized authenticated requests before storage', async () => {
  await withTokenSetting('correct-token', async () => {
    const runtimeResponse = await submitHandlers[0](requestWithHeaders({
      authorization: 'Bearer correct-token',
      'content-length': String(12 * 1024 * 1024 + 1)
    }));
    const surfaceResponse = await submitHandlers[1](requestWithHeaders({
      authorization: 'Bearer correct-token',
      'content-length': String(256 * 1024 + 1)
    }));

    assert.equal(runtimeResponse.status, 413);
    assert.equal(surfaceResponse.status, 413);
  });
});
