import {reformatPublicData, combineExistingDeviceWithNewData} from './ingest-device-list';
import * as check from 'check-types';

describe('Testing of reformatPublicData function', () => {

  test('Converts public data correctly', () => {

    const publicData = [
      {
        _id: '70:ee:50:17:eb:1a',
        place: {
          location: [
            -1.949845,
            52.461884
          ],
          timezone: 'Europe/London',
          country: 'GB',
          altitude: 160,
          city: 'Birmingham',
          street: 'Park Hill Road'
        },
        mark: 14,
        measures: {
          '02:00:00:17:68:62': {
            res: {
              '1581094840': [
                6.7,
                81
              ]
            },
            type: [
              'temperature',
              'humidity'
            ]
          },
          '70:ee:50:17:eb:1a': {
            res: {
              '1581094862': [
                1012.2
              ]
            },
            type: [
              'pressure'
            ]
          },
          '05:00:00:06:db:60': {
            rain_60min: 0,
            rain_24h: 0,
            rain_live: 0,
            rain_timeutc: 1581094859
          },
          '06:00:00:04:1f:4e': {
            wind_strength: 6,
            wind_angle: 59,
            gust_strength: 10,
            gust_angle: 125,
            wind_timeutc: 1581094859
          }
        },
        modules: [
          '05:00:00:06:db:60',
          '02:00:00:17:68:62',
          '06:00:00:04:1f:4e'
        ],
        module_types: {
          '05:00:00:06:db:60': 'NAModule3',
          '02:00:00:17:68:62': 'NAModule1',
          '06:00:00:04:1f:4e': 'NAModule2'
        }
      }
    ];

    const expected = ([
      {
        deviceId: '70:ee:50:17:eb:1a',
        location: {
          lat: 52.461884,
          lon: -1.949845
        },
        extras: {
          timezone: 'Europe/London',
          country: 'GB',
          altitude: 160,
          city: 'Birmingham',
          street: 'Park Hill Road'
        },
        modules: [
          {
            moduleId: '02:00:00:17:68:62',
            types: ['temperature', 'humidity']
          },
          {
            moduleId: '70:ee:50:17:eb:1a',
            types: ['pressure']
          },
          {
            moduleId: '05:00:00:06:db:60',
            types: ['rain']
          },
          {
            moduleId: '06:00:00:04:1f:4e',
            types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle']
          }     
        ]
      }
    ]);

    const reformatted = reformatPublicData(publicData);
    expect(reformatted).toEqual(expected);

  });

});




