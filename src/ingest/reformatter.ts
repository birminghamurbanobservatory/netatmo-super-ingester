import {Observation} from './observation';
import {Measurement} from '../netatmo/measurement';
import {DeviceApp} from '../device/device-app';
import {sub} from 'date-fns';
import * as check from 'check-types';



// Expect measurements from a single module at a time.
export function measurementsToUrbanObs(device: DeviceApp, module, measurements: Measurement[]): Observation[] {

  const observations = [];

  const location = {
    id: device.location.id,
    geometry: {
      type: 'Point',
      coordinates: [device.location.lon, device.location.lat]
    },
    validAt: device.location.validAt.toISOString()
  };

  const possibleTypes = [
    'temperature',
    'humidity',
    'pressure',
    'rain',
    'windStrength', 
    'windAngle', 
    'gustStrength', 
    'gustAngle'
  ];

  // The time between measurements isn't always exactly 5 minutes, so we'll want to remember what the time of the previous timestep was so we can set the hasBeginning value.
  // However, for the very first measurement there won't be a previous timestep, but we might be able to use the modules timeOfLatest value if it looks sensible.
  let previousTimestep = module.timeOfLatest;

  measurements.forEach((measurement) => {

    // Assumes the getMeasure used 'max' from the scale
    const sixMinsBeforeMeasurementTime = sub(measurement.time, {minutes: 6});
    const fourMinsBeforeMeasurementTime = sub(measurement.time, {minutes: 4});
    const fiveMinsBeforeMeasurementTime = sub(measurement.time, {minutes: 5});
    const usePreviousTimestep = (previousTimestep > sixMinsBeforeMeasurementTime) && (previousTimestep > fourMinsBeforeMeasurementTime);
    const hasBeginning = usePreviousTimestep ? previousTimestep : fiveMinsBeforeMeasurementTime;

    possibleTypes.forEach((type) => {
      if (check.assigned(measurement[type])) {

        //------------------------
        // Temperature
        //------------------------
        if (type === 'temperature') {
          const tempObservation = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            location,
            hasResult: {
              value: measurement[type],
              unit: 'degree-celsius'
            },
            observedProperty: 'air-temperature',
            aggregation: 'instant',
            usedProcedures: ['netatmo-temperature-instantaneous']
          };
          observations.push(tempObservation);
        }

        //------------------------
        // Humidity
        //------------------------
        if (type === 'humidity') {
          const tempObservation = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            location,
            hasResult: {
              value: measurement[type],
              unit: 'percent'
            },
            observedProperty: 'relative-humidity',
            aggregation: 'instant',
            usedProcedures: ['netatmo-humidity-instantaneous']
          };
          observations.push(tempObservation);
        }


        // TODO: Got other variables to add

      }
    });

    previousTimestep = measurement.time;

  });

  return observations;
}



export function generateSensorId(moduleId: string, type: string): string {

  const mappings = {
    temperature: 'temperature',
    humidity: 'humidity',
    rain: 'rain',
    pressure: 'pressure',
    windStrength: 'wind', 
    windAngle: 'wind', 
    gustStrength: 'wind', 
    gustAngle: 'wind'
  };

  const suffix = mappings[type];

  if (!suffix) throw new Error(`No mapping found for type ${type}`);

  const urlSafeModuleId = moduleId.replace(/:/g, '-');
  const sensorId = `netatmo-${urlSafeModuleId}-${suffix}`;
  return sensorId;
}