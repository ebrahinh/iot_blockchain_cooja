#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "net/ipv6/simple-udp.h"

#define LOG_MODULE "Security-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT_SERVER 8847                 // UDP destination port
#define UDP_PORT_LOCAL 5555                  // Local UDP port
#define DEVICE_ID_SIZE 3                     // Device ID size (2 digits + null terminator)
#define SEND_INTERVAL (10 * CLOCK_SECOND)    // Data send interval
#define MAX_BUFFER_SIZE 256                  // Maximum buffer size for messages

static struct simple_udp_connection udp_conn;    // UDP connection instance
static char device_id[DEVICE_ID_SIZE];           // Device ID
static uip_ipaddr_t server_addr;                 // Server IPv6 address

// Forward declarations for functions
static void udp_rx_callback(struct simple_udp_connection *c,
                            const uip_ipaddr_t *sender_addr,
                            uint16_t sender_port,
                            const uip_ipaddr_t *receiver_addr,
                            uint16_t receiver_port,
                            const uint8_t *data, uint16_t datalen);

PROCESS(security_sensor_process, "Security Sensor Process");
AUTOSTART_PROCESSES(&security_sensor_process);

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

// Generate a 2-digit unique device ID using the last byte of the MAC address
static void generate_device_id() {
    if (linkaddr_node_addr.u8[7] == 0) {
        snprintf(device_id, DEVICE_ID_SIZE, "00");
        LOG_WARN("⚠️ Invalid MAC address. Defaulting Device ID to 00.\n");
    } else {
        snprintf(device_id, DEVICE_ID_SIZE, "%02X", linkaddr_node_addr.u8[7]);
        LOG_INFO("✅ Device ID: %s\n", device_id);
    }
}

// UDP callback function to handle incoming packets
static void udp_rx_callback(struct simple_udp_connection *c,
                            const uip_ipaddr_t *sender_addr,
                            uint16_t sender_port,
                            const uip_ipaddr_t *receiver_addr,
                            uint16_t receiver_port,
                            const uint8_t *data, uint16_t datalen) {
    LOG_INFO("📩 Received message from ");
    LOG_INFO_6ADDR(sender_addr);
    LOG_INFO(":%d\n", sender_port);

    char message[MAX_BUFFER_SIZE];
    snprintf(message, sizeof(message), "%.*s", datalen, (char *)data);
    LOG_INFO("📩 Message content: %s\n", message);
}

// Set up the UDP connection
static void setup_udp() {
    uip_ip6addr(&server_addr, 0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101); // Server IPv6 address
    simple_udp_register(&udp_conn,
                        UDP_PORT_LOCAL, NULL,
                        UDP_PORT_SERVER, udp_rx_callback); // Use the callback function
    LOG_INFO("🔗 UDP Security Sensor bound to port %d, communicating with port %d.\n",
             UDP_PORT_LOCAL, UDP_PORT_SERVER);
}

// Send simulated security event data to the server
static void send_security_data() {
    static char payload[MAX_BUFFER_SIZE];

    int breach_flag = rand() % 2;  // Simulated breach flag: 1 = breach, 0 = secure
    snprintf(payload, sizeof(payload), "device_id:%s,breach_flag:%d", device_id, breach_flag);

    simple_udp_sendto(&udp_conn, payload, strlen(payload), &server_addr);
    LOG_INFO("📤 Sent security data: [%s]\n", payload);
}

// ------------------------------------------------------------
// Main Security Sensor Process
// ------------------------------------------------------------
PROCESS_THREAD(security_sensor_process, ev, data) {
    static struct etimer timer;

    PROCESS_BEGIN();

    LOG_INFO("🔐 Security Sensor Node Started.\n");
    generate_device_id();   // Generate a 2-digit Device ID
    setup_udp();            // Configure UDP connection

    etimer_set(&timer, SEND_INTERVAL); // Set timer for periodic data sending
    while (1) {
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&timer)); // Wait for timer to expire
        send_security_data(); // Send a security event
        etimer_reset(&timer); // Reset the timer
    }

    PROCESS_END();
}