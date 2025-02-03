'use strict';

const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Availability extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                RID: '101',
                Attempts: 0,
                SecurityIncidents: 0,
            },
            {
                RID: '102',
                Attempts: 0,
                SecurityIncidents: 0,
            },
            {
                RID: '103',
                Attempts: 0,
                SecurityIncidents: 0,
            },
            {
                RID: '104',
                Attempts: 0,
                SecurityIncidents: 0,
            },
            {
                RID: '105',
                Attempts: 0,
                SecurityIncidents: 0,
            },
            {
                RID: '106',
                Attempts: 0,
                SecurityIncidents: 0,
            },
        ];

        for (const asset of assets) {
            asset.docType = 'availability-sensor';
            await ctx.stub.putState(asset.RID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    async CreateAvailability(ctx, rid, attempts = 0, securityIncidents = 0) {
        if (!rid || typeof rid !== 'string' || rid.length === 0) {
            throw new Error('RID must be a non-empty string.');
        }
        if (isNaN(attempts) || attempts < 0) {
            throw new Error('Attempts must be a non-negative number.');
        }
        if (isNaN(securityIncidents) || securityIncidents < 0) {
            throw new Error('SecurityIncidents must be a non-negative number.');
        }

        const exists = await this.AssetExists(ctx, rid);
        if (exists) {
            throw new Error(`Availability record ${rid} already exists.`);
        }

        const asset = { RID: rid, Attempts: parseInt(attempts), SecurityIncidents: parseInt(securityIncidents), docType: 'availability-sensor' };
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async ReadAvailability(ctx, rid) {
        const assetJSON = await ctx.stub.getState(rid);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset with RID ${rid} does not exist.`);
        }
        return assetJSON.toString();
    }

    async IncrementAttempts(ctx, rid) {
        const assetJSON = await this.ReadAvailability(ctx, rid);
        const asset = JSON.parse(assetJSON);

        asset.Attempts += 1;
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async IncrementSecurityIncidents(ctx, rid) {
        const assetJSON = await this.ReadAvailability(ctx, rid);
        const asset = JSON.parse(assetJSON);

        asset.SecurityIncidents += 1;
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async UpdateAvailability(ctx, rid, attempts, securityIncidents) {
        const exists = await this.AssetExists(ctx, rid);
        if (!exists) {
            throw new Error(`The asset with RID ${rid} does not exist.`);
        }

        const updatedAsset = { RID: rid, Attempts: parseInt(attempts), SecurityIncidents: parseInt(securityIncidents), docType: 'availability-sensor' };
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
        return JSON.stringify(updatedAsset);
    }

    async DeleteAvailability(ctx, rid) {
        const exists = await this.AssetExists(ctx, rid);
        if (!exists) {
            throw new Error(`The asset with RID ${rid} does not exist.`);
        }
        await ctx.stub.deleteState(rid);
    }

    async AssetExists(ctx, rid) {
        const assetJSON = await ctx.stub.getState(rid);
        return assetJSON && assetJSON.length > 0;
    }

    async GetAllAvailability(ctx) {
        const allResults = [];
        const startKey = 'availability-sensor~';
        const endKey = 'availability-sensor~' + String.fromCharCode(1111111);

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

module.exports = Availability;
