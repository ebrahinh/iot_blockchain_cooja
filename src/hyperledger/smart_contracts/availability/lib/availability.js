'use strict';

const { Contract } = require('fabric-contract-api');

class Availability extends Contract {
    /**
     * Initialize the ledger with some sensor availability records (optional)
     * @param {*} ctx - The transaction context object
     */
    async InitLedger(ctx) {
        console.info('Ledger initialized with default Availability records');
        const defaultSensors = [
            { RID: '101', Attempts: 0, SecurityIncidents: 0 },
            { RID: '102', Attempts: 5, SecurityIncidents: 2 },
        ];

        for (const sensor of defaultSensors) {
            await ctx.stub.putState(
                sensor.RID,
                Buffer.from(JSON.stringify(sensor))
            );
        }
    }

    /**
     * Create a new availability record
     * @param {Object} ctx - The transaction context object
     * @param {String} rid - Sensor ID (unique identifier)
     * @param {Number} attempts - Number of completed attempts
     * @param {Number} securityIncidents - Number of security issues
     */
    async CreateAvailabilityRecord(ctx, rid, attempts, securityIncidents) {
        if (await this.assetExists(ctx, rid)) {
            throw new Error(`Availability record ${rid} already exists`);
        }

        if (!rid || rid.trim() === '') {
            throw new Error('RID (Sensor ID) cannot be empty');
        }

        const newSensor = {
            RID: rid,
            Attempts: parseInt(attempts) || 0,
            SecurityIncidents: parseInt(securityIncidents) || 0,
        };

        await ctx.stub.putState(rid, Buffer.from(JSON.stringify(newSensor)));

        return JSON.stringify(newSensor);
    }

    /**
     * Read the availability record for a specific sensor
     * @param {*} ctx - Transaction context
     * @param {String} rid - Sensor ID to read from the ledger
     */
    async ReadAvailabilityRecord(ctx, rid) {
        const recordBytes = await ctx.stub.getState(rid);

        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Availability record with ID ${rid} does not exist`);
        }

        return recordBytes.toString();
    }

    /**
     * Increment the number of attempts for a specific sensor
     * @param {*} ctx - Transaction context
     * @param {String} rid - Sensor ID
     */
    async IncrementAttempts(ctx, rid) {
        const sensorRecord = await this.ReadAvailabilityRecord(ctx, rid);
        const sensor = JSON.parse(sensorRecord);

        // Increment attempts
        sensor.Attempts += 1;

        // Update state
        await ctx.stub.putState(rid, Buffer.from(JSON.stringify(sensor)));

        return JSON.stringify(sensor);
    }

    /**
     * Increment the number of security incidents for a specific sensor
     * @param {*} ctx - Transaction context
     * @param {*} rid - Sensor ID
     */
    async IncrementSecurityIncidents(ctx, rid) {
        const sensorRecord = await this.ReadAvailabilityRecord(ctx, rid);
        const sensor = JSON.parse(sensorRecord);

        // Increment security incidents
        sensor.SecurityIncidents += 1;

        // Update state
        await ctx.stub.putState(rid, Buffer.from(JSON.stringify(sensor)));

        return JSON.stringify(sensor);
    }

    /**
     * Delete an availability record
     * @param {*} ctx - Transaction context
     * @param {*} rid - Sensor ID to delete
     */
    async DeleteAvailabilityRecord(ctx, rid) {
        if (!(await this.assetExists(ctx, rid))) {
            throw new Error(`Availability record ${rid} does not exist`);
        }

        await ctx.stub.deleteState(rid);
        return `Availability record ${rid} has been successfully deleted`;
    }

    /**
     * Get all availability records on the ledger (useful for dashboards)
     * @param {*} ctx - Transaction context
     */
    async GetAllAvailabilityRecords(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        for await (const record of iterator) {
            results.push(JSON.parse(record.value.toString()));
        }

        return JSON.stringify(results);
    }

    // Utility: Check if an asset exists
    async assetExists(ctx, rid) {
        const recordBytes = await ctx.stub.getState(rid);
        return recordBytes && recordBytes.length > 0;
    }
}

module.exports = Availability;