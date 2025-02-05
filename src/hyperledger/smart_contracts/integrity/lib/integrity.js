'use strict';

const { Contract } = require('fabric-contract-api');

class Integrity extends Contract {
    /**
     * Initialize the ledger with default sensor integrity records (for testing/demo purposes).
     */
    async InitLedger(ctx) {
        console.info('Initializing the Integrity Ledger with default data');

        const defaultIntegrityData = [
            { RID: '201', Status: 'Operational', TamperIncidents: 0, IntegrityScore: 100 },
            { RID: '202', Status: 'Compromised', TamperIncidents: 3, IntegrityScore: 70 },
        ];

        for (const record of defaultIntegrityData) {
            await ctx.stub.putState(
                record.RID,
                Buffer.from(JSON.stringify(record))
            );
        }
    }

    /**
     * Create a new integrity record for a sensor
     * @param {Context} ctx - The Fabric transaction context
     * @param {String} rid - Unique ID for the sensor
     * @param {String} status - Current status of the sensor (e.g., "Operational", "Compromised")
     * @param {Number} tamperIncidents - Count of tampering incidents observed
     * @param {Number} integrityScore - Integrity score (0-100)
     */
    async CreateIntegrityRecord(ctx, rid, status, tamperIncidents, integrityScore) {
        if (await this.recordExists(ctx, rid)) {
            throw new Error(`Integrity record with RID ${rid} already exists`);
        }

        if (!rid || rid.trim() === '') {
            throw new Error('RID (sensor ID) must be a non-empty string');
        }

        const newRecord = {
            RID: rid,
            Status: status || 'Unknown',
            TamperIncidents: parseInt(tamperIncidents) || 0,
            IntegrityScore: parseInt(integrityScore) || 100,
        };

        await ctx.stub.putState(rid, Buffer.from(JSON.stringify(newRecord)));

        return JSON.stringify(newRecord);
    }

    /**
     * Retrieve a specific integrity record by RID
     * @param {Context} ctx - The Fabric transaction context
     * @param {String} rid - Unique sensor ID
     */
    async ReadIntegrityRecord(ctx, rid) {
        const recordBytes = await ctx.stub.getState(rid);

        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Integrity record with RID ${rid} does not exist`);
        }

        return recordBytes.toString();
    }

    /**
     * Update the integrity score and/or status of a sensor
     * @param {Context} ctx - The Fabric transaction context
     * @param {String} rid - Unique sensor ID
     * @param {String} status - Updated status
     * @param {Number} integrityScore - Updated integrity score
     */
    async UpdateIntegrity(ctx, rid, status, integrityScore) {
        const existingRecord = await this.getRecord(ctx, rid);

        existingRecord.Status = status || existingRecord.Status;
        existingRecord.IntegrityScore = parseInt(integrityScore) || existingRecord.IntegrityScore;

        await ctx.stub.putState(rid, Buffer.from(JSON.stringify(existingRecord)));

        return JSON.stringify(existingRecord);
    }

    /**
     * Increment Tamper Incidents for a given sensor
     * @param {Context} ctx - The Fabric transaction context
     * @param {String} rid - Unique sensor ID
     */
    async IncrementTamperIncidents(ctx, rid) {
        const record = await this.getRecord(ctx, rid);

        record.TamperIncidents += 1;

        // Decrement the integrity score by 10 points (if applicable)
        record.IntegrityScore = Math.max(0, record.IntegrityScore - 10);

        await ctx.stub.putState(rid, Buffer.from(JSON.stringify(record)));

        return JSON.stringify(record);
    }

    /**
     * Delete a specific integrity record from the ledger
     * @param {Context} ctx - The Fabric transaction context
     * @param {String} rid - Unique sensor ID
     */
    async DeleteIntegrityRecord(ctx, rid) {
        if (!(await this.recordExists(ctx, rid))) {
            throw new Error(`Integrity record with RID ${rid} does not exist`);
        }

        await ctx.stub.deleteState(rid);

        return `Integrity record ${rid} successfully deleted`;
    }

    /**
     * Retrieve all integrity records from the ledger
     * @param {Context} ctx - The Fabric transaction context
     */
    async GetAllIntegrityRecords(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        for await (const record of iterator) {
            results.push(JSON.parse(record.value.toString()));
        }

        return JSON.stringify(results);
    }

    /**
     * Utility: Check if a record exists
     * @param {Context} ctx - The Fabric transaction context
     * @param {String} rid - Unique sensor ID
     */
    async recordExists(ctx, rid) {
        const recordBytes = await ctx.stub.getState(rid);
        return recordBytes && recordBytes.length > 0;
    }

    /**
     * Utility: Get a record and parse it
     * @param {Context} ctx - The Fabric transaction context
     * @param {String} rid - Unique sensor ID
     */
    async getRecord(ctx, rid) {
        const recordBytes = await ctx.stub.getState(rid);

        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Integrity record with RID ${rid} does not exist`);
        }

        return JSON.parse(recordBytes.toString());
    }
}

module.exports = Integrity;