# Twenty Eight Labs

Portfolio, research, and security tooling site for Twenty Eight Labs.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local AI with Ollama

No external API key is required for local AI. Install Ollama, then run:

```bash
npm run ai:local
```

Useful commands:

```bash
npm run ai:status
npm run ai:ask -- "Summarize the current AI security posture in one sentence."
```

Defaults:

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:8b
```

The helper reports whether Ollama is up, the configured model, loaded models,
best-effort uptime, and token totals tracked by `npm run ai:ask`.

If the model is missing:

```bash
ollama pull qwen3:8b
```

The app automatically tries local Ollama in development when `ATOMIX_AI_ENDPOINT`
is not configured.

## Deployed Apps and Local AI

Production apps cannot reach `127.0.0.1` on your Mac. To let deployed apps use
local Ollama, run the authenticated proxy and expose that proxy with a secure
tunnel:

```bash
npm run ai:local
npm run ai:proxy
cloudflared tunnel --url http://127.0.0.1:8787
```

Use the generated tunnel URL in Vercel:

```bash
ATOMIX_AI_ENDPOINT=https://your-tunnel.trycloudflare.com/analyze
ATOMIX_AI_API_KEY=<value printed by npm run ai:proxy>
```

Do not expose raw Ollama directly to the internet. The proxy requires a bearer
token for analysis calls and exposes only `/health` and `/analyze`.
