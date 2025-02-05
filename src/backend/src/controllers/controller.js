const dotenv = require("dotenv");
const fetch = require("node-fetch");
const path = require("path");
const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");

// Load environment variables
dotenv.config({ path: "./config.env" });

// Constants
const API_KEYS = {
    comp1: process.env.API_KEY_COMP1,
    comp2: process.env.API_KEY_COMP2,
    comp3: process.env.API_KEY_COMP3,
    comp4: process.env.API_KEY_COMP4,
    comp5: process.env.API_KEY_COMP5,
    availability: process.env.API_KEY_AVAILABILITY,
    network: process.env.API_KEY_NETWORK,
};
const API_URI = process.env.API_URI || "http://localhost:3000/api/assets";
const WALLET_PATH = path.join(process.cwd(), "wallet");
const CCP_PATH = path.resolve(__dirname, "..", "fabric-config", "connection.json");

// Helper: Validate required fields in the request
const validateRequiredFields = (obj, requiredFields) => {
    const missingFields = requiredFields.filter(field => obj[field] == null);
    if (missingFields.length > 0) {
        return `Missing required fields: ${missingFields.join(", ")}`;
    }
    return null;
};

// Helper function to connect to the blockchain, submit transactions, and disconnect
const submitTransaction = async (contractName, methodName, args, identity = "admin") => {
    const ccp = JSON.parse(fs.readFileSync(CCP_PATH, "utf8"));
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);
    const gateway = new Gateway();

    await gateway.connect(ccp, {
        wallet,
        identity, // Identity as a parameter for flexibility
        discovery: { enabled: true, asLocalhost: true },
    });

    try {
        const network = await gateway.getNetwork("mychannel"); // Replace 'mychannel' with your channel name
        const contract = network.getContract(contractName);
        const result = await contract.submitTransaction(methodName, ...args);
        return result.toString();
    } finally {
        gateway.disconnect();
    }
};

// Reusable function for API interactions
const handleRequest = async (orgKey, req, res) => {
    if (!API_KEYS[orgKey]) {
        return res.status(400).json({ error: "Invalid organization key" });
    }

    try {
        const response = await fetch(API_URI, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": API_KEYS[orgKey],
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error(`Error handling request for ${orgKey}:`, err);
        res.status(500).json({
            error: "Internal Server Error",
            message: err.message,
            orgKey,
            timestamp: new Date().toISOString(),
        });
    }
};

// Exported Controllers for Component Interactions
exports.getComp1 = (req, res) => handleRequest("comp1", req, res);
exports.getComp2 = (req, res) => handleRequest("comp2", req, res);
exports.getComp3 = (req, res) => handleRequest("comp3", req, res);
exports.getComp4 = (req, res) => handleRequest("comp4", req, res);
exports.getComp5 = (req, res) => handleRequest("comp5", req, res);

// Reusable function to handle generic contract operations
const handleContractOperation = async (req, res, contractName, contractMethod, requiredFields, argsCallback) => {
    const validationError = validateRequiredFields(req.body, requiredFields);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const args = argsCallback(req.body);
        const result = await submitTransaction(contractName, contractMethod, args);
        res.status(200).json({ message: `${contractMethod} successful`, result: JSON.parse(result) });
    } catch (err) {
        console.error(`Error in ${contractMethod}:`, err);
        res.status(500).json({ error: `Failed to execute ${contractMethod}`, details: err.message });
    }
};

// Integrity Contract Logic
exports.handleIntegrityCreate = (req, res) =>
    handleContractOperation(req, res, "IntegrityContract", "CreateIntegrityRecord",
        ["RID", "status", "tamperIncidents", "integrityScore"],
        ({ RID, status, tamperIncidents, integrityScore }) => [RID, status, tamperIncidents.toString(), integrityScore.toString()]
    );

exports.handleIntegrityRead = async (req, res) => {
    const { RID } = req.params;
    if (!RID) return res.status(400).json({ error: "Missing RID parameter" });

    try {
        const result = await submitTransaction("IntegrityContract", "ReadIntegrityRecord", [RID]);
        res.status(200).json(JSON.parse(result));
    } catch (err) {
        console.error("Error reading integrity record:", err);
        res.status(500).json({ error: "Failed to read integrity record", details: err.message });
    }
};

exports.handleIntegrityUpdate = (req, res) =>
    handleContractOperation(req, res, "IntegrityContract", "UpdateIntegrity",
        ["RID", "status", "integrityScore"],
        ({ RID, status, integrityScore }) => [RID, status, integrityScore.toString()]
    );

exports.handleIntegrityIncrementTampering = async (req, res) => {
    const { RID } = req.params;
    if (!RID) return res.status(400).json({ error: "Missing RID parameter" });

    try {
        const result = await submitTransaction("IntegrityContract", "IncrementTamperIncidents", [RID]);
        res.status(200).json({ message: "Tamper incidents incremented", record: JSON.parse(result) });
    } catch (err) {
        console.error("Error incrementing tamper incidents:", err);
        res.status(500).json({ error: "Failed to increment tamper incidents", details: err.message });
    }
};

exports.handleIntegrityGetAll = async (req, res) => {
    try {
        const result = await submitTransaction("IntegrityContract", "GetAllIntegrityRecords", []);
        res.status(200).json(JSON.parse(result));
    } catch (err) {
        console.error("Error retrieving all integrity records:", err);
        res.status(500).json({ error: "Failed to retrieve integrity records", details: err.message });
    }
};

// Network Contract Logic
exports.handleNetworkCreate = (req, res) =>
    handleContractOperation(req, res, "NetworkContract", "CreateNetworkRecord",
        ["RID", "Latency", "PacketLoss", "Bandwidth"],
        ({ RID, Latency, PacketLoss, Bandwidth }) => [RID, Latency.toString(), PacketLoss.toString(), Bandwidth.toString()]
    );

exports.handleNetworkRead = async (req, res) => {
    const { RID } = req.params;
    if (!RID) return res.status(400).json({ error: "Missing RID parameter" });

    try {
        const result = await submitTransaction("NetworkContract", "ReadNetworkRecord", [RID]);
        res.status(200).json(JSON.parse(result));
    } catch (err) {
        console.error("Error reading network record:", err);
        res.status(500).json({ error: "Failed to read network record", details: err.message });
    }
};

exports.handleNetworkUpdate = (req, res) =>
    handleContractOperation(req, res, "NetworkContract", "UpdateNetworkRecord",
        ["RID", "Latency", "PacketLoss", "Bandwidth"],
        ({ RID, Latency, PacketLoss, Bandwidth }) => [RID, Latency.toString(), PacketLoss.toString(), Bandwidth.toString()]
    );

exports.handleNetworkDelete = async (req, res) => {
    const { RID } = req.params;
    if (!RID) return res.status(400).json({ error: "Missing RID parameter" });

    try {
        await submitTransaction("NetworkContract", "DeleteNetworkRecord", [RID]);
        res.status(200).json({ message: `Network record ${RID} deleted` });
    } catch (err) {
        console.error("Error deleting network record:", err);
        res.status(500).json({ error: "Failed to delete network record", details: err.message });
    }
};

exports.handleNetworkGetAll = async (req, res) => {
    try {
        const result = await submitTransaction("NetworkContract", "GetAllNetworkRecords", []);
        res.status(200).json(JSON.parse(result));
    } catch (err) {
        console.error("Error retrieving network records:", err);
        res.status(500).json({ error: "Failed to retrieve network records", details: err.message });
    }
};