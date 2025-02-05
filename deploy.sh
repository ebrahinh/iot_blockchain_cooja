#!/bin/bash

# IoT Blockchain Deployment Script
# Automates: Hyperledger Fabric, Cooja IoT Simulation, Blockchain Backend, Frontend Dashboard

set -e  # Exit on any error
set -u  # Treat unset variables as errors

echo "🚀 Starting full deployment of IoT Blockchain Project!"

# ====================================================================
# Helper functions
# ====================================================================

# Print and execute commands
run_cmd() {
    echo "✔️ $1"
    $2
}

# Check environment prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    for cmd in docker docker-compose node npm git; do
        if ! command -v $cmd &> /dev/null; then
            echo "❌ Command $cmd not found! Please install it and re-run the script."
            exit 1
        fi
    done
    echo "✅ All prerequisites are installed!"
}

# ====================================================================
# Step 1: Clone and Setup Hyperledger Fabric
# ====================================================================
setup_hyperledger() {
    echo "🔹 Setting up Hyperledger Fabric binaries..."

    # Clone the Hyperledger Fabric test-network if not already downloaded
    FABRIC_DIR=$HOME/fabric-samples
    if [ ! -d "$FABRIC_DIR" ]; then
        git clone https://github.com/hyperledger/fabric-samples.git $FABRIC_DIR
    fi

    # Move necessary binaries and artifacts into your project structure
    PROJECT_HYPERLEDGER_DIR=~/blockchain-iot-project--main/hyperledger

    # Copy binaries
    cp -r $FABRIC_DIR/bin $PROJECT_HYPERLEDGER_DIR/  # Binaries
    cp -r $FABRIC_DIR/test-network $PROJECT_HYPERLEDGER_DIR/  # Test network setup

    export PATH=${HOME}/fabric-samples/bin:$PATH
    echo "✅ Hyperledger setup complete!"
}

# ====================================================================
# Step 2: Setup Cooja IoT Simulator
# ====================================================================
setup_cooja() {
    echo "🔹 Setting up Cooja IoT Simulator..."
    COOJA_DIR=$HOME/contiki-ng/tools/cooja

    if [ ! -d "$COOJA_DIR" ]; then
        echo "❌ Cooja not found! Please install Contiki-NG and ensure it is located at $HOME/contiki-ng"
        exit 1
    fi

    # Ensure the Gradle wrapper is executable
    chmod +x $COOJA_DIR/gradlew

    # Start Cooja
    cd $COOJA_DIR
    ./gradlew run &
    echo "✅ Cooja Simulator launched successfully!"
}

# ====================================================================
# Step 3: Start Border Routers and Compile Simulation Nodes
# ====================================================================
start_border_routers() {
    echo "🔹 Starting border routers and compiling sensor nodes..."
    BORDER_ROUTERS_DIR=~/blockchain-iot-project--main/simulation/devices
    TUNSLIP=$HOME/contiki-ng/tools/serial-io/tunslip6

    # Create TUNSLIP6 if it is missing
    if [ ! -f "$TUNSLIP" ]; then
        echo "🔹 Compiling TUNSLIP6..."
        run_cmd "Compiling TUNSLIP6" "cd $HOME/contiki-ng/tools/serial-io && make tunslip6"
    fi

    # Setup and launch border routers
    cd $BORDER_ROUTERS_DIR
    for NODE in *.c; do
        echo "🔹 Compiling $NODE..."
        make -C $BORDER_ROUTERS_DIR $(basename $NODE .c)
        sudo ./$(basename $NODE .c) &
    done

    # Setup TunSlip6 connections
    echo "🔹 Setting up TunSlip6 connections..."
    sudo $TUNSLIP -a 127.0.0.1 aaaa::1/64 -p 60020 -t tun0 &
    sudo $TUNSLIP -a 127.0.0.1 aaaa::1/64 -p 60002 -t tun1 &
    echo "✅ Border routers and TunSlip6 are running!"
}

# ====================================================================
# Step 4: Deploy the Hyperledger Network
# ====================================================================
deploy_hyperledger_fabric() {
    echo "🔹 Starting Hyperledger Fabric Network..."
    FABRIC_NETWORK_DIR=~/blockchain-iot-project--main/hyperledger/test-network

    # Teardown any previous networks and start fresh
    cd $FABRIC_NETWORK_DIR
    ./network.sh down
    ./network.sh up createChannel -c mychannel -ca

    # Deploy smart contracts
    echo "🔹 Installing chaincodes..."
    for CC in security integrity mobility network; do
        ./network.sh deployCC -ccn $CC -ccp ../smart_contracts/$CC/ -ccl node
    done
    echo "✅ Hyperledger Fabric network is up and chaincodes are deployed!"
}

# ====================================================================
# Step 5: Start Backend API
# ====================================================================
start_backend() {
    echo "🔹 Starting backend API..."
    BACKEND_DIR=~/blockchain-iot-project--main/src/backend
    cd $BACKEND_DIR

    # Install dependencies and start the backend
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    npm run start &
    echo "✅ Backend API is up and running!"
}

# ====================================================================
# Step 6: Start Frontend Dashboard
# ====================================================================
start_frontend() {
    echo "🔹 Starting frontend dashboard..."
    FRONTEND_DIR=~/blockchain-iot-project--main/src/frontend
    cd $FRONTEND_DIR

    # Install dependencies and start the frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    npm start &
    echo "✅ Frontend Dashboard is live!"
}

# ====================================================================
# Step 7: Final Launch Sequence
# ====================================================================
start_full_deployment() {
    echo "🔹 Deployment starting..."

    check_prerequisites
    setup_hyperledger
    setup_cooja
    start_border_routers
    deploy_hyperledger_fabric
    start_backend
    start_frontend

    echo "🎉 Deployment complete! All systems are up and running!"
    echo "👉 Access the frontend at http://localhost:3000"
    echo "👉 Backend API running at http://localhost:3001/api"
}

# Launch the deployment
start_full_deployment