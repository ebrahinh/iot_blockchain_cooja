#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "net/ipv6/simple-udp.h"

#define LOG_MODULE "Integrity-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT_SERVER 8843
#define UDP_PORT_LOCAL 5555
#define SEND_INTERVAL (10 * CLOCK_SECOND)
#define DEVICE_ID_SIZE 3
#define MAX_BUFFER_SIZE 256

static struct simple_udp_connection udp_conn;
static char device_id[DEVICE_ID_SIZE];
static uip_ipaddr_t server_addr;

PROCESS(integrity_sensor_process, "Integrity Sensor Process");
AUTOSTART_PROCESSES(&integrity_sensor_process);

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

static void generate_device_id() {
    if (linkaddr_node_addr.u8[7] == 0) {
        snprintf(device_id, DEVICE_ID_SIZE, "00");
        LOG_WARN("⚠️ Invalid link-layer address. Defaulting Device ID to 00.\n");
    } else {
        snprintf(device_id, DEVICE_ID_SIZE, "%02X", linkaddr_node_addr.u8[7]);
        LOG_INFO("✅ Device ID: %s\n", device_id);
    }
}

static void udp_rx_callback(struct simple_udp_connection *c,
                            const uip_ipaddr_t *sender_addr,
                            uint16_t sender_port,
                            const uip_ipaddr_t *receiver_addr,
                            uint16_t receiver_port,
                            const uint8_t *data, uint16_t datalen) {
    LOG_INFO("📩 Received integrity-related message from port %d. Message: %.*s\n",
             sender_port, datalen, (char *)data);
}

static void setup_udp() {
    uip_ip6addr(&server_addr, 0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101);
    simple_udp_register(&udp_conn, UDP_PORT_LOCAL, NULL, UDP_PORT_SERVER, udp_rx_callback);
    LOG_INFO("🔗 Registered Integrity Sensor UDP server on port %d.\n", UDP_PORT_SERVER);
}

static void send_integrity_data() {
    static char payload[MAX_BUFFER_SIZE];
    int integrity_flag = rand() % 2; // Simulated integrity flag

    snprintf(payload, sizeof(payload), "device_id:%s,integrity_flag:%d", device_id, integrity_flag);
    simple_udp_sendto(&udp_conn, payload, strlen(payload), &server_addr);

    LOG_INFO("📤 Sent integrity message: [%s]\n", payload);
}

// ------------------------------------------------------------
// Main Process
// ------------------------------------------------------------
PROCESS_THREAD(integrity_sensor_process, ev, data) {
    static struct etimer timer;

    PROCESS_BEGIN();

    LOG_INFO("🔒 Integrity Sensor Process Starting...\n");

    generate_device_id();
    setup_udp();

    etimer_set(&timer, SEND_INTERVAL);
    while (1) {
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&timer));
        send_integrity_data();
        etimer_reset(&timer);
    }

    PROCESS_END();
}