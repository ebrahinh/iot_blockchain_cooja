#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This script makes peers from SecurityOrg and AvailabilityOrg join the specified channel.

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../../config/
export CORE_PEER_TLS_ENABLED=true

# Command-line arguments
CHANNEL_NAME=$1
ORDERER_CA=$2
SECURITY_PEER_ADDRESS=$3
SECURITY_MSP_NAME="SecurityOrgMSP"
SECURITY_ADMIN_MSP_PATH=$4
AVAILABILITY_PEER_ADDRESS=$5
AVAILABILITY_MSP_NAME="AvailabilityOrgMSP"
AVAILABILITY_ADMIN_MSP_PATH=$6

# Check if all arguments are provided
if [ -z "$CHANNEL_NAME" ] || [ -z "$ORDERER_CA" ] || [ -z "$SECURITY_PEER_ADDRESS" ] || [ -z "$SECURITY_ADMIN_MSP_PATH" ] || [ -z "$AVAILABILITY_PEER_ADDRESS" ] || [ -z "$AVAILABILITY_ADMIN_MSP_PATH" ]; then
    echo "Usage: ./joinChannel.sh <channel_name> <orderer_ca_path> <security_peer_address> <security_admin_msp_path> <availability_peer_address> <availability_admin_msp_path>"
    exit 1
fi

### **🔄 Fetch Latest Channel Block**
echo "🔄 Fetching latest channel block for $CHANNEL_NAME..."
peer channel fetch 0 ../channel-artifacts/${CHANNEL_NAME}.block -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c "$CHANNEL_NAME" --tls --cafile "$ORDERER_CA"

### **✅ Joining SecurityOrg Peer**
echo "📢 SecurityOrg peer ($SECURITY_PEER_ADDRESS) joining channel $CHANNEL_NAME..."
export CORE_PEER_MSPCONFIGPATH=$SECURITY_ADMIN_MSP_PATH
export CORE_PEER_ADDRESS=$SECURITY_PEER_ADDRESS
export CORE_PEER_LOCALMSPID=$SECURITY_MSP_NAME
export CORE_PEER_TLS_ROOTCERT_FILE=$ORDERER_CA

peer channel join -b ../channel-artifacts/${CHANNEL_NAME}.block
if [ $? -ne 0 ]; then
    echo "❌ Failed to join SecurityOrg peer to channel $CHANNEL_NAME!"
    exit 1
fi
echo "✅ Successfully joined SecurityOrg peer to channel $CHANNEL_NAME!"

### **✅ Joining AvailabilityOrg Peer**
echo "📢 AvailabilityOrg peer ($AVAILABILITY_PEER_ADDRESS) joining channel $CHANNEL_NAME..."
export CORE_PEER_MSPCONFIGPATH=$AVAILABILITY_ADMIN_MSP_PATH
export CORE_PEER_ADDRESS=$AVAILABILITY_PEER_ADDRESS
export CORE_PEER_LOCALMSPID=$AVAILABILITY_MSP_NAME
export CORE_PEER_TLS_ROOTCERT_FILE=$ORDERER_CA

peer channel join -b ../channel-artifacts/${CHANNEL_NAME}.block
if [ $? -ne 0 ]; then
    echo "❌ Failed to join AvailabilityOrg peer to channel $CHANNEL_NAME!"
    exit 1
fi
echo "✅ Successfully joined AvailabilityOrg peer to channel $CHANNEL_NAME!"
