Blockchain & IoT Security Integration

This project integrates IoT security sensors with a Hyperledger Fabric blockchain to enhance security, 
prevent unauthorized access, and detect anomalies. The system consists of Cooja sensor nodes, 
a backend API, and a frontend dashboard.
________________________________________
Table of Contents
•	Simulation Setup
•	Hyperledger Blockchain Deployment
•	Backend Code
•	Frontend Code
________________________________________

1️⃣ Simulation Setup
1.	Run Cooja Simulation

Open the Contiki-NG environment and run the Cooja simulator:

sudo ant run

2.	Start Border Router & Sensor Nodes

Run tunslip6 for each border router:

sudo ./tunslip6 -a 127.0.0.1 aaaa::1/64 -p 60020 -t tun0
sudo ./tunslip6 -a 127.0.0.1 aaaa::1/64 -p 60002 -t tun1
sudo ./tunslip6 -a 127.0.0.1 aaaa::1/64 -p 60003 -t tun2
sudo ./tunslip6 -a 127.0.0.1 aaaa::1/64 -p 60004 -t tun3
sudo ./tunslip6 -a 127.0.0.1 aaaa::1/64 -p 60005 -t tun4
(Make sure port numbers match the Cooja settings!)

3.	Start the Border Router Data Processor

Run the server.js files to listen for data:

node availability-server.js
node integrity-server.js
node mobility-server.js
node network-server.js
node security-server.js
________________________________________
2️⃣ Hyperledger Blockchain Deployment

Step 1: Start the Blockchain Network
1.	Navigate to the test-network directory

cd fabric-samples/test-network
2.	Launch the blockchain network & create the channel

./network.sh up createChannel -c mychannel -ca
________________________________________
Step 2: Deploy Organizations & Chaincodes

1.	Deploy security organizations (Availability, Integrity, Mobility, Network, Security)

./availability.sh up
./integrity.sh up
./mobility.sh up
./network.sh up
./security.sh up

2.	Deploy the chaincodes for each security module

./network.sh deployCC -ccn availability -ccp ../asset-transfer-basic/availability/ -ccl node
./network.sh deployCC -ccn integrity -ccp ../asset-transfer-basic/integrity/ -ccl node
./network.sh deployCC -ccn mobility -ccp ../asset-transfer-basic/mobility/ -ccl node
./network.sh deployCC -ccn network -ccp ../asset-transfer-basic/network/ -ccl node
./network.sh deployCC -ccn security -ccp ../asset-transfer-basic/security/ -ccl node
________________________________________
Step 3: Start the Hyperledger REST API
1.	Navigate to the rest-api-typescript directory

cd rest-api-typescript
npm install
npm run build
2.	Generate environment variables & start Redis

TEST_NETWORK_HOME=$HOME/fabric-samples/test-network npm run generateEnv
export REDIS_PASSWORD=$(uuidgen)
npm run start:redis
npm run start:dev
________________________________________
Step 4: Start Hyperledger Blockchain Explorer

1.	Copy network configuration

cp -r ../fabric-samples/test-network/organizations/ .
2.	Start the explorer using Docker

docker-compose up
________________________________________
3️⃣ Backend Code
1.	Navigate to the backend directory

cd backend
2.	Install dependencies and start the backend API

npm install
node api.routes.js
3.	If any dependencies are missing, install manually:

npm i <package-name>
________________________________________
4️⃣ Frontend Code
1.	Navigate to the frontend directory

cd frontend
2.	Install dependencies and start the frontend app

npm install
npm start
________________________________________
✅ Final Check
1.	Cooja sensor nodes are running 
2.	Hyperledger blockchain is up 
3.	REST API is working 
4.	Backend is running 
5.	Frontend dashboard is accessible 
________________________________________
❓ Need Help?
If you encounter issues, check:
•	fabric-samples/logs for Hyperledger logs
•	backend/logs for API logs
•	Browser console for frontend errors
