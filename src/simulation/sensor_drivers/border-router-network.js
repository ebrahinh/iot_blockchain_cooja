'use strict';

const dgram = require('dgram'); // UDP module for IPv6 communication
const fetch = require('node-fetch'); // HTTP client for Hyperledger API

// Configuration
const portIPv6 = 8844; // Port for the Network Sensor
const hostIPv6 = 'aaaa::1'; // IPv6 address to bind the server
const serverUDP = dgram.createSocket('udp6'); // Create UDP6 socket
const disableLogs = false; // Set to true to disable logging

// Hyperledger API configuration
const SAMPLE_APIKEY = '8554358f-2152-42c2-a892-f48a85608504'; // Replace with your Org 1 API key
const hyperledgerEndpoint = 'http://localhost:3000/api/assets'; // Hyperledger API endpoint
const headers = {
  'Content-Type': 'application/json',
  'X-Api-Key': SAMPLE_APIKEY,
};

// Server Event: On Listening
serverUDP.on('listening', function () {
  const address = serverUDP.address();
  console.log(`[UDP - IPv6] Network Border Router listening at ${address.address}:${address.port}`);
});

// Server Event: On Message Received
serverUDP.on('message', processMessage);

// Bind the server to the specified port and address
serverUDP.bind(portIPv6, hostIPv6);

// Function: Process Incoming Messages
function processMessage(message, remote) {
  if (!disableLogs) {
    console.log(`[UDP - IPv6] ${new Date().toISOString()} Received from ${remote.address}:${remote.port} - ${message}`);
  }

  // Parse the incoming message
  const dataArray = message.toString().split('|');
  const data = dataArray[0];

  console.log('Processing data for Hyperledger:', data);

  // Parse the input string into a JSON object
  const keyValuePairs = data.split(',');
  const dataBlock = {
    rid: Date.now().toString(), // Unique Request ID
  };

  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split(':');
    if (key === 'latency' || key === 'packet_size' || key === 'id') {
      dataBlock[key] = value;
    } else {
      const numericValue = parseInt(value, 10);
      dataBlock[key] = numericValue < 0 ? Math.abs(numericValue) : numericValue;
    }
  });

  console.log('Prepared Data Block:', dataBlock);

  // Send data to Hyperledger API
  try {
    fetch(hyperledgerEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(dataBlock),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((responseData) => {
        console.log('Hyperledger Response:', responseData);
      })
      .catch((error) => {
        console.error('Error sending data to Hyperledger:', error.message);
      });
  } catch (error) {
    console.error('Unexpected Error:', error.message);
  }
}