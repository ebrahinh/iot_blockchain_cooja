'use strict';

const sinon = require('sinon');
const chai = require('chai');
const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');
const Integrity = require('../lib/integrity');
const expect = chai.expect;

describe('Integrity Smart Contract Tests', () => {
    let context, chaincodeStub;

    beforeEach(() => {
        context = new Context();
        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        context.setChaincodeStub(chaincodeStub);

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
    });

    it('should create an integrity record', async () => {
        const integrityChaincode = new Integrity();

        await integrityChaincode.CreateIntegrityRecord(
            context,
            'RID001',
            'Operational',
            0,
            100
        );

        const record = JSON.parse(await chaincodeStub.getState('RID001'));
        expect(record.RID).to.equal('RID001');
        expect(record.Status).to.equal('Operational');
        expect(record.TamperIncidents).to.equal(0);
    });

    it('should increment tamper incidents and reduce integrity score', async () => {
        const integrityChaincode = new Integrity();
        await integrityChaincode.CreateIntegrityRecord(
            context,
            'RID001',
            'Operational',
            0,
            100
        );

        await integrityChaincode.IncrementTamperIncidents(context, 'RID001');
        const record = JSON.parse(await chaincodeStub.getState('RID001'));

        expect(record.TamperIncidents).to.equal(1);
        expect(record.IntegrityScore).to.equal(90);
    });

    it('should update integrity record', async () => {
        const integrityChaincode = new Integrity();
        await integrityChaincode.CreateIntegrityRecord(
            context,
            'RID001',
            'Operational',
            0,
            100
        );

        await integrityChaincode.UpdateIntegrity(context, 'RID001', 'Compromised', 80);
        const record = JSON.parse(await chaincodeStub.getState('RID001'));

        expect(record.Status).to.equal('Compromised');
        expect(record.IntegrityScore).to.equal(80);
    });

    it('should retrieve all records', async () => {
        const integrityChaincode = new Integrity();
        await integrityChaincode.CreateIntegrityRecord(
            context,
            'RID001',
            'Operational',
            0,
            100
        );
        await integrityChaincode.CreateIntegrityRecord(
            context,
            'RID002',
            'Compromised',
            3,
            70
        );

        const allRecords = JSON.parse(
            await integrityChaincode.GetAllIntegrityRecords(context)
        );
        expect(allRecords.length).to.equal(2);
    });

    it('should delete an integrity record', async () => {
        const integrityChaincode = new Integrity();
        await integrityChaincode.CreateIntegrityRecord(
            context,
            'RID001',
            'Operational',
            0,
            100
        );

        await integrityChaincode.DeleteIntegrityRecord(context, 'RID001');
        const record = await chaincodeStub.getState('RID001');

        expect(record).to.be.undefined;
    });
});