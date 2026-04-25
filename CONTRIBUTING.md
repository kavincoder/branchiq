# Contributing to BranchIQ

Thanks for your interest in contributing! Here's everything you need to know.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/branchiq.git`
3. Follow the [Quick Start](README.md#quick-start) to get the app running locally
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Guidelines

### Backend (Python / FastAPI)

- All new endpoints must have a corresponding test in `backend/tests/`
- Use `Depends(get_current_user)` for any authenticated endpoint
- Use `Depends(require_manager)` for manager-only endpoints
- Run tests before opening a PR: `pytest tests/ -v`
- Follow the existing pattern: validate with Pydantic, write to DB, call `log_action()`

### Frontend (React / Vite)

- All API calls must go through `src/api/client.js` — never use `fetch` directly in pages
- Follow the existing page structure: `useState` for local state, `useEffect` for data fetching
- Run build check before opening a PR: `npm run build`

## Pull Request Process

1. Make sure all tests pass
2. Update `README.md` if you added or changed a feature
3. Keep PRs focused — one feature or fix per PR
4. Write a clear PR description explaining what and why

## Reporting Bugs

Open a [GitHub Issue](https://github.com/kavincoder/branchiq/issues) with:
- Steps to reproduce
- Expected vs actual behaviour
- Browser/OS if it's a frontend issue

## Security Issues

**Do not open a public issue for security vulnerabilities.**  
See [SECURITY.md](SECURITY.md) for the responsible disclosure process.
