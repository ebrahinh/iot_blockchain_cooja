'use strict';

const dgram = require('dgram'); // UDP module for IPv6 communication
const fetch = require('node-fetch'); // HTTP client for Hyperledger API

// ------------------------------------------------------------
// Configuration and Constants
// ------------------------------------------------------------
const UDP_PORT = 8846; // UDP port for the Network Sensor
const IPV6_HOST = 'aaaa::1'; // IPv6 address to bind the server
const LOGGING_ENABLED = true; // Toggle logging for debugging and monitoring

// Hyperledger API Configuration
const HYPERLEDGER_API_KEY = '8554358f-2152-42c2-a892-f48a85608504'; // Replace with your actual API key
const HYPERLEDGER_ENDPOINT = 'http://localhost:3000/api/assets'; // Hyperledger endpoint
const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-Api-Key': HYPERLEDGER_API_KEY,
};

// Create a UDP server to handle incoming network data
const udpServer = dgram.createSocket('udp6');

// ------------------------------------------------------------
// Server Initialization and Event Handlers
// ------------------------------------------------------------
udpServer.on('listening', () => handleServerStart());
udpServer.on('message', (message, remote) => handleIncomingMessage(message, remote));

// Bind the server to the specified port and address
udpServer.bind(UDP_PORT, IPV6_HOST);

// ------------------------------------------------------------
// Logging Utility
// ------------------------------------------------------------
function log(message, isError = false) {
  if (LOGGING_ENABLED) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    isError ? console.error(logMessage) : console.log(logMessage);
  }
}

// ------------------------------------------------------------
// Function: Handle Server Start
// ------------------------------------------------------------
function handleServerStart() {
  const address = udpServer.address();
  log(`[UDP - IPv6] Network Border Router listening at ${address.address}:${address.port}`);
}

// ------------------------------------------------------------
// Function: Handle Incoming UDP Message
// ------------------------------------------------------------
function handleIncomingMessage(message, remote) {
  log(`[UDP - IPv6] Received from ${remote.address}:${remote.port} - ${message}`);

  try {
    // Parse the received message into a structured data block
    const dataBlock = parseNetworkSensorData(message.toString());

    log(`Parsed Data Block: ${JSON.stringify(dataBlock)}`);

    // Send the parsed data block to the Hyperledger API
    sendDataToHyperledger(dataBlock);
  } catch (error) {
    log(`Error processing incoming message: ${error.message}`, true);
  }
}

// ------------------------------------------------------------
// Function: Parse Network Sensor Data
// ------------------------------------------------------------
function parseNetworkSensorData(message) {
  const keyValuePairs = message.split(',');
  const dataBlock = {
    rid: Date.now().toString(), // Unique Request ID for tracking
  };

  // Parse key-value pairs within the UDP message
  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split(':');

    if (key === 'device_id' || key === 'malware_flag' || key === 'firmware_integrity') {
      dataBlock[key] = value; // Direct assignment for string-based fields
    } else {
      const intValue = parseInt(value, 10);
      dataBlock[key] = isNaN(intValue) ? 0 : Math.abs(intValue); // Ensure valid numeric fields
    }
  });

  return dataBlock;
}

// ------------------------------------------------------------
// Function: Send Data to Hyperledger API
// ------------------------------------------------------------
async function sendDataToHyperledger(dataBlock) {
  try {
    const response = await fetch(HYPERLEDGER_ENDPOINT, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(dataBlock),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    log(`Hyperledger Response: ${JSON.stringify(responseBody)}`);
  } catch (error) {
    log(`Error sending data to Hyperledger: ${error.message}`, true);
  }
}