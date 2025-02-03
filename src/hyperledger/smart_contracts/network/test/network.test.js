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

const Network = require('../lib/network.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Network Chaincode Tests', () => {
    let transactionContext, chaincodeStub, asset;

    beforeEach(() => {
        transactionContext = new Context();

        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    const copied = Object.assign({}, chaincodeStub.states);
                    for (let key in copied) {
                        yield { value: copied[key] };
                    }
                }
            }
            return Promise.resolve(internalGetStateByRange());
        });

        asset = {
            ID: 'network1',
            Temperature: 40,
            Fuel: 85,
            Coolant: 60,
            OilPressure: 25
        };
    });

    describe('Test InitLedger', () => {
        it('should initialize the ledger with predefined network assets', async () => {
            const network = new Network();
            await network.InitLedger(transactionContext);
            const ret = JSON.parse((await chaincodeStub.getState('network1')).toString());
            expect(ret).to.eql(Object.assign({ docType: 'network' }, asset));
        });
    });

    describe('Test CreateNetworkAsset', () => {
        it('should create a new network asset', async () => {
            const network = new Network();
            await network.CreateAsset(
                transactionContext,
                asset.ID,
                asset.Temperature,
                asset.Fuel,
                asset.Coolant,
                asset.OilPressure
            );
            const ret = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
            expect(ret).to.eql(asset);
        });

        it('should throw an error if network asset already exists', async () => {
            const network = new Network();
            await network.CreateAsset(
                transactionContext,
                asset.ID,
                asset.Temperature,
                asset.Fuel,
                asset.Coolant,
                asset.OilPressure
            );

            try {
                await network.CreateAsset(
                    transactionContext,
                    asset.ID,
                    asset.Temperature,
                    asset.Fuel,
                    asset.Coolant,
                    asset.OilPressure
                );
                assert.fail('CreateAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal(`The asset ${asset.ID} already exists.`);
            }
        });
    });

    describe('Test ReadNetworkAsset', () => {
        it('should return error on ReadAsset if asset does not exist', async () => {
            const network = new Network();
            try {
                await network.ReadAsset(transactionContext, 'nonExistentID');
                assert.fail('ReadAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset nonExistentID does not exist');
            }
        });

        it('should return success on ReadAsset', async () => {
            const network = new Network();
            await network.CreateAsset(
                transactionContext,
                asset.ID,
                asset.Temperature,
                asset.Fuel,
                asset.Coolant,
                asset.OilPressure
            );

            let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
            expect(ret).to.eql(asset);
        });
    });

    describe('Test UpdateNetworkAsset', () => {
        it('should return error on UpdateAsset if asset does not exist', async () => {
            const network = new Network();
            try {
                await network.UpdateAsset(transactionContext, 'nonExistentID', 45, 90, 65, 30);
                assert.fail('UpdateAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset nonExistentID does not exist');
            }
        });

        it('should return success on UpdateAsset', async () => {
            const network = new Network();
            await network.CreateAsset(
                transactionContext,
                asset.ID,
                asset.Temperature,
                asset.Fuel,
                asset.Coolant,
                asset.OilPressure
            );

            await network.UpdateAsset(transactionContext, asset.ID, 45, 90, 65, 30);
            let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
            let expected = {
                ID: 'network1',
                Temperature: 45,
                Fuel: 90,
                Coolant: 65,
                OilPressure: 30
            };
            expect(ret).to.eql(expected);
        });
    });

    describe('Test DeleteNetworkAsset', () => {
        it('should return error on DeleteAsset if asset does not exist', async () => {
            const network = new Network();
            try {
                await network.DeleteAsset(transactionContext, 'nonExistentID');
                assert.fail('DeleteAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset nonExistentID does not exist');
            }
        });

        it('should return success on DeleteAsset', async () => {
            const network = new Network();
            await network.CreateAsset(
                transactionContext,
                asset.ID,
                asset.Temperature,
                asset.Fuel,
                asset.Coolant,
                asset.OilPressure
            );

            await network.DeleteAsset(transactionContext, asset.ID);
            let ret = await chaincodeStub.getState(asset.ID);
            expect(ret).to.be.undefined;
        });
    });

    describe('Test GetAllNetworkAssets', () => {
        it('should return all network assets in the ledger', async () => {
            const network = new Network();
            await network.CreateAsset(transactionContext, 'network1', 40, 85, 60, 25);
            await network.CreateAsset(transactionContext, 'network2', 45, 90, 65, 30);

            const assets = JSON.parse(await network.GetAllAssets(transactionContext));
            expect(assets.length).to.equal(2);
        });
    });
});
