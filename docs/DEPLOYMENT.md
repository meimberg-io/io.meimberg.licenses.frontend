# Deployment

Automatic deployment on push to `main` branch.

## How It Works

Push to `main` → GitHub Actions:
1. Runs tests and linting
2. Builds Docker image (with Vite build and nginx)
3. Pushes to GitHub Container Registry (GHCR)
4. SSHs to server
5. Updates container with Traefik labels
6. Traefik automatically routes traffic with SSL

**Time:** ~4-6 minutes

---

## Initial Setup

**First time?** Complete setup first: [GITHUB-SETUP.md](GITHUB-SETUP.md)

This covers:
- GitHub Variables & Secrets
- DNS configuration
- Server infrastructure
- SSH keys

---

## Deploy

```bash
git push origin main
```

Watch: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

---

## Operations

### View logs

```bash
ssh deploy@hc-02.meimberg.io "docker logs licenses-frontend -f"
```

### Restart app

```bash
ssh deploy@hc-02.meimberg.io "cd /srv/projects/licenses-frontend && docker compose restart"
```

### Manual redeploy

```bash
ssh deploy@hc-02.meimberg.io "cd /srv/projects/licenses-frontend && docker compose pull && docker compose up -d"
```

### SSH into container

```bash
ssh deploy@hc-02.meimberg.io "docker exec -it licenses-frontend sh"
```

### Check container status

```bash
ssh deploy@hc-02.meimberg.io "docker ps | grep licenses-frontend"
```

### View compose file

```bash
ssh deploy@hc-02.meimberg.io "cat /srv/projects/licenses-frontend/docker-compose.yml"
```

---

## Environment Variables

The following environment variables must be set in GitHub Variables/Secrets:

### GitHub Variables
- `SERVER_HOST` - Server hostname (e.g., `hc-02.meimberg.io`)
- `SERVER_USER` - SSH user (default: `deploy`)
- `APP_DOMAIN` - Domain for the application (e.g., `licenses.meimberg.io`)
- `API_BASE_URL` - Backend API URL (required)

### GitHub Secrets
- `SSH_PRIVATE_KEY` - Private SSH key for deployment user

### Build-time Environment Variables

The `VITE_API_BASE_URL` is set at build time from the GitHub Variable `API_BASE_URL`:
- This is baked into the static files during build
- **Required**: `API_BASE_URL` must be set in GitHub Variables

To change the API URL, update the `API_BASE_URL` GitHub Variable and redeploy.

---

## Troubleshooting

### Container not starting

```bash
# View logs
ssh deploy@hc-02.meimberg.io "docker logs licenses-frontend"

# View full compose logs
ssh deploy@hc-02.meimberg.io "cd /srv/projects/licenses-frontend && docker compose logs"
```

### SSL issues (502/503 errors)

```bash
# Check Traefik logs
ssh root@hc-02.meimberg.io "docker logs traefik | grep licenses-frontend"

# Check Traefik dashboard (if enabled)
# Usually at traefik.yourdomain.com

# Verify labels are correct
ssh deploy@hc-02.meimberg.io "docker inspect licenses-frontend | grep -A 10 Labels"
```

### DNS check

```bash
# Check DNS resolution
dig licenses.meimberg.io +short

# Should return server IP
# If empty, DNS not configured or not propagated yet (wait up to 24h)
```

### API connection issues

If the frontend can't connect to the backend:
1. Verify backend is accessible: `curl https://licenses-backend.meimberg.io/api/v1/users`
2. Check browser console for CORS errors
3. Verify `VITE_API_BASE_URL` in build logs matches backend URL

### Nginx issues

```bash
# Check nginx configuration
ssh deploy@hc-02.meimberg.io "docker exec licenses-frontend cat /etc/nginx/conf.d/default.conf"

# Test nginx config
ssh deploy@hc-02.meimberg.io "docker exec licenses-frontend nginx -t"
```

---

## Health Checks

The application exposes a health endpoint:

- Health: `https://licenses.meimberg.io/health`

---

## Architecture

- **Build**: Vite builds static files (HTML, CSS, JS)
- **Serve**: Nginx serves static files
- **Routing**: React Router handles client-side routing (nginx serves index.html for all routes)
- **API**: Frontend calls backend API at `https://licenses-backend.meimberg.io/api/v1`

