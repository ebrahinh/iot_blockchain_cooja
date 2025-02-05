'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const Availability = require('../lib/availability.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Availability Smart Contract Tests', () => {
    let transactionContext, chaincodeStub;

    beforeEach(() => {
        transactionContext = new Context();
        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) chaincodeStub.states = {};
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            return Promise.resolve(chaincodeStub.states ? chaincodeStub.states[key] : undefined);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) delete chaincodeStub.states[key];
            return Promise.resolve();
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    for (let key in chaincodeStub.states) {
                        yield { value: chaincodeStub.states[key] };
                    }
                }
            }
            return Promise.resolve(internalGetStateByRange());
        });
    });

    it('CreateAvailabilityRecord: should create a new availability record', async () => {
        const contract = new Availability();
        await contract.CreateAvailabilityRecord(
            transactionContext,
            'RID001',
            3,
            1
        );

        const record = JSON.parse(
            await chaincodeStub.getState('RID001')
        );
        expect(record.RID).to.equal('RID001');
        expect(record.Attempts).to.equal(3);
        expect(record.SecurityIncidents).to.equal(1);
    });

    it('IncrementAttempts: should correctly increment attempts', async () => {
        const contract = new Availability();
        await contract.CreateAvailabilityRecord(
            transactionContext,
            'RID001',
            3,
            1
        );

        await contract.IncrementAttempts(transactionContext, 'RID001');
        const record = JSON.parse(
            await chaincodeStub.getState('RID001')
        );
        expect(record.Attempts).to.equal(4);
    });

    it('GetAllAvailabilityRecords: should retrieve all records', async () => {
        const contract = new Availability();
        await contract.CreateAvailabilityRecord(
            transactionContext,
            'RID001',
            3,
            1
        );
        await contract.CreateAvailabilityRecord(
            transactionContext,
            'RID002',
            2,
            0
        );

        const allRecords = JSON.parse(
            await contract.GetAllAvailabilityRecords(transactionContext)
        );
        expect(allRecords.length).to.equal(2);
    });

    it('DeleteAvailabilityRecord: should delete the record successfully', async () => {
        const contract = new Availability();
        await contract.CreateAvailabilityRecord(
            transactionContext,
            'RID001',
            3,
            1
        );

        await contract.DeleteAvailabilityRecord(transactionContext, 'RID001');
        const record = await chaincodeStub.getState('RID001');

        expect(record).to.be.undefined;
    });
});