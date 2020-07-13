import {Observation} from './observation';
import {Measurement} from '../netatmo/measurement';
import {DeviceApp} from '../device/device-app';
import {sub} from 'date-fns';
import * as check from 'check-types';
import {calculateRainRate} from '../utils/rain.service';
import {kilometrePerHourToMetresPerSecond} from '../utils/wind.service';



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
    const usePreviousTimestep = (previousTimestep > sixMinsBeforeMeasurementTime) && (previousTimestep < fourMinsBeforeMeasurementTime);
    const hasBeginning = usePreviousTimestep ? previousTimestep : fiveMinsBeforeMeasurementTime;

    possibleTypes.forEach((type) => {
      if (check.assigned(measurement[type])) {

        //------------------------
        // Temperature
        //------------------------
        if (type === 'temperature') {
          const obs = {
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
          observations.push(obs);
        }

        //------------------------
        // Humidity
        //------------------------
        if (type === 'humidity') {
          const obs = {
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
          observations.push(obs);
        }

        //------------------------
        // Rain
        //------------------------
        if (type === 'rain') {

          // depth
          const depthObs = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            phenomenonTime: {
              hasBeginning: hasBeginning.toISOString(),
              hasEnd: measurement.time.toISOString()
            },
            location,
            hasResult: {
              value: measurement[type],
              unit: 'millimetre'
            },
            observedProperty: 'precipitation-depth',
            aggregation: 'sum',
            usedProcedures: ['uo-netatmo-precip-depth-derivation']
          };
          observations.push(depthObs);

          // rate
          const rateObs = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            phenomenonTime: {
              hasBeginning: hasBeginning.toISOString(),
              hasEnd: measurement.time.toISOString()
            },
            location,
            hasResult: {
              value: calculateRainRate(hasBeginning, measurement.time, measurement[type]),
              unit: 'millimetre-per-hour'
            },
            observedProperty: 'precipitation-rate',
            aggregation: 'average',
            usedProcedures: ['uo-netatmo-precip-rate-derivation']
          };
          observations.push(rateObs);

        }

        //------------------------
        // Pressure
        //------------------------
        if (type === 'pressure') {
          const obs = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            location,
            hasResult: {
              value: measurement[type],
              unit: 'hectopascal'
            },
            observedProperty: 'air-pressure-at-mean-sea-level',
            aggregation: 'instant',
            usedProcedures: ['netatmo-pressure-instantaneous', 'netatmo-pressure-adjusted-to-sea-level']
          };
          observations.push(obs);
        }

        //------------------------
        // Wind Speed
        //------------------------
        if (type === 'windStrength') {
          const obs = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            phenomenonTime: {
              hasBeginning: hasBeginning.toISOString(),
              hasEnd: measurement.time.toISOString()
            },
            location,
            hasResult: {
              value: kilometrePerHourToMetresPerSecond(measurement[type]),
              unit: 'metre-per-second'
            },
            observedProperty: 'wind-speed',
            aggregation: 'average',
            usedProcedures: ['netatmo-wind-speed-5-min-average', 'kilometre-per-hour-to-metre-per-second']
          };
          observations.push(obs);
        }

        //------------------------
        // Wind speed maximum
        //------------------------
        if (type === 'gustStrength') {
          const obs = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            phenomenonTime: {
              hasBeginning: hasBeginning.toISOString(),
              hasEnd: measurement.time.toISOString()
            },
            location,
            hasResult: {
              value: kilometrePerHourToMetresPerSecond(measurement[type]),
              unit: 'metre-per-second'
            },
            observedProperty: 'wind-speed',
            aggregation: 'maximum',
            usedProcedures: ['netatmo-wind-speed-5-min-maximum', 'kilometre-per-hour-to-metre-per-second']
          };
          observations.push(obs);
        }

        //------------------------
        // Wind Direction
        //------------------------
        if (type === 'windAngle') {
          const obs = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            phenomenonTime: {
              hasBeginning: hasBeginning.toISOString(),
              hasEnd: measurement.time.toISOString()
            },
            location,
            hasResult: {
              value: measurement[type],
              unit: 'degree'
            },
            observedProperty: 'wind-direction',
            aggregation: 'average',
            usedProcedures: ['netatmo-wind-direction-5-min-average']
          };
          observations.push(obs);
        }

        //------------------------
        // Wind Gust Direction
        //------------------------
        if (type === 'gustAngle') {
          const obs = {
            madeBySensor: generateSensorId(module.moduleId, type),
            resultTime: measurement.time.toISOString(),
            phenomenonTime: {
              hasBeginning: hasBeginning.toISOString(),
              hasEnd: measurement.time.toISOString()
            },
            location,
            hasResult: {
              value: measurement[type],
              unit: 'degree'
            },
            observedProperty: 'wind-direction',
            aggregation: 'maximum', // is 'maximum' the right thing to use here?
            usedProcedures: ['netatmo-wind-dir-during-5-min-max-speed']
          };
          observations.push(obs);
        }

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