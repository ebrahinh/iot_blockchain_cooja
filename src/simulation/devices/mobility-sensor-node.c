#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "simple-udp.h"
#include "net/ip/uip-debug.h"

// ------------------------------------------------------------
// Configuration and Logging
// ------------------------------------------------------------
#define LOG_MODULE "Mobility-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT_CENTRAL 8845                 // UDP Server Port
#define UDP_PORT_OUT 5555                     // UDP Source Port
#define SEND_INTERVAL (10 * CLOCK_SECOND)     // Data Send Interval (10 seconds)
#define DEVICE_ID_SIZE 17                     // Device ID Length (Hex representation)
#define MAX_UDP_BUFFER_SIZE 150               // Maximum UDP buffer size

// IPv6 address of the central server (split into parts)
static uint16_t central_addr[] = {
    0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101
};

// ------------------------------------------------------------
// Global Variables
// ------------------------------------------------------------
static struct simple_udp_connection udp_connection; // UDP Connection struct
static uip_ipaddr_t server_addr;                    // IPv6 server address
static char device_id[DEVICE_ID_SIZE];              // Device identifier

// ------------------------------------------------------------
// Function Prototypes
// ------------------------------------------------------------
void generate_device_id(void);
void connect_udp_server(void);
void send_security_data(void);
void udp_rx_callback(struct simple_udp_connection *c,
                     const uip_ipaddr_t *sender_addr,
                     uint16_t sender_port,
                     const uip_ipaddr_t *receiver_addr,
                     uint16_t receiver_port,
                     const uint8_t *data,
                     uint16_t datalen);

// ------------------------------------------------------------
// UDP Reception Callback
// ------------------------------------------------------------
void udp_rx_callback(struct simple_udp_connection *c,
                     const uip_ipaddr_t *sender_addr,
                     uint16_t sender_port,
                     const uip_ipaddr_t *receiver_addr,
                     uint16_t receiver_port,
                     const uint8_t *data,
                     uint16_t datalen) {
    if (datalen > 0 && datalen < MAX_UDP_BUFFER_SIZE) { // Validate incoming data length
        LOG_INFO("Received UDP data from ");
        LOG_INFO_6ADDR(sender_addr);
        LOG_INFO(":%d\n", sender_port);
        LOG_INFO("Data: %.*s\n", datalen, (char *)data);
    } else {
        LOG_WARN("Malformed or oversized UDP packet received.\n");
    }
}

// ------------------------------------------------------------
// Generate Device ID from Link-layer Address
// ------------------------------------------------------------
void generate_device_id(void) {
    if (linkaddr_node_addr.u8[0] == 0 && linkaddr_node_addr.u8[1] == 0) {
        // If the link-layer address is invalid, generate a placeholder ID
        LOG_WARN("Invalid node link address, cannot generate device ID.\n");
        snprintf(device_id, sizeof(device_id), "UNKNOWN");
    } else {
        // Convert the link-layer address to a hexadecimal device ID string
        snprintf(device_id, sizeof(device_id), "%02X%02X%02X%02X%02X%02X%02X%02X",
                 linkaddr_node_addr.u8[0], linkaddr_node_addr.u8[1],
                 linkaddr_node_addr.u8[2], linkaddr_node_addr.u8[3],
                 linkaddr_node_addr.u8[4], linkaddr_node_addr.u8[5],
                 linkaddr_node_addr.u8[6], linkaddr_node_addr.u8[7]);
        LOG_INFO("Generated Device ID: %s\n", device_id);
    }
}

// ------------------------------------------------------------
// Connect to the UDP Server
// ------------------------------------------------------------
void connect_udp_server(void) {
    // Construct the IPv6 address of the server from the defined central_addr array
    uip_ip6addr(&server_addr,
                central_addr[0], central_addr[1],
                central_addr[2], central_addr[3],
                central_addr[4], central_addr[5],
                central_addr[6], central_addr[7]);

    LOG_INFO("Connecting to server at: ");
    LOG_INFO_6ADDR(&server_addr);
    LOG_INFO("\n");

    // Register a UDP connection with the callback for handling incoming packets
    simple_udp_register(&udp_connection,
                        UDP_PORT_OUT, NULL,
                        UDP_PORT_CENTRAL, udp_rx_callback);
}

// ------------------------------------------------------------
// Security Data Simulation Functions
// ------------------------------------------------------------
void get_location_sec_status(int *data) {
    *data = rand() % 2; // Simulate location security status: 0 (insecure), 1 (secure)
}

void get_speed_anomaly(int *data) {
    *data = rand() % 2; // Simulate speed anomaly: 0 (normal), 1 (anomaly detected)
}

void get_geo_fence_breach(int *data) {
    *data = rand() % 2; // Simulate geofence breach: 0 (no breach), 1 (breach detected)
}

void get_signal_strength(int *data) {
    *data = -1 * (rand() % 101); // Simulate random signal strength in dBm (-100 to 0)
}

// ------------------------------------------------------------
// Send Security Data
// ------------------------------------------------------------
void send_security_data(void) {
    static char udp_buffer[MAX_UDP_BUFFER_SIZE];
    int location_sec_status, speed_anomaly, geo_breach, signal_strength;

    // Simulate security data
    get_location_sec_status(&location_sec_status);
    get_speed_anomaly(&speed_anomaly);
    get_geo_fence_breach(&geo_breach);
    get_signal_strength(&signal_strength);

    // Format the simulated data into a UDP message
    snprintf(udp_buffer, sizeof(udp_buffer),
             "device_id:%s,location_sec_status:%d,speed_anomaly:%d,geo_breach:%d,signal_strength:%d",
             device_id, location_sec_status, speed_anomaly, geo_breach, signal_strength);

    LOG_INFO("Sending UDP data: %s\n", udp_buffer);

    // Send the formatted data to the server via UDP
    simple_udp_sendto(&udp_connection, udp_buffer, strlen(udp_buffer), &server_addr);
}

// ------------------------------------------------------------
// Main Process Thread
// ------------------------------------------------------------
PROCESS(init_system_proc, "Init System Process");
AUTOSTART_PROCESSES(&init_system_proc);

PROCESS_THREAD(init_system_proc, ev, data) {
    PROCESS_BEGIN();

    static struct etimer periodic_timer; // Timer for periodic tasks

    // Step 1: Generate a unique device ID
    generate_device_id();

    // Step 2: Connect to the UDP server
    connect_udp_server();

    // Step 3: Set up a periodic timer to send data at regular intervals
    etimer_set(&periodic_timer, SEND_INTERVAL);
    LOG_INFO("System initialized. Data will be sent every %d seconds.\n", SEND_INTERVAL / CLOCK_SECOND);

    // Step 4: Main loop for sending data periodically
    while (1) {
        // Wait for the periodic timer to expire
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&periodic_timer));

        // Send security data to the server
        send_security_data();

        // Reset the periodic timer
        etimer_reset(&periodic_timer);
    }

    PROCESS_END();
}