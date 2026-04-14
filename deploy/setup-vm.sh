#!/bin/bash
# Setup script for Syzy deployment VM with Docker
# Run this once on the target VM

set -e

echo "Setting up Syzy deployment environment with Docker..."

# Update system
apt-get update && apt-get upgrade -y

# Install prerequisites
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    unzip \
    wget

# Install Docker
if ! command -v docker &> /dev/null; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Enable Docker
systemctl enable docker
systemctl start docker

# Install Docker Compose standalone (if needed)
if ! command -v docker compose &> /dev/null; then
    apt-get install -y docker-compose
fi

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 7788/tcp
ufw --force enable

# Create deployment directory
mkdir -p /opt/syzy

echo "Docker setup complete!"
echo ""
echo "Remember to:"
echo "1. Add your GitHub Container Registry credentials"
echo "2. Set up GitHub Actions secrets"
echo ""
echo "To deploy manually:"
echo "  docker login ghcr.io -u <github-username>"
echo "  docker run -d --name syzy-backend -p 7788:7788 -e ... ghcr.io/<owner>/syzy-backend:latest"
