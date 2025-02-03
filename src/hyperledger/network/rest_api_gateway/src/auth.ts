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

export const fabricAPIKeyStrategy: HeaderAPIKeyStrategy =
  new HeaderAPIKeyStrategy(
    { header: 'X-API-Key', prefix: '' },
    false,
    function (apikey, done) {
      logger.debug({ apikey }, 'Checking X-API-Key');

      // Existing organizations
      if (apikey === config.org1ApiKey) {
        const user = config.mspIdOrg1;
        logger.debug('User set to %s', user);
        done(null, user);
      } else if (apikey === config.org2ApiKey) {
        const user = config.mspIdOrg2;
        logger.debug('User set to %s', user);
        done(null, user);
      } else if (apikey === config.org3ApiKey) {
        const user = config.mspIdOrg3;
        logger.debug('User set to %s', user);
        done(null, user);
      } else if (apikey === config.org4ApiKey) {
        const user = config.mspIdOrg4;
        logger.debug('User set to %s', user);
        done(null, user);
      } else if (apikey === config.org5ApiKey) {
        const user = config.mspIdOrg5;
        logger.debug('User set to %s', user);
        done(null, user);
      }

      // New organizations
      else if (apikey === config.securityOrgApiKey) {
        const user = config.mspIdSecurityOrg;
        logger.debug('User set to %s', user);
        done(null, user);
      } else if (apikey === config.integrityOrgApiKey) {
        const user = config.mspIdIntegrityOrg;
        logger.debug('User set to %s', user);
        done(null, user);
      } else if (apikey === config.networkMobilityOrgApiKey) {
        const user = config.mspIdNetworkMobilityOrg;
        logger.debug('User set to %s', user);
        done(null, user);
      } else if (apikey === config.availabilitySensorApiKey) {
        const user = config.mspIdAvailabilitySensor;
        logger.debug('User set to %s', user);
        done(null, user);
      } 

      // No valid API key
      else {
        logger.debug({ apikey }, 'No valid X-API-Key');
        return done(null, false);
      }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
