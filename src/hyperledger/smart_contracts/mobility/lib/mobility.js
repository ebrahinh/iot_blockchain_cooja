'use strict';

// Deterministic JSON.stringify()
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Mobility extends Contract {
    
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

    async CreateMobility(ctx, rid, location, geoFence, attempts = 0, securityIncidents = 0) {
        if (!rid || !location || !geoFence) {
            throw new Error('RID, Location, and GeoFence must be provided.');
        }
        if (isNaN(attempts) || attempts < 0) {
            throw new Error('Attempts must be a non-negative number.');
        }
        if (isNaN(securityIncidents) || securityIncidents < 0) {
            throw new Error('SecurityIncidents must be a non-negative number.');
        }

        const exists = await this.MobilityExists(ctx, rid);
        if (exists) {
            throw new Error(`Mobility record ${rid} already exists.`);
        }

        const asset = { 
            RID: rid, 
            Location: location, 
            GeoFence: geoFence, 
            Attempts: parseInt(attempts), 
            SecurityIncidents: parseInt(securityIncidents), 
            docType: 'mobility' 
        };

        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async ReadMobility(ctx, rid) {
        const assetJSON = await ctx.stub.getState(rid);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`Mobility record ${rid} does not exist.`);
        }
        return assetJSON.toString();
    }

    async IncrementAttempts(ctx, rid) {
        const assetJSON = await this.ReadMobility(ctx, rid);
        const asset = JSON.parse(assetJSON);

        asset.Attempts += 1;
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async IncrementSecurityIncidents(ctx, rid) {
        const assetJSON = await this.ReadMobility(ctx, rid);
        const asset = JSON.parse(assetJSON);

        asset.SecurityIncidents += 1;
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async UpdateMobility(ctx, rid, location, geoFence, attempts, securityIncidents) {
        const exists = await this.MobilityExists(ctx, rid);
        if (!exists) {
            throw new Error(`Mobility record ${rid} does not exist.`);
        }

        const updatedAsset = { 
            RID: rid, 
            Location: location, 
            GeoFence: geoFence, 
            Attempts: parseInt(attempts), 
            SecurityIncidents: parseInt(securityIncidents), 
            docType: 'mobility' 
        };

        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
        return JSON.stringify(updatedAsset);
    }

    async DeleteMobility(ctx, rid) {
        const exists = await this.MobilityExists(ctx, rid);
        if (!exists) {
            throw new Error(`Mobility record ${rid} does not exist.`);
        }
        await ctx.stub.deleteState(rid);
    }

    async MobilityExists(ctx, rid) {
        const assetJSON = await ctx.stub.getState(rid);
        return assetJSON && assetJSON.length > 0;
    }

    async GetAllMobility(ctx) {
        const allResults = [];
        const startKey = 'mobility~';
        const endKey = 'mobility~' + String.fromCharCode(1111111);

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
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

module.exports = Mobility;
