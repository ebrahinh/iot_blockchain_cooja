#include "global_resources.h"
#include "sys/log.h"
#include "net/ipv6/uip-ds6.h"
#include "net/netstack.h"
#include "net/routing/routing.h"

#define LOG_MODULE "Global Resources"
#define LOG_LEVEL LOG_LEVEL_INFO

#define RPL_NETWORK_TIMEOUT (120 * CLOCK_SECOND) // Timeout for RPL network formation

char custom_node_id[NODE_ID_LENGTH];         // Unique node identifier
uip_ipaddr_t server_addr;                    // Border Router address
struct simple_udp_connection udp_conn;       // UDP connection object

/*---------------------------------------------------------------------------*/
/* Function to Generate Node ID */
void generate_node_id(void) {
    const uip_ipaddr_t *lladdr = (const uip_ipaddr_t *)uip_ds6_get_link_local(-1);

    if (lladdr != NULL) {
        snprintf(custom_node_id, NODE_ID_LENGTH, "NODE-%02X%02X", lladdr->u8[14], lladdr->u8[15]);
    } else {
        snprintf(custom_node_id, NODE_ID_LENGTH, "NODE-UNKNOWN");
    }

    LOG_INFO("Generated Custom Node ID: %s\n", custom_node_id);
}

/*---------------------------------------------------------------------------*/
/* Initialize Global Resources */
void initialize_global_resources(void) {
    if (NETSTACK_ROUTING.node_is_root()) {
        uip_ip6addr(&server_addr, 0xaaaa, 0, 0, 0, 0, 0, 0, 1);
    }

    generate_node_id();

    LOG_INFO("Server Address Configured: ");
    LOG_INFO_6ADDR(&server_addr);
    LOG_INFO_("\n");
}

/*---------------------------------------------------------------------------*/
/* Wait for RPL Network Formation */
int wait_for_rpl_network(void) {
    clock_time_t start_time = clock_time(); // Record the start time
    clock_time_t deadline = start_time + RPL_NETWORK_TIMEOUT; // Calculate the timeout deadline

    LOG_INFO("⌛ Waiting for RPL network to form...\n");

    while (clock_time() < deadline) {
        // Check if the RPL network is reachable and root IP address is available
        if (NETSTACK_ROUTING.node_is_reachable() && NETSTACK_ROUTING.get_root_ipaddr(&server_addr)) {
            LOG_INFO("🌐 RPL Network Formed. Border Router Address: ");
            LOG_INFO_6ADDR(&server_addr);
            LOG_INFO_("\n");
            return 1; // Network successfully formed
        }

        // Allow other processes to run while we check intermittently
        process_poll(&etimer_process);
        clock_wait(CLOCK_SECOND); // Sleep for one second before checking again
    }

    LOG_WARN("⚠️ Timeout waiting for RPL network to form.\n");
    return 0; // Network formation failed
}