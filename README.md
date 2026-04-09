# DSA Tracker

This repo is now split into two deployable apps:

- `client/` - Vite + React frontend, ready for Vercel
- `server/` - Express + MongoDB backend, ready for Render

## Local development

Install dependencies:

```bash
npm run install:client
npm run install:server
```

Run the frontend and backend in two terminals:

```bash
npm run dev:client
npm run dev:server
```

The frontend uses the Vite proxy in development, so `VITE_API_URL` can stay empty locally.

## Environment variables

Frontend (`client/.env.example`):

```bash
VITE_API_URL=
```

Backend (`server/.env.example`):

```bash
PORT=10000
MONGO_URI=
JWT_SECRET=
CLIENT_URL=http://localhost:5173
FRONTEND_URL=
GROQ_API_KEY=
```

## Deployment notes

- Vercel: deploy `client/` as the project root directory.
- Render: deploy `server/` as a Node web service.
- The backend currently stores profile images on the local filesystem. That works on Render at runtime, but files are ephemeral and can disappear after redeploys or restarts. Use external storage later if you need persistent uploads.
- The current Express backend is not a good fit for Vercel in its present form because it relies on a long-running server process and local file storage.
