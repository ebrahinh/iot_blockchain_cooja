#!/bin/bash

# IoT Security & Blockchain Deployment Script
# Automates: Cooja IoT Simulation, Hyperledger Fabric, Backend, Frontend

set -e  # Exit immediately if a command fails

echo "🚀 Starting Deployment..."

# Step 1: Run Cooja Simulation
echo "🔹 Running Cooja..."
COOJA_DIR=~/contiki-ng/tools/cooja

# Ensure Gradle (`gradlew`) is executable
chmod +x $COOJA_DIR/gradlew

# Run Cooja
cd $COOJA_DIR
./gradlew run &

# Give Cooja some time to start
sleep 10

# Step 2: Initialize Border Routers & TunSlip6
echo "🔹 Setting Up Border Routers & TunSlip6..."
BORDER_DIR=~/blockchain-iot-project--main/cooja_simulation/border_routers_code
TUNSLIP6_PATH=~/contiki-ng/tools/serial-io/tunslip6  # Ensure this is the correct path

# Check if tunslip6 exists
if [ ! -f "$TUNSLIP6_PATH" ]; then
    echo "❌ tunslip6 not found! Compiling..."
    cd ~/contiki-ng/tools/serial-io
    make tunslip6
fi

# Set Contiki path
export CONTIKI=~/contiki-ng

# Compile and Run Border Routers
cd $BORDER_DIR
for router in availability-sensor-node integrity-sensor-node mobility-sensor-node network-sensor-node security-sensor-node; do
    if [ -f "$router.c" ]; then
        echo "🔹 Compiling $router..."
        make -C $BORDER_DIR $router || echo "⚠️ Compilation failed for $router, skipping..."
        sudo ./$router &
    else
        echo "⚠️ Source file $router.c not found! Skipping..."
    fi
done

# Start TunSlip6 for Border Routers
echo "🔹 Setting up TunSlip6..."
sudo $TUNSLIP6_PATH -a 127.0.0.1 aaaa::1/64 -p 60020 -t tun0 &
sudo $TUNSLIP6_PATH -a 127.0.0.1 aaaa::1/64 -p 60002 -t tun1 &
sudo $TUNSLIP6_PATH -a 127.0.0.1 aaaa::1/64 -p 60003 -t tun2 &
sudo $TUNSLIP6_PATH -a 127.0.0.1 aaaa::1/64 -p 60004 -t tun3 &
sudo $TUNSLIP6_PATH -a 127.0.0.1 aaaa::1/64 -p 60005 -t tun4 &

sleep 5

# Step 3: Deploy Hyperledger Fabric Network
echo "🔹 Deploying Hyperledger Fabric Network..."
FABRIC_DIR=~/blockchain-iot-project--main/blockchain_hyperledger/fabric-samples/test-network

# Stop any running containers and clean up old configurations
docker stop $(docker ps -aq) || true
docker rm $(docker ps -aq) || true
docker network prune -f || true
docker volume prune -f || true

cd $FABRIC_DIR
./network.sh down
rm -rf organizations/
./network.sh up createChannel -c mychannel -ca

sleep 5

# Step 4: Deploy Blockchain Organizations (SecurityOrg, IntegrityOrg, NetworkMobilityOrg)
echo "🔹 Deploying Blockchain Organizations..."
./SecurityOrg.sh up
./IntegrityOrg.sh up
./NetworkMobilityOrg.sh up

sleep 5

# Step 5: Deploy Chaincodes
echo "🔹 Deploying Chaincodes..."
CHAINCODE_DIR=~/blockchain-iot-project--main/blockchain_hyperledger/chaincodes

for chaincode in security integrity mobility network availability; do
    echo "🔹 Deploying $chaincode..."
    ./network.sh deployCC -ccn $chaincode -ccp ../asset-transfer-basic/cc-$chaincode/ -ccl node
done

sleep 5

# Step 6: Start Hyperledger REST API
echo "🔹 Starting Hyperledger REST API..."
REST_API_DIR=~/blockchain-iot-project--main/blockchain_hyperledger/rest_api_codes
cd $REST_API_DIR

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    npm install
fi

npm run build

# Generate .env file
TEST_NETWORK_HOME=$FABRIC_DIR npm run generateEnv

# Set Redis password
export REDIS_PASSWORD=$(uuidgen)

npm run start:redis &
npm run start:dev &

sleep 5

# Step 7: Start Hyperledger Blockchain Explorer
echo "🔹 Starting Blockchain Explorer..."
EXPLORER_DIR=~/blockchain-iot-project--main/blockchain_hyperledger/hyperledger_explorer_config_files
cd $EXPLORER_DIR

cp -r ../fabric-samples/test-network/organizations/ .
docker-compose up -d

sleep 5

# Step 8: Start Backend API
echo "🔹 Starting Backend API..."
BACKEND_DIR=~/blockchain-iot-project--main/web_application/backend
cd $BACKEND_DIR

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Kill any existing backend process before restarting
pkill -f "node index.js" || true

node index.js &

sleep 5

# Step 9: Start Frontend Dashboard
echo "🔹 Starting Frontend Dashboard..."
FRONTEND_DIR=~/blockchain-iot-project--main/web_application/frontend
cd $FRONTEND_DIR

# Kill any existing frontend process
pkill -f "npm start" || true

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    npm install
fi

npm start &

echo "✅ Deployment Complete! 🚀 Everything is up and running."

# Keep script alive
wait
