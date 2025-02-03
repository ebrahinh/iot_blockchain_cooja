#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This script makes a peer node join the specified channel.

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../../config/
export CORE_PEER_TLS_ENABLED=true

# Command-line arguments
CHANNEL_NAME=$1
PEER_ADDRESS=$2
MSP_NAME=$3
ORDERER_CA=$4
ADMIN_MSP_PATH=$5

# Check if all arguments are provided
if [ -z "$CHANNEL_NAME" ] || [ -z "$PEER_ADDRESS" ] || [ -z "$MSP_NAME" ] || [ -z "$ORDERER_CA" ] || [ -z "$ADMIN_MSP_PATH" ]; then
    echo "Usage: ./joinChannel.sh <channel_name> <peer_address> <msp_name> <orderer_ca_path> <admin_msp_path>"
    exit 1
fi

echo "🔄 Fetching latest channel block..."
export CORE_PEER_MSPCONFIGPATH=$ADMIN_MSP_PATH
export CORE_PEER_ADDRESS=$PEER_ADDRESS
export CORE_PEER_LOCALMSPID=$MSP_NAME
export CORE_PEER_TLS_ROOTCERT_FILE=$ORDERER_CA

peer channel fetch 0 ../channel-artifacts/${CHANNEL_NAME}.block -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c "$CHANNEL_NAME" --tls --cafile "$ORDERER_CA"

echo "📢 Peer $PEER_ADDRESS joining channel $CHANNEL_NAME..."
peer channel join -b ../channel-artifacts/${CHANNEL_NAME}.block

echo "✅ Successfully joined peer $PEER_ADDRESS to channel $CHANNEL_NAME!"
