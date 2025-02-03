#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This script updates the channel configuration to add SecurityOrg and AvailabilityOrg.

# Ensure all required environment variables are set
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
    echo "Usage: ./updateChannelConfig.sh <channel_name> <orderer_ca_path> <security_peer_address> <security_admin_msp_path> <availability_peer_address> <availability_admin_msp_path>"
    exit 1
fi

echo "🔄 Fetching latest channel configuration block..."
peer channel fetch config ../channel-artifacts/config_block.pb -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c "$CHANNEL_NAME" --tls --cafile "$ORDERER_CA"

echo "📜 Decoding configuration block..."
configtxlator proto_decode --input ../channel-artifacts/config_block.pb --type common.Block --output ../channel-artifacts/config_block.json

echo "📝 Extracting configuration..."
jq ".data.data[0].payload.data.config" ../channel-artifacts/config_block.json > ../channel-artifacts/config.json

### **🔧 Adding SecurityOrg to Configuration**
echo "🔧 Adding SecurityOrg to channel configuration..."
jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups":{"SecurityOrgMSP":.[1]}}}}}' ../channel-artifacts/config.json ../organizations/peerOrganizations/security.example.com/security.json > ../channel-artifacts/modified_config_security.json

### **🔧 Adding AvailabilityOrg to Configuration**
echo "🔧 Adding AvailabilityOrg to channel configuration..."
jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups":{"AvailabilityOrgMSP":.[1]}}}}}' ../channel-artifacts/modified_config_security.json ../organizations/peerOrganizations/availability.example.com/availability.json > ../channel-artifacts/modified_config_final.json

echo "🔄 Encoding configurations..."
configtxlator proto_encode --input ../channel-artifacts/config.json --type common.Config --output ../channel-artifacts/config.pb
configtxlator proto_encode --input ../channel-artifacts/modified_config_final.json --type common.Config --output ../channel-artifacts/modified_config.pb

echo "📏 Computing config update..."
configtxlator compute_update --channel_id "$CHANNEL_NAME" --original ../channel-artifacts/config.pb --updated ../channel-artifacts/modified_config.pb --output ../channel-artifacts/security_availability_update.pb

echo "📜 Decoding config update..."
configtxlator proto_decode --input ../channel-artifacts/security_availability_update.pb --type common.ConfigUpdate --output ../channel-artifacts/security_availability_update.json

echo "📦 Wrapping config update in an envelope..."
echo '{"payload":{"header":{"channel_header":{"channel_id":"'"$CHANNEL_NAME"'", "type":2}},"data":{"config_update":'$(cat ../channel-artifacts/security_availability_update.json)'}}}' | jq . > ../channel-artifacts/security_availability_update_in_envelope.json

echo "🔄 Encoding final config update envelope..."
configtxlator proto_encode --input ../channel-artifacts/security_availability_update_in_envelope.json --type common.Envelope --output ../channel-artifacts/security_availability_update_in_envelope.pb

### **✅ Signing and Submitting the Update for SecurityOrg**
echo "✅ Signing the update transaction for SecurityOrg..."
export CORE_PEER_MSPCONFIGPATH=$SECURITY_ADMIN_MSP_PATH
export CORE_PEER_ADDRESS=$SECURITY_PEER_ADDRESS
peer channel signconfigtx -f ../channel-artifacts/security_availability_update_in_envelope.pb

### **✅ Signing and Submitting the Update for AvailabilityOrg**
echo "✅ Signing the update transaction for AvailabilityOrg..."
export CORE_PEER_MSPCONFIGPATH=$AVAILABILITY_ADMIN_MSP_PATH
export CORE_PEER_ADDRESS=$AVAILABILITY_PEER_ADDRESS
peer channel signconfigtx -f ../channel-artifacts/security_availability_update_in_envelope.pb

### **🚀 Submitting the Update Transaction**
echo "🚀 Submitting the update transaction..."
peer channel update -f ../channel-artifacts/security_availability_update_in_envelope.pb -c "$CHANNEL_NAME" -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA"

echo "✅ Successfully updated channel configuration to include SecurityOrg and AvailabilityOrg!"
