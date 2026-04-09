# online-pdf-chat-web-server

Backend for the online PDF chat app. The VPS deployment stack for both repos lives here.

## Local development

```bash
bun install
bun run dev
```

The API listens on `http://localhost:4000`.

## VPS deployment

The production stack uses:

- `mongodb`: local MongoDB 7 container with a persistent Docker volume
- `api`: Bun/Elysia backend on port `4000`
- `client`: static Vite build served by Nginx on port `80`

### Required VPS repo layout

Clone both repos side by side on the VPS:

```text
~/apps/online-pdf-chat-web-server
~/apps/online-pdf-chat-web-client
```

`docker-compose.vps.yml` expects the client repo to be the sibling directory `../online-pdf-chat-web-client`.

### Environment

On the VPS, in this repo, copy `.env.example` to `.env` and fill in the real values.

Important variables:

- Backend runtime: `PORT`, `NODE_ENV`, `MONGO_PROD_URL`, Firebase admin vars, `GEMINI_API_KEY`, `OPENAI_API_KEY`
- Compose ports: `API_PORT`, `CLIENT_PORT`
- Local Mongo defaults in the VPS stack:
  - `MONGO_PROD_URL=mongodb://mongodb:27017/FreePDFChat`
  - `MONGO_DEV_URL=mongodb://mongodb:27017/FreePDFChat-dev`
- Client build-time prod endpoints:
  - `VITE_REACT_APP_API_BASE_PROD_URL=http://vps-23dedd20.vps.ovh.net:4000`
  - `VITE_REACT_APP_WS_BASE_PROD_URL=ws://vps-23dedd20.vps.ovh.net:4000/conversation/messages`

### First deploy

```bash
docker compose -f docker-compose.vps.yml build
docker compose -f docker-compose.vps.yml up -d
```

App URLs:

- Frontend: `http://vps-23dedd20.vps.ovh.net`
- Backend health check: `http://vps-23dedd20.vps.ovh.net:4000/`

## GitHub Actions deployment

This repo deploys the backend service on pushes to `main`.

Required GitHub repository secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT` (optional, defaults to `22`)
- `SERVER_REPO_DIR` (example: `/home/anby/apps/online-pdf-chat-web-server`)

The workflow SSHes into the VPS, pulls this repo, and runs:

```bash
docker compose -f docker-compose.vps.yml up -d --build api
```
