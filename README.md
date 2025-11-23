# License Management Frontend

React frontend application for managing licenses and their assignment to users.

## Technologies

- Vite
- TypeScript
- React 18
- React Router
- React Query (TanStack Query)
- shadcn/ui
- Tailwind CSS

## Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

The API base URL is configured via environment variable:

- Default: `http://localhost:8080/api/v1`
- Set `VITE_API_BASE_URL` in `.env` to override
- Production: Set at build time in Dockerfile (see `env.example`)

## Development

The frontend connects to the Spring Boot backend API. Make sure the backend is running on `http://localhost:8080` (or update `VITE_API_BASE_URL` accordingly).

## Deployment

Automatic deployment via GitHub Actions on push to `main` branch.

**Documentation:**
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment operations and troubleshooting
- [GITHUB-SETUP.md](docs/GITHUB-SETUP.md) - Initial GitHub setup

**Quick deploy:**
```bash
git push origin main
```

## Project Structure

- `src/pages/` - Page components (Users, Products, Assignments, etc.)
- `src/components/` - Reusable UI components
- `src/components/ui/` - shadcn/ui components
- `src/integrations/api/` - API client and endpoint functions
- `src/lib/` - Utility functions


