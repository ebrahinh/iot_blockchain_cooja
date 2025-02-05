'use strict';

const dgram = require('dgram'); // UDP module for IPv6 communication
const fetch = require('node-fetch'); // HTTP client for Hyperledger API

// ------------------------------------------------------------
// Configuration and Constants
// ------------------------------------------------------------
const PORT_IPV6 = 8842; // Port for the Availability Sensor
const IPV6_HOST = 'aaaa::1'; // IPv6 address to bind the server
const LOGGING_ENABLED = true; // Toggle logging (true for enabling, false for disabling)

// Hyperledger API Configuration
const HYPERLEDGER_API_KEY = '8554358f-2152-42c2-a892-f48a85608504'; // Replace with your actual API key
const HYPERLEDGER_ENDPOINT = 'http://localhost:3000/api/assets'; // API endpoint
const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-Api-Key': HYPERLEDGER_API_KEY,
};

// Create a UDP server to handle incoming data from Availability Sensor Node
const udpServer = dgram.createSocket('udp6');

// ------------------------------------------------------------
// Server Initialization and Event Handlers
// ------------------------------------------------------------
udpServer.on('listening', () => handleServerStart());
udpServer.on('message', (message, remote) => handleIncomingMessage(message, remote));

// Bind the server to the specified port and address
udpServer.bind(PORT_IPV6, IPV6_HOST);

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
  log(`[UDP - IPv6] Server is listening at ${address.address}:${address.port}`);
}

// ------------------------------------------------------------
// Function: Handle Incoming UDP Message
// ------------------------------------------------------------
function handleIncomingMessage(message, remote) {
  log(`[UDP - IPv6] Received from ${remote.address}:${remote.port} - ${message}`);

  try {
    // Parse the incoming message into a structured data block
    const dataBlock = parseSensorData(message.toString());

    log(`Parsed Data Block: ${JSON.stringify(dataBlock)}`);

    // Send the parsed data block to the Hyperledger API
    sendToHyperledger(dataBlock);
  } catch (error) {
    log(`Error processing incoming message: ${error.message}`, true);
  }
}

// ------------------------------------------------------------
// Function: Parse Incoming Sensor Data
// ------------------------------------------------------------
function parseSensorData(message) {
  const keyValuePairs = message.split(',');
  const dataBlock = {
    rid: Date.now().toString(), // Unique Request ID (timestamp-based)
  };

  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split(':');
    if (key === 'device_id' || key === 'availability') {
      dataBlock[key] = value; // String fields
    } else {
      const intValue = parseInt(value, 10);
      dataBlock[key] = isNaN(intValue) ? 0 : Math.abs(intValue); // Numeric fields, handle negatives and invalid numbers
    }
  });

  return dataBlock;
}

// ------------------------------------------------------------
// Function: Send Data to Hyperledger API
// ------------------------------------------------------------
async function sendToHyperledger(dataBlock) {
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