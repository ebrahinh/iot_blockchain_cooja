#!/bin/bash

# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This script updates the channel configuration to add IntegrityOrg.

# Ensure all required environment variables are set
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../../config/
export CORE_PEER_TLS_ENABLED=true

# Command-line arguments
CHANNEL_NAME=$1
ORDERER_CA=$2
PEER_ADDRESS=$3
ADMIN_MSP_PATH=$4

# Check if all arguments are provided
if [ -z "$CHANNEL_NAME" ] || [ -z "$ORDERER_CA" ] || [ -z "$PEER_ADDRESS" ] || [ -z "$ADMIN_MSP_PATH" ]; then
    echo "Usage: ./updateChannelConfig.sh <channel_name> <orderer_ca_path> <peer_address> <admin_msp_path>"
    exit 1
fi

ORG_NAME="integrity"
MSP_NAME="IntegrityOrgMSP"

echo "🔄 Fetching latest channel configuration block..."
peer channel fetch config ../channel-artifacts/config_block.pb -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c "$CHANNEL_NAME" --tls --cafile "$ORDERER_CA"

echo "📜 Decoding configuration block..."
configtxlator proto_decode --input ../channel-artifacts/config_block.pb --type common.Block --output ../channel-artifacts/config_block.json

echo "📝 Extracting configuration..."
jq ".data.data[0].payload.data.config" ../channel-artifacts/config_block.json > ../channel-artifacts/config.json

echo "🔧 Adding IntegrityOrg to configuration..."
jq -s ".[0] * {\"channel_group\":{\"groups\":{\"Application\":{\"groups\":{\"$MSP_NAME\":.[1]}}}}}" ../channel-artifacts/config.json ../organizations/peerOrganizations/integrity.example.com/integrity.json > ../channel-artifacts/modified_config.json

echo "🔄 Encoding configurations..."
configtxlator proto_encode --input ../channel-artifacts/config.json --type common.Config --output ../channel-artifacts/config.pb
configtxlator proto_encode --input ../channel-artifacts/modified_config.json --type common.Config --output ../channel-artifacts/modified_config.pb

echo "📏 Computing config update..."
configtxlator compute_update --channel_id "$CHANNEL_NAME" --original ../channel-artifacts/config.pb --updated ../channel-artifacts/modified_config.pb --output ../channel-artifacts/${ORG_NAME}_update.pb

echo "📜 Decoding config update..."
configtxlator proto_decode --input ../channel-artifacts/${ORG_NAME}_update.pb --type common.ConfigUpdate --output ../channel-artifacts/${ORG_NAME}_update.json

echo "📦 Wrapping config update in an envelope..."
echo '{"payload":{"header":{"channel_header":{"channel_id":"'"$CHANNEL_NAME"'", "type":2}},"data":{"config_update":'$(cat ../channel-artifacts/${ORG_NAME}_update.json)'}}}' | jq . > ../channel-artifacts/${ORG_NAME}_update_in_envelope.json

echo "🔄 Encoding final config update envelope..."
configtxlator proto_encode --input ../channel-artifacts/${ORG_NAME}_update_in_envelope.json --type common.Envelope --output ../channel-artifacts/${ORG_NAME}_update_in_envelope.pb

echo "✅ Signing the update transaction..."
export CORE_PEER_MSPCONFIGPATH=$ADMIN_MSP_PATH
export CORE_PEER_ADDRESS=$PEER_ADDRESS
peer channel signconfigtx -f ../channel-artifacts/${ORG_NAME}_update_in_envelope.pb

echo "🚀 Submitting the update transaction..."
peer channel update -f ../channel-artifacts/${ORG_NAME}_update_in_envelope.pb -c "$CHANNEL_NAME" -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA"

echo "✅ Successfully updated channel configuration to include IntegrityOrg!"

# 🏆 Log success
echo "🎉 IntegrityOrg successfully added to channel $CHANNEL_NAME!"
