# Lotin-Kiril Converter

A small web app that converts between Latin and Cyrillic scripts and includes AI-powered translation, polishing, OCR, summarization, document templates and chat. The backend supports multiple AI providers: Google Gemini (default), Azure OpenAI, and Cloudflare AI (REST fallback).

**AI Providers**
- `gemini` — Google Gemini via `@google/genai` (default)
- `azure` — Azure OpenAI via REST chat/completions endpoints
- `cloudflare` — Cloudflare AI via REST API

**Environment variables**
Create a `.env` (or set system env vars) with the sections below. Only set the provider you intend to use.

Common
- `AI_PROVIDER` = `gemini` | `azure` | `cloudflare`

Gemini (Google)
- `GEMINI_API_KEY` = your Google Gemini API key

Azure OpenAI
- `AZURE_OPENAI_ENDPOINT` = e.g. `https://<resource-name>.openai.azure.com`
- `AZURE_OPENAI_API_KEY` = your Azure key
- `AZURE_OPENAI_DEPLOYMENT` = your deployment name (required)
- `AZURE_OPENAI_API_VERSION` = optional (default `2024-10-21`)

Cloudflare AI (REST)
- `CLOUDFLARE_ACCOUNT_ID` = your Cloudflare Account ID
- `CLOUDFLARE_API_TOKEN` = API token with `account.ai` or appropriate AI scopes
- `CLOUDFLARE_AI_MODEL` = optional, default `@cf/meta/llama-3.1-8b-instruct`

Example `.env` (PowerShell / Windows):
```powershell
$env:AI_PROVIDER = 'cloudflare'
$env:CLOUDFLARE_ACCOUNT_ID = 'your_account_id'
$env:CLOUDFLARE_API_TOKEN = 'your_api_token'
```

Or a simple `.env` file (for local dev with a loader):
```
AI_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=xxxxxxxx
AZURE_OPENAI_DEPLOYMENT=your-deployment
```

**Running locally**
- Install deps:
```bash
npm install
```
- Development (Vite + Express middleware):
```bash
npm run dev
```
- Production build + server bundle:
```bash
npm run build
npm start
```

**Per-request provider override**
You can temporarily override the configured provider per request by sending an `X-AI-Provider` header (e.g. `azure`) or adding `?provider=cloudflare` to the request URL. This is useful for testing without changing system env vars.

**Notes & Recommendations**
- Image OCR and some multimodal features are best supported by Gemini — use `AI_PROVIDER=gemini` when testing OCR routes.
- Keep API keys secret. For production, use a secrets store and do not commit `.env` to source control.
- Consider adding request timeouts, rate limits, and logging when deploying to production.

If you want, I can add example `curl` requests for each endpoint or scaffold a `.env.example` file next.
