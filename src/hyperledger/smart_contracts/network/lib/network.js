/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Network extends Contract {

    async InitLedger(ctx) {
        const networkRecords = [
            {
                RID: '101',
                Latency: 10,
                PacketLoss: 0.5,
                Bandwidth: 50,
            },
            {
                RID: '102',
                Latency: 15,
                PacketLoss: 0.3,
                Bandwidth: 60,
            },
            {
                RID: '103',
                Latency: 8,
                PacketLoss: 0.1,
                Bandwidth: 75,
            },
            {
                RID: '104',
                Latency: 20,
                PacketLoss: 0.8,
                Bandwidth: 40,
            },
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

    // Read a network performance record
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

    // Check if a record exists
    async RecordExists(ctx, rid) {
        const recordJSON = await ctx.stub.getState(rid);
        return recordJSON && recordJSON.length > 0;
    }

    // Retrieve all network records
    async GetAllNetworkRecords(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();

        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            try {
                const record = JSON.parse(strValue);
                allResults.push(record);
            } catch (err) {
                console.error(err);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = Network;
