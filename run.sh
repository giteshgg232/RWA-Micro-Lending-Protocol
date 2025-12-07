#!/bin/bash

echo "RWA Lending Protocol Auto-Run Script"
echo "-----------------------------------------"

# Move into the project root
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"


echo "🔄 Starting Hardhat node..."
cd "$BACKEND_DIR"

# Kill any previous hardhat node
pkill -f "hardhat node" 2>/dev/null

# Start node
npx hardhat node > "$ROOT_DIR/hardhat-node.log" 2>&1 &

NODE_PID=$!

echo "⏳ Waiting for Hardhat node to boot..."
sleep 5


echo "Deploying smart contracts..."
npx hardhat run scripts/deploy.js --network localhost

if [ $? -ne 0 ]; then
  echo "Deployment failed!"
  kill $NODE_PID
  exit 1
fi

echo "Contracts deployed successfully!"


echo "Starting Next.js frontend..."

cd "$FRONTEND_DIR"
npm run dev
