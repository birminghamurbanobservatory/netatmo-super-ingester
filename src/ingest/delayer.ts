import {config} from '../config';
import * as Promise from 'bluebird';
import * as logger from 'node-logger';

export async function delayToAvoidNetatmoLimit(): Promise<void> {
  logger.debug(`Delaying for ${config.netatmo.secondsBetweenRequests} seconds.`);
  await Promise.delay(config.netatmo.secondsBetweenRequests * 1000);
  return;
}