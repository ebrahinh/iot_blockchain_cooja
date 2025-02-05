/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { logger } from './logger';
import passport from 'passport';
import { NextFunction, Request, Response } from 'express';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import * as config from './config';

const { UNAUTHORIZED } = StatusCodes;

// Centralized mapping of API keys to MSP IDs
const apiKeyToMspMap: Record<string, string> = {
    [config.org1ApiKey]: config.mspIdOrg1,
    [config.org2ApiKey]: config.mspIdOrg2,
    [config.org3ApiKey]: config.mspIdOrg3,
    [config.org4ApiKey]: config.mspIdOrg4,
    [config.org5ApiKey]: config.mspIdOrg5,
    [config.sensorsOrgApiKey]: config.mspIdSensorsOrg, // Single SensorsOrg mapping
};

export const fabricAPIKeyStrategy: HeaderAPIKeyStrategy = new HeaderAPIKeyStrategy(
    { header: 'X-API-Key', prefix: '' },
    false,
    (apikey: string, done: (error: Error | null, user?: string | false) => void) => {
        logger.debug({ apikey }, 'Checking X-API-Key');

        const user = apiKeyToMspMap[apikey];

        if (user) {
            logger.debug('User set to %s', user);
            return done(null, user);
        }

        // No valid API key
        logger.debug({ apikey }, 'No valid X-API-Key');
        return done(null, false);
    }
);

export const authenticateApiKey = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    passport.authenticate(
        'headerapikey',
        { session: false },
        (err: any, user: Express.User, _info: any) => {
            if (err) return next(err);
            if (!user)
                return res.status(UNAUTHORIZED).json({
                    status: getReasonPhrase(UNAUTHORIZED),
                    reason: 'NO_VALID_APIKEY',
                    timestamp: new Date().toISOString(),
                });

            req.logIn(user, { session: false }, async (err) => {
                if (err) {
                    return next(err);
                }
                return next();
            });
        }
    )(req, res, next);
};