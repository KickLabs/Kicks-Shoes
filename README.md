# Kicks Shoes — E-commerce Platform

Full-stack e-commerce application for selling shoes, built with **React** (frontend), **Node.js/Express** (backend), and deployed on **AWS** via Terraform.

---

## Project Structure

```
kicks-shoes/
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── assets/             # Images, SVGs, static files
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Shared components (LoadingSpinner, etc.)
│   │   │   ├── layout/         # App layout, header components
│   │   │   ├── livestream/     # Livestream chat UI
│   │   │   ├── pages/          # Page-level components
│   │   │   └── weather/        # Weather widget components
│   │   ├── config/             # API and WebRTC config
│   │   ├── contexts/           # React context providers
│   │   ├── data/               # Static/mock data
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service layer (axios)
│   │   ├── store/              # Redux store
│   │   ├── styles/             # Global CSS
│   │   └── utils/              # Helper utilities
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                    # Node.js + Express REST API
│   ├── src/
│   │   ├── config/             # DB, S3, Cloudinary, email configs
│   │   ├── controllers/        # Route handler logic
│   │   ├── middlewares/        # Auth, error, upload middlewares
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic layer
│   │   ├── templates/          # Email templates
│   │   ├── utils/              # Utilities (JWT, logger, cron, etc.)
│   │   ├── vnpay/              # VNPay payment integration
│   │   ├── app.js              # Express app entry point
│   │   └── socket.js           # Socket.IO setup
│   ├── lambda/
│   │   └── bedrock-chat/       # AWS Lambda: Bedrock AI chat processor
│   ├── Dockerfile              # Production Docker image
│   ├── Dockerfile.evolution    # Incremental ECS deployment image
│   └── package.json
│
├── infra/                      # Infrastructure as Code
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── dev/            # Dev environment (01-network, 02-app)
│   │   │   ├── demo/           # Demo environment
│   │   │   └── production/     # Production environment
│   │   └── modules/            # Reusable Terraform modules
│   │       ├── alb/            # Application Load Balancer
│   │       ├── autoscaling/    # ECS Auto Scaling
│   │       ├── dynamodb/       # DynamoDB tables
│   │       ├── ecs/            # ECS Fargate cluster & service
│   │       ├── lambda/         # Lambda function
│   │       └── network/        # VPC, subnets, security groups
│   ├── deploy/                 # Platform deployment configs (Heroku)
│   ├── cf-config.json          # CloudFront distribution config
│   ├── policy.json             # IAM policy (base)
│   └── new_policy.json         # IAM policy (updated)
│
├── docs/                       # Project documentation
│   ├── aws/
│   │   ├── backend/            # Backend AWS deployment guides
│   │   └── frontend/           # Frontend AWS deployment guides
│   ├── weekly/                 # Weekly progress reports
│   │   ├── week1/
│   │   └── week2/
│   └── images/                 # Screenshots and diagrams
│
├── scripts/                    # Automation & utility scripts
│   ├── security/               # Pre-push audit, lint scripts
│   ├── deploy-all.ps1
│   ├── k6-loadtest.js
│   └── ...
│
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
│
├── Dockerfile                  # Root Dockerfile (full-stack build)
├── package.json                # Root workspace (dev tooling only)
└── .gitignore
```

---

## Prerequisites

- Node.js v18+
- MongoDB
- npm

## Quick Start

### Install all dependencies

```bash
npm run install-all --legacy-peer-deps
```

### Run in development

```bash
npm run dev
```

This starts both frontend (`http://localhost:5173`) and backend (`http://localhost:5000`) concurrently.

### Run separately

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

---

## Environment Variables

Copy the example files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Key backend variables:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Server port (default: 5000) |
| `AWS_REGION` | AWS region |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name |
| `BEDROCK_KB_ID` | Bedrock Knowledge Base ID |

---

## Tech Stack

### Frontend
- React 18, Vite, React Router v6
- Redux Toolkit + Redux Persist
- Ant Design, TailwindCSS
- Socket.IO Client, Axios
- TanStack Query

### Backend
- Node.js, Express
- MongoDB + Mongoose
- Socket.IO
- AWS SDK (S3, DynamoDB, Bedrock)
- Cloudinary, VNPay, PayOS

### Infrastructure
- AWS ECS Fargate, ALB, CloudFront
- AWS DynamoDB, S3, Lambda, Bedrock
- Terraform (IaC)
- GitHub Actions (CI/CD)
- Docker

---

## Available Scripts (root)

| Script | Description |
|---|---|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `npm run lint` | Lint both frontend and backend |
| `npm run format` | Format all files with Prettier |
| `npm run security:scan` | Run security audit |
| `npm run install-all` | Install all dependencies |
