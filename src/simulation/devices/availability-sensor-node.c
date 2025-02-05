#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "net/ipv6/simple-udp.h"

#define LOG_MODULE "Security-Monitor" // Updated module name for relevance
#define LOG_LEVEL LOG_LEVEL_INFO

// ------------------------------------------------------------
// Configuration Constants
// ------------------------------------------------------------
#define UDP_PORT_CENTRAL 8842                 // UDP server (central node) port
#define UDP_PORT_OUT 5555                     // UDP source port for this device
#define SEND_INTERVAL (10 * CLOCK_SECOND)     // Interval between each log transmission in seconds
#define MAX_BUFFER_SIZE 160                   // Maximum size of transmitted data

// ------------------------------------------------------------
// Global Variables
// ------------------------------------------------------------
static struct simple_udp_connection udp_connection;
static uip_ipaddr_t server_addr;             // Stores the IPv6 address of the central node
static uint16_t central_addr[] = {0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101}; // Default IPv6 server address

PROCESS(init_system_proc, "Initialization and Monitoring Process");
AUTOSTART_PROCESSES(&init_system_proc);

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

// Initialize the Random Number Generator
static void seed_random_generator() {
  srand((unsigned)clock_time());
}

// Generate a Unique Device ID Based on Node Address (Linklayer Address)
static void generate_device_id(char *device_id, size_t id_size) {
  if (linkaddr_node_addr.u8[0] == 0 && linkaddr_node_addr.u8[1] == 0) {
    LOG_WARN("Device ID generation failed: Invalid link address.\n");
    snprintf(device_id, id_size, "UNKNOWN");
  } else {
    snprintf(device_id, id_size, "%02X%02X%02X%02X%02X%02X%02X%02X",
             linkaddr_node_addr.u8[0], linkaddr_node_addr.u8[1],
             linkaddr_node_addr.u8[2], linkaddr_node_addr.u8[3],
             linkaddr_node_addr.u8[4], linkaddr_node_addr.u8[5],
             linkaddr_node_addr.u8[6], linkaddr_node_addr.u8[7]);
  }
}

// Generate Randomized Security Logs
static void generate_security_logs(char *buffer, size_t buffer_size) {
  int availability_flag = rand() % 2;    // Random 0 or 1
  int usage_anomaly = rand() % 2;        // Random 0 or 1
  int enc_strength = rand() % 101;       // Random 0 to 100
  int tamper_flag = rand() % 2;          // Random 0 or 1

  snprintf(buffer, buffer_size,
           "availability:%d,usage_anomaly:%d,enc_strength:%d,tamper_flag:%d",
           availability_flag, usage_anomaly, enc_strength, tamper_flag);
}

// Connect to the UDP Server (Central Node)
static void connect_udp_server() {
  // Construct server address based on central_addr
  uip_ip6addr(&server_addr,
              central_addr[0], central_addr[1],
              central_addr[2], central_addr[3],
              central_addr[4], central_addr[5],
              central_addr[6], central_addr[7]);

  LOG_INFO("Central Server Address: ");
  LOG_INFO_6ADDR(&server_addr);
  LOG_INFO("\n");

  // Register UDP connection and callback
  simple_udp_register(&udp_connection, UDP_PORT_OUT, NULL, UDP_PORT_CENTRAL, udp_rx_callback);
}

// ------------------------------------------------------------
// Callback for Receiving UDP Packets
// ------------------------------------------------------------
static void udp_rx_callback(struct simple_udp_connection *c,
                            const uip_ipaddr_t *sender_addr,
                            uint16_t sender_port,
                            const uip_ipaddr_t *receiver_addr,
                            uint16_t receiver_port,
                            const uint8_t *data,
                            uint16_t datalen) {
  if (datalen > 0 && datalen < MAX_BUFFER_SIZE) { // Validate data length
    LOG_INFO("Received UDP data from ");
    LOG_INFO_6ADDR(sender_addr);
    LOG_INFO(":%d\n", sender_port);
    LOG_INFO("Data: %.*s\n", datalen, (char *)data);
  } else {
    LOG_WARN("Received malformed or too large UDP packet.\n");
  }
}

// ------------------------------------------------------------
// Main Process for Initialization, Logging, and Monitoring
// ------------------------------------------------------------
PROCESS_THREAD(init_system_proc, ev, data) {
  PROCESS_BEGIN();

  static struct etimer periodic_timer;           // Timer for periodic task
  static char udp_buffer[MAX_BUFFER_SIZE];       // Buffer for formatted security logs
  static char device_id[20];                     // Buffer for storing Device ID
  static char full_message[MAX_BUFFER_SIZE + 20]; // Full message buffer (including Device ID)

  // Generate Device ID
  generate_device_id(device_id, sizeof(device_id));
  LOG_INFO("Generated Device ID: %s\n", device_id);

  // Seed the random generator
  seed_random_generator();

  // Connect to UDP server
  connect_udp_server();

  // Initialize periodic timer
  etimer_set(&periodic_timer, SEND_INTERVAL);
  LOG_INFO("System initialized. Logs will be sent every %d seconds.\n", SEND_INTERVAL / CLOCK_SECOND);

  while (1) {
    // Wait for the timer to expire
    PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&periodic_timer));

    // Generate security log data
    generate_security_logs(udp_buffer, sizeof(udp_buffer));

    // Combine Device ID and security log into the final message
    snprintf(full_message, sizeof(full_message), "device_id:%s,%s", device_id, udp_buffer);

    // Send the data to the central UDP server
    LOG_INFO("Sending: %s\n", full_message);

    for (int retries = 0; retries < 3; retries++) { // Add Retry Logic
      if (simple_udp_sendto(&udp_connection, full_message, strlen(full_message), &server_addr) == 0) {
        LOG_INFO("Log successfully sent on attempt %d\n", retries + 1);
        break;
      }
    }

    // Reset the timer
    etimer_reset(&periodic_timer);
  }

  PROCESS_END();
}