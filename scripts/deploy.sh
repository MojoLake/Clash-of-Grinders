#!/bin/bash

# Deployment Script for Clash of Grinders
# Builds locally, transfers to VPS, and deploys with pm2
#
# Usage:
#   ./scripts/deploy.sh
#   (Will prompt for VPS IP if not set)
#
# Or set environment variables:
#   export VPS_IP=your.vps.ip
#   export SSH_USER=root                    # default: root (SSH login user)
#   export DEPLOY_USER=mojolake            # default: mojolake (user to run app)
#   export VPS_PATH=/your/deploy/path      # default: /home/mojolake/clash-of-grinders
#   export PM2_APP_NAME=your_app           # default: clash-of-grinders
#   ./scripts/deploy.sh
#
# Or use a .env.deploy file (gitignored):
#   echo "VPS_IP=your.vps.ip" > .env.deploy
#   source .env.deploy && ./scripts/deploy.sh

set -e  # Exit on error

# ============================================
# Configuration
# ============================================
# Override these with environment variables or edit locally
VPS_IP="${VPS_IP:-}"
SSH_USER="${SSH_USER:-root}"
DEPLOY_USER="${DEPLOY_USER:-mojolake}"
VPS_PATH="${VPS_PATH:-/home/mojolake/clash-of-grinders}"
PM2_APP_NAME="${PM2_APP_NAME:-clash-of-grinders}"
TAR_FILE="clash-of-grinders-deploy.tar.gz"

# Prompt for VPS_IP if not set
if [ -z "$VPS_IP" ]; then
    read -p "Enter VPS IP address: " VPS_IP
    if [ -z "$VPS_IP" ]; then
        error "VPS IP address is required"
        exit 1
    fi
fi

# ============================================
# Color Output
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# ============================================
# Cleanup Function
# ============================================
cleanup() {
    if [ -f "$TAR_FILE" ]; then
        info "Cleaning up local tar file..."
        rm -f "$TAR_FILE"
        success "Local cleanup complete"
    fi
}

trap cleanup EXIT

# ============================================
# Main Deployment Process
# ============================================

echo ""
info "=========================================="
info "  Clash of Grinders - Deployment Script"
info "=========================================="
echo ""

# Step 1: Build Next.js application
info "Step 1/5: Building Next.js application..."
if npm run build; then
    success "Build completed successfully"
else
    error "Build failed"
    exit 1
fi

echo ""

# Step 2: Create tar archive
info "Step 2/5: Creating deployment archive..."
if tar -czf "$TAR_FILE" .next/ public/ package.json package-lock.json; then
    TAR_SIZE=$(du -h "$TAR_FILE" | cut -f1)
    success "Archive created successfully ($TAR_SIZE)"
else
    error "Failed to create archive"
    exit 1
fi

echo ""

# Step 3: Transfer to VPS
info "Step 3/5: Transferring to VPS ($SSH_USER@$VPS_IP)..."
if scp "$TAR_FILE" "$SSH_USER@$VPS_IP:$VPS_PATH/"; then
    success "Transfer completed successfully"
else
    error "Transfer failed"
    exit 1
fi

echo ""

# Step 4: Deploy on VPS
info "Step 4/5: Deploying on VPS..."

ssh "$SSH_USER@$VPS_IP" bash << EOF
    set -e
    
    echo "Switching to user: $DEPLOY_USER"
    su - $DEPLOY_USER bash << DEPLOY_EOF
        set -e
        cd $VPS_PATH
        
        echo "Extracting archive..."
        tar -xzf $TAR_FILE
        
        echo "Installing production dependencies..."
        npm install --production
        
        echo "Checking pm2 process status..."
        if pm2 describe $PM2_APP_NAME > /dev/null 2>&1; then
            echo "Reloading existing pm2 process..."
            pm2 reload $PM2_APP_NAME
        else
            echo "Starting new pm2 process on port 8080..."
            PORT=8080 pm2 start npm --name "$PM2_APP_NAME" -- start
            pm2 save
        fi
        
        echo "Cleaning up deployment archive..."
        rm -f $TAR_FILE
        
        echo "Deployment complete!"
DEPLOY_EOF
EOF

if [ $? -eq 0 ]; then
    success "VPS deployment completed successfully"
else
    error "VPS deployment failed"
    exit 1
fi

echo ""

# Step 5: Verify deployment
info "Step 5/5: Verifying deployment..."
ssh "$SSH_USER@$VPS_IP" "su - $DEPLOY_USER -c 'pm2 status $PM2_APP_NAME'"

echo ""
success "=========================================="
success "  Deployment completed successfully!"
success "=========================================="
echo ""
info "Application is running at: http://$VPS_IP:8080"
echo ""

