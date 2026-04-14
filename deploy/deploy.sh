#!/bin/bash
# Deploy script - called by GitHub Actions

set -e

# Backend deployment
echo "Deploying backend..."
cd /opt/syzy-backend

# Stop existing process
pkill -f "node dist/main" || true
sleep 2

# Copy new build
cp -r $1/syzy-be/dist ./dist

# Update environment if provided
if [ -f "$2/.env" ]; then
    cp $2/.env .env
fi

# Restart with PM2
pm2 restart syzy-backend || pm2 start dist/main.js --name syzy-backend --env production

# Wait for health check
sleep 3

# Health check
if curl -f http://localhost:7788/health > /dev/null 2>&1; then
    echo "Backend deployed successfully!"
else
    echo "Backend health check failed!"
    exit 1
fi

# Frontend deployment
echo "Deploying frontend..."
cd /var/www/syzy-frontend

# Remove old build
rm -rf .next
cp -r $1/syzy-fe/.next .next
cp -r $1/syzy-fe/public public 2>/dev/null || true

# Restart frontend (if using PM2 for Next.js)
pm2 restart syzy-frontend || true

echo "Deployment complete!"
