# API Examples — Lotin-Kiril-converter

Below are `curl` examples for common AI endpoints. Adjust host and provider as needed.

Base URL (dev): http://localhost:3000

1) Translate

```bash
curl -X POST http://localhost:3000/api/ai/translate \
  -H "Content-Type: application/json" \
  -H "X-AI-Provider: cloudflare" \
  -d '{"text":"Salom dunyo","sourceLang":"uz","targetLang":"ru"}'
```

2) Polish (text editing)

```bash
curl -X POST http://localhost:3000/api/ai/polish \
  -H "Content-Type: application/json" \
  -d '{"text":"salom, men yaxshi emasman","style":"conversational"}'
```

3) OCR (image)

```bash
# image.png -> base64
BASE64_IMG=$(base64 -w 0 image.png)
curl -X POST http://localhost:3000/api/ai/ocr \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,'"$BASE64_IMG"'"}'
```

4) Summarize

```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"Long article text...","lang":"uz"}'
```

5) Document template

```bash
curl -X POST http://localhost:3000/api/ai/document \
  -H "Content-Type: application/json" \
  -d '{"templateType":"ariza","to":"Direktor","from":"Ism Fam","detail":"Iltimos..."}'
```

6) Chat (Q&A)

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Lotin va kirill transliteratsiya qoidalari nima?","lang":"uz"}'
```

Notes:
- Use `X-AI-Provider` header to override the configured provider per request.
- For OCR, prefer `AI_PROVIDER=gemini` for best multimodal support.
- If using Azure, ensure `AZURE_OPENAI_DEPLOYMENT` corresponds to a chat/completions deployment.
