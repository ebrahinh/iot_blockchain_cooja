'use strict';

const dgram = require('dgram'); // UDP module for IPv6 communication
const fetch = require('node-fetch'); // HTTP client for Hyperledger API

// Configuration
const portIPv6 = 8846; // Port for the Security Sensor
const hostIPv6 = 'aaaa::1'; // IPv6 address to bind the server
const serverUDP = dgram.createSocket('udp6'); // Create UDP6 socket
const disableLogs = false; // Set to true to disable logging

// Hyperledger API configuration
const SAMPLE_APIKEY = process.env.HYPERLEDGER_API_KEY || '8554358f-2152-42c2-a892-f48a85608504'; // Use environment variable for API key
const hyperledgerEndpoint = 'http://localhost:3000/api/assets'; // Hyperledger API endpoint
const headers = {
  'Content-Type': 'application/json',
  'X-Api-Key': SAMPLE_APIKEY,
};

// Maximum number of retry attempts for API calls
const MAX_RETRIES = 3;

// Server Event: On Listening
serverUDP.on('listening', function () {
  const address = serverUDP.address();
  console.log(`[UDP - IPv6] Security Border Router listening at ${address.address}:${address.port}`);
});

// Server Event: On Message Received
serverUDP.on('message', processMessage);

// Bind the server to the specified port and address
serverUDP.bind(portIPv6, hostIPv6);

// Function: Process Incoming Messages
async function processMessage(message, remote) {
  if (!disableLogs) {
    console.log(`[UDP - IPv6] ${new Date().toISOString()} Received from ${remote.address}:${remote.port} - ${message}`);
  }

  // Parse the incoming message
  const dataArray = message.toString().split('|');
  const data = dataArray[0];

  console.log('Processing data for Hyperledger:', data);

  // Parse the input string into a JSON object
  const dataBlock = parseMessageToDataBlock(data);

  // Validate the data
  if (!validateDataBlock(dataBlock)) {
    console.error('Validation failed for received data:', dataBlock);
    return;
  }

  console.log('Validated Data Block:', dataBlock);

  // Send data to Hyperledger API with retry mechanism
  try {
    await sendDataToHyperledger(dataBlock);
  } catch (error) {
    console.error('Failed to send data to Hyperledger after retries:', error.message);
  }
}

// Function: Parse Message to Data Block
function parseMessageToDataBlock(data) {
  const keyValuePairs = data.split(',');
  const dataBlock = {
    rid: Date.now().toString(), // Unique Request ID
  };

  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split(':');
    if (key) {
      const numericValue = parseInt(value, 10);
      dataBlock[key] = isNaN(numericValue) ? value : Math.abs(numericValue);
    }
  });

  return dataBlock;
}

// Function: Validate Data Block
function validateDataBlock(dataBlock) {
  // Example validation: Ensure required fields exist
  const requiredFields = ['malware_flag', 'firmware_integrity', 'id'];
  for (const field of requiredFields) {
    if (!dataBlock.hasOwnProperty(field)) {
      return false;
    }
  }
  return true;
}

// Function: Send Data to Hyperledger with Retry
async function sendDataToHyperledger(dataBlock, attempt = 1) {
  try {
    const response = await fetch(hyperledgerEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(dataBlock),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Hyperledger Response:', responseData);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(`Retrying API call (${attempt}/${MAX_RETRIES})...`);
      await sendDataToHyperledger(dataBlock, attempt + 1);
    } else {
      throw error;
    }
  }
}
