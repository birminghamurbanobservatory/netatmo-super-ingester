import * as logger from 'node-logger';
import * as Promise from 'bluebird';
import {config} from '../config';
import {updateDeviceList} from './ingest-device-list';
import {updateOldestCheckedDevice} from './ingest-oldest-checked-device';

let timeOfLastDevicesUpdate;

export async function ingest(): Promise<void> {

  logger.debug('Starting ingest cycle');

  if (needToUpdateDevices(timeOfLastDevicesUpdate, config.netatmo.minutesBetweenDeviceListUpdate)) {

    try {
      await updateDeviceList();
      timeOfLastDevicesUpdate = new Date();
    } catch (err) {
      logger.error('Failed to update device list', err);
      // Because timeOfLastDevicesUpdate is not updated here, it will keep trying until it can update the device list.
    }

  } else {

    try {
      await updateOldestCheckedDevice();
    } catch (err) {
      logger.error('Failed to update the oldest checked device', err);
    }

  }

  ingest(); // calls itself

}



export function needToUpdateDevices(lastUpdate: Date, maxGapMins: number): boolean {

  if (!lastUpdate) {
    return true;
  }

  const maxGapMs = maxGapMins * 60 * 1000;
  const msSinceLastUpdate = Date.now() - lastUpdate.getTime(); 
  return msSinceLastUpdate > maxGapMs;

}