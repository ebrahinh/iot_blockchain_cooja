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

class Security extends Contract {
    async InitLedger(ctx) {
        const assets = [
            {
                ID: 'security1',
                Xco: 11,
                Yco: 5,
                Speed: 23,
            },
            {
                ID: 'security2',
                Xco: 7,
                Yco: 5,
                Speed: 1,
            },
            {
                ID: 'security3',
                Xco: 8,
                Yco: 10,
                Speed: 32,
            },
            {
                ID: 'security4',
                Xco: 87,
                Yco: 10,
                Speed: 65,
            },
            {
                ID: 'security5',
                Xco: 12,
                Yco: 15,
                Speed: 69,
            },
        ];

        for (const asset of assets) {
            asset.docType = 'security';
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateSecurityRecord(ctx, id, x, y, sp) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The security record ${id} already exists.`);
        }

        const asset = {
            ID: id,
            Xco: x,
            Yco: y,
            Speed: sp,
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the security record stored in the world state with given id.
    async ReadSecurityRecord(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The security record ${id} does not exist.`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing security record in the world state with provided parameters.
    async UpdateSecurityRecord(ctx, id, x, y, sp) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The security record ${id} does not exist.`);
        }

        const updatedAsset = {
            ID: id,
            Xco: x,
            Yco: y,
            Speed: sp,
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
        return JSON.stringify(updatedAsset);
    }

    // DeleteAsset deletes an existing security record from the world state.
    async DeleteSecurityRecord(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The security record ${id} does not exist.`);
        }
        await ctx.stub.deleteState(id);
    }

    // AssetExists returns true when security record with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // GetAllAssets returns all security records stored in the world state.
    async GetAllSecurityRecords(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.error(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }

        return JSON.stringify(allResults);
    }
}

module.exports = Security;
