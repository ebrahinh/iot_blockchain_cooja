# 1. Contiki-NG and Cooja
All sensor node files are implemented in **C** and are designed to generate randomised values within a predefined range. For example, speed values are randomly generated between **0 and 80** to simulate real-world sensor readings.

Mobility is separately handled using the **Cooja Mobility Plugin**, which utilises **.dat files** to define precise movement patterns for each node. This allows for accurate simulation of IoT device mobility within a network environment.

## Sensor Network Diagram
A visual representation of the sensor network is provided to illustrate how nodes interact within the system.

# 2. Border Routers
There are **five border routers**, each corresponding to a specific organisation. These routers are implemented in **JavaScript** and function as intermediaries that collect organisation-specific data from IoT nodes and transmit it to the **Hyperledger Fabric blockchain**.

Each border router:
- Listens for incoming sensor data via **UDP over IPv6**.
- Parses and processes the received data.
- Transmits validated data to **Hyperledger Fabric’s REST API** for secure storage.

# 3. IBM Hyperledger Fabric Blockchain
## Environment Setup
The blockchain network consists of **five distinct organisations**, each representing an independent entity storing its IoT data securely. These organisations are:
- **SecurityOrg** 
- **IntegrityOrg** 
- **NetworkMobilityOrg** 
- **AvailabilityOrg** 
- **PerformanceOrg** 

Each organisation specialises in monitoring different aspects of IoT security and operational performance. Data communication between organisations occurs via a shared **Hyperledger Fabric channel** named `my-channel`.

### Organisational Access Control
- Each organisation must **register on the blockchain** using pre-written scripts.
- Upon registration, an **API key** is issued for authentication.
- This API key is required when an organisation retrieves data from the blockchain via the **REST API**.

### Peer Node Configuration
Each organisation maintains a **single peer node**, responsible for processing organisation-specific transactions and writing them to the blockchain. These peer nodes operate on the following ports:

- **SecurityOrg** - Port **7051**
- **IntegrityOrg** - Port **9051**
- **NetworkMobilityOrg** - Port **11051**
- **AvailabilityOrg** - Port **12051**
- **PerformanceOrg** - Port **13051**

### Chaincode Logic
Each **chaincode (smart contract)** is designed to handle data specific to its organisation. Chaincodes are **restricted to writing new records and fetching existing records**; no modifications or deletions are permitted to ensure data integrity.

For example, **SecurityOrg’s chaincode** exclusively processes data from its associated security sensors, ensuring that **only relevant sensor data** is recorded on the blockchain.

# 4. Hyperledger Explorer
Hyperledger Explorer provides a **graphical interface** for monitoring blockchain activity. It enables administrators to:
- View the status of **active peers** and organisations.
- Analyse **block transactions and historical records**.
- Track **real-time changes** in the blockchain.

This dashboard tool enhances visibility and allows for efficient monitoring of blockchain operations within the IoT security simulation environment.

