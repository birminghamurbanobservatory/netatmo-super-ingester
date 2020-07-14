import * as logger from 'node-logger';
import {delayToAvoidNetatmoLimit} from './delayer';
import {getOldestLastCheckedDevice, updateDevice, deleteDevice} from '../device/device.service';
import {cloneDeep, last} from 'lodash';
import * as Promise from 'bluebird';
import {getMeasure, getAccessTokenWithCaching} from '../netatmo/netatmo.service';
import {config} from '../config';
import {add} from 'date-fns';
import {measurementsToUrbanObs} from './reformatter';
import * as event from 'event-stream';
import * as check from 'check-types';
import {Measurement} from '../netatmo/measurement';

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
        dateBegin: add(module.timeOfLatest, {minutes: 1}),
        dateEnd: new Date() // just in case netatmo has observations in the future, we don't want these.
      });
    } catch (err) {
      logger.warn(`Failed to get measurements for device ${device.deviceId} and module ${module.moduleId} (${module.types.join(',')}). Reason: ${err.message}`);
      // If this fails then we should update the consecutiveFails count, because it could be a sign that this module not longer exists on this device.
      updatedModule.consecutiveFails += 1;
      // TODO: If the error is due to hitting the rate limit, then we probably don't want to increase the consecutiveFails count because the error hasn't got anything to do with this particular module.
    }

    if (check.array(measurements) && measurements.length === 0) {
      logger.warn(`No new measurements were retrieved for ${device.deviceId} and module ${module.moduleId} (${module.types.join(',')})`);
      // It also makes sense to increment the consecutiveFails here too. Because if the requests are going to keep returning nothing then eventually we'll want to forget this module relationship and stop trying to get its data.
      updatedModule.consecutiveFails += 1;
    }

    if (check.array(measurements) && measurements.length > 0) {

      // Convert these measurements to observations
      const observations = measurementsToUrbanObs(device, module, measurements);

      // Because you can have serveral netatmo readings (e.g. temp and humid) at each timestep you tend end up with more UO observations than netatmo timesteps.
      logger.debug(`Retrieved netatmo measurements at ${measurements.length} timesteps, which were converted to ${observations.length} Urban Observatory observations.`);

      // Publish each of these observations
      await Promise.mapSeries(observations, async (observation): Promise<void> => {
        await event.publish('observation.incoming', observation);
      });

      // Use the last measurement from the module to update the module's timeOfLatest value
      const lastMeasurement: Measurement = last(measurements);
      updatedModule.timeOfLatest = lastMeasurement.time;
      logger.debug(`Updating the timeOfLatest of module ${module.moduleId} (on device ${device.deviceId}) to ${lastMeasurement.time.toISOString()}.`);

      // We can also reset the consecutiveFails tally
      updatedModule.consecutiveFails = 0;

    }

    // Add any module updates to our device updates
    deviceUpdates.modules[idx] = updatedModule;

  });

  deviceUpdates.lastChecked = new Date();

  // Only keep modules whose consecutiveFails is below a given threshold
  const maxConsecutiveFailsAllowed = 10;
  deviceUpdates.modules = deviceUpdates.modules.filter((dModule) => {
    const hasBreached = dModule.consecutiveFails > maxConsecutiveFailsAllowed;
    if (hasBreached) {
      logger.info(`Module ${dModule.moduleId} (on device ${device.deviceId}) has breached ${maxConsecutiveFailsAllowed} consecutive fails, and will therefore be removed from this device's records.`);
    }
    return !hasBreached;
  });

  // If this device has no modules left what-so-ever then we should delete the whole device.
  if (deviceUpdates.modules.length === 0) {
    logger.info(`Device ${device.deviceId} no longer has any active modules, and thus it will be removed from the database.`);
    await deleteDevice(device.deviceId);
  
  // Otherwise update it
  } else {
    await updateDevice(device.deviceId, deviceUpdates);
  }

  return;

}

