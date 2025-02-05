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
#define LOG_MODULE "Security-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT_CENTRAL 8844                 // UDP Server Port
#define UDP_PORT_OUT 5555                     // UDP Source Port
#define SEND_INTERVAL (10 * CLOCK_SECOND)     // Data Send Interval (10 seconds)
#define DEVICE_ID_SIZE 17                     // Device ID Length (Hexadecimal)
#define MAX_UDP_BUFFER_SIZE 150               // Maximum UDP Buffer Size

// IPv6 address of the central server (split into parts)
static uint16_t central_addr[] = {
    0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101
};

// ------------------------------------------------------------
// Global Variables
// ------------------------------------------------------------
static struct simple_udp_connection udp_connection; // UDP connection object
static uip_ipaddr_t server_addr;                    // Central server's IPv6 address
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
// UDP Packet Reception Callback
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
        LOG_WARN("Invalid node link address, cannot generate device ID.\n");
        snprintf(device_id, sizeof(device_id), "UNKNOWN");
    } else {
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
    // Construct IPv6 address of the central server
    uip_ip6addr(&server_addr,
                central_addr[0], central_addr[1],
                central_addr[2], central_addr[3],
                central_addr[4], central_addr[5],
                central_addr[6], central_addr[7]);

    LOG_INFO("Connecting to server at: ");
    LOG_INFO_6ADDR(&server_addr);
    LOG_INFO("\n");

    // Register the UDP connection with a callback handler
    simple_udp_register(&udp_connection,
                        UDP_PORT_OUT, NULL,
                        UDP_PORT_CENTRAL, udp_rx_callback);
}

// ------------------------------------------------------------
// Security Data Simulation Functions
// ------------------------------------------------------------
void get_auth_status(int *data) {
    *data = rand() % 2; // Random 0 (not authenticated) or 1 (authenticated)
}

void get_integrity_flag(int *data) {
    *data = rand() % 2; // Random 0 (invalid) or 1 (valid)
}

void get_enc_latency(int *data) {
    *data = rand() % 100 + 10; // Random encryption latency between 10–109 ms
}

void get_threat_flag(int *data) {
    *data = rand() % 2; // Random 0 (no threat) or 1 (threat detected)
}

// ------------------------------------------------------------
// Send Security Data to UDP Server
// ------------------------------------------------------------
void send_security_data(void) {
    static char udp_buffer[MAX_UDP_BUFFER_SIZE];
    int auth_status, integrity_flag, enc_latency, threat_flag;

    // Simulating security-related data
    get_auth_status(&auth_status);
    get_integrity_flag(&integrity_flag);
    get_enc_latency(&enc_latency);
    get_threat_flag(&threat_flag);

    // Formatting data for transmission
    snprintf(udp_buffer, sizeof(udp_buffer),
             "device_id:%s,auth_status:%d,integrity_flag:%d,enc_latency:%d,threat_flag:%d",
             device_id, auth_status, integrity_flag, enc_latency, threat_flag);

    LOG_INFO("Sending UDP data: %s\n", udp_buffer);

    // Transmit data via UDP to the server
    simple_udp_sendto(&udp_connection, udp_buffer, strlen(udp_buffer), &server_addr);
}

// ------------------------------------------------------------
// Main Process Thread
// ------------------------------------------------------------
PROCESS(init_system_proc, "Init System Process");
AUTOSTART_PROCESSES(&init_system_proc);

PROCESS_THREAD(init_system_proc, ev, data) {
    PROCESS_BEGIN();

    static struct etimer periodic_timer; // Timer for periodic data sending

    // Step 1: Generate unique device ID
    generate_device_id();

    // Step 2: Connect to the central UDP server
    connect_udp_server();

    // Step 3: Configure a periodic timer for scheduled data transmission
    etimer_set(&periodic_timer, SEND_INTERVAL);
    LOG_INFO("System initialized. Data will be sent every %d seconds.\n", SEND_INTERVAL / CLOCK_SECOND);

    // Step 4: Periodic loop for transmitting data
    while (1) {
        // Wait for the timer to expire
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&periodic_timer));

        // Generate and transmit security data
        send_security_data();

        // Reset the timer for the next transmission
        etimer_reset(&periodic_timer);
    }

    PROCESS_END();
}