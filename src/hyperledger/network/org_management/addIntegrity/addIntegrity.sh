#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This script extends the Hyperledger Fabric test network by adding IntegrityOrg
# and ensuring it joins the channel using automation

export PATH=${PWD}/../../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
export VERBOSE=false

. ../scripts/utils.sh

: ${CONTAINER_CLI:="docker"}
: ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
infoln "Using ${CONTAINER_CLI} and ${CONTAINER_CLI_COMPOSE}"

# Function to generate IntegrityOrg crypto materials
function generateIntegrityOrg() {
  if [[ "$CRYPTO" == "cryptogen" ]]; then
    which cryptogen
    if [[ "$?" -ne 0 ]]; then
      fatalln "cryptogen tool not found. Exiting."
    fi
    infoln "Generating certificates using cryptogen tool"
    set -x
    cryptogen generate --config=integrity-crypto.yaml --output="../organizations"
    res=$?
    { set +x; } 2>/dev/null
    if [[ $res -ne 0 ]]; then
      fatalln "Failed to generate certificates..."
    fi
  fi
}

# Function to create the channel configuration for IntegrityOrg
function generateIntegrityOrgDefinition() {
  which configtxgen
  if [[ "$?" -ne 0 ]]; then
    fatalln "configtxgen tool not found. Exiting."
  fi
  infoln "Generating IntegrityOrg organization definition"
  export FABRIC_CFG_PATH=$PWD
  set -x
  configtxgen -printOrg IntegrityOrgMSP > ../organizations/peerOrganizations/integrity.example.com/integrity.json
  res=$?
  { set +x; } 2>/dev/null
  if [[ $res -ne 0 ]]; then
    fatalln "Failed to generate IntegrityOrg organization definition..."
  fi
}

# Function to start IntegrityOrg peers
function IntegrityOrgUp() {
  if [[ "$CONTAINER_CLI" == "podman" ]]; then
    cp ../podman/core.yaml ../../organizations/peerOrganizations/integrity.example.com/peers/peer0.integrity.example.com/
  fi
  DOCKER_SOCK=${DOCKER_SOCK} ${CONTAINER_CLI_COMPOSE} -f compose/compose-integrity.yaml up -d 2>&1
  if [[ $? -ne 0 ]]; then
    fatalln "ERROR !!!! Unable to start IntegrityOrg network"
  fi
}

# Function to add IntegrityOrg to the channel
function addIntegrityOrg() {
  if [[ ! -d ../organizations/ordererOrganizations ]]; then
    fatalln "ERROR: Please run ./network.sh up createChannel first."
  fi
  if [[ ! -d "../organizations/peerOrganizations/integrity.example.com" ]]; then
    generateIntegrityOrg
    generateIntegrityOrgDefinition
  fi
  infoln "Bringing up IntegrityOrg peer"
  IntegrityOrgUp

  # Update the channel configuration to include IntegrityOrg
  infoln "Generating and submitting config tx to add IntegrityOrg"
  ${CONTAINER_CLI} exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && ./scripts/integrity-scripts/updateChannelConfig.sh mychannel integrity IntegrityOrgMSP /organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem peer0.integrity.example.com:15051 /organizations/peerOrganizations/integrity.example.com/users/Admin@integrity.example.com/msp"
  
  if [[ $? -ne 0 ]]; then
    fatalln "ERROR !!!! Unable to create config tx for IntegrityOrg"
  fi

  # Join the channel
  infoln "Joining IntegrityOrg peers to network"
  ${CONTAINER_CLI} exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && ./scripts/integrity-scripts/joinChannel.sh mychannel peer0.integrity.example.com:15051 IntegrityOrgMSP /organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem /organizations/peerOrganizations/integrity.example.com/users/Admin@integrity.example.com/msp"
  
  if [[ $? -ne 0 ]]; then
    fatalln "ERROR !!!! Unable to join IntegrityOrg peers to network"
  fi
}

# Function to bring down the network
function networkDown() {
  cd .. && ./network.sh down
}

# Configuration settings
CRYPTO="cryptogen"
CLI_TIMEOUT=10
CLI_DELAY=3
CHANNEL_NAME="mychannel"
ORDERER_CA="/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
ADMIN_MSP_PATH="/organizations/peerOrganizations/integrity.example.com/users/Admin@integrity.example.com/msp"

COMPOSE_FILE_BASE=compose/compose-integrity.yaml
DATABASE="leveldb"
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

# Parse command-line args
if [[ $# -lt 1 ]]; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

while [[ $# -ge 1 ]]; do
  key="$1"
  case $key in
  -h)
    printHelp
    exit 0
    ;;
  -c)
    CHANNEL_NAME="$2"
    shift
    ;;
  -s)
    DATABASE="$2"
    shift
    ;;
  *)
    errorln "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done

if [[ "$MODE" == "up" ]]; then
  addIntegrityOrg
elif [[ "$MODE" == "down" ]]; then
  networkDown
elif [[ "$MODE" == "generate" ]]; then
  generateIntegrityOrg
  generateIntegrityOrgDefinition
else
  printHelp
  exit 1
fi
