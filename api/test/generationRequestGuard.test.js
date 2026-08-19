const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const test = require('node:test');
const {
  RequestTooLargeError,
  assertRequestSize,
  authenticateGenerationRequest,
  consumeRateLimit,
  contentLengthResponse,
  isRateLimitStoreError,
  readRequestBuffer,
  readRequestText,
  rateLimitResponse,
  withRateLimitHeaders
} = require('../src/security/generationRequestGuard');

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

function settings(values = {}) {
  return (name) => values[name];
}

function storageError(statusCode) {
  const error = new Error(`storage error ${statusCode}`);
  error.statusCode = statusCode;
  return error;
}

class FakeBlockBlobClient {
  constructor() {
    this.data = null;
    this.version = 0;
  }

  etag() {
    return `"${this.version}"`;
  }

  async download() {
    if (!this.data) throw storageError(404);
    return {
      etag: this.etag(),
      readableStreamBody: Readable.from([this.data])
    };
  }

  async uploadData(data, options = {}) {
    const conditions = options.conditions || {};
    if (conditions.ifNoneMatch === '*' && this.data) throw storageError(412);
    if (conditions.ifMatch && conditions.ifMatch !== this.etag()) throw storageError(412);
    this.data = Buffer.from(data);
    this.version += 1;
    return { etag: this.etag() };
  }
}

class FakeContainerClient {
  constructor() {
    this.blobs = new Map();
  }

  getBlockBlobClient(name) {
    if (!this.blobs.has(name)) this.blobs.set(name, new FakeBlockBlobClient());
    return this.blobs.get(name);
  }
}

test('authentication fails closed when no generation token is configured', () => {
  const result = authenticateGenerationRequest(requestWithHeaders(), settings());
  assert.equal(result.ok, false);
  assert.equal(result.response.status, 503);
});

test('authentication rejects a missing or incorrect token', () => {
  const getSetting = settings({ SCENESHIFT_GENERATION_TOKEN: 'correct-token' });
  const missing = authenticateGenerationRequest(requestWithHeaders(), getSetting);
  const incorrect = authenticateGenerationRequest(
    requestWithHeaders({ authorization: 'Bearer wrong-token' }),
    getSetting
  );

  assert.equal(missing.response.status, 401);
  assert.equal(incorrect.response.status, 401);
  assert.match(incorrect.response.headers['www-authenticate'], /^Bearer /);
});

test('authentication accepts bearer and API-key headers during token rotation', () => {
  const getSetting = settings({ SCENESHIFT_GENERATION_TOKENS: 'old-token, new-token' });
  const bearer = authenticateGenerationRequest(
    requestWithHeaders({ authorization: 'Bearer new-token' }),
    getSetting
  );
  const apiKey = authenticateGenerationRequest(
    requestWithHeaders({ 'x-sceneshift-api-key': 'old-token' }),
    getSetting
  );

  assert.equal(bearer.ok, true);
  assert.equal(apiKey.ok, true);
  assert.equal(bearer.identity.length, 64);
});

test('content-length and measured-body checks reject oversized requests', () => {
  const response = contentLengthResponse(
    requestWithHeaders({ 'content-length': '1025' }),
    1024
  );
  assert.equal(response.status, 413);
  assert.equal(response.jsonBody.max_bytes, 1024);
  assert.throws(() => assertRequestSize(1025, 1024), RequestTooLargeError);
  assert.doesNotThrow(() => assertRequestSize(1024, 1024));
});

test('invalid content-length is rejected', () => {
  const response = contentLengthResponse(
    requestWithHeaders({ 'content-length': 'not-a-number' }),
    1024
  );
  assert.equal(response.status, 400);
});

test('consumed binary and text bodies are measured without content-length', async () => {
  await assert.rejects(
    () => readRequestBuffer({ arrayBuffer: async () => Buffer.alloc(1025) }, 1024),
    RequestTooLargeError
  );
  await assert.rejects(
    () => readRequestText({ text: async () => '测'.repeat(342) }, 1024),
    RequestTooLargeError
  );
  assert.equal(
    await readRequestText({ text: async () => 'ok' }, 1024),
    'ok'
  );
});

test('shared fixed-window limiter returns 429 after the configured count', async () => {
  const container = new FakeContainerClient();
  const options = {
    scope: 'runtime-generations',
    identity: 'authenticated-client',
    limit: 2,
    windowSeconds: 60,
    nowMs: 120000
  };

  const first = await consumeRateLimit(container, options);
  const second = await consumeRateLimit(container, options);
  const third = await consumeRateLimit(container, options);

  assert.deepEqual(
    [first.allowed, first.remaining, second.allowed, second.remaining, third.allowed],
    [true, 1, true, 0, false]
  );
  const denied = rateLimitResponse(third);
  assert.equal(denied.status, 429);
  assert.equal(denied.headers['retry-after'], '60');
});

test('rate limit resets in the next window and is isolated by route scope', async () => {
  const container = new FakeContainerClient();
  const base = {
    identity: 'authenticated-client',
    limit: 1,
    windowSeconds: 60
  };

  const runtimeFirst = await consumeRateLimit(container, {
    ...base,
    scope: 'runtime-generations',
    nowMs: 120000
  });
  const surfaceFirst = await consumeRateLimit(container, {
    ...base,
    scope: 'surface-generations',
    nowMs: 120000
  });
  const runtimeNextWindow = await consumeRateLimit(container, {
    ...base,
    scope: 'runtime-generations',
    nowMs: 180000
  });

  assert.equal(runtimeFirst.allowed, true);
  assert.equal(surfaceFirst.allowed, true);
  assert.equal(runtimeNextWindow.allowed, true);
});

test('concurrent callers share the same conditional blob counter', async () => {
  const container = new FakeContainerClient();
  const results = await Promise.all(Array.from({ length: 6 }, () => consumeRateLimit(container, {
    scope: 'surface-generations',
    identity: 'shared-token',
    limit: 3,
    windowSeconds: 60,
    nowMs: 120000
  })));

  assert.equal(results.filter((result) => result.allowed).length, 3);
  assert.equal(results.filter((result) => !result.allowed).length, 3);
});

test('invalid shared rate-limit state fails closed', async () => {
  const container = new FakeContainerClient();
  const options = {
    scope: 'runtime-generations',
    identity: 'authenticated-client',
    limit: 3,
    windowSeconds: 60,
    nowMs: 120000
  };
  await consumeRateLimit(container, options);
  const [blob] = container.blobs.values();
  blob.data = Buffer.from(JSON.stringify({ window_start_ms: 120000, count: -1 }));

  await assert.rejects(
    () => consumeRateLimit(container, options),
    (error) => isRateLimitStoreError(error)
  );
});

test('successful responses receive rate-limit metadata', () => {
  const response = withRateLimitHeaders(
    { status: 200, headers: { 'content-type': 'application/json' }, jsonBody: {} },
    { allowed: true, limit: 5, remaining: 4, resetAtMs: 60000, retryAfterSeconds: 0 }
  );
  assert.equal(response.headers['x-ratelimit-limit'], '5');
  assert.equal(response.headers['x-ratelimit-remaining'], '4');
  assert.equal(response.headers['x-ratelimit-reset'], '60');
});
