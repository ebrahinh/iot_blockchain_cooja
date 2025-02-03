#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This script extends the Hyperledger Fabric test network by adding
# NetworkMobilityOrg (Org5, renamed to handle both Network & Mobility Sensors)

export PATH=${PWD}/../../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
export VERBOSE=false

. ../scripts/utils.sh

: ${CONTAINER_CLI:="docker"}
: ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
infoln "Using ${CONTAINER_CLI} and ${CONTAINER_CLI_COMPOSE}"

# Function to generate crypto materials for NetworkMobilityOrg
function generateNetworkMobilityOrg() {
  if [ "$CRYPTO" == "cryptogen" ]; then
    which cryptogen
    if [ "$?" -ne 0 ]; then
      fatalln "cryptogen tool not found. exiting"
    fi
    infoln "Generating certificates using cryptogen tool"

    infoln "Creating NetworkMobilityOrg Identities"

    set -x
    cryptogen generate --config=network-mobility-crypto.yaml --output="../organizations"
    res=$?
    { set +x; } 2>/dev/null
    if [ $res -ne 0 ]; then
      fatalln "Failed to generate certificates..."
    fi
  fi
}

# Function to create channel configuration for NetworkMobilityOrg
function generateNetworkMobilityOrgDefinition() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    fatalln "configtxgen tool not found. exiting"
  fi
  infoln "Generating NetworkMobilityOrg organization definition"
  export FABRIC_CFG_PATH=$PWD
  set -x
  configtxgen -printOrg NetworkMobilityOrgMSP > ../organizations/peerOrganizations/network-mobility.example.com/network-mobility.json
  res=$?
  { set +x; } 2>/dev/null
  if [ $res -ne 0 ]; then
    fatalln "Failed to generate NetworkMobilityOrg organization definition..."
  fi
}

# Function to bring up NetworkMobilityOrg peers
function NetworkMobilityOrgUp () {
  if [ "${DATABASE}" == "couchdb" ]; then
    DOCKER_SOCK=${DOCKER_SOCK} ${CONTAINER_CLI_COMPOSE} \
      -f ${COMPOSE_FILE_BASE} \
      -f $COMPOSE_FILE_NETWORK_MOBILITY \
      -f ${COMPOSE_FILE_COUCH_BASE} \
      -f $COMPOSE_FILE_COUCH_NETWORK_MOBILITY up -d 2>&1
  else
    DOCKER_SOCK=${DOCKER_SOCK} ${CONTAINER_CLI_COMPOSE} \
      -f ${COMPOSE_FILE_BASE} \
      -f $COMPOSE_FILE_NETWORK_MOBILITY up -d 2>&1
  fi
  if [ $? -ne 0 ]; then
    fatalln "ERROR !!!! Unable to start NetworkMobilityOrg network"
  fi
}

# Function to add NetworkMobilityOrg to the channel
function addNetworkMobilityOrg () {
  if [ ! -d "../organizations/ordererOrganizations" ]; then
    fatalln "ERROR: Please, run ./network.sh up createChannel first."
  fi

  if [ ! -d "../organizations/peerOrganizations/network-mobility.example.com" ]; then
    generateNetworkMobilityOrg
    generateNetworkMobilityOrgDefinition
  fi

  infoln "Bringing up NetworkMobilityOrg peer"
  NetworkMobilityOrgUp

  infoln "🔄 Updating channel configuration for NetworkMobilityOrg..."
  ./updateChannelConfig.sh mychannel networkMobilityOrg NetworkMobilityOrgMSP ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem localhost:13051 ../organizations/peerOrganizations/network-mobility.example.com/users/Admin@network-mobility.example.com/msp

  infoln "🔄 Joining NetworkMobilityOrg peers to the channel..."
  ./joinChannel.sh mychannel localhost:13051 NetworkMobilityOrgMSP ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem ../organizations/peerOrganizations/network-mobility.example.com/users/Admin@network-mobility.example.com/msp
}

# Tear down the running network
function networkDown () {
    cd ..
    ./network.sh down
}

# Configuration settings
CRYPTO="cryptogen"
CLI_TIMEOUT=10
CLI_DELAY=3
CHANNEL_NAME="mychannel"
COMPOSE_FILE_COUCH_BASE=compose/compose-couch-network-mobility.yaml
COMPOSE_FILE_COUCH_NETWORK_MOBILITY=compose/${CONTAINER_CLI}/docker-compose-couch-network-mobility.yaml
COMPOSE_FILE_BASE=compose/compose-network-mobility.yaml
COMPOSE_FILE_NETWORK_MOBILITY=compose/${CONTAINER_CLI}/docker-compose-network-mobility.yaml
COMPOSE_FILE_CA_BASE=compose/compose-ca-network-mobility.yaml
COMPOSE_FILE_CA_NETWORK_MOBILITY=compose/${CONTAINER_CLI}/docker-compose-ca-network-mobility.yaml
DATABASE="leveldb"

# Parse command-line args
if [[ $# -lt 1 ]] ; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

# Main execution logic
if [ "${MODE}" == "up" ]; then
  addNetworkMobilityOrg
elif [ "${MODE}" == "down" ]; then
  networkDown
elif [ "${MODE}" == "generate" ]; then
  generateNetworkMobilityOrg
  generateNetworkMobilityOrgDefinition
else
  printHelp
  exit 1
fi
