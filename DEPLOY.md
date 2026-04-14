# Syzy Deployment Guide

## Quick Start

The CI/CD pipeline automatically deploys to production when changes are pushed to `main` branch:
- Backend deploys when `syzy-be/**` files change
- Frontend deploys when `syzy-fe/**` files change

## Required GitHub Secrets

Add these secrets in GitHub repo settings: `Settings > Secrets and variables > Actions`

### Server Access
| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Server IP address (e.g., `206.189.151.6`) |
| `SSH_PRIVATE_KEY` | SSH private key for root access |
| `GHCR_TOKEN` | GitHub PAT with `read:packages` scope |

### Backend Environment
| Secret | Description |
|--------|-------------|
| `DB_URL` | PostgreSQL connection string (e.g., `postgresql://syzy:password@syzy-postgres:5432/syzy_waitlist`) |
| `REDIS_URL` | Redis connection string (e.g., `redis://syzy-redis:6379`) |
| `RESEND_API_KEY` | Resend.com API key for emails |
| `EMAIL_FROM` | Sender email address |
| `WAITLIST_APP_ORIGIN` | Frontend URL (e.g., `https://syzy.space`) |
| `WAITLIST_MEMBER_JWT_SECRET` | JWT secret (min 32 chars) |
| `WAITLIST_ADMIN_JWT_SECRET` | Admin JWT secret (min 32 chars) |
| `WAITLIST_MEMBER_REFRESH_SECRET` | Refresh token secret |
| `WAITLIST_ADMIN_REFRESH_SECRET` | Admin refresh secret |

### Frontend Environment
| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g., `https://backend.syzy.space`) |
| `NEXT_PUBLIC_RPC_URL` | Solana RPC URL |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Reown/WalletConnect project ID |
| `NEXT_PUBLIC_PROGRAM_ID` | Solana program ID |
| `NEXT_PUBLIC_WAITLIST_API_URL` | Waitlist API URL |

## Creating GHCR_TOKEN

1. Go to GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with scope: `read:packages`
3. Copy token and add as `GHCR_TOKEN` secret in repo

## Manual Deployment

If you need to deploy manually without GitHub Actions:

```bash
# SSH to server
ssh root@206.189.151.6

# Login to GHCR
echo "YOUR_PAT" | docker login ghcr.io -u minkhoaa --password-stdin

# Deploy using docker-compose
cd /opt/syzy
cp /path/to/.env .env  # Create from deploy/.env.example
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Architecture

```
Internet
    |
  Nginx (SSL termination)
    |
    +-- syzy.space --> syzy-frontend:3000
    +-- backend.syzy.space --> syzy-backend:7788
    |
syzy-network (Docker bridge)
    |
    +-- syzy-frontend (Next.js)
    +-- syzy-backend (NestJS)
    +-- syzy-postgres (PostgreSQL 16)
    +-- syzy-redis (Redis 7)
```

## Nginx Setup

Copy nginx configs to server:
```bash
scp deploy/nginx-*.conf root@206.189.151.6:/etc/nginx/sites-available/

# Enable sites
ln -sf /etc/nginx/sites-available/nginx-frontend.conf /etc/nginx/sites-enabled/syzy-frontend
ln -sf /etc/nginx/sites-available/nginx-backend.conf /etc/nginx/sites-enabled/syzy-backend

# SSL with certbot
certbot --nginx -d syzy.space -d www.syzy.space
certbot --nginx -d backend.syzy.space

nginx -t && systemctl reload nginx
```

## Rollback

To rollback to a previous version:

```bash
# List available tags
docker images ghcr.io/minkhoaa/syzy/syzy-backend

# Pull specific version
docker pull ghcr.io/minkhoaa/syzy/syzy-backend:main-abc1234

# Restart with old image
docker stop syzy-backend
docker rm syzy-backend
docker run -d --name syzy-backend ... ghcr.io/minkhoaa/syzy/syzy-backend:main-abc1234
```

## Troubleshooting

### Check container logs
```bash
docker logs syzy-backend --tail 100
docker logs syzy-frontend --tail 100
```

### Check container health
```bash
docker ps
curl http://localhost:7788/health
curl http://localhost:3000
```

### Restart services
```bash
docker restart syzy-backend syzy-frontend
```

### Database migrations
```bash
docker exec -it syzy-backend npx prisma migrate deploy
```
