import {measurementsToUrbanObs} from './reformatter';


describe('Testing measurementsToUrbanObs function', () => {

  test('Converts as expected', () => {

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



});