#!/bin/bash
# Run this from your local era-hub folder to push the frontend to your VPS.
# Usage: bash deploy.sh root@YOUR_VPS_IP

VPS=${1:-""}
if [ -z "$VPS" ]; then
  echo "Usage: bash deploy.sh root@YOUR_VPS_IP"
  exit 1
fi

echo "Building ERA Hub..."
npm run build

echo "Uploading to $VPS..."
ssh "$VPS" "mkdir -p /var/www/era-hub"
scp -r dist/* "$VPS":/var/www/era-hub/

echo "Done — ERA Hub is live at your VPS."
