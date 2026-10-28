# Documentation — API
Project: متجر أزياء اختبار (NB-29KFRB)

## GET /api/health
Response 200:
{
  "status": "ok",
  "service": "nebras-ai",
  "time": "ISO-8601"
}

## GET /api/echo?msg=<text>
- msg: required, max 500 chars
- 200: { "echo": "<text>", "receivedAt": "ISO-8601" }
- 400: { "error": "msg is required (max 500 chars)" }

## Static files
Files in /public are served at root. Paths are validated (no traversal).

