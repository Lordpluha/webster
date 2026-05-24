# Webster

**Webster** is a browser-based design studio for creating posters, slides, and visual layouts without a professional design background. Users register, verify email, manage projects, edit on an infinite canvas with a custom 2D engine, export designs, and share projects via links.

**Live demo (production):** [http://webster-avm.duckdns.org](http://webster-avm.duckdns.org)  
Hosted on a **DigitalOcean** VPS (Frankfurt) with **Docker**, **Nginx**, and **MongoDB**.

---

## Features

| Area | Capabilities |
|------|----------------|
| **Auth** | Register, email verification, login, password reset, magic link, OAuth (Google / GitHub / Facebook), JWT in HttpOnly cookies, refresh rotation, TOTP 2FA |
| **Projects** | CRUD, soft delete, clone, paginated list, autosave (debounced GraphQL) |
| **Canvas editor** | Shapes, pencil paths, arrows, text, images (upload to server), select / move / resize / rotate, layers panel, groups, undo/redo (200 steps), zoom & pan, version history (up to 20 snapshots) |
| **Templates** | Base and user templates, create project from template, save project as template |
| **Export** | Client-side PNG, JPG, PDF, WEBP, JSON scene export |
| **Sharing** | Time-limited share links (`resolveShareLink` GraphQL) |
| **Assets** | `POST /upload` for images (max 10 MB), served from `/uploads` |

---

## Full stack

### Frontend (`apps/frontend`)

| Layer | Technology |
|-------|------------|
| Framework | **React 19** + **TypeScript** |
| Build | **Vite 6** |
| Routing | **React Router 7** |
| API client | **Apollo Client 4** (GraphQL, `credentials: include`) |
| State | **Zustand 5** |
| Styling | **Tailwind CSS 4** + Radix UI primitives |
| Canvas | **Custom canvas engine** (Canvas 2D API, no Fabric/Konva) — scene graph, history, dirty-region rendering |
| Export | **pdf-lib**, offscreen canvas rasterization |
| Tests | **Vitest**, **Playwright** (e2e) |

Architecture: Feature-Sliced Design under `src/` (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).

### Backend (`apps/backend`)

| Layer | Technology |
|-------|------------|
| Framework | **NestJS 11** + **TypeScript** |
| API | **GraphQL** (Apollo Server 5, code-first schema → `src/infra/graphql/schema.gql`) |
| Database | **MongoDB 7** via **Mongoose 8** |
| Auth | **JWT** (access + refresh), **argon2** password hashing, **otplib** (2FA), **cookie-parser** |
| Email | **Nodemailer** → **Brevo SMTP** (transactional) |
| OAuth | Google, Facebook, GitHub (optional env) |
| Security | **Helmet**, **express-mongo-sanitize**, **@nestjs/throttler**, **class-validator** |
| Logging | **Winston** + request ID middleware |
| Files | **Multer** upload, static `/uploads` and `/exports` |
| Scheduling | Cron cleanup (expired share links, orphan uploads) |

### Data layer (MongoDB collections)

| Collection | Purpose |
|------------|---------|
| `userentities` | Users, OAuth, 2FA flags |
| `refreshtokenentities` | Hashed refresh tokens (TTL index) |
| `projectentities` | Projects + JSON canvas `content` |
| `projectversionentities` | Version snapshots (max 20 per project) |
| `templateentities` | Base (`userId: null`) and user templates |
| `sharelinkentities` | Public share tokens |
| `uploadassetentities` | Uploaded file metadata |

### DevOps & infrastructure

| Component | Technology / provider |
|-----------|---------------------|
| **Hosting** | **DigitalOcean Droplet** — Ubuntu 24.04, 1 vCPU / 2 GB RAM, Frankfurt (`fra1`) |
| **Containers** | **Docker** + **Docker Compose v2** |
| **Reverse proxy** | **Nginx 1.24** (TLS via Let's Encrypt / Certbot when enabled) |
| **DNS** | **DuckDNS** — `webster-avm.duckdns.org` → droplet IP |
| **Email** | **Brevo** (`smtp-relay.brevo.com`, port **2525** on DO — ports 25/587 blocked) |
| **Firewall** | **UFW** (22, 80, 443); MongoDB **not** published to host (Docker-internal only) |
| **Volumes** | `mongo_data`, `backend_uploads` |

### Monorepo tooling

- **pnpm 9** workspaces (`@webster/frontend`, `@webster/backend`)
- **Node.js ≥ 20**
- Root scripts: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm docker:up`

---

## Architecture (high level)

```mermaid
flowchart LR
  Browser[Browser React SPA]
  Nginx[Nginx :80 / :443]
  FE[Frontend container :5173]
  BE[Backend NestJS :4000]
  Mongo[(MongoDB :27017 internal)]
  Brevo[Brevo SMTP :2525]

  Browser --> Nginx
  Nginx --> FE
  Nginx --> BE
  FE -->|GraphQL /upload| BE
  BE --> Mongo
  BE --> Brevo
```

PlantUML diagrams: `docs/diagrams/` (use case, activity, deployment, sequence, database).

---

## Repository structure

```text
webster/
├── apps/
│   ├── frontend/          # React + Vite + canvas engine
│   └── backend/           # NestJS + GraphQL + Mongoose
├── docs/
│   ├── diagrams/          # PlantUML (.puml)
│   ├── deploy/            # nginx example (see note below)
│   ├── методичка.md       # CBL methodology (UA)
│   └── ROADMAP_CHECKLIST.md
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

---

## Prerequisites

- **Node.js** ≥ 20  
- **pnpm** 9.x (`corepack enable`)  
- **Docker** + **Docker Compose** plugin (for containerized run / production-like setup)

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/andreo-kalashnello/webster.git
cd webster
pnpm install
```

### 2. Environment files

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Generate strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` for production.

### 3. Run (recommended for development)

**MongoDB in Docker, app via pnpm:**

```bash
docker compose up -d mongo
```

In `apps/backend/.env` use host Mongo:

```env
MONGODB_URI=mongodb://webster:webster@127.0.0.1:27017/webster?authSource=admin
```

For local mongo in compose without publishing port, temporarily add `ports: ["27017:27017"]` under `mongo` only on your machine, or use `docker compose run` — production compose has **no** host port on Mongo.

```bash
pnpm dev
```

- Frontend: http://localhost:5173  
- Backend health: http://localhost:4000/health  
- GraphQL: http://localhost:4000/graphql  

### 4. Run (full Docker stack)

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

In `apps/backend/.env` for all-in-Docker backend:

```env
MONGODB_URI=mongodb://webster:webster@mongo:27017/webster?authSource=admin
```

```bash
docker compose up --build -d
docker compose ps
```

---

## Environment variables

### Backend (`apps/backend/.env`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` \| `production` |
| `PORT` | Default `4000` |
| `MONGODB_URI` | `mongo:27017` in Docker; `127.0.0.1:27017` for hybrid dev |
| `JWT_*` | Access/refresh secrets and expiry |
| `SMTP_HOST` | e.g. `smtp-relay.brevo.com` |
| `SMTP_PORT` | **`2525`** on DigitalOcean; `587` works locally |
| `SMTP_USER` / `SMTP_PASS` | Brevo SMTP login + key (`xsmtpsib-...`) |
| `SMTP_FROM` | Must match a **verified sender** in Brevo |
| `FRONTEND_URL` | Public app URL (links in emails), e.g. `https://webster-avm.duckdns.org` |
| `GOOGLE_*`, `GITHUB_*`, `FACEBOOK_*` | Optional OAuth |

If `SMTP_HOST` is unset, verification emails are **logged only** (no real delivery).

### Frontend (`apps/frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_GRAPHQL_URL` | `http://localhost:4000/graphql` locally; `/graphql` behind Nginx in production |
| `VITE_APP_NAME` | `Webster` |
| `VITE_APP_ENV` | `development` \| `production` |

---

## Production deployment (DigitalOcean)

This is how the live environment is set up.

### Server

| Item | Value |
|------|--------|
| Provider | DigitalOcean |
| Region | Frankfurt (`fra1`) |
| Droplet | Ubuntu, 1 vCPU / 2 GB RAM |
| App path | `/opt/webster` |
| Domain | DuckDNS → `webster-avm.duckdns.org` |

### Deploy steps (summary)

```bash
# On the server
cd /opt/webster
git pull
cp apps/backend/.env   # production values — never commit .env
cp apps/frontend/.env

docker compose up -d --build
docker compose ps
curl -s http://127.0.0.1:4000/health
```

### Production `apps/backend/.env` checklist

```env
NODE_ENV=production
MONGODB_URI=mongodb://webster:webster@mongo:27017/webster?authSource=admin
FRONTEND_URL=http://webster-avm.duckdns.org
# After HTTPS: FRONTEND_URL=https://webster-avm.duckdns.org

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_USER=<brevo-smtp-login>
SMTP_PASS=<xsmtpsib-key>
SMTP_FROM=Webster <verified@your-email.com>
```

### Production `apps/frontend/.env`

```env
VITE_GRAPHQL_URL=/graphql
VITE_APP_NAME=Webster
VITE_APP_ENV=production
```

Rebuild frontend after env changes: `docker compose up -d --build frontend`.

### Nginx

Example config: `docs/deploy/nginx-webster.conf.example` (copy to `/etc/nginx/sites-available/webster` on the server).

| Location | Upstream | Notes |
|----------|----------|--------|
| `/` | `127.0.0.1:5173` | Vite dev server in container; WebSocket headers for HMR |
| `/graphql` | `127.0.0.1:4000/graphql` | `client_max_body_size 50m` (large autosave payloads) |
| `/upload` | `127.0.0.1:4000/upload` | Image upload |
| `/uploads` | `127.0.0.1:4000/uploads` | Static assets |
| `/health` | `127.0.0.1:4000/health` | Health check |
| `/exports` | `127.0.0.1:4000/exports` | Export files |

Reload: `nginx -t && systemctl reload nginx`

**HTTPS (optional):**

```bash
certbot --nginx -d webster-avm.duckdns.org
```

Then set `FRONTEND_URL=https://...` and recreate backend.

### Brevo (email)

1. Register at [brevo.com](https://www.brevo.com).  
2. **Senders** — verify the address used in `SMTP_FROM`.  
3. **SMTP & API** — create SMTP key; use as `SMTP_PASS`.  
4. On DigitalOcean use port **2525** (outbound 587/25 are blocked).

### MongoDB security

MongoDB must **not** be exposed on `0.0.0.0:27017`. The compose file has **no** `ports` mapping for `mongo`; only the `backend` service connects via hostname `mongo`.

Verify:

```bash
ss -tlnp | grep 27017   # should show nothing on the host
```

Docker can bypass UFW; removing the port publish is the correct fix. Optionally add a [DigitalOcean Cloud Firewall](https://docs.digitalocean.com/products/networking/firewalls/) allowing only 22, 80, 443.

### Vite allowed hosts

Production domain must be allowed in `apps/frontend/vite.config.ts` (`server.allowedHosts`, e.g. `.duckdns.org`) so Nginx proxy requests are accepted.

---

## Docker services

| Service | Image / build | Host ports | Notes |
|---------|---------------|------------|--------|
| `mongo` | `mongo:7` | *(none)* | Internal only; volume `mongo_data` |
| `backend` | `apps/backend/Dockerfile` | `4000` | Volume `backend_uploads` → `/app/apps/backend/uploads` |
| `frontend` | `apps/frontend/Dockerfile` | `5173` | `pnpm dev` in container (demo deploy) |

Healthchecks: `GET /health` (backend), wget on frontend port.

---

## API overview

- **GraphQL:** `POST /graphql` — main API (see `apps/backend/src/infra/graphql/schema.gql`)
- **REST:** `GET /health`, `POST /upload` (multipart, JWT cookie), static `GET /uploads/*`, `GET /exports/*`
- **Auth:** HttpOnly cookies `access_token`, `refresh_token`; Apollo retries with `refreshToken` mutation on `UNAUTHENTICATED`

Postman collection: `apps/backend/webster-backend.postman_collection.json`

---

## NPM scripts (root)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Backend + frontend concurrently |
| `pnpm dev:backend` / `pnpm dev:frontend` | Single app |
| `pnpm build` | Production build both apps |
| `pnpm test` | Unit tests (backend + frontend) |
| `pnpm test:e2e` | Playwright (frontend) |
| `pnpm docker:up` | `docker compose up --build` |
| `pnpm docker:down` | `docker compose down -v` |
| `pnpm docker:logs` | Follow container logs |

---

## Security notes

- Passwords hashed with **argon2**; refresh tokens stored as **bcrypt** hashes.  
- **CORS** in production: only `FRONTEND_URL`.  
- **Rate limiting** on GraphQL (NestJS Throttler).  
- **Request body limit** 50 MB (large canvas JSON).  
- Images stored as **URLs** (`/uploads/...`), not base64 in autosave (avoids payload limits).  
- Change default Mongo credentials in production; use strong JWT secrets.

---

## Team roles (reference)

| Role | Focus |
|------|--------|
| **Backend** | NestJS, GraphQL, MongoDB, auth, mail, deploy |
| **Teamlead / Canvas** | Canvas engine, architecture, editor core |
| **Frontend / Design** | React UI, editor UX, styling |

---

## License

Private academic / team project. All rights reserved by the authors.
