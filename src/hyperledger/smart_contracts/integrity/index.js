/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Import Integrity smart contract
const IntegrityContract = require('./lib/integrity');

// Export the Integrity smart contract for use across systems
module.exports.IntegrityContract = IntegrityContract;

// Export the array of contracts for Fabric runtime
module.exports.contracts = [IntegrityContract];