#include "contiki.h"
#include "net/ipv6/uip-ds6.h"
#include "net/routing/routing.h"
#include "net/netstack.h"
#include "sys/log.h"
#include "global_resources.h"
#include "net/ipv6/simple-udp.h"
#include <stdbool.h>

#define LOG_MODULE "Border Router"
#define LOG_LEVEL LOG_LEVEL_INFO

#define UDP_PORT 1234
#define RPL_JOIN_TIMEOUT (120 * CLOCK_SECOND) // Increased timeout for RPL network to form

/* Process Declarations */
PROCESS(border_router_process, "Contiki-NG Border Router");
PROCESS(configure_network_process, "Configure RPL Network");
PROCESS(monitor_rpl_nodes_process, "Monitor RPL Nodes");
AUTOSTART_PROCESSES(&border_router_process);

/*---------------------------------------------------------------------------*/
/* Set IPv6 Prefix */
static void set_prefix_64(uip_ipaddr_t *prefix) {
    uip_ip6addr(prefix, 0xaaaa, 0, 0, 0, 0, 0, 0, 0);
    NETSTACK_ROUTING.root_set_prefix(prefix, NULL); // Set the routing root prefix
    NETSTACK_ROUTING.root_start(); // Ensure root is started correctly

    LOG_INFO("IPv6 Prefix Set: ");
    LOG_INFO_6ADDR(prefix);
    LOG_INFO_("\n");
}

/*---------------------------------------------------------------------------*/
/* Verify RPL Network Join */
static bool verify_rpl_status(void) {
    if (NETSTACK_ROUTING.node_is_root()) {
        LOG_INFO("The Border Router is correctly functioning as the root.\n");
        return true;
    }
    LOG_WARN("The Border Router is not functioning as the root!\n");
    return false;
}

/*---------------------------------------------------------------------------*/
/* Monitor Active RPL Network Nodes */
PROCESS_THREAD(monitor_rpl_nodes_process, ev, data) {
    static struct etimer node_timer;
    static int retries = 30;         // Maximum retries for checking nodes
    static int num_nodes = 0;

    PROCESS_BEGIN();

    etimer_set(&node_timer, CLOCK_SECOND / 2); // Half-second checks

    while (retries > 0) {
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&node_timer));
        etimer_reset(&node_timer);

        num_nodes = 0;
        uip_ds6_route_t *route;

        // Iterate through the routing table to count active nodes
        for (route = uip_ds6_route_head(); route != NULL; route = uip_ds6_route_next(route)) {
            num_nodes++;
        }

        if (num_nodes > 0) {
            LOG_INFO("Active RPL Nodes Detected: %d\n", num_nodes);
            PROCESS_EXIT(); // Exit if nodes are detected
        }

        LOG_INFO("Waiting for sensor nodes to join... (retries left: %d)\n", retries - 1);
        retries--;
    }

    LOG_WARN("No sensor nodes detected after timeout!\n");

    PROCESS_END();
}

/*---------------------------------------------------------------------------*/
/* Configure RPL Network Process */
PROCESS_THREAD(configure_network_process, ev, data) {
    static struct etimer rpl_timer;
    static bool rpl_ready = false; // RPL readiness flag
    static uip_ipaddr_t prefix;

    PROCESS_BEGIN();

    /* Set the IPv6 Prefix */
    set_prefix_64(&prefix);

    /* Start the timer for RPL formation */
    etimer_set(&rpl_timer, RPL_JOIN_TIMEOUT);

    LOG_INFO("Waiting for the RPL network to form...\n");

    while (!etimer_expired(&rpl_timer)) {
        if (verify_rpl_status()) {
            rpl_ready = true;
            break;
        }
        PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&rpl_timer));
    }

    if (!rpl_ready) {
        LOG_ERR("Failed to form RPL network within the timeout period.\n");

        /* Retry Mechanism for RPL */
        LOG_WARN("Retrying RPL network initialization...\n");
        process_start(&configure_network_process, NULL); // Restart process
        PROCESS_EXIT();

    } else {
        LOG_INFO("RPL Network formed successfully.\n");

        /* Monitor Active RPL Nodes */
        process_start(&monitor_rpl_nodes_process, NULL); // Start monitoring nodes
        PROCESS_WAIT_EVENT_UNTIL(ev == PROCESS_EVENT_EXIT); // Wait for exit
    }

    PROCESS_END();
}

/*---------------------------------------------------------------------------*/
/* UDP Callback Function */
static void udp_rx_callback(struct simple_udp_connection *c,
                             const uip_ipaddr_t *sender_addr,
                             uint16_t sender_port,
                             const uip_ipaddr_t *receiver_addr,
                             uint16_t receiver_port,
                             const uint8_t *data,
                             uint16_t datalen) {
    LOG_INFO("Received UDP Packet:\n");
    LOG_INFO("  From: ");
    LOG_INFO_6ADDR(sender_addr);
    LOG_INFO_("\n");
    LOG_INFO("  To: ");
    LOG_INFO_6ADDR(receiver_addr);
    LOG_INFO_("\n");
    LOG_INFO("  Data: %.*s\n", datalen, (char *)data);

    /* Log Specific Sensor Packet Data */
    LOG_INFO("[LOG] Processing data received from node: %.*s\n", datalen, (char *)data);
}

/*---------------------------------------------------------------------------*/
/* Border Router Main Process */
PROCESS_THREAD(border_router_process, ev, data) {
    PROCESS_BEGIN();

    LOG_INFO("Starting the Contiki-NG Border Router...\n");

    /* Initialize Global Resources */
    initialize_global_resources();

    /* Configure the RPL Network */
    process_start(&configure_network_process, NULL); // Start configuration process
    PROCESS_WAIT_EVENT_UNTIL(ev == PROCESS_EVENT_EXIT);

    /* Initialize UDP Processing */
    simple_udp_register(&udp_conn, UDP_PORT, NULL, UDP_PORT, udp_rx_callback);
    LOG_INFO("Listening for UDP traffic on port %u\n", UDP_PORT);

    /* Keep the process alive for handling UDP traffic */
    while (1) {
        PROCESS_WAIT_EVENT(); // Infinite event waiting loop
    }

    PROCESS_END();
}