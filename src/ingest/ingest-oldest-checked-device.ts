import * as logger from 'node-logger';
import {delayToAvoidNetatmoLimit} from './delayer';
import {getOldestLastCheckedDevice, updateDevice} from '../device/device.service';
import {cloneDeep} from 'lodash';
import * as Promise from 'bluebird';
import {getMeasure, getAccessTokenWithCaching} from '../netatmo/netatmo.service';
import {config} from '../config';
import {add} from 'date-fns';
import {measurementsToUrbanObs} from './reformatter';

export async function updateOldestCheckedDevice(): Promise<void> {

  logger.debug('Updating the device which was last checked the longest time ago');

  const device = await getOldestLastCheckedDevice();
  const deviceUpdates = cloneDeep(device);

  logger.debug(`Oldest last checked device is ${device.deviceId}`);

  await Promise.mapSeries(device.modules, async (module, idx) => {

    await delayToAvoidNetatmoLimit();
    logger.debug(`Getting measurements for device ${device.deviceId} and module ${module.moduleId} (${module.types.join(',')})`);

    const updatedModule = cloneDeep(module);

    const accessToken = await getAccessTokenWithCaching(config.netatmo.credentials);

    let measurements;

    // Get data for this module
    try {
      measurements = await getMeasure({
        deviceId: device.deviceId,
        moduleId: module.moduleId,
        accessToken,
        type: module.types,
        scale: 'max',
        dateBegin: add(module.timeOfLatest, {minutes: 1})
      });
    } catch (err) {
      // If this fails then we should update the consecutiveFails count
      updatedModule.consecutiveFails += 1;
    }

    // Convert these measurements to observations
    const observations = measurementsToUrbanObs(device, module, measurements);

    // Publish each of these observations

    // Use the last observation from the module to update the module's timeOfLatest value

    // Add these module updates to our device updates
    deviceUpdates.modules[idx] = updatedModule;

  });

  deviceUpdates.lastChecked = new Date();

  await updateDevice(device.deviceId, deviceUpdates);

  return;

}

