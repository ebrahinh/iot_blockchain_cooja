#ifndef GLOBAL_RESOURCES_H_
#define GLOBAL_RESOURCES_H_

#include "contiki.h"
#include "net/ipv6/simple-udp.h"
#include "net/ipv6/uip.h"
#include "net/ipv6/uip-ds6.h"
#include "net/routing/routing.h"
#include <stdio.h>

#define NODE_ID_LENGTH 16    // Max length for node ID string
#define UDP_PORT 1234        // UDP port used for communication

// Global variables for all nodes
extern char custom_node_id[NODE_ID_LENGTH];              // Unique node ID
extern uip_ipaddr_t server_addr;                         // Border Router address
extern struct simple_udp_connection udp_conn;            // UDP connection object

// Functions
void generate_node_id(void);                             // Create unique node ID
void initialize_global_resources(void);                  // Initialize resource settings
int wait_for_rpl_network(void);                          // Wait until RPL network is formed

#endif /* GLOBAL_RESOURCES_H_ */