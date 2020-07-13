import * as logger from 'node-logger';
import {countDevices, getOldestLastCheckedDevice} from '../device/device.service';
import {formatDistance} from 'date-fns';
import {config} from '../config';

const announceEvery = config.netatmo.announceEvery;
let deviceCount = 0;
let resetTime = new Date();


export async function incrementCheckedDeviceCount(): Promise<void> {

  deviceCount += 1;
  
  if (deviceCount === announceEvery) {

    deviceCount = 0;
    const nDevicesInDatabase = await countDevices();
    const oldestCheckedDevice = await getOldestLastCheckedDevice();

    logger.info(`It has taken ${formatDistance(resetTime, new Date())} to process ${announceEvery} devices. There are ${nDevicesInDatabase} devices on record in the database. The device that will be checked next was last checked ${formatDistance(oldestCheckedDevice.lastChecked, new Date())} ago.`);

    resetTime = new Date();
  }

  return;

}