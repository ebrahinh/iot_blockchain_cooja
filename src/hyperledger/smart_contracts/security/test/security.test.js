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

const Security = require('../lib/security.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Security Chaincode Tests', () => {
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
            ID: 'security1',
            SecurityLevel: 'High',
            BreachAttempts: 0,
            AlertsTriggered: 0,
        };
    });

    describe('Test InitLedger', () => {
        it('should initialize the ledger with predefined assets', async () => {
            const security = new Security();
            await security.InitLedger(transactionContext);
            const ret = JSON.parse((await chaincodeStub.getState('security1')).toString());
            expect(ret).to.eql(Object.assign({ docType: 'security' }, asset));
        });
    });

    describe('Test CreateSecurityAsset', () => {
        it('should create a new security asset', async () => {
            const security = new Security();
            await security.CreateSecurityAsset(
                transactionContext,
                asset.ID,
                asset.SecurityLevel
            );
            const ret = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
            expect(ret).to.eql(Object.assign({}, asset, { BreachAttempts: 0, AlertsTriggered: 0 }));
        });

        it('should throw an error if asset already exists', async () => {
            const security = new Security();
            await security.CreateSecurityAsset(
                transactionContext,
                asset.ID,
                asset.SecurityLevel
            );

            try {
                await security.CreateSecurityAsset(
                    transactionContext,
                    asset.ID,
                    asset.SecurityLevel
                );
                assert.fail('CreateSecurityAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal(`The security asset ${asset.ID} already exists.`);
            }
        });
    });

    describe('Test IncrementBreachAttempts', () => {
        it('should increment the BreachAttempts counter', async () => {
            const security = new Security();
            await security.CreateSecurityAsset(transactionContext, asset.ID, asset.SecurityLevel);
            await security.IncrementBreachAttempts(transactionContext, asset.ID);

            const updatedAsset = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
            expect(updatedAsset.BreachAttempts).to.equal(1);
        });
    });

    describe('Test IncrementAlertsTriggered', () => {
        it('should increment the AlertsTriggered counter', async () => {
            const security = new Security();
            await security.CreateSecurityAsset(transactionContext, asset.ID, asset.SecurityLevel);
            await security.IncrementAlertsTriggered(transactionContext, asset.ID);

            const updatedAsset = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
            expect(updatedAsset.AlertsTriggered).to.equal(1);
        });
    });

    describe('Test GetAllSecurityAssets', () => {
        it('should return all security assets in the ledger', async () => {
            const security = new Security();
            await security.CreateSecurityAsset(transactionContext, 'security1', 'High');
            await security.CreateSecurityAsset(transactionContext, 'security2', 'Medium');

            const assets = JSON.parse(await security.GetAllSecurityAssets(transactionContext));
            expect(assets.length).to.equal(2);
        });
    });

    describe('Test DeleteSecurityAsset', () => {
        it('should delete a security asset', async () => {
            const security = new Security();
            await security.CreateSecurityAsset(transactionContext, asset.ID, asset.SecurityLevel);

            await security.DeleteSecurityAsset(transactionContext, asset.ID);
            const ret = await chaincodeStub.getState(asset.ID);
            expect(ret).to.be.undefined;
        });
    });
});
