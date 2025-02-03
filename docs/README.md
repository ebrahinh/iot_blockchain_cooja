# IoT Security Simulation and Blockchain Integration

## Objective:
This project aims to simulate a network of **IoT security sensors** using **Contiki-NG**, visualise their interactions in **Cooja**, and securely store the generated security-related data on **IBM Hyperledger Fabric**. The system evaluates key IoT security aspects, including **availability, integrity, mobility, network performance, and general security**. Data is transmitted via a **border router implemented in JavaScript** and subsequently stored in the blockchain. A **React-based front-end** is used for real-time monitoring and analysis.

## System Components:

### 1. IoT Sensor Nodes (Contiki-NG & Cooja):
- **Availability Sensor Node:** Measures device uptime, detects anomalies, and assesses encryption strength.
- **Integrity Sensor Node:** Evaluates authentication status, detects potential threats, and verifies data integrity.
- **Mobility Sensor Node:** Tracks location security, geo-fencing breaches, and signal strength fluctuations.
- **Network Security Sensor Node:** Monitors malware presence, packet size variations, and network latency.
- **General Security Sensor Node:** Assesses encryption latency, firmware integrity, and authentication robustness.
- Each sensor node sends security-related data via **UDP over IPv6** to designated border routers.

### 2. Border Routers (JavaScript):
- Each border router is responsible for receiving sensor node data through **UDP over IPv6**.
- Incoming data is parsed, validated, and structured for blockchain storage.
- Border routers communicate with **Hyperledger Fabric's API** for secure data transmission.
- Implements a retry mechanism for handling failed API requests, ensuring data consistency.

### 3. Hyperledger Fabric Blockchain:
- Provides **tamper-proof storage** for IoT security events and metrics.
- Utilises **smart contracts (chaincode)** to validate incoming transactions and manage access control policies.
- Ensures **data immutability**, preventing unauthorised modifications or deletions.
- Facilitates retrieval of past security events for forensic analysis and compliance verification.

### 4. Web Interface (React & Backend):
- Presents **real-time IoT security data** sourced from the blockchain.
- Offers **interactive visualisations**, including graphs, tables, and alerts to track anomalies and threats.
- Enables filtering and analysis of security incidents based on device type, timestamp, and severity level.
- Provides administrators with detailed logs and reports for security auditing and compliance monitoring.

## Security and Performance Considerations:
- **Data Integrity:** Ensured through cryptographic hashing and blockchain immutability.
- **Network Security:** IPv6 communication channels secured against unauthorised interception.
- **Performance Optimisation:** Efficient handling of IoT data to minimise blockchain transaction overhead.
- **Scalability:** Designed to accommodate an increasing number of IoT devices without significant degradation in performance.

This project demonstrates a **secure, scalable, and blockchain-backed** approach for monitoring and safeguarding IoT networks. It provides a research framework for analysing **threat detection, data authenticity, and decentralised security models** in IoT ecosystems.

