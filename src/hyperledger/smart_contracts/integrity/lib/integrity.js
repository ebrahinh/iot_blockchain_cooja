'use strict';

const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Integrity extends Contract {
    async InitLedger(ctx) {  
        const assets = [
            { RID: '201', Attempts: 0, SecurityIncidents: 0 },
            { RID: '202', Attempts: 0, SecurityIncidents: 0 },
            { RID: '203', Attempts: 0, SecurityIncidents: 0 },
            { RID: '204', Attempts: 0, SecurityIncidents: 0 },
            { RID: '205', Attempts: 0, SecurityIncidents: 0 },
            { RID: '206', Attempts: 0, SecurityIncidents: 0 },
        ];

        for (const asset of assets) {
            asset.docType = 'integrity-sensor';
            await ctx.stub.putState(asset.RID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    async CreateIntegrityRecord(ctx, rid, attempts = 0, securityIncidents = 0) {
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
            throw new Error(`Integrity record ${rid} already exists.`);
        }

        const asset = { 
            RID: rid, 
            Attempts: parseInt(attempts), 
            SecurityIncidents: parseInt(securityIncidents), 
            docType: 'integrity-sensor' 
        };

        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async ReadIntegrityRecord(ctx, rid) {
        const assetJSON = await ctx.stub.getState(rid);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`Integrity record ${rid} does not exist.`);
        }
        return assetJSON.toString();
    }

    async IncrementAttempts(ctx, rid) {
        const assetJSON = await this.ReadIntegrityRecord(ctx, rid);
        const asset = JSON.parse(assetJSON);

        asset.Attempts += 1;
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async IncrementSecurityIncidents(ctx, rid) {
        const assetJSON = await this.ReadIntegrityRecord(ctx, rid);
        const asset = JSON.parse(assetJSON);

        asset.SecurityIncidents += 1;
        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async UpdateIntegrityRecord(ctx, rid, attempts, securityIncidents) {
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
        if (!exists) {
            throw new Error(`Integrity record ${rid} does not exist.`);
        }

        const updatedAsset = { 
            RID: rid, 
            Attempts: parseInt(attempts), 
            SecurityIncidents: parseInt(securityIncidents), 
            docType: 'integrity-sensor' 
        };

        await ctx.stub.putState(rid, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
        return JSON.stringify(updatedAsset);
    }

    async DeleteIntegrityRecord(ctx, rid) {
        const exists = await this.AssetExists(ctx, rid);
        if (!exists) {
            throw new Error(`Integrity record ${rid} does not exist.`);
        }
        await ctx.stub.deleteState(rid);
    }

    async AssetExists(ctx, rid) {
        const assetJSON = await ctx.stub.getState(rid);
        return assetJSON && assetJSON.length > 0;
    }

    async GetAllIntegrityRecords(ctx) {
        return this._getAllRecords(ctx, 'integrity-sensor');
    }

    async _getAllRecords(ctx, sensorType) {
        const allResults = [];
        const startKey = sensorType + '~';
        const endKey = sensorType + '~' + String.fromCharCode(1111111);

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        let result = await iterator.next();

        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            try {
                allResults.push(JSON.parse(strValue));
            } catch (err) {
                console.error(err);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = Integrity;
