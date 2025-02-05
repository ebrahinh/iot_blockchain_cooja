#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "net/ipv6/simple-udp.h"

#define LOG_MODULE "Avail-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT_SERVER 8845                 // UDP destination port
#define UDP_PORT_LOCAL 5555                  // UDP source port
#define SEND_INTERVAL (10 * CLOCK_SECOND)    // Time interval for sending data
#define DEVICE_ID_SIZE 3                     // Length of Device ID
#define MAX_BUFFER_SIZE 256                  // Maximum size of UDP packets

static struct simple_udp_connection udp_conn;    // UDP connection instance
static char device_id[DEVICE_ID_SIZE];           // Device ID as a unique identifier
static uip_ipaddr_t server_addr;                 // Server's IPv6 address

PROCESS(availability_sensor_process, "Availability Sensor Process");
AUTOSTART_PROCESSES(&availability_sensor_process);

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

// Generate 2-digit Device ID using the last byte of the MAC address
static void generate_device_id() {
    if (linkaddr_node_addr.u8[7] == 0) { // Check if the last byte is invalid
        snprintf(device_id, DEVICE_ID_SIZE, "00"); // Hardcode ID if invalid
        LOG_WARN("⚠️ Invalid link-layer address. Defaulting Device ID to 00.\n");
    } else {
        snprintf(device_id, DEVICE_ID_SIZE, "%02X", linkaddr_node_addr.u8[7]); // Use last byte
        LOG_INFO("✅ Device ID: %s\n", device_id);
    }
}

// UDP callback function to handle incoming messages
static void udp_rx_callback(struct simple_udp_connection *c,
                            const uip_ipaddr_t *sender_addr,
                            uint16_t sender_port,
                            const uip_ipaddr_t *receiver_addr,
                            uint16_t receiver_port,
                            const uint8_t *data, uint16_t datalen) {
    char message[MAX_BUFFER_SIZE];
    snprintf(message, sizeof(message), "%.*s", datalen, (char *)data);
    LOG_INFO("📩 Received: [%s] from port %d\n", message, sender_port);
}

// Establish the server address and set up the UDP connection
static void setup_udp() {
    uip_ip6addr(&server_addr,
                0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101); // Set server IPv6 address
    simple_udp_register(&udp_conn, UDP_PORT_LOCAL, NULL, UDP_PORT_SERVER, udp_rx_callback);
    LOG_INFO("🔗 UDP server bound to port %d.\n", UDP_PORT_SERVER);
}

// Send availability metrics to the server
static void send_availability_data() {
    static char payload[MAX_BUFFER_SIZE];
    int status = rand() % 2; // Random availability flag: 1 = "Up", 0 = "Down"

    snprintf(payload, sizeof(payload), "device_id:%s,availability:%d", device_id, status);
    simple_udp_sendto(&udp_conn, payload, strlen(payload), &server_addr);

    LOG_INFO("📤 Sent message: [%s]\n", payload);
}

// ------------------------------------------------------------
// Main Process: Availability Sensor Workflow
// ------------------------------------------------------------
PROCESS_THREAD(availability_sensor_process, ev, data) {
    static struct etimer timer;

    PROCESS_BEGIN();

    LOG_INFO("📡 Availability Sensor Process Starting...\n");

    generate_device_id(); // Generate a unique ID
    setup_udp();          // Set up the UDP server connection

    etimer_set(&timer, SEND_INTERVAL); // Set the timer to trigger periodically
    while (1) {
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&timer)); // Wait for the timer to expire
        send_availability_data(); // Send the sensor data
        etimer_reset(&timer);     // Reset the timer
    }

    PROCESS_END();
}