#!/bin/bash

# Function to generate a single-line PEM file
function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

# Function to generate JSON CCP
function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/IntegrityOrg/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.json
}

# Function to generate YAML CCP
function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/IntegrityOrg/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

# Set IntegrityOrg Variables
ORG="IntegrityOrg"
P0PORT=12051
CAPORT=12054
PEERPEM=../organizations/peerOrganizations/integrity.example.com/tlsca/tlsca.integrity.example.com-cert.pem
CAPEM=../organizations/peerOrganizations/integrity.example.com/ca/ca.integrity.example.com-cert.pem

# Generate JSON and YAML Connection Profiles
echo "🔹 Generating JSON CCP for IntegrityOrg..."
echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ../organizations/peerOrganizations/integrity.example.com/connection-integrity.json

echo "🔹 Generating YAML CCP for IntegrityOrg..."
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ../organizations/peerOrganizations/integrity.example.com/connection-integrity.yaml

echo "✅ Successfully generated IntegrityOrg connection profile."
