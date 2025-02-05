'use strict';

const { Contract } = require('fabric-contract-api');

class AvailabilityContract extends Contract {
    // Smart contract initialization
    async init(ctx) {
        console.info("Availability Smart Contract Initialized");
    }

    /**
     * Create Availability Record
     * @param {Context} ctx - The transaction context object
     * @param {String} deviceId - Unique ID of the sensor/device
     * @param {Object} availabilityData - Availability information from the sensor
     */
    async createAvailability(ctx, deviceId, availabilityData) {
        console.info(`Creating availability record for Device ID: ${deviceId}`);

        // Parse the incoming JSON data
        const record = {
            deviceId,
            availabilityData: JSON.parse(availabilityData), // Sensor logs as JSON
            timestamp: new Date().toISOString(), // Record timestamp
        };

        if (!record.deviceId || !record.availabilityData) {
            throw new Error('Device ID and availability data are required.');
        }

        // Save the availability data in the ledger
        await ctx.stub.putState(deviceId, Buffer.from(JSON.stringify(record)));
        console.info(`Availability Record created for Device ID: ${deviceId}`);
        return JSON.stringify({ success: true, record });
    }

    /**
     * Query Availability Record
     * @param {Context} ctx - The transaction context object
     * @param {String} deviceId - Unique ID of the sensor/device
     */
    async queryAvailability(ctx, deviceId) {
        console.info(`Querying availability record for Device ID: ${deviceId}`);

        const recordBytes = await ctx.stub.getState(deviceId); // Fetch data
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`No availability record found for Device ID: ${deviceId}`);
        }

        const record = JSON.parse(recordBytes.toString());
        console.info(`Record Found: ${JSON.stringify(record)}`);
        return record;
    }

    /**
     * Update Availability Record
     * @param {Context} ctx - The transaction context object
     * @param {String} deviceId - Unique ID of the sensor/device
     * @param {Object} updatedData - Updated availability data
     */
    async updateAvailability(ctx, deviceId, updatedData) {
        console.info(`Updating availability record for Device ID: ${deviceId}`);

        const recordBytes = await ctx.stub.getState(deviceId); // Fetch data
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Cannot update: No availability record exists for Device ID: ${deviceId}`);
        }

        const existingRecord = JSON.parse(recordBytes.toString());
        const updatedRecord = {
            ...existingRecord,
            availabilityData: JSON.parse(updatedData), // New data
            updated: new Date().toISOString(),
        };

        // Save the updated record
        await ctx.stub.putState(deviceId, Buffer.from(JSON.stringify(updatedRecord)));
        console.info(`Availability Record updated for Device ID: ${deviceId}`);

        return JSON.stringify({ success: true, updatedRecord });
    }

    /**
     * Delete Availability Record
     * @param {Context} ctx - The transaction context object
     * @param {String} deviceId - Unique ID of the sensor/device
     */
    async deleteAvailability(ctx, deviceId) {
        console.info(`Deleting availability record for Device ID: ${deviceId}`);
        await ctx.stub.deleteState(deviceId); // Remove data from the ledger
        console.info(`Availability Record deleted for Device ID: ${deviceId}`);
        return JSON.stringify({ success: true, deviceId });
    }
}

module.exports.AvailabilityContract = AvailabilityContract;
module.exports.contracts = [AvailabilityContract];