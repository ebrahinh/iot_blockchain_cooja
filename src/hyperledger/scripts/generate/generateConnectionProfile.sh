#!/bin/bash

# Function to generate a single-line PEM file
function one_line_pem {
    echo "$(awk 'NF {printf "%s\\n",$0;}' $1)"
}

# Function to generate JSON CCP
function json_ccp {
    local PP=$(one_line_pem "$4")
    local CP=$(one_line_pem "$5")
    sed -e "s/\${ORG}/SensorsOrg/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.json
}

# Function to generate YAML CCP
function yaml_ccp {
    local PP=$(one_line_pem "$4")
    local CP=$(one_line_pem "$5")
    sed -e "s/\${ORG}/SensorsOrg/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

# Set SensorsOrg Variables
ORG="SensorsOrg"
P0PORT=7051
CAPORT=7054
PEERPEM=../organizations/peerOrganizations/sensors.example.com/tlsca/tlsca.sensors.example.com-cert.pem
CAPEM=../organizations/peerOrganizations/sensors.example.com/ca/ca.sensors.example.com-cert.pem

# Validate input files
if [[ ! -f "$PEERPEM" ]]; then
    echo "❌ Error: File '$PEERPEM' does not exist."
    exit 1
fi
if [[ ! -f "$CAPEM" ]]; then
    echo "❌ Error: File '$CAPEM' does not exist."
    exit 1
fi

# Generate JSON and YAML Connection Profiles
echo "🔹 Generating JSON CCP for SensorsOrg..."
json_ccp "$ORG" "$P0PORT" "$CAPORT" "$PEERPEM" "$CAPEM" > ../organizations/peerOrganizations/sensors.example.com/connection-sensors.json

echo "🔹 Generating YAML CCP for SensorsOrg..."
yaml_ccp "$ORG" "$P0PORT" "$CAPORT" "$PEERPEM" "$CAPEM" > ../organizations/peerOrganizations/sensors.example.com/connection-sensors.yaml

echo "✅ Successfully generated SensorsOrg connection profiles."