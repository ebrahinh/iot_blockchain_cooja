#!/bin/bash

set -e  # Exit on error
PROJECT_ROOT="$(pwd)"

echo "🛠️ [INFO] Starting final restructuring..."

# ==================== FRONTEND ====================

echo "🔄 [INFO] Organizing frontend files..."
mv "$PROJECT_ROOT/src/frontend/package.json" "$PROJECT_ROOT/src/frontend/" 2>/dev/null || true
mv "$PROJECT_ROOT/src/frontend/package-lock.json" "$PROJECT_ROOT/src/frontend/" 2>/dev/null || true
mv "$PROJECT_ROOT/public/" "$PROJECT_ROOT/src/frontend/" 2>/dev/null || true

# ==================== HYPERLEDGER ====================

echo "🔄 [INFO] Organizing Hyperledger files..."

# Rename configuration -> config
mv "$PROJECT_ROOT/src/hyperledger/network/configuration" "$PROJECT_ROOT/src/hyperledger/network/config" 2>/dev/null || true

# Move deploy script inside config
mv "$PROJECT_ROOT/src/hyperledger/network/deploy.sh" "$PROJECT_ROOT/src/hyperledger/network/config/" 2>/dev/null || true

# Rename and move scripts
mv "$PROJECT_ROOT/src/hyperledger/network/scripts/Custom_Chaincode_Deploy_Script_For_5_Orgs" "$PROJECT_ROOT/src/hyperledger/network/scripts/chaincode_deploy" 2>/dev/null || true

echo "✅ [INFO] Final restructuring complete!"

