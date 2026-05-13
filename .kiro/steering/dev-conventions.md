# Development Conventions

## Code Style

- **Formatter**: Prettier (config in `.prettierrc`)
- **Linter**: ESLint (config in `.eslintrc.js` and `frontend/.eslintrc.js`)
- Run `npm run format` to format all files
- Run `npm run lint` to lint frontend + backend

## Commit Convention

Commits follow **Conventional Commits** (enforced by commitlint + husky):

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
```

Examples:
- `feat(auth): add Google OAuth login`
- `fix(cart): correct quantity update logic`
- `docs(readme): update project structure`

See `COMMITS_PULLREQUEST_RULES.md` for full rules.

## Git Hooks (Husky)

- `pre-commit` — runs lint-staged (Prettier on staged files)
- `commit-msg` — validates commit message format
- `pre-push` — runs security scan + lint on changed files

## Backend Conventions

- **Module system**: ES Modules only (`import`/`export`) — never use `require()`
- **Async handling**: Use `asyncMiddleware` wrapper from `middlewares/async.middleware.js`
- **Error responses**: Use `errorResponse` utility from `utils/errorResponse.js`
- **Logging**: Use Winston logger from `utils/logger.js`, never use `console.log` in production code
- **Validation**: Use `express-validator` in routes
- **File naming**: camelCase for files, PascalCase for Mongoose models

### Adding a new feature (backend)

1. Create model in `src/models/`
2. Create service in `src/services/`
3. Create controller in `src/controllers/`
4. Create route file in `src/routes/`
5. Register route in `src/app.js`

## Frontend Conventions

- **Component files**: PascalCase (e.g., `ProductCard.jsx`)
- **Service files**: camelCase with `Service` suffix (e.g., `productService.js`)
- **State management**: Redux Toolkit for global state, React Context for auth/cart
- **API calls**: Always go through `services/` layer, never call axios directly in components
- **Axios instance**: Use `services/axiosInstance.js` (has interceptors for auth tokens)

### Adding a new page (frontend)

1. Create folder under `src/components/pages/<feature>/`
2. Add service in `src/services/`
3. Add route in `src/components/layout/App.jsx`

## Environment Variables

- Never hardcode secrets or API keys
- Backend: add to `backend/.env` and document in `backend/.env.example`
- Frontend: prefix with `VITE_` for Vite to expose them (e.g., `VITE_API_URL`)
- Terraform: use `.tfvars` files (gitignored), document in `.tfvars.example`

## Docker

- `Dockerfile` (root) — full-stack build for Heroku/generic deployment
- `backend/Dockerfile` — backend-only image for ECS Fargate
- `backend/Dockerfile.evolution` — incremental ECS deployment (preserves base image)
- Build context: always run Docker from the repo root

## Infrastructure

- All infra lives in `infra/terraform/`
- Environments: `dev`, `demo`, `production`
- Modules are reusable: `alb`, `autoscaling`, `dynamodb`, `ecs`, `lambda`, `network`
- Never commit `*.tfstate`, `*.tfvars`, or `.terraform/` directories
- IAM policies are in `infra/policy.json` (base) and `infra/new_policy.json` (updated)
