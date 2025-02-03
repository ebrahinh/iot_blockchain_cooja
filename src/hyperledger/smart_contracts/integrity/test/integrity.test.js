/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const Integrity = require('../lib/integrity.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Integrity Sensor Chaincode Tests', () => {
    let transactionContext, chaincodeStub, asset;

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

        asset = {
            RID: '101',
            Attempts: 0,
            SecurityIncidents: 0,
        };
    });

    describe('Test InitLedger', () => {
        it('should initialize the ledger with predefined integrity records', async () => {
            const integrityChaincode = new Integrity();
            await integrityChaincode.InitLedger(transactionContext);
            const ret = JSON.parse((await chaincodeStub.getState('101')).toString());
            expect(ret).to.have.property('RID', '101');
            expect(ret).to.have.property('Attempts', 0);
            expect(ret).to.have.property('SecurityIncidents', 0);
        });
    });

    describe('Test CreateIntegrityRecord', () => {
        it('should successfully create a new integrity record', async () => {
            const integrityChaincode = new Integrity();
            await integrityChaincode.CreateIntegrityRecord(transactionContext, asset.RID, 3, 1);
            const ret = JSON.parse(await chaincodeStub.getState(asset.RID));
            expect(ret).to.eql({ RID: asset.RID, Attempts: 3, SecurityIncidents: 1 });
        });

        it('should throw an error if record already exists', async () => {
            const integrityChaincode = new Integrity();
            await integrityChaincode.CreateIntegrityRecord(transactionContext, asset.RID, 3, 1);

            try {
                await integrityChaincode.CreateIntegrityRecord(transactionContext, asset.RID, 5, 2);
                assert.fail('CreateIntegrityRecord should have failed');
            } catch (err) {
                expect(err.message).to.equal(`Integrity record ${asset.RID} already exists.`);
            }
        });
    });

    describe('Test IncrementAttempts', () => {
        it('should increment the Attempts counter', async () => {
            const integrityChaincode = new Integrity();
            await integrityChaincode.CreateIntegrityRecord(transactionContext, asset.RID, 3, 1);
            await integrityChaincode.IncrementAttempts(transactionContext, asset.RID);
            const updatedAsset = JSON.parse(await chaincodeStub.getState(asset.RID));
            expect(updatedAsset.Attempts).to.equal(4);
        });

        it('should throw an error if record does not exist', async () => {
            const integrityChaincode = new Integrity();
            try {
                await integrityChaincode.IncrementAttempts(transactionContext, '999');
                assert.fail('IncrementAttempts should have failed');
            } catch (err) {
                expect(err.message).to.equal('The integrity record 999 does not exist.');
            }
        });
    });

    describe('Test IncrementSecurityIncidents', () => {
        it('should increment the SecurityIncidents counter', async () => {
            const integrityChaincode = new Integrity();
            await integrityChaincode.CreateIntegrityRecord(transactionContext, asset.RID, 3, 1);
            await integrityChaincode.IncrementSecurityIncidents(transactionContext, asset.RID);
            const updatedAsset = JSON.parse(await chaincodeStub.getState(asset.RID));
            expect(updatedAsset.SecurityIncidents).to.equal(2);
        });

        it('should throw an error if record does not exist', async () => {
            const integrityChaincode = new Integrity();
            try {
                await integrityChaincode.IncrementSecurityIncidents(transactionContext, '999');
                assert.fail('IncrementSecurityIncidents should have failed');
            } catch (err) {
                expect(err.message).to.equal('The integrity record 999 does not exist.');
            }
        });
    });

    describe('Test GetAllIntegrityRecords', () => {
        it('should retrieve all integrity records', async () => {
            const integrityChaincode = new Integrity();
            await integrityChaincode.CreateIntegrityRecord(transactionContext, '101', 3, 1);
            await integrityChaincode.CreateIntegrityRecord(transactionContext, '102', 5, 2);

            const records = JSON.parse(await integrityChaincode.GetAllIntegrityRecords(transactionContext));
            expect(records.length).to.equal(2);
        });
    });

    describe('Test DeleteIntegrityRecord', () => {
        it('should delete an integrity record', async () => {
            const integrityChaincode = new Integrity();
            await integrityChaincode.CreateIntegrityRecord(transactionContext, asset.RID, 3, 1);
            await integrityChaincode.DeleteIntegrityRecord(transactionContext, asset.RID);
            const ret = await chaincodeStub.getState(asset.RID);
            expect(ret).to.be.undefined;
        });

        it('should throw an error if trying to delete a non-existing record', async () => {
            const integrityChaincode = new Integrity();
            try {
                await integrityChaincode.DeleteIntegrityRecord(transactionContext, '999');
                assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal('The integrity record 999 does not exist.');
            }
        });
    });
});
