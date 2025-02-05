'use strict';

const dgram = require('dgram'); // UDP module for IPv6 communication
const fetch = require('node-fetch'); // HTTP client for Hyperledger API

// ------------------------------------------------------------
// Configuration and Constants
// ------------------------------------------------------------
const UDP_PORT = 8844; // UDP Port for the Security Sensor
const IPV6_HOST = 'aaaa::1'; // IPv6 address to bind the server
const LOGGING_ENABLED = true; // Toggle to enable/disable logging
const MAX_RETRIES = 3; // Maximum retry attempts for API requests

// Hyperledger API Configuration
const HYPERLEDGER_API_KEY = process.env.HYPERLEDGER_API_KEY || '8554358f-2152-42c2-a892-f48a85608504'; // Replace with actual API Key
const HYPERLEDGER_ENDPOINT = 'http://localhost:3000/api/assets'; // API Endpoint
const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-Api-Key': HYPERLEDGER_API_KEY,
};

// Create UDP server for handling incoming data
const udpServer = dgram.createSocket('udp6');

// ------------------------------------------------------------
// Server Initialization and Event Handlers
// ------------------------------------------------------------
udpServer.on('listening', () => handleServerStart());
udpServer.on('message', (message, remote) => handleIncomingMessage(message, remote));

// Bind the server to the configured port and address
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
  log(`[UDP - IPv6] Security Border Router listening at ${address.address}:${address.port}`);
}

// ------------------------------------------------------------
// Function: Handle Incoming UDP Messages
// ------------------------------------------------------------
async function handleIncomingMessage(message, remote) {
  log(`[UDP - IPv6] Received from ${remote.address}:${remote.port} - ${message}`);

  try {
    // Parse the incoming message into a structured data block
    const dataBlock = parseMessageToDataBlock(message.toString());

    log(`Parsed Data Block: ${JSON.stringify(dataBlock)}`);

    // Validate the parsed data
    if (!validateDataBlock(dataBlock)) {
      log('Validation failed for received data block.', true);
      return;
    }

    // Send data to Hyperledger API with retry
    await sendDataToHyperledger(dataBlock);
  } catch (error) {
    log(`Error processing the message: ${error.message}`, true);
  }
}

// ------------------------------------------------------------
// Function: Parse Message to Data Block
// ------------------------------------------------------------
function parseMessageToDataBlock(message) {
  const keyValuePairs = message.split(',');
  const dataBlock = {
    rid: Date.now().toString(), // Generate a unique request ID
  };

  // Parse each key-value pair into the data block
  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split(':');

    // Assign as numeric value if possible, otherwise use the original string
    const numericValue = parseInt(value, 10);
    dataBlock[key] = isNaN(numericValue) ? value : Math.abs(numericValue);
  });

  return dataBlock;
}

// ------------------------------------------------------------
// Function: Validate Data Block
// ------------------------------------------------------------
function validateDataBlock(dataBlock) {
  // Example validation: Ensure all required fields exist
  const requiredFields = ['auth_status', 'integrity_flag', 'enc_latency', 'threat_flag', 'device_id'];
  return requiredFields.every((field) => field in dataBlock);
}

// ------------------------------------------------------------
// Function: Send Data to Hyperledger API with Retry
// ------------------------------------------------------------
async function sendDataToHyperledger(dataBlock, attempt = 1) {
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
    if (attempt < MAX_RETRIES) {
      log(`Retrying API call (${attempt}/${MAX_RETRIES})...`);
      await sendDataToHyperledger(dataBlock, attempt + 1);
    } else {
      log(`Failed to send data to Hyperledger after ${MAX_RETRIES} attempts: ${error.message}`, true);
    }
  }
}