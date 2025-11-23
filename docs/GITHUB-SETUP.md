# GitHub Setup

One-time setup for GitHub Actions deployment.

## Prerequisites

- GitHub repository
- Access to deployment server (hc-02.meimberg.io)
- SSH key pair for deployment user

## Step 1: Configure GitHub Variables

Go to: `Settings` → `Secrets and variables` → `Actions` → `Variables`

Add the following variables:

| Variable | Value | Example |
|----------|-------|---------|
| `SERVER_HOST` | Server hostname | `hc-02.meimberg.io` |
| `SERVER_USER` | SSH user (optional, defaults to `deploy`) | `deploy` |
| `APP_DOMAIN` | Domain for the application | `licenses.meimberg.io` |

## Step 2: Configure GitHub Secrets

Go to: `Settings` → `Secrets and variables` → `Actions` → `Secrets`

Add the following secret:

| Secret | Value | Description |
|--------|-------|-------------|
| `SSH_PRIVATE_KEY` | Private SSH key content | Private key for `deploy` user on server |

### Generate SSH Key (if needed)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions-deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/github-actions-deploy.pub deploy@hc-02.meimberg.io

# Copy private key content to GitHub Secret
cat ~/.ssh/github-actions-deploy
```

## Step 3: Configure DNS

Add DNS A record pointing to server IP:

```
licenses.meimberg.io  A  <server-ip>
```

DNS propagation can take up to 24 hours.

## Step 4: Verify Setup

1. Push to `main` branch
2. Check GitHub Actions: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
3. Wait for deployment to complete (~4-6 minutes)
4. Verify application is accessible: `https://licenses.meimberg.io`

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection
ssh -i ~/.ssh/github-actions-deploy deploy@hc-02.meimberg.io

# Verify SSH key permissions
chmod 600 ~/.ssh/github-actions-deploy
```

### GitHub Actions Failures

Check GitHub Actions logs for:
- SSH connection errors
- Docker login issues
- Environment variable substitution errors
- Build failures

### Server Access

Ensure the `deploy` user has:
- Docker access (member of `docker` group)
- Write access to `/srv/projects/licenses-frontend`
- Access to external `traefik` network

```bash
# Check docker group
groups deploy

# Add to docker group if needed (as root)
usermod -aG docker deploy
```

---

## Next Steps

After setup, see [DEPLOYMENT.md](DEPLOYMENT.md) for deployment operations and troubleshooting.

