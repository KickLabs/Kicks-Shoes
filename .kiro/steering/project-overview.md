# Kicks Shoes — Project Overview

## What is this project?

**Kicks Shoes** is a full-stack e-commerce platform for selling shoes. It is a monorepo with three main parts:

- `frontend/` — React + Vite SPA
- `backend/` — Node.js + Express REST API
- `infra/` — Terraform infrastructure on AWS

## Key Technologies

- **Frontend**: React 18, Vite, Redux Toolkit, Ant Design, React Router v6, Socket.IO, TanStack Query
- **Backend**: Node.js (ESM), Express, MongoDB/Mongoose, Socket.IO, Winston logger
- **Payments**: VNPay, PayOS
- **AI**: AWS Bedrock (Knowledge Base + RAG), Google Gemini
- **Storage**: AWS S3, Cloudinary
- **Database**: MongoDB (primary), AWS DynamoDB (chat messages)
- **Infrastructure**: AWS ECS Fargate, ALB, CloudFront, Lambda, Terraform

## Backend Architecture

The backend follows a layered architecture:

```
routes → controllers → services → models
```

- `routes/` — Express route definitions, apply middlewares
- `controllers/` — Handle HTTP request/response, call services
- `services/` — Business logic, database operations
- `models/` — Mongoose schemas
- `middlewares/` — Auth (JWT), role-based access, upload, error handling
- `config/` — External service configurations (DB, S3, Cloudinary, email)
- `utils/` — Shared utilities (JWT, logger, cron jobs, socket.io)

## Frontend Architecture

```
pages (in components/pages/) → services → store (Redux)
```

- `components/pages/` — Page-level components organized by feature
- `components/common/` — Shared reusable components
- `services/` — Axios-based API calls
- `store/` — Redux store with Redux Toolkit
- `contexts/` — React Context for Auth, Cart, VideoCall, Weather
- `hooks/` — Custom React hooks

## Running the Project

```bash
# Install all dependencies
npm run install-all --legacy-peer-deps

# Start dev (both frontend + backend)
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

## Environment Files

- `backend/.env` — Backend secrets (copy from `backend/.env.example`)
- `frontend/.env` — Frontend config (copy from `frontend/.env.example`)

## Important Conventions

- Backend uses **ES Modules** (`"type": "module"` in package.json) — use `import/export`, not `require()`
- API routes are prefixed with `/api/v1/`
- Auth uses JWT stored in HTTP-only cookies
- File uploads go to `backend/uploads/` (local) or AWS S3 (production)
- Logs go to `backend/logs/` (gitignored)
- All sensitive files (`.env`, `*.pem`, `*.tfvars`) are gitignored
