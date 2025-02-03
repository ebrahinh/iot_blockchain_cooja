#!/bin/bash

# Function to format PEM files into a single line
function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

# Function to generate JSON Connection Profile
function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.json
}

# Function to generate YAML Connection Profile
function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

# Define NetworkMobilityOrg (previously Org5)
ORG=NetworkMobilityOrg
P0PORT=13051
CAPORT=13054
PEERPEM=../organizations/peerOrganizations/network-mobility.example.com/tlsca/tlsca.network-mobility.example.com-cert.pem
CAPEM=../organizations/peerOrganizations/network-mobility.example.com/ca/ca.network-mobility.example.com-cert.pem

# Generate JSON and YAML connection profiles for NetworkMobilityOrg
echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ../organizations/peerOrganizations/network-mobility.example.com/connection-network-mobility.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ../organizations/peerOrganizations/network-mobility.example.com/connection-network-mobility.yaml

infoln "✅ Successfully generated connection profiles for NetworkMobilityOrg"
