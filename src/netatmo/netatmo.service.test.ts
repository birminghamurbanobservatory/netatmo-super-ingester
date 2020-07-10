import {optimisedGetMeasureBodyToMeasurements} from './netatmo.service';


describe('Testing optimisedGetMeasureBodyToMeasurements function', () => {

  test('Converts normal body as expected', () => {
    
    const body = {
      // The netatmo response has these timestamps in string form
      '1585958504': [
        7.3,
        78
      ],
      '1585958813': [
        7.4,
        79
      ],
    };

    const types = ['temperature', 'humidity'];

    const expected = [
      {
        time: new Date('2020-04-04T00:01:44.000Z'),
        temperature: 7.3,
        humidity: 78
      },
      {
        time: new Date('2020-04-04T00:06:53.000Z'),
        temperature: 7.4,
        humidity: 79
      }
    ];

    const measurements = optimisedGetMeasureBodyToMeasurements(body, types);
    expect(measurements).toEqual(expected);

  });


  test('Handles body with no reaadings', () => {
    const body = {};
    const types = ['temperature', 'humidity'];
    const expected = [];

    const measurements = optimisedGetMeasureBodyToMeasurements(body, types);
    expect(measurements).toEqual(expected);
  });


  test('Handles null values', () => {
    
    const body = {
      // The netatmo response has these timestamps in string form
      '1585958504': [
        null,
        null
      ],
      '1585958813': [
        7.4,
        null
      ],
    };

    const types = ['temperature', 'humidity'];

    const expected = [
      {
        time: new Date('2020-04-04T00:06:53.000Z'),
        temperature: 7.4,
      }
    ];

    const measurements = optimisedGetMeasureBodyToMeasurements(body, types);
    expect(measurements).toEqual(expected);

  });


});