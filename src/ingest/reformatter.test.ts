import {measurementsToUrbanObs} from './reformatter';


describe('Testing measurementsToUrbanObs function', () => {

  test('Converts outdoor module as expected', () => {

    const device = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000'),
      location: {
        lat: 52.461884,
        lon: -1.949845,
        id: '971572a3-fb60-421b-91cc-175483705eda',
        validAt: new Date('2020-07-10T16:13:17.000Z')
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        // not much point in filling anything in here as it's the module below that's actually used
      ]
    };

    const module = {
      moduleId: '02:00:00:17:68:62',
      types: ['temperature', 'humidity'],
      timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
      consecutiveFails: 0
    };

    const measurements = [
      {
        time: new Date('2020-07-10T12:15:10.000Z'),
        temperature: 17.8,
        humidity: 88
      }
    ];

    const expected = [
      {
        madeBySensor: 'netatmo-02-00-00-17-68-62-temperature',
        resultTime: '2020-07-10T12:15:10.000Z',
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 17.8,
          unit: 'degree-celsius',
        },
        observedProperty: 'air-temperature',
        aggregation: 'instant',
        usedProcedures: ['netatmo-temperature-instantaneous']
      },
      {
        madeBySensor: 'netatmo-02-00-00-17-68-62-humidity',
        resultTime: '2020-07-10T12:15:10.000Z',
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 88,
          unit: 'percent',
        },
        observedProperty: 'relative-humidity',
        aggregation: 'instant',
        usedProcedures: ['netatmo-humidity-instantaneous']
      }
    ];

    const observations = measurementsToUrbanObs(device, module, measurements);
    expect(observations).toEqual(expected);

  });


  test('Converts rain module as expected', () => {

    const device = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000'),
      location: {
        lat: 52.461884,
        lon: -1.949845,
        id: '971572a3-fb60-421b-91cc-175483705eda',
        validAt: new Date('2020-07-10T16:13:17.000Z')
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        // not much point in filling anything in here as it's the module below that's actually used
      ]
    };

    const module = {
      moduleId: '05:00:00:06:db:60',
      types: ['rain'],
      timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
      consecutiveFails: 0
    };

    const measurements = [
      {
        time: new Date('2020-07-10T12:15:10.000Z'),
        rain: 0.202
      }
    ];

    const expected = [
      {
        madeBySensor: 'netatmo-05-00-00-06-db-60-rain',
        resultTime: '2020-07-10T12:15:10.000Z',
        phenomenonTime: {
          hasBeginning: '2020-07-10T12:10:11.000Z', // N.b. this is from the module's timeOfLatest
          hasEnd: '2020-07-10T12:15:10.000Z'
        },
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 0.202,
          unit: 'millimetre',
        },
        observedProperty: 'precipitation-depth',
        aggregation: 'sum',
        usedProcedures: ['uo-netatmo-precip-depth-derivation']
      },
      {
        madeBySensor: 'netatmo-05-00-00-06-db-60-rain',
        resultTime: '2020-07-10T12:15:10.000Z',
        phenomenonTime: {
          hasBeginning: '2020-07-10T12:10:11.000Z', // N.b. this is from the module's timeOfLatest
          hasEnd: '2020-07-10T12:15:10.000Z'
        },
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 2.43, // we the gap exactly 5 mins it would be 2.42
          unit: 'millimetre-per-hour',
        },
        observedProperty: 'precipitation-rate',
        aggregation: 'average',
        usedProcedures: ['uo-netatmo-precip-rate-derivation']
      },
    ];

    const observations = measurementsToUrbanObs(device, module, measurements);
    expect(observations).toEqual(expected);

  });


  test(`Defaults to a 5 minute window is the module's timeOfLatest is not appropriate for use`, () => {

    const device = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000'),
      location: {
        lat: 52.461884,
        lon: -1.949845,
        id: '971572a3-fb60-421b-91cc-175483705eda',
        validAt: new Date('2020-07-10T16:13:17.000Z')
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        // not much point in filling anything in here as it's the module below that's actually used
      ]
    };

    const module = {
      moduleId: '05:00:00:06:db:60',
      types: ['rain'],
      timeOfLatest: new Date('2020-07-10T09:45:12.000Z'), // this is far to outdated for us to want to use
      consecutiveFails: 0
    };

    const measurements = [
      {
        time: new Date('2020-07-10T12:15:10.000Z'),
        rain: 0.202
      }
    ];

    const expected = [
      {
        madeBySensor: 'netatmo-05-00-00-06-db-60-rain',
        resultTime: '2020-07-10T12:15:10.000Z',
        phenomenonTime: {
          hasBeginning: '2020-07-10T12:10:10.000Z', // defaults to 5 mins before the resultTime
          hasEnd: '2020-07-10T12:15:10.000Z'
        },
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 0.202,
          unit: 'millimetre',
        },
        observedProperty: 'precipitation-depth',
        aggregation: 'sum',
        usedProcedures: ['uo-netatmo-precip-depth-derivation']
      },
      {
        madeBySensor: 'netatmo-05-00-00-06-db-60-rain',
        resultTime: '2020-07-10T12:15:10.000Z',
        phenomenonTime: {
          hasBeginning: '2020-07-10T12:10:10.000Z',
          hasEnd: '2020-07-10T12:15:10.000Z'
        },
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 2.42, // now that the gap is exactly 5 mins this has changed slightly
          unit: 'millimetre-per-hour',
        },
        observedProperty: 'precipitation-rate',
        aggregation: 'average',
        usedProcedures: ['uo-netatmo-precip-rate-derivation']
      },
    ];

    const observations = measurementsToUrbanObs(device, module, measurements);
    expect(observations).toEqual(expected);

  });


  test('Converts indoor module as expected', () => {

    const device = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000'),
      location: {
        lat: 52.461884,
        lon: -1.949845,
        id: '971572a3-fb60-421b-91cc-175483705eda',
        validAt: new Date('2020-07-10T16:13:17.000Z')
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        // not much point in filling anything in here as it's the module below that's actually used
      ]
    };

    const module = {
      moduleId: '70:ee:50:17:eb:1a',
      types: ['pressure'],
      timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
      consecutiveFails: 0
    };

    const measurements = [
      {
        time: new Date('2020-07-10T12:15:10.000Z'),
        pressure: 1012.5
      }
    ];

    const expected = [
      {
        madeBySensor: 'netatmo-70-ee-50-17-eb-1a-pressure',
        resultTime: '2020-07-10T12:15:10.000Z',
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 1012.5,
          unit: 'hectopascal',
        },
        observedProperty: 'air-pressure-at-mean-sea-level',
        aggregation: 'instant',
        usedProcedures: ['netatmo-pressure-instantaneous', 'netatmo-pressure-adjusted-to-sea-level']
      }
    ];

    const observations = measurementsToUrbanObs(device, module, measurements);
    expect(observations).toEqual(expected);

  });



  test('Converts wind module as expected', () => {

    const device = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000'),
      location: {
        lat: 52.461884,
        lon: -1.949845,
        id: '971572a3-fb60-421b-91cc-175483705eda',
        validAt: new Date('2020-07-10T16:13:17.000Z')
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        // not much point in filling anything in here as it's the module below that's actually used
      ]
    };

    const module = {
      moduleId: '06:00:00:04:1f:4e',
      types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle'],
      timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
      consecutiveFails: 0
    };

    const measurements = [
      {
        time: new Date('2020-07-10T12:15:10.000Z'),
        windStrength: 6,
        windAngle: 59,
        gustStrength: 10,
        gustAngle: 125
      }
    ];

    const expected = [
      {
        madeBySensor: 'netatmo-06-00-00-04-1f-4e-wind',
        resultTime: '2020-07-10T12:15:10.000Z',
        phenomenonTime: {
          hasBeginning: '2020-07-10T12:10:11.000Z', // N.b. this is from the module's timeOfLatest
          hasEnd: '2020-07-10T12:15:10.000Z'
        },
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 1.7,
          unit: 'metre-per-second',
        },
        observedProperty: 'wind-speed',
        aggregation: 'average',
        usedProcedures: ['netatmo-wind-speed-5-min-average', 'kilometre-per-hour-to-metre-per-second']
      },
      {
        madeBySensor: 'netatmo-06-00-00-04-1f-4e-wind',
        resultTime: '2020-07-10T12:15:10.000Z',
        phenomenonTime: {
          hasBeginning: '2020-07-10T12:10:11.000Z', // N.b. this is from the module's timeOfLatest
          hasEnd: '2020-07-10T12:15:10.000Z'
        },
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 59,
          unit: 'degree',
        },
        observedProperty: 'wind-direction',
        aggregation: 'average',
        usedProcedures: ['netatmo-wind-direction-5-min-average']
      },
      {
        madeBySensor: 'netatmo-06-00-00-04-1f-4e-wind',
        resultTime: '2020-07-10T12:15:10.000Z',
        phenomenonTime: {
          hasBeginning: '2020-07-10T12:10:11.000Z', // N.b. this is from the module's timeOfLatest
          hasEnd: '2020-07-10T12:15:10.000Z'
        },
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 2.8,
          unit: 'metre-per-second',
        },
        observedProperty: 'wind-speed',
        aggregation: 'maximum', 
        usedProcedures: ['netatmo-wind-speed-5-min-maximum', 'kilometre-per-hour-to-metre-per-second']
      },
      {
        madeBySensor: 'netatmo-06-00-00-04-1f-4e-wind',
        resultTime: '2020-07-10T12:15:10.000Z',
        phenomenonTime: {
          hasBeginning: '2020-07-10T12:10:11.000Z', // N.b. this is from the module's timeOfLatest
          hasEnd: '2020-07-10T12:15:10.000Z'
        },
        location: {
          id: '971572a3-fb60-421b-91cc-175483705eda',
          geometry: {
            type: 'Point',
            coordinates: [-1.949845, 52.461884]
          },
          validAt: '2020-07-10T16:13:17.000Z'
        },
        hasResult: {
          value: 125,
          unit: 'degree',
        },
        observedProperty: 'wind-direction',
        aggregation: 'maximum', // is 'maximum' right to use in this instance?
        usedProcedures: ['netatmo-wind-dir-during-5-min-max-speed']
      }
    ];

    const observations = measurementsToUrbanObs(device, module, measurements);
    expect(observations).toEqual(expected);

  });


});