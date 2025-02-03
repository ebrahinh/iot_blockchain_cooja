#!/bin/bash

echo "🔄 Generating Connection Profiles for SecurityOrg and Availability Sensor..."

# Function to generate a single-line PEM file
function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

# Function to generate JSON CCP
function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        security-template.json
}

# Function to generate YAML CCP
function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        security-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

# Generate Connection Profiles for SecurityOrg
ORG="SecurityOrg"
P0PORT=12051
CAPORT=12054
PEERPEM=../organizations/peerOrganizations/security.example.com/tlsca/tlsca.security.example.com-cert.pem
CAPEM=../organizations/peerOrganizations/security.example.com/ca/ca.security.example.com-cert.pem

echo "🔹 Generating JSON CCP for SecurityOrg..."
echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ../organizations/peerOrganizations/security.example.com/connection-security.json

echo "🔹 Generating YAML CCP for SecurityOrg..."
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ../organizations/peerOrganizations/security.example.com/connection-security.yaml

# Generate Connection Profiles for Availability Sensor
ORG="AvailabilitySensor"
P0PORT=13051
CAPORT=13054
PEERPEM=../organizations/peerOrganizations/availability.example.com/tlsca/tlsca.availability.example.com-cert.pem
CAPEM=../organizations/peerOrganizations/availability.example.com/ca/ca.availability.example.com-cert.pem

echo "🔹 Generating JSON CCP for Availability Sensor..."
echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ../organizations/peerOrganizations/availability.example.com/connection-availability.json

echo "🔹 Generating YAML CCP for Availability Sensor..."
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ../organizations/peerOrganizations/availability.example.com/connection-availability.yaml

echo "✅ Successfully generated SecurityOrg and Availability Sensor connection profiles."
