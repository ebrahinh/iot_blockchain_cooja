#!/bin/bash 

source scripts/utils.sh

CHANNEL_NAME=${1:-"mychannel"}
CC_NAME=${2}
CC_SRC_PATH=${3}
CC_SRC_LANGUAGE=${4}
CC_VERSION=${5:-"1.0"}
CC_SEQUENCE=${6:-"1"}
CC_INIT_FCN=${7:-"NA"}
CC_END_POLICY=${8:-"NA"}
CC_COLL_CONFIG=${9:-"NA"}
DELAY=${10:-"3"}
MAX_RETRY=${11:-"5"}
VERBOSE=${12:-"false"}

# Input validation
if [[ -z "$CC_NAME" || -z "$CC_SRC_PATH" || -z "$CC_SRC_LANGUAGE" ]]; then
  echo "Error: Chaincode name, source path, and language are mandatory arguments."
  echo "Usage: ./deployCC.sh <CHANNEL_NAME> <CC_NAME> <CC_SRC_PATH> <CC_SRC_LANGUAGE> [CC_VERSION] [CC_SEQUENCE] [CC_INIT_FCN] [CC_END_POLICY] [CC_COLL_CONFIG] [DELAY] [MAX_RETRY] [VERBOSE]"
  exit 1
fi

println "executing with the following"
println "- CHANNEL_NAME: ${C_GREEN}${CHANNEL_NAME}${C_RESET}"
println "- CC_NAME: ${C_GREEN}${CC_NAME}${C_RESET}"
println "- CC_SRC_PATH: ${C_GREEN}${CC_SRC_PATH}${C_RESET}"
println "- CC_SRC_LANGUAGE: ${C_GREEN}${CC_SRC_LANGUAGE}${C_RESET}"
println "- CC_VERSION: ${C_GREEN}${CC_VERSION}${C_RESET}"
println "- CC_SEQUENCE: ${C_GREEN}${CC_SEQUENCE}${C_RESET}"
println "- CC_END_POLICY: ${C_GREEN}${CC_END_POLICY}${C_RESET}"
println "- CC_COLL_CONFIG: ${C_GREEN}${CC_COLL_CONFIG}${C_RESET}"
println "- CC_INIT_FCN: ${C_GREEN}${CC_INIT_FCN}${C_RESET}"
println "- DELAY: ${C_GREEN}${DELAY}${C_RESET}"
println "- MAX_RETRY: ${C_GREEN}${MAX_RETRY}${C_RESET}"
println "- VERBOSE: ${C_GREEN}${VERBOSE}${C_RESET}"

INIT_REQUIRED=""
# Check if the init function should be called
if [ "$CC_INIT_FCN" != "NA" ]; then
  INIT_REQUIRED="--init-required"
fi

CC_END_POLICY=""
if [ "$CC_END_POLICY" != "NA" ]; then
  CC_END_POLICY="--signature-policy $CC_END_POLICY"
fi

CC_COLL_CONFIG=""
if [ "$CC_COLL_CONFIG" != "NA" ]; then
  CC_COLL_CONFIG="--collections-config $CC_COLL_CONFIG"
fi

FABRIC_CFG_PATH=$PWD/../config.env/

# Import utils
. scripts/envVar.sh
. scripts/ccutils.sh

function checkPrereqs() {
  if ! command -v jq &> /dev/null; then
    errorln "jq command not found..."
    errorln
    errorln "Follow the instructions in the Fabric docs to install the prerequisites"
    errorln "https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html"
    exit 1
  fi
}

# Check for prerequisites
checkPrereqs

## Package the chaincode
if ! ./scripts/packageCC.sh "$CC_NAME" "$CC_SRC_PATH" "$CC_SRC_LANGUAGE" "$CC_VERSION"; then
  errorln "Failed to package chaincode"
  exit 1
fi

PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid "${CC_NAME}.tar.gz")
if [ $? -ne 0 ]; then
  errorln "Failed to calculate package ID for chaincode"
  exit 1
fi

## Install chaincode on all organizations' peers
for ORG in 1 2 securityorg 4 5; do
  infoln "Installing chaincode on peer0.org${ORG}..."
  if ! installChaincode "$ORG"; then
    errorln "Failed to install chaincode on peer0.org${ORG}"
    exit 1
  fi
done

resolveSequence

## Query whether the chaincode is installed
if ! queryInstalled 1; then
  errorln "Failed to query installed chaincode on org1"
  exit 1
fi

## Approve the definition for all organizations
for ORG in 1 2 securityorg 4 5; do
  infoln "Approving chaincode definition for org${ORG}..."
  if ! approveForMyOrg "$ORG"; then
    errorln "Failed to approve chaincode definition for org${ORG}"
    exit 1
  fi
done

## Check whether the chaincode definition is ready to be committed
if ! checkCommitReadiness 1 "\"Org1MSP\": true" "\"Org2MSP\": true" "\"SecurityOrgMSP\": true" "\"Org4MSP\": true" "\"Org5MSP\": true"; then
  errorln "Chaincode definition is not ready to be committed"
  exit 1
fi

## Now that all orgs have approved, commit the definition
if ! commitChaincodeDefinition 1 2 securityorg 4 5; then
  errorln "Failed to commit chaincode definition"
  exit 1
fi

## Query on all orgs to see that the definition committed successfully
for ORG in 1 2 securityorg 4 5; do
  infoln "Querying chaincode commitment on peer0.org${ORG}..."
  if ! queryCommitted "$ORG"; then
    errorln "Failed to query committed chaincode definition on org${ORG}"
    exit 1
  fi
done

## Exit script
exit 0