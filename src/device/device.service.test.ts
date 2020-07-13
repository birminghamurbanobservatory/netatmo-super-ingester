import {config} from '../config';
import * as logger from 'node-logger';
import {connectDb, disconnectDb} from '../db/mongodb-service';
import * as MongodbMemoryServer from 'mongodb-memory-server';
import {createDevice, updateDevice} from './device.service';


describe('Testing the device service', () => {

  let mongoServer;

  beforeAll(() => {
    // Configure the logger
    logger.configure(config.logger);
  });

  beforeEach(() => {
    // Create fresh database
    mongoServer = new MongodbMemoryServer.MongoMemoryServer();
    return mongoServer.getConnectionString()
    .then((url) => {
      return connectDb(url);
    });    
  });

  afterEach(() => {
    // Disconnect from, then stop, database.
    return disconnectDb()
    .then(() => {
      mongoServer.stop();
      return;
    });
  });  


  test('Updating device modules, e.g. as done when processing the oldest checked device.', async () => {
    // The main thing I'm checking here is if a module is actually removed from the module array if you leave it out of the updates. This is what I want to happen.

    expect.assertions(1);

    // First create a new device
    const deviceToCreate = {
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
          consecutiveFails: 10
        }
      ]
    };

    const device = await createDevice(deviceToCreate);

    // Now let's update it. We give it the full device again. Although none of the device information has actually changed, just the modules.
    const updates = {
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
          timeOfLatest: new Date('2020-07-10T13:14:02.000Z'), // this has updated
          consecutiveFails: 0
        },
        // The pressure module has been completely removed, e.g. because it had too make consecutive fails.
      ]
    };

    const updatedDevice = await updateDevice(device.deviceId, updates);

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
          timeOfLatest: new Date('2020-07-10T13:14:02.000Z'), // this should be updated
          consecutiveFails: 0
        }
        // pressure module should now be gone
      ],
      createdAt: device.createdAt,
      updatedAt: updatedDevice.updatedAt
    };

    expect(updatedDevice).toEqual(expected);

  });





});