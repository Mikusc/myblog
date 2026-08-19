# SceneShift API security configuration

The paid runtime and surface generation submission routes use custom bearer/API-key authentication even though their Azure Functions `authLevel` remains `anonymous`. This lets the Static Web Apps API receive the request before the application-level guard validates it.

The protected routes are:

- `POST /api/v1/runtime-generations`
- `POST /api/v1/surface-generations`

The status and generated-file `GET` routes remain public.

## Required authentication setting

Configure at least one of these Azure application settings. Do not commit the value to this repository.

- `SCENESHIFT_GENERATION_TOKEN`: one token.
- `SCENESHIFT_GENERATION_TOKENS`: comma-separated tokens for rotation.
- `SCENESHIFT_API_KEY`: compatibility alias for one token.

If none is configured, both protected routes fail closed with HTTP `503`. Clients may send the configured value using either:

```http
Authorization: Bearer <token>
```

or:

```http
x-sceneshift-api-key: <token>
```

## Request and rate limits

| Setting | Default | Purpose |
| --- | ---: | --- |
| `SCENESHIFT_RUNTIME_MAX_REQUEST_BYTES` | `12582912` | Maximum runtime-generation request size, including a multipart image. |
| `SCENESHIFT_SURFACE_MAX_REQUEST_BYTES` | `262144` | Maximum surface-generation JSON request size. |
| `SCENESHIFT_GENERATION_RATE_LIMIT` | `5` | Requests allowed per token, per protected route, per window. |
| `SCENESHIFT_GENERATION_RATE_WINDOW_SECONDS` | `60` | Fixed-window duration. |

Normal oversized requests are rejected from `Content-Length` before parsing. The consumed runtime body and decoded surface JSON are measured again so chunked oversized requests cannot create job artifacts or reach a paid provider.

Rate-limit counters are stored under `rate-limits/` in the existing SceneShift Azure Blob container. Updates use ETag conditions so concurrently scaled Functions share one counter. If the rate-limit store is unavailable or remains contended, generation fails closed with HTTP `503`.

Run the focused tests with:

```sh
npm test --prefix api
```
