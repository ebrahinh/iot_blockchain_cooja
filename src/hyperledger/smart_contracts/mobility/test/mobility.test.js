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

const Mobility = require('../lib/mobility.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Mobility Chaincode Tests', () => {
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
            ID: 'mobility1',
            Speed: 10,
            Acceleration: 2.5,
            Deceleration: 1.2
        };
    });

    describe('Test InitLedger', () => {
        it('should initialize the ledger with default mobility data', async () => {
            let mobilityChaincode = new Mobility();
            await mobilityChaincode.InitLedger(transactionContext);
            let ret = JSON.parse((await chaincodeStub.getState('mobility1')).toString());
            expect(ret).to.have.property('ID', 'mobility1');
            expect(ret).to.have.property('Speed');
        });
    });

    describe('Test CreateMobilityRecord', () => {
        it('should successfully create a mobility record', async () => {
            let mobilityChaincode = new Mobility();
            await mobilityChaincode.CreateMobilityRecord(transactionContext, asset.ID, asset.Speed, asset.Acceleration, asset.Deceleration);
            let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
            expect(ret).to.eql(asset);
        });

        it('should throw an error if the mobility record already exists', async () => {
            let mobilityChaincode = new Mobility();
            await mobilityChaincode.CreateMobilityRecord(transactionContext, asset.ID, asset.Speed, asset.Acceleration, asset.Deceleration);
            try {
                await mobilityChaincode.CreateMobilityRecord(transactionContext, asset.ID, asset.Speed, asset.Acceleration, asset.Deceleration);
                assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal(`The mobility record ${asset.ID} already exists.`);
            }
        });
    });

    describe('Test ReadMobilityRecord', () => {
        it('should retrieve an existing mobility record', async () => {
            let mobilityChaincode = new Mobility();
            await mobilityChaincode.CreateMobilityRecord(transactionContext, asset.ID, asset.Speed, asset.Acceleration, asset.Deceleration);
            let ret = JSON.parse(await mobilityChaincode.ReadMobilityRecord(transactionContext, asset.ID));
            expect(ret).to.eql(asset);
        });

        it('should throw an error if the record does not exist', async () => {
            let mobilityChaincode = new Mobility();
            try {
                await mobilityChaincode.ReadMobilityRecord(transactionContext, 'unknown_id');
                assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal('The mobility record unknown_id does not exist.');
            }
        });
    });

    describe('Test UpdateMobilityRecord', () => {
        it('should update an existing mobility record', async () => {
            let mobilityChaincode = new Mobility();
            await mobilityChaincode.CreateMobilityRecord(transactionContext, asset.ID, asset.Speed, asset.Acceleration, asset.Deceleration);

            await mobilityChaincode.UpdateMobilityRecord(transactionContext, asset.ID, 15, 3.0, 1.5);
            let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
            expect(ret).to.eql({ ID: asset.ID, Speed: 15, Acceleration: 3.0, Deceleration: 1.5 });
        });

        it('should throw an error if trying to update a non-existing record', async () => {
            let mobilityChaincode = new Mobility();
            try {
                await mobilityChaincode.UpdateMobilityRecord(transactionContext, 'unknown_id', 15, 3.0, 1.5);
                assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal('The mobility record unknown_id does not exist.');
            }
        });
    });

    describe('Test DeleteMobilityRecord', () => {
        it('should delete an existing mobility record', async () => {
            let mobilityChaincode = new Mobility();
            await mobilityChaincode.CreateMobilityRecord(transactionContext, asset.ID, asset.Speed, asset.Acceleration, asset.Deceleration);
            await mobilityChaincode.DeleteMobilityRecord(transactionContext, asset.ID);
            let ret = await chaincodeStub.getState(asset.ID);
            expect(ret).to.be.undefined;
        });

        it('should throw an error if trying to delete a non-existing record', async () => {
            let mobilityChaincode = new Mobility();
            try {
                await mobilityChaincode.DeleteMobilityRecord(transactionContext, 'unknown_id');
                assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal('The mobility record unknown_id does not exist.');
            }
        });
    });

    describe('Test GetAllMobilityRecords', () => {
        it('should retrieve all mobility records', async () => {
            let mobilityChaincode = new Mobility();
            await mobilityChaincode.CreateMobilityRecord(transactionContext, 'mobility1', 20, 2.0, 1.0);
            await mobilityChaincode.CreateMobilityRecord(transactionContext, 'mobility2', 25, 2.5, 1.2);

            let ret = await mobilityChaincode.GetAllMobilityRecords(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(2);
        });
    });
});
