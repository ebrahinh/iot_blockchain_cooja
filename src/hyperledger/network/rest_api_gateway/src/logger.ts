/*
 * SPDX-License-Identifier: Apache-2.0
 */

import pino from 'pino';
import * as config from './config';

export const logger = pino({
  level: config.logLevel,
  transport: {
    targets: [
      {
        target: 'pino/file', // Log to a file
        options: { destination: './logs/app.log', mkdir: true },
      },
      {
        target: 'pino-pretty', // Pretty print in console
        options: { colorize: true },
      },
    ],
  },
});
