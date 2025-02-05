/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const Mobility = require('./lib/mobility');

// Export contract to align with Fabric runtime and project usage
module.exports.Mobility = Mobility;
module.exports.contracts = [Mobility];