describe('Testing of combineExistingDeviceWithNewData function', () => {

  test('It combines as expected when nothing has changed', () => {
    
    const existing = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
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
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity'],
          timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure'],
          timeOfLatest: new Date('2020-07-10T12:10:09.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '05:00:00:06:db:60',
          types: ['rain'],
          timeOfLatest: new Date('2020-07-10T12:10:12.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '06:00:00:04:1f:4e',
          types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle'],
          timeOfLatest: new Date('2020-07-10T12:10:05.000Z'),
          consecutiveFails: 0
        }     
      ]
    };

    const newData = {
      deviceId: '70:ee:50:17:eb:1a',
      location: {
        lat: 52.461884,
        lon: -1.949845
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity']
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure']
        },
        {
          moduleId: '05:00:00:06:db:60',
          types: ['rain']
        },
        {
          moduleId: '06:00:00:04:1f:4e',
          types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle']
        }     
      ]
    };

    const expected = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
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
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity'],
          timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure'],
          timeOfLatest: new Date('2020-07-10T12:10:09.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '05:00:00:06:db:60',
          types: ['rain'],
          timeOfLatest: new Date('2020-07-10T12:10:12.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '06:00:00:04:1f:4e',
          types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle'],
          timeOfLatest: new Date('2020-07-10T12:10:05.000Z'),
          consecutiveFails: 0
        }     
      ]
    };

    const combined = combineExistingDeviceWithNewData(existing, newData);
    expect(combined).toEqual(expected);
  });


  test('Throws error when deviceIds mismatch', () => {
    
    const existing = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
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
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure'],
          timeOfLatest: new Date('2020-07-10T12:10:09.000Z'),
          consecutiveFails: 0
        }   
      ]
    };

    const newData = {
      deviceId: '70:ee:50:11:cc:bb',
      location: {
        lat: 52.461884,
        lon: -1.949845
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure']
        }   
      ]
    };

    expect(() => {
      combineExistingDeviceWithNewData(existing, newData);
    }).toThrow();

  });


  test('It adds a new module correctly', () => {
    
    const existing = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
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
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity'],
          timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure'],
          timeOfLatest: new Date('2020-07-10T12:10:09.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '05:00:00:06:db:60',
          types: ['rain'],
          timeOfLatest: new Date('2020-07-10T12:10:12.000Z'),
          consecutiveFails: 0
        }
      ]
    };

    const newData = {
      deviceId: '70:ee:50:17:eb:1a',
      location: {
        lat: 52.461884,
        lon: -1.949845
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity']
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure']
        },
        {
          moduleId: '05:00:00:06:db:60',
          types: ['rain']
        },
        {
          moduleId: '06:00:00:04:1f:4e',
          types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle']
        }     
      ]
    };

    const expected = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
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
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity'],
          timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure'],
          timeOfLatest: new Date('2020-07-10T12:10:09.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '05:00:00:06:db:60',
          types: ['rain'],
          timeOfLatest: new Date('2020-07-10T12:10:12.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '06:00:00:04:1f:4e',
          types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle'],
          // we'll need to populate this in a moment
          consecutiveFails: 0
        }     
      ]
    };

    const combined = combineExistingDeviceWithNewData(existing, newData);

    // Because timeOfLatest is set to the current time, we'll need to add this to our expected result using the value that was assigned.
    const newModule = combined.modules.find((module) => module.moduleId === '06:00:00:04:1f:4e');
    expect(newModule.timeOfLatest).toBeInstanceOf(Date);
    expected.modules.forEach((module) => {
      if (module.moduleId === '06:00:00:04:1f:4e') {
        module.timeOfLatest = newModule.timeOfLatest;
      }
    });

    expect(combined).toEqual(expected);
  });


  test('It does not remove existing modules', () => {

    // We only want modules to removed when lots of consequtive getMeasure requests show that the module clearly isn't on this device anymore.
    
    const existing = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
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
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity'],
          timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure'],
          timeOfLatest: new Date('2020-07-10T12:10:09.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '05:00:00:06:db:60',
          types: ['rain'],
          timeOfLatest: new Date('2020-07-10T12:10:12.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '06:00:00:04:1f:4e',
          types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle'],
          timeOfLatest: new Date('2020-07-10T12:10:05.000Z'),
          consecutiveFails: 0
        }     
      ]
    };

    const newData = {
      deviceId: '70:ee:50:17:eb:1a',
      location: {
        lat: 52.461884,
        lon: -1.949845
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 160,
        city: 'Birmingham',
        street: 'Park Hill Road'
      },
      modules: [
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity']
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure']
        },
        // N.B. how the new data does not have the rain module present.
        {
          moduleId: '06:00:00:04:1f:4e',
          types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle']
        }     
      ]
    };

    const expected = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
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
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity'],
          timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '70:ee:50:17:eb:1a',
          types: ['pressure'],
          timeOfLatest: new Date('2020-07-10T12:10:09.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '05:00:00:06:db:60',
          types: ['rain'],
          timeOfLatest: new Date('2020-07-10T12:10:12.000Z'),
          consecutiveFails: 0
        },
        {
          moduleId: '06:00:00:04:1f:4e',
          types: ['windStrength', 'windAngle', 'gustStrength', 'gustAngle'],
          timeOfLatest: new Date('2020-07-10T12:10:05.000Z'),
          consecutiveFails: 0
        }     
      ]
    };

    const combined = combineExistingDeviceWithNewData(existing, newData);
    expect(combined).toEqual(expected);
  });


  test('It updates the location and extras', () => {
    
    const existing = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
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
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity'],
          timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
          consecutiveFails: 0
        }
      ]
    };

    const newData = {
      deviceId: '70:ee:50:17:eb:1a',
      location: {
        lat: 50.953,
        lon: -2.453
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 10,
        city: 'Cardiff',
        street: 'Southgate Road'
      },
      modules: [
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity']
        }   
      ]
    };

    const expected: any = {
      deviceId: '70:ee:50:17:eb:1a',
      lastChecked: new Date('2020-07-10T12:11:11.000Z'),
      location: {
        lat: 50.953,
        lon: -2.453
        // We'll need to populate the id and validAt once we know their new values
      },
      extras: {
        timezone: 'Europe/London',
        country: 'GB',
        altitude: 10,
        city: 'Cardiff',
        street: 'Southgate Road'
      },
      modules: [
        {
          moduleId: '02:00:00:17:68:62',
          types: ['temperature', 'humidity'],
          timeOfLatest: new Date('2020-07-10T12:10:11.000Z'),
          consecutiveFails: 0
        }   
      ]
    };

    const combined = combineExistingDeviceWithNewData(existing, newData);

    const newLocationId = combined.location.id;
    expect(check.nonEmptyString(newLocationId)).toBe(true);
    const newLocationValidAt = combined.location.validAt;
    expect(check.date(newLocationValidAt)).toBe(true);
    expected.location.id = newLocationId;
    expected.location.validAt = newLocationValidAt;
    expect(combined).toEqual(expected);
  });


});