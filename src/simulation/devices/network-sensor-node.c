#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "net/ipv6/simple-udp.h"

#define LOG_MODULE "Network-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT_SERVER 8846                // UDP destination port
#define UDP_PORT_LOCAL 5555                 // Local UDP port
#define DEVICE_ID_SIZE 3
#define SEND_INTERVAL (10 * CLOCK_SECOND)
#define MAX_BUFFER_SIZE 256

static struct simple_udp_connection udp_conn;
static char device_id[DEVICE_ID_SIZE];
static uip_ipaddr_t server_addr;

PROCESS(network_sensor_process, "Network Sensor Process");
AUTOSTART_PROCESSES(&network_sensor_process);

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

// Generate a 2-digit unique Device ID using the last byte of MAC Address
static void generate_device_id() {
    if (linkaddr_node_addr.u8[7] == 0) {
        snprintf(device_id, DEVICE_ID_SIZE, "00");
        LOG_WARN("⚠️ Invalid MAC address. Defaulting Device ID to 00.\n");
    } else {
        snprintf(device_id, DEVICE_ID_SIZE, "%02X", linkaddr_node_addr.u8[7]);
        LOG_INFO("✅ Device ID: %s\n", device_id);
    }
}

// Dummy network performance data generator
static void generate_network_metrics(char *buffer, size_t buffer_size) {
    int latency = rand() % 100 + 10;    // Simulated latency in ms
    int packet_loss = rand() % 10;     // Simulated packet loss (0-9%)
    snprintf(buffer, buffer_size, "latency:%dms,packet_loss:%d%%", latency, packet_loss);
}

// UDP callback to log incoming messages
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
    LOG_INFO("🔗 UDP Network Sensor set up on port %d.\n", UDP_PORT_SERVER);
}

// Send network metrics to server
static void send_network_data() {
    static char payload[MAX_BUFFER_SIZE];
    char metrics[MAX_BUFFER_SIZE];

    generate_network_metrics(metrics, sizeof(metrics));
    snprintf(payload, sizeof(payload), "device_id:%s,%s", device_id, metrics);

    simple_udp_sendto(&udp_conn, payload, strlen(payload), &server_addr);
    LOG_INFO("📤 Sent network data: [%s]\n", payload);
}

// ------------------------------------------------------------
// Main Network Sensor Process
// ------------------------------------------------------------
PROCESS_THREAD(network_sensor_process, ev, data) {
    static struct etimer timer;

    PROCESS_BEGIN();

    LOG_INFO("📶 Network Sensor Node Started.\n");
    generate_device_id();
    setup_udp();

    etimer_set(&timer, SEND_INTERVAL);
    while (1) {
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&timer));
        send_network_data();
        etimer_reset(&timer);
    }

    PROCESS_END();
}