const crypto = require('node:crypto');

const DEFAULT_RATE_LIMIT = 5;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_RATE_LIMIT_UPDATE_ATTEMPTS = 8;

class RequestTooLargeError extends Error {
  constructor(maxBytes) {
    super(`request body exceeds the ${maxBytes} byte limit`);
    this.name = 'RequestTooLargeError';
    this.maxBytes = maxBytes;
  }
}

class RateLimitStoreError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'RateLimitStoreError';
    this.cause = cause;
  }
}

function jsonResponse(status, body, headers = {}) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    },
    jsonBody: body
  };
}

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maximum);
}

function configuredTokens(getSetting) {
  const values = [
    getSetting('SCENESHIFT_GENERATION_TOKENS'),
    getSetting('SCENESHIFT_GENERATION_TOKEN'),
    getSetting('SCENESHIFT_API_KEY')
  ];

  return [...new Set(values
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean))];
}

function presentedToken(request) {
  const authorization = request.headers.get('authorization') || '';
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) return bearerMatch[1].trim();

  return (
    request.headers.get('x-sceneshift-api-key') ||
    request.headers.get('x-sceneshift-generation-token') ||
    ''
  ).trim();
}

function tokensMatch(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function authenticateGenerationRequest(request, getSetting) {
  const tokens = configuredTokens(getSetting);
  if (tokens.length === 0) {
    return {
      ok: false,
      response: jsonResponse(503, { error: 'generation API authentication is not configured' })
    };
  }

  const token = presentedToken(request);
  const matched = token && tokens.some((candidate) => tokensMatch(token, candidate));
  if (!matched) {
    return {
      ok: false,
      response: jsonResponse(
        401,
        { error: 'unauthorized' },
        { 'www-authenticate': 'Bearer realm="SceneShift generation API"' }
      )
    };
  }

  return {
    ok: true,
    identity: crypto.createHash('sha256').update(token, 'utf8').digest('hex')
  };
}

function contentLengthResponse(request, maxBytes) {
  const rawLength = request.headers.get('content-length');
  if (!rawLength) return null;

  const contentLength = Number(rawLength);
  if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
    return jsonResponse(400, { error: 'invalid content-length header' });
  }
  if (contentLength > maxBytes) return requestTooLargeResponse(maxBytes);
  return null;
}

function assertRequestSize(actualBytes, maxBytes) {
  if (actualBytes > maxBytes) throw new RequestTooLargeError(maxBytes);
}

async function readRequestBuffer(request, maxBytes) {
  const buffer = Buffer.from(await request.arrayBuffer());
  assertRequestSize(buffer.length, maxBytes);
  return buffer;
}

async function readRequestText(request, maxBytes) {
  const text = await request.text();
  assertRequestSize(Buffer.byteLength(text, 'utf8'), maxBytes);
  return text;
}

function requestTooLargeResponse(maxBytes) {
  return jsonResponse(413, {
    error: 'request body too large',
    max_bytes: maxBytes
  });
}

function isRequestTooLargeError(error) {
  return error instanceof RequestTooLargeError;
}

function isNotFound(error) {
  return error && Number(error.statusCode) === 404;
}

function isConditionFailure(error) {
  return error && [409, 412].includes(Number(error.statusCode));
}

async function streamToBuffer(stream) {
  if (!stream) return Buffer.alloc(0);
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function readRateLimitRecord(blob) {
  try {
    const response = await blob.download(0);
    const buffer = await streamToBuffer(response.readableStreamBody);
    if (!response.etag) throw new Error('rate limit blob response is missing an ETag');
    return {
      etag: response.etag,
      value: JSON.parse(buffer.toString('utf8'))
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

function safeScope(scope) {
  return String(scope || 'generation').replace(/[^A-Za-z0-9_.-]+/g, '-').slice(0, 64) || 'generation';
}

function rateLimitHeaders(result) {
  const headers = {
    'x-ratelimit-limit': String(result.limit),
    'x-ratelimit-remaining': String(result.remaining),
    'x-ratelimit-reset': String(Math.ceil(result.resetAtMs / 1000))
  };
  if (!result.allowed) headers['retry-after'] = String(result.retryAfterSeconds);
  return headers;
}

async function consumeRateLimit(container, options) {
  const limit = positiveInteger(options.limit, DEFAULT_RATE_LIMIT, 10000);
  const windowSeconds = positiveInteger(
    options.windowSeconds,
    DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
    86400
  );
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const resetAtMs = windowStartMs + windowMs;
  const identity = String(options.identity || 'missing-identity');
  const identityHash = crypto.createHash('sha256').update(identity, 'utf8').digest('hex');
  const blobName = `rate-limits/${safeScope(options.scope)}/${identityHash}.json`;
  const blob = container.getBlockBlobClient(blobName);

  for (let attempt = 0; attempt < MAX_RATE_LIMIT_UPDATE_ATTEMPTS; attempt += 1) {
    let current;
    try {
      current = await readRateLimitRecord(blob);
    } catch (error) {
      throw new RateLimitStoreError('failed to read generation rate limit state', error);
    }

    let currentCount = 0;
    if (current && Number(current.value.window_start_ms) === windowStartMs) {
      const storedCount = Number(current.value.count);
      if (!Number.isSafeInteger(storedCount) || storedCount < 0) {
        throw new RateLimitStoreError('generation rate limit state has an invalid count');
      }
      currentCount = Math.min(storedCount, limit);
    }

    if (currentCount >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAtMs,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000))
      };
    }

    const nextCount = currentCount + 1;
    const payload = Buffer.from(JSON.stringify({
      window_start_ms: windowStartMs,
      window_seconds: windowSeconds,
      count: nextCount,
      updated_at: new Date(nowMs).toISOString()
    }), 'utf8');

    try {
      await blob.uploadData(payload, {
        blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' },
        conditions: current ? { ifMatch: current.etag } : { ifNoneMatch: '*' }
      });
      return {
        allowed: true,
        limit,
        remaining: Math.max(0, limit - nextCount),
        resetAtMs,
        retryAfterSeconds: 0
      };
    } catch (error) {
      if (isConditionFailure(error)) continue;
      throw new RateLimitStoreError('failed to update generation rate limit state', error);
    }
  }

  throw new RateLimitStoreError('generation rate limit state remained contended');
}

function rateLimitResponse(result) {
  return jsonResponse(
    429,
    { error: 'rate limit exceeded' },
    rateLimitHeaders(result)
  );
}

function rateLimitUnavailableResponse() {
  return jsonResponse(503, { error: 'generation rate limit is temporarily unavailable' });
}

function isRateLimitStoreError(error) {
  return error instanceof RateLimitStoreError;
}

function withRateLimitHeaders(response, result) {
  if (!result) return response;
  return {
    ...response,
    headers: {
      ...(response.headers || {}),
      ...rateLimitHeaders(result)
    }
  };
}

module.exports = {
  DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
  RequestTooLargeError,
  assertRequestSize,
  authenticateGenerationRequest,
  consumeRateLimit,
  contentLengthResponse,
  isRateLimitStoreError,
  isRequestTooLargeError,
  positiveInteger,
  readRequestBuffer,
  readRequestText,
  rateLimitResponse,
  rateLimitUnavailableResponse,
  requestTooLargeResponse,
  withRateLimitHeaders
};
