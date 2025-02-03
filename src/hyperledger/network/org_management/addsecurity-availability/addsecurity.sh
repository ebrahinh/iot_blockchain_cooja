#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

export PATH=${PWD}/../../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
export VERBOSE=false

. ../scripts/utils.sh

: ${CONTAINER_CLI:="docker"}
: ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
infoln "Using ${CONTAINER_CLI} and ${CONTAINER_CLI_COMPOSE}"

# Print the usage message
function printHelp () {
  echo "Usage: "
  echo "  addsecurity.sh up|down|generate [-c <channel name>] [-t <timeout>] [-d <delay>] [-s <dbtype>]"
  echo "  addsecurity.sh -h|--help (print this message)"
}

# Generate cryptographic material
function generateSecurityOrg() {
  if [ "$CRYPTO" == "cryptogen" ]; then
    which cryptogen
    if [ "$?" -ne 0 ]; then
      fatalln "cryptogen tool not found. exiting"
    fi
    infoln "Generating certificates using cryptogen tool"

    infoln "Creating SecurityOrg and Availability Sensor Identities"
    set -x
    cryptogen generate --config=security-crypto.yaml --output="../organizations"
    cryptogen generate --config=availability-crypto.yaml --output="../organizations"
    res=$?
    { set +x; } 2>/dev/null
    if [ $res -ne 0 ]; then
      fatalln "Failed to generate certificates..."
    fi
  fi
}

# Generate channel configuration transaction
function generateSecurityOrgDefinition() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    fatalln "configtxgen tool not found. exiting"
  fi
  infoln "Generating SecurityOrg and Availability Sensor organization definitions"
  export FABRIC_CFG_PATH=$PWD
  set -x
  configtxgen -printOrg SecurityOrgMSP > ../organizations/peerOrganizations/security.example.com/security.json
  configtxgen -printOrg AvailabilitySensorMSP > ../organizations/peerOrganizations/availability.example.com/availability.json
  res=$?
  { set +x; } 2>/dev/null
  if [ $res -ne 0 ]; then
    fatalln "Failed to generate organization definitions..."
  fi
}

function SecurityOrgUp () {
  if [ "${DATABASE}" == "couchdb" ]; then
    DOCKER_SOCK=${DOCKER_SOCK} ${CONTAINER_CLI_COMPOSE} -f ${COMPOSE_FILE_BASE} -f $COMPOSE_FILE_SECURITY -f ${COMPOSE_FILE_COUCH_BASE} -f $COMPOSE_FILE_COUCH_SECURITY up -d 2>&1
  else
    DOCKER_SOCK=${DOCKER_SOCK} ${CONTAINER_CLI_COMPOSE} -f ${COMPOSE_FILE_BASE} -f $COMPOSE_FILE_SECURITY up -d 2>&1
  fi
  if [ $? -ne 0 ]; then
    fatalln "ERROR !!!! Unable to start SecurityOrg network"
  fi
}

function addSecurityOrg () {
  if [ ! -d ../organizations/ordererOrganizations ]; then
    fatalln "ERROR: Please, run ./network.sh up createChannel first."
  fi

  if [ ! -d "../organizations/peerOrganizations/security.example.com" ]; then
    generateSecurityOrg
    generateSecurityOrgDefinition
  fi

  infoln "Bringing up SecurityOrg peer"
  SecurityOrgUp

  infoln "Updating channel configuration to add SecurityOrg and Availability Sensor..."
  ./updateChannelConfig.sh mychannel security SecurityOrgMSP ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem localhost:11051 ../organizations/peerOrganizations/security.example.com/users/Admin@security.example.com/msp
  ./updateChannelConfig.sh mychannel availability AvailabilitySensorMSP ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem localhost:12051 ../organizations/peerOrganizations/availability.example.com/users/Admin@availability.example.com/msp

  infoln "Joining SecurityOrg and Availability Sensor peers to channel..."
  ./joinChannel.sh mychannel localhost:11051 SecurityOrgMSP ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem ../organizations/peerOrganizations/security.example.com/users/Admin@security.example.com/msp
  ./joinChannel.sh mychannel localhost:12051 AvailabilitySensorMSP ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem ../organizations/peerOrganizations/availability.example.com/users/Admin@availability.example.com/msp
}

function networkDown () {
    cd .. && ./network.sh down
}

CRYPTO="cryptogen"
CLI_TIMEOUT=10
CLI_DELAY=3
CHANNEL_NAME="mychannel"
COMPOSE_FILE_COUCH_BASE=compose/compose-couch-security.yaml
COMPOSE_FILE_COUCH_SECURITY=compose/${CONTAINER_CLI}/docker-compose-couch-security.yaml
COMPOSE_FILE_BASE=compose/compose-security.yaml
COMPOSE_FILE_SECURITY=compose/${CONTAINER_CLI}/docker-compose-security.yaml
COMPOSE_FILE_CA_BASE=compose/compose-ca-security.yaml
COMPOSE_FILE_CA_SECURITY=compose/${CONTAINER_CLI}/docker-compose-ca-security.yaml
DATABASE="leveldb"

SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

if [[ $# -lt 1 ]] ; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -h )
    printHelp
    exit 0
    ;;
  -c )
    CHANNEL_NAME="$2"
    shift
    ;;
  -ca )
    CRYPTO="Certificate Authorities"
    ;;
  -t )
    CLI_TIMEOUT="$2"
    shift
    ;;
  -d )
    CLI_DELAY="$2"
    shift
    ;;
  -s )
    DATABASE="$2"
    shift
    ;;
  -verbose )
    VERBOSE=true
    ;;
  * )
    errorln "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done

if [ "$MODE" == "up" ]; then
  infoln "Adding SecurityOrg and Availability Sensor to channel '${CHANNEL_NAME}' with '${CLI_TIMEOUT}' seconds timeout"
elif [ "$MODE" == "down" ]; then
  EXPMODE="Stopping network"
elif [ "$MODE" == "generate" ]; then
  EXPMODE="Generating certs and organization definitions for SecurityOrg and Availability Sensor"
else
  printHelp
  exit 1
fi

if [ "${MODE}" == "up" ]; then
  addSecurityOrg
elif [ "${MODE}" == "down" ]; then
  networkDown
elif [ "${MODE}" == "generate" ]; then
  generateSecurityOrg
  generateSecurityOrgDefinition
else
  printHelp
  exit 1
fi
