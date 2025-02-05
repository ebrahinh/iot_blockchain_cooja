#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "simple-udp.h"
#include "net/ipaddr.h"
#include "sys/timer.h"
#include "net/ip/uip-debug.h"

// ------------------------------------------------------------
// Logging Configuration
// ------------------------------------------------------------
#define LOG_MODULE "Integrity-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

// ------------------------------------------------------------
// Configuration Constants (Move to Config Header in Larger Projects)
// ------------------------------------------------------------
#define UDP_PORT_CENTRAL 8843                 // UDP Server (Central Node) Port
#define UDP_PORT_OUT 5555                     // UDP Source Port for This Node
#define SEND_INTERVAL (10 * CLOCK_SECOND)     // Interval for Periodic Data Transmission
#define MAX_UDP_BUFFER_SIZE 150               // Max Buffer Size for UDP Messages
#define DEVICE_ID_SIZE 17                     // Device ID Length

// Central server's IPv6 address parts
static uint16_t central_addr[] = {
    0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101};

// ------------------------------------------------------------
// Global Variables
// ------------------------------------------------------------
static struct simple_udp_connection udp_connection;
static uip_ipaddr_t server_addr;              // IPv6 Address of the Central Server
static char device_id[DEVICE_ID_SIZE];        // Identifier for This Device

// ------------------------------------------------------------
// Function Declarations
// ------------------------------------------------------------
void connect_udp_server();
void generate_device_id();
void send_security_data();
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
    if (datalen > 0 && datalen < MAX_UDP_BUFFER_SIZE) {
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
void generate_device_id() {
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
// Connect to UDP Server
// ------------------------------------------------------------
void connect_udp_server() {
    uip_ip6addr(&server_addr,
                central_addr[0], central_addr[1],
                central_addr[2], central_addr[3],
                central_addr[4], central_addr[5],
                central_addr[6], central_addr[7]);

    LOG_INFO("Server address: ");
    LOG_INFO_6ADDR(&server_addr);
    LOG_INFO("\n");

    simple_udp_register(&udp_connection,
                        UDP_PORT_OUT, NULL,
                        UDP_PORT_CENTRAL, udp_rx_callback);
}

// ------------------------------------------------------------
// Send Security Data
// ------------------------------------------------------------
void send_security_data() {
    static char udp_buffer[MAX_UDP_BUFFER_SIZE];
    int auth_status = rand() % 2; // Random authentication status
    int integrity_flag = rand() % 2; // Random integrity status
    int threat_flag = rand() % 2; // Random threat flag
    int enc_time = rand() % 100 + 10; // Encryption time between 10–109 ms

    snprintf(udp_buffer, sizeof(udp_buffer),
             "device_id:%s,auth_status:%d,integrity_flag:%d,threat_flag:%d,enc_time:%d",
             device_id, auth_status, integrity_flag, threat_flag, enc_time);

    LOG_INFO("Sending UDP Data: %s\n", udp_buffer);
    simple_udp_sendto(&udp_connection, udp_buffer, strlen(udp_buffer), &server_addr);
}

// ------------------------------------------------------------
// Main Process Thread
// ------------------------------------------------------------
PROCESS(init_system_proc, "Init System Process");
AUTOSTART_PROCESSES(&init_system_proc);

PROCESS_THREAD(init_system_proc, ev, data) {
    PROCESS_BEGIN();

    static struct etimer periodic_timer;

    // Step 1: Generate Device ID
    generate_device_id();

    // Step 2: Connect to the Central UDP Server
    connect_udp_server();

    // Step 3: Configure Timer for Periodic Data Sending
    etimer_set(&periodic_timer, SEND_INTERVAL);
    LOG_INFO("System initialized. Data will be sent every %d seconds.\n", SEND_INTERVAL / CLOCK_SECOND);

    // Step 4: Periodic Execution Loop
    while (1) {
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&periodic_timer));
        send_security_data();
        etimer_reset(&periodic_timer);
    }

    PROCESS_END();
}