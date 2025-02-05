#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "net/ipv6/simple-udp.h"

#define LOG_MODULE "Monitor-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT_SERVER 8844                // UDP destination port
#define UDP_PORT_LOCAL 5555                 // Local UDP port
#define DEVICE_ID_SIZE 3
#define MAX_BUFFER_SIZE 256
#define SEND_INTERVAL (10 * CLOCK_SECOND)   // Time interval for sending logs

static struct simple_udp_connection udp_conn;    // UDP connection instance
static char device_id[DEVICE_ID_SIZE];           // Device ID to identify the node
static uip_ipaddr_t server_addr;                 // Server IPv6 address

PROCESS(monitor_sensor_process, "Monitor Sensor Process");
AUTOSTART_PROCESSES(&monitor_sensor_process);

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

// Generate a 2-digit unique Device ID using the last MAC address byte
static void generate_device_id() {
    if (linkaddr_node_addr.u8[7] == 0) {
        snprintf(device_id, DEVICE_ID_SIZE, "00");
        LOG_WARN("⚠️ Invalid MAC address. Defaulting Device ID to 00.\n");
    } else {
        snprintf(device_id, DEVICE_ID_SIZE, "%02X", linkaddr_node_addr.u8[7]);
        LOG_INFO("✅ Device ID: %s\n", device_id);
    }
}

// UDP callback to log received messages
static void udp_rx_callback(struct simple_udp_connection *c,
                            const uip_ipaddr_t *sender_addr,
                            uint16_t sender_port,
                            const uip_ipaddr_t *receiver_addr,
                            uint16_t receiver_port,
                            const uint8_t *data, uint16_t datalen) {
    LOG_INFO("📩 Received from port %d: %.*s\n", sender_port, datalen, (char *)data);
}

// Set up the UDP connection
static void setup_udp() {
    uip_ip6addr(&server_addr, 0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101);
    simple_udp_register(&udp_conn, UDP_PORT_LOCAL, NULL, UDP_PORT_SERVER, udp_rx_callback);
    LOG_INFO("🔗 UDP Monitor Server set up on port %d.\n", UDP_PORT_SERVER);
}

// Send dummy monitoring logs to the server
static void send_monitoring_logs() {
    static char payload[MAX_BUFFER_SIZE];
    int log_event_id = rand() % 100; // Example "event ID" for monitoring logs

    snprintf(payload, sizeof(payload), "device_id:%s,log_id:%d,message:Monitor_OK", device_id, log_event_id);
    simple_udp_sendto(&udp_conn, payload, strlen(payload), &server_addr);
    LOG_INFO("📤 Sent log message: [%s]\n", payload);
}

// ------------------------------------------------------------
// Main Monitoring Sensor Process
// ------------------------------------------------------------
PROCESS_THREAD(monitor_sensor_process, ev, data) {
    static struct etimer timer;

    PROCESS_BEGIN();

    LOG_INFO("📡 Monitor Sensor Node Started.\n");
    generate_device_id();
    setup_udp();

    etimer_set(&timer, SEND_INTERVAL);
    while (1) {
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&timer));
        send_monitoring_logs();
        etimer_reset(&timer);
    }

    PROCESS_END();
}