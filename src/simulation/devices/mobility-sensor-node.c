#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "contiki.h"
#include "contiki-net.h"
#include "sys/log.h"
#include "simple-udp.h"
#include "net/ip/uip-debug.h"

#define LOG_MODULE "Mobility-Sensor"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT_CENTRAL 8845
#define UDP_PORT_OUT 5555
#define SEND_INTERVAL (10 * CLOCK_SECOND)

static struct simple_udp_connection broadcast_connection;
static uip_ipaddr_t server_addr;
static uint16_t central_addr[] = {0xfe80, 0, 0, 0, 0x0212, 0x7401, 0x0001, 0x0101};

PROCESS(init_system_proc, "Init System Process");
AUTOSTART_PROCESSES(&init_system_proc);

// Handle incoming UDP packets
void udp_rx_callback(struct simple_udp_connection *c,
                     const uip_ipaddr_t *sender_addr,
                     uint16_t sender_port,
                     const uip_ipaddr_t *receiver_addr,
                     uint16_t receiver_port,
                     const uint8_t *data,
                     uint16_t datalen) {
    LOG_INFO("Received UDP data from ");
    LOG_INFO_6ADDR(sender_addr);
    LOG_INFO(":%d\n", sender_port);
    LOG_INFO("Data: %s\n", data);
}

// Connect to UDP server
void connect_udp_server() {
    uip_ip6addr(&server_addr,
                central_addr[0], central_addr[1],
                central_addr[2], central_addr[3],
                central_addr[4], central_addr[5],
                central_addr[6], central_addr[7]);
    LOG_INFO("Server address: ");
    LOG_INFO_6ADDR(&server_addr);
    LOG_INFO("\n");

    simple_udp_register(&broadcast_connection,
                        UDP_PORT_OUT, NULL,
                        UDP_PORT_CENTRAL, udp_rx_callback);
}

// Security simulation functions
void getLocationSecStatus(int *data) {
    *data = rand() % 2; // Random 0 (insecure) or 1 (secure)
}

void getSpeedAnomaly(int *data) {
    *data = rand() % 2; // Random 0 (normal) or 1 (anomaly detected)
}

void getGeoFenceBreach(int *data) {
    *data = rand() % 2; // Random 0 (no breach) or 1 (breach detected)
}

void getSignalStrength(int *data) {
    *data = -1 * (rand() % 101); // Random RSSI value between -100 and 0 dBm
}

// Main process thread
PROCESS_THREAD(init_system_proc, ev, data) {
    PROCESS_BEGIN();
    static struct etimer periodic_timer;
    static char buff_udp[150];
    static char device_id[17];

    // Generate device ID from the link address
    sprintf(device_id, "%02X%02X%02X%02X%02X%02X%02X%02X",
            linkaddr_node_addr.u8[0], linkaddr_node_addr.u8[1],
            linkaddr_node_addr.u8[2], linkaddr_node_addr.u8[3],
            linkaddr_node_addr.u8[4], linkaddr_node_addr.u8[5],
            linkaddr_node_addr.u8[6], linkaddr_node_addr.u8[7]);
    LOG_INFO("Device ID: %s\n", device_id);

    // Connect to UDP server
    connect_udp_server();

    // Set periodic timer
    etimer_set(&periodic_timer, SEND_INTERVAL);

    LOG_INFO("Device initialized. Sending data every %d seconds.\n", SEND_INTERVAL / CLOCK_SECOND);

    while (1) {
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&periodic_timer));

        // Generate security data
        int location_sec_status, speed_anomaly, geo_breach, signal_strength;
        getLocationSecStatus(&location_sec_status);
        getSpeedAnomaly(&speed_anomaly);
        getGeoFenceBreach(&geo_breach);
        getSignalStrength(&signal_strength);

        // Format data for transmission
        snprintf(buff_udp, sizeof(buff_udp),
                 "location_sec_status:%d,speed_anomaly:%d,geo_breach:%d,signal_strength:%d",
                 location_sec_status, speed_anomaly, geo_breach, signal_strength);

        LOG_INFO("Sending: %s\n", buff_udp);

        // Send data to UDP server
        simple_udp_sendto(&broadcast_connection, buff_udp, strlen(buff_udp), &server_addr);

        // Reset timer
        etimer_reset(&periodic_timer);
    }

    PROCESS_END();
}