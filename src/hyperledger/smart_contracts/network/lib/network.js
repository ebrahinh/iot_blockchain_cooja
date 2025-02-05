/*
 * Copyright IBM Corp.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Network extends Contract {
    // Initialize the network ledger with default records
    async InitLedger(ctx) {
        const networkRecords = [
            { RID: '101', Latency: 10, PacketLoss: 0.5, Bandwidth: 50 },
            { RID: '102', Latency: 15, PacketLoss: 0.3, Bandwidth: 60 },
            { RID: '103', Latency: 8, PacketLoss: 0.1, Bandwidth: 75 },
            { RID: '104', Latency: 20, PacketLoss: 0.8, Bandwidth: 40 },
        ];

        for (const record of networkRecords) {
            record.docType = 'network-sensor';
            await ctx.stub.putState(record.RID, Buffer.from(stringify(sortKeysRecursive(record))));
        }
    }

    // Create a new network performance record
    async CreateNetworkRecord(ctx, rid, latency, packetLoss, bandwidth) {
        const exists = await this.RecordExists(ctx, rid);
        if (exists) {
            throw new Error(`Network record ${rid} already exists.`);
        }
        const record = {
            RID: rid,
            Latency: parseFloat(latency),
            PacketLoss: parseFloat(packetLoss),
            Bandwidth: parseInt(bandwidth),
            docType: 'network-sensor',
        };
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(record))));
        return JSON.stringify(record);
    }

    // Retrieve a network record
    async ReadNetworkRecord(ctx, rid) {
        const recordJSON = await ctx.stub.getState(rid);
        if (!recordJSON || recordJSON.length === 0) {
            throw new Error(`Network record ${rid} does not exist.`);
        }
        return recordJSON.toString();
    }

    // Update an existing network record
    async UpdateNetworkRecord(ctx, rid, latency, packetLoss, bandwidth) {
        const exists = await this.RecordExists(ctx, rid);
        if (!exists) {
            throw new Error(`Network record ${rid} does not exist.`);
        }
        const updatedRecord = {
            RID: rid,
            Latency: parseFloat(latency),
            PacketLoss: parseFloat(packetLoss),
            Bandwidth: parseInt(bandwidth),
            docType: 'network-sensor',
        };
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(updatedRecord))));
        return JSON.stringify(updatedRecord);
    }

    // Delete a network record
    async DeleteNetworkRecord(ctx, rid) {
        const exists = await this.RecordExists(ctx, rid);
        if (!exists) {
            throw new Error(`Network record ${rid} does not exist.`);
        }
        await ctx.stub.deleteState(rid);
    }

    // Check if a network record exists
    async RecordExists(ctx, rid) {
        const recordJSON = await ctx.stub.getState(rid);
        return recordJSON && recordJSON.length > 0;
    }

    // Retrieve all network performance records
    async GetAllNetworkRecords(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const allResults = [];
        for await (const res of iterator) {
            const strValue = Buffer.from(res.value).toString('utf8');
            try {
                const record = JSON.parse(strValue);
                allResults.push(record);
            } catch (err) {
                console.error(err);
            }
        }
        return JSON.stringify(allResults);
    }
}

module.exports = Network;