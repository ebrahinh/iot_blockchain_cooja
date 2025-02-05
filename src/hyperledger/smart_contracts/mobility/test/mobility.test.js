/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const { expect } = chai;
chai.use(sinonChai);

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');
const Mobility = require('../lib/mobility.js'); // The Mobility smart contract

describe('Mobility Chaincode Unit Tests', () => {
    let transactionContext, chaincodeStub, testAsset;

    beforeEach(() => {
        // Setup transaction context and stub
        transactionContext = new Context();
        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        // Fake states for testing in stub
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

        // Example test asset initialized
        testAsset = {
            RID: 'test1',
            Location: 'Test Zone',
            GeoFence: 'Restricted',
            Attempts: 0,
            SecurityIncidents: 0,
        };
    });

    describe('Initialize Mobility Ledger (InitLedger)', () => {
        it('should set up the mobility ledger with default records', async () => {
            const mobility = new Mobility();
            await mobility.InitLedger(transactionContext);
            const assetBytes = await chaincodeStub.getState('301');
            const asset = JSON.parse(assetBytes.toString());
            expect(asset).to.have.property('RID', '301');
            expect(asset).to.have.property('GeoFence', 'Restricted');
        });
    });

    describe('CreateMobility', () => {
        it('should successfully create a new mobility record', async () => {
            const mobility = new Mobility();
            const result = await mobility.CreateMobility(
                transactionContext,
                testAsset.RID,
                testAsset.Location,
                testAsset.GeoFence,
                testAsset.Attempts,
                testAsset.SecurityIncidents
            );
            const asset = JSON.parse(result);
            expect(asset).to.eql(testAsset);

            const storedAsset = JSON.parse(await chaincodeStub.getState(testAsset.RID));
            expect(storedAsset).to.eql(testAsset);
        });

        it('should fail to create a duplicate mobility record', async () => {
            const mobility = new Mobility();
            await mobility.CreateMobility(
                transactionContext,
                testAsset.RID,
                testAsset.Location,
                testAsset.GeoFence,
                testAsset.Attempts,
                testAsset.SecurityIncidents
            );
            try {
                await mobility.CreateMobility(
                    transactionContext,
                    testAsset.RID,
                    testAsset.Location,
                    testAsset.GeoFence,
                    testAsset.Attempts,
                    testAsset.SecurityIncidents
                );
                chai.assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal(`Mobility record ${testAsset.RID} already exists.`);
            }
        });
    });

    describe('ReadMobility', () => {
        it('should correctly retrieve an existing record', async () => {
            const mobility = new Mobility();
            await mobility.CreateMobility(
                transactionContext,
                testAsset.RID,
                testAsset.Location,
                testAsset.GeoFence,
                testAsset.Attempts,
                testAsset.SecurityIncidents
            );
            const result = await mobility.ReadMobility(transactionContext, testAsset.RID);
            const asset = JSON.parse(result);
            expect(asset).to.eql(testAsset);
        });

        it('should fail to retrieve a non-existent record', async () => {
            const mobility = new Mobility();
            try {
                await mobility.ReadMobility(transactionContext, 'unknown_record');
                chai.assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal('Mobility record unknown_record does not exist.');
            }
        });
    });

    describe('UpdateMobility', () => {
        it('should correctly update an existing mobility record', async () => {
            const mobility = new Mobility();
            await mobility.CreateMobility(
                transactionContext,
                testAsset.RID,
                testAsset.Location,
                testAsset.GeoFence,
                testAsset.Attempts,
                testAsset.SecurityIncidents
            );

            const updatedLoc = 'Updated Zone';
            const updatedGeoFence = 'Allowed';
            const updatedAttempts = 5;
            const updatedSecurityIncidents = 2;

            const updatedResult = await mobility.UpdateMobility(
                transactionContext,
                testAsset.RID,
                updatedLoc,
                updatedGeoFence,
                updatedAttempts,
                updatedSecurityIncidents
            );
            const updatedAsset = JSON.parse(updatedResult);

            expect(updatedAsset).to.eql({
                RID: testAsset.RID,
                Location: updatedLoc,
                GeoFence: updatedGeoFence,
                Attempts: updatedAttempts,
                SecurityIncidents: updatedSecurityIncidents,
                docType: 'mobility',
            });
        });

        it('should fail to update a non-existent mobility record', async () => {
            const mobility = new Mobility();
            try {
                await mobility.UpdateMobility(transactionContext, 'unknown_record', 'New Zone', 'Restricted', 1, 1);
                chai.assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal('Mobility record unknown_record does not exist.');
            }
        });
    });

    describe('IncrementAttempts', () => {
        it('should correctly increment Attempts on a mobility record', async () => {
            const mobility = new Mobility();
            await mobility.CreateMobility(
                transactionContext,
                testAsset.RID,
                testAsset.Location,
                testAsset.GeoFence,
                testAsset.Attempts,
                testAsset.SecurityIncidents
            );

            await mobility.IncrementAttempts(transactionContext, testAsset.RID);
            const record = JSON.parse(await chaincodeStub.getState(testAsset.RID));
            expect(record.Attempts).to.equal(1);
        });
    });

    describe('IncrementSecurityIncidents', () => {
        it('should correctly increment SecurityIncidents on a mobility record', async () => {
            const mobility = new Mobility();
            await mobility.CreateMobility(
                transactionContext,
                testAsset.RID,
                testAsset.Location,
                testAsset.GeoFence,
                testAsset.Attempts,
                testAsset.SecurityIncidents
            );

            await mobility.IncrementSecurityIncidents(transactionContext, testAsset.RID);
            const record = JSON.parse(await chaincodeStub.getState(testAsset.RID));
            expect(record.SecurityIncidents).to.equal(1);
        });
    });

    describe('DeleteMobility', () => {
        it('should delete an existing mobility record', async () => {
            const mobility = new Mobility();
            await mobility.CreateMobility(
                transactionContext,
                testAsset.RID,
                testAsset.Location,
                testAsset.GeoFence,
                testAsset.Attempts,
                testAsset.SecurityIncidents
            );

            await mobility.DeleteMobility(transactionContext, testAsset.RID);
            const record = await chaincodeStub.getState(testAsset.RID);
            expect(record).to.be.undefined;
        });

        it('should fail to delete a non-existent mobility record', async () => {
            const mobility = new Mobility();
            try {
                await mobility.DeleteMobility(transactionContext, 'unknown_record');
                chai.assert.fail('Expected error not thrown');
            } catch (err) {
                expect(err.message).to.equal('Mobility record unknown_record does not exist.');
            }
        });
    });

    describe('GetAllMobility', () => {
        it('should retrieve all existing mobility records', async () => {
            const mobility = new Mobility();
            await mobility.CreateMobility(transactionContext, '301', 'Zone A', 'Restricted', 0, 0);
            await mobility.CreateMobility(transactionContext, '302', 'Zone B', 'Allowed', 1, 0);

            const result = await mobility.GetAllMobility(transactionContext);
            const allRecords = JSON.parse(result);
            expect(allRecords.length).to.equal(2);
        });
    });
});