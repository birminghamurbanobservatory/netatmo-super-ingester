import * as logger from 'node-logger';
import {config} from '../config';
import {getAccessToken, getPublicDataWithRetries} from '../netatmo/netatmo.service';
import {calculateWindows} from '../netatmo/windows-calculator';
import * as Promise from 'bluebird';
import {round, pick, cloneDeep} from 'lodash';
import * as check from 'check-types';
import {getDevice, updateDevice, createDevice} from '../device/device.service';
import {DeviceApp} from '../device/device-app';
import {v4 as uuid} from 'uuid';
import {sub} from 'date-fns';
import {delayToAvoidNetatmoLimit} from './delayer';


// Calculate the windows
// Because the netatmo api will often exclude netatmo stations when there are many in a certain region or you are looking at a large spatial area, therefore its important run the getPublicData request over several smaller windows that together make up the full region of interest.
const windows = calculateWindows(config.netatmo.region);

// Uses getPublicData requests to keep the list of devices in the database collection up to date, e.g. their location, and which modules they have. It ignores actually sensor readings returned by Netatmo.
export async function updateDeviceList(): Promise<void> {

  logger.debug('Updating device list');

  // Get access token (we won't bother using the cached approach here because there could be multiple windows that may take a while)
  const accessToken = await getAccessToken(config.netatmo.credentials);

  logger.debug(`Using ${windows.length} windows`);

  await Promise.mapSeries(windows, async (window, wIdx) => {

    await delayToAvoidNetatmoLimit();
    logger.debug(`Processing window ${wIdx + 1} of ${windows.length}.`);

    const maxRetries = 3;

    const {publicData, successfulOnAttempt} = await getPublicDataWithRetries({
      accessToken,
      latNE: window.north,
      latSW: window.south,
      lonNE: window.east,
      lonSW: window.west
    }, maxRetries);

    logger.debug(`Successfully got public data for window ${wIdx + 1} on attempt ${successfulOnAttempt}`);

    const reformatted: DeviceApp[] = reformatPublicData(publicData);

    // Exclude any outside of the window
    const devicesData = reformatted.filter((device) => {
      return device.location.lat <= window.north &&
        device.location.lat >= window.south &&
        device.location.lon >= window.west &&
        device.location.lon <= window.east;
    });

    logger.debug(`${devicesData.length} devices found in window ${wIdx + 1}`);

    await Promise.mapSeries(devicesData, async (deviceData) => {
      await upsertDeviceWithNewPublicData(deviceData);
      return;
    });

    return;
  });

  return;

}



async function upsertDeviceWithNewPublicData(deviceData): Promise<void> {

  let existingDevice;

  try {
    existingDevice = await getDevice(deviceData.deviceId);
  } catch (err) {
    if (err.name === 'DeviceNotFound') {
      logger.info(`This is the first time deviceId '${deviceData.deviceId} has been seen.'`);
    } else {
      throw err;
    }
  }

  //------------------------
  // Update
  //------------------------
  if (existingDevice) {
    const updates = combineExistingDeviceWithNewData(existingDevice, deviceData);
    await updateDevice(deviceData.deviceId, updates);
  }


  //------------------------
  // Insert
  //------------------------
  if (!existingDevice) {
    // There's some extra properties we need to add to our device before we can save it.
    const deviceToSave: DeviceApp = cloneDeep(deviceData);
    deviceToSave.location.id = uuid();
    deviceToSave.location.validAt = new Date();
    // We'll set the lastChecked value as a day ago so that it should be checked for new data pretty quickly, as this value should be older than all the over devices in the database.
    deviceToSave.lastChecked = sub(new Date(), {days: 1});
    deviceToSave.modules.forEach((module) => {
      module.timeOfLatest = sub(new Date(), {hours: 1}); // this is when we'll start pulling in from.
    });
    await createDevice(deviceToSave);
  }

}


export function combineExistingDeviceWithNewData(existing: DeviceApp, newData: DeviceApp): DeviceApp {

  if (existing.deviceId !== newData.deviceId) {
    throw new Error('deviceIds should match');
  }

  const combined = cloneDeep(existing);

  // We'll overwrite the extras
  combined.extras = newData.extras;

  // Check to see if the location has changed
  const locationRemainsTheSame = existing.location.lat === newData.location.lat && existing.location.lon === newData.location.lon;

  if (locationRemainsTheSame) {
    combined.location = existing.location;
  } else {
    // Location has changed
    combined.location = {
      lat: newData.location.lat,
      lon: newData.location.lon,
      id: uuid(),
      validAt: new Date() 
    };
  }

  // Are there any new modules that need adding?
  newData.modules.forEach((module) => {

    const match = combined.modules.find((combinedModule) => {
      return module.moduleId === combinedModule.moduleId;
    });

    if (!match) {
      const moduleToAdd = cloneDeep(module);
      moduleToAdd.timeOfLatest = sub(new Date(), {hours: 1}); // this is when we'll start pulling in from.
      moduleToAdd.consecutiveFails = 0;
      combined.modules.push(moduleToAdd);
    }

  });

  return combined;

}


export function reformatPublicData(publicData): DeviceApp[] {
  return publicData.map(reformatPublicDataSingleDevice);
}


export function reformatPublicDataSingleDevice(data): DeviceApp {

  const reformatted: DeviceApp = {
    deviceId: data._id,
    location: {
      lat: round(data.place.location[1], 7), // no point in having more than 7 decimal places
      lon: round(data.place.location[0], 7)
    },
    extras: pick(data.place, ['timezone', 'country', 'altitude', 'city', 'street']),
    modules: []
  };

  Object.keys(data.measures).forEach((moduleId) => {
    
    const moduleData = data.measures[moduleId];

    // Outdoor module
    if (moduleData.type && moduleData.type.includes('temperature')) {
      reformatted.modules.push({
        moduleId,
        types: ['temperature', 'humidity']
        // N.B. we don't care about the time of the readings, or the readings themselves, also we need is the relationship between modules and devices.
      });
    }

    // Indoor module
    if (moduleData.type && moduleData.type.includes('pressure')) {
      reformatted.modules.push({
        moduleId,
        types: ['pressure']
      });
    }

    // Wind module
    if (check.assigned(moduleData.wind_timeutc)) {
      reformatted.modules.push({
        moduleId,
        types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle']  
      });
    }

    // Rain
    if (check.assigned(moduleData.rain_timeutc)) {
      reformatted.modules.push({
        moduleId,
        types: ['rain']  
      });
    }

  });

  return reformatted;

}


