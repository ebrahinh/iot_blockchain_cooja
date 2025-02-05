'use strict';

// Deterministic JSON.stringify() for consistent state storage
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Mobility extends Contract {
    /**
     * Initialize default mobility data
     */
    async InitLedger(ctx) {
        const assets = [
            {
                RID: '301',
                Location: 'Zone A',
                GeoFence: 'Restricted',
                Attempts: 0,
                SecurityIncidents: 0,
            },
            {
                RID: '302',
                Location: 'Zone B',
                GeoFence: 'Allowed',
                Attempts: 0,
                SecurityIncidents: 0,
            },
        ];

        for (const asset of assets) {
            asset.docType = 'mobility';
            await ctx.stub.putState(asset.RID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    /**
     * Create a new mobility record
     */
    async CreateMobility(ctx, rid, location, geoFence, attempts = 0, securityIncidents = 0) {
        if (!rid || !location || !geoFence) {
            throw new Error('RID, Location, and GeoFence must be provided.');
        }

        if (await this.MobilityExists(ctx, rid)) {
            throw new Error(`Mobility record with RID ${rid} already exists.`);
        }

        const record = {
            RID: rid,
            Location: location,
            GeoFence: geoFence,
            Attempts: parseInt(attempts),
            SecurityIncidents: parseInt(securityIncidents),
            docType: 'mobility',
        };

        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(record))));
        return JSON.stringify(record);
    }

    /**
     * Read an existing mobility record
     */
    async ReadMobility(ctx, rid) {
        const recordBytes = await ctx.stub.getState(rid);
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Mobility record with RID ${rid} does not exist.`);
        }
        return recordBytes.toString();
    }

    /**
     * Update attributes of an existing mobility record
     */
    async UpdateMobility(ctx, rid, location, geoFence, attempts, securityIncidents) {
        if (!(await this.MobilityExists(ctx, rid))) {
            throw new Error(`Mobility record with RID ${rid} does not exist.`);
        }

        const updatedRecord = {
            RID: rid,
            Location: location,
            GeoFence: geoFence,
            Attempts: parseInt(attempts),
            SecurityIncidents: parseInt(securityIncidents),
            docType: 'mobility',
        };

        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(updatedRecord))));
        return JSON.stringify(updatedRecord);
    }

    /**
     * Increment attempts for a location breach
     */
    async IncrementAttempts(ctx, rid) {
        const currentRecord = await this.ReadMobility(ctx, rid);
        const parsedRecord = JSON.parse(currentRecord);

        parsedRecord.Attempts += 1;
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(parsedRecord))));
        return JSON.stringify(parsedRecord);
    }

    /**
     * Increment security incidents for a location
     */
    async IncrementSecurityIncidents(ctx, rid) {
        const currentRecord = await this.ReadMobility(ctx, rid);
        const parsedRecord = JSON.parse(currentRecord);

        parsedRecord.SecurityIncidents += 1;
        await ctx.stub.putState(rid, Buffer.from(stringify(sorted(parsedRecord))));
        return JSON.stringify(parsedRecord);
    }

    /**
     * Retrieve all mobility records
     */
    async GetAllMobility(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const result = [];
        for await (const record of iterator) {
            const strValue = Buffer.from(record.value).toString('utf8');
            try {
                const parsedRecord = JSON.parse(strValue);
                result.push(parsedRecord);
            } catch (e) {
                console.error('Error parsing state:', e);
            }
        }
        return JSON.stringify(result);
    }

    /**
     * Mobility existence check utility
     */
    async MobilityExists(ctx, rid) {
        const recordBytes = await ctx.stub.getState(rid);
        return recordBytes && recordBytes.length > 0;
    }
}

module.exports = Mobility;