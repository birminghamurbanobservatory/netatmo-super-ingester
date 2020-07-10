import Device from './device.model';
import {DeviceNotFound} from './errors/DeviceNotFound';
import {GetDeviceFail} from './errors/GetDeviceFail';
import {DeviceApp} from './device-app';
import {UpdateDeviceFail} from './errors/UpdateDeviceFail';
import {CreateDeviceFail} from './errors/CreateDeviceFail';
import {GetOldestLastCheckedDeviceFail} from './errors/GetOldestLastCheckedDeviceFail';


export async function createDevice(device: DeviceApp): Promise<DeviceApp> {

  let createdDevice;
  try {
    createdDevice = await Device.create(device);
  } catch (err) {
    throw new CreateDeviceFail(`Failed to create a new document for device '${device.deviceId}'.`, err.message);
  }

  return deviceDbToApp(createdDevice);

}


export async function getDevice(deviceId: string): Promise<DeviceApp> {

  let device;
  try {
    device = await Device.findOne(
      {
        deviceId
      }       
    ).exec();
  } catch (err) {
    throw new GetDeviceFail(undefined, err.message);
  }

  if (!device) {
    throw new DeviceNotFound(`A document for device '${deviceId}' could not be found`);
  }

  return deviceDbToApp(device);

}


export async function getOldestLastCheckedDevice(): Promise<DeviceApp> {

  let device;
  try {
    device = await Device.findOne(
      {},
      {},
      {sort: {lastChecked: 1}} // this should find the oldest      
    ).exec();
  } catch (err) {
    throw new GetOldestLastCheckedDeviceFail(undefined, err.message);
  }

  if (!device) {
    throw new DeviceNotFound(`No device could not be found`);
  }

  return deviceDbToApp(device);

}



export async function updateDevice(deviceId: string, updates): Promise<DeviceApp> {

  let updatedDevice;
  try {
    updatedDevice = await Device.findOneAndUpdate(
      {
        deviceId
      },
      updates,
      {
        new: true,
        runValidators: true        
      } 
    );
  } catch (err) {
    throw new UpdateDeviceFail(`Failed to update document for device '${deviceId}'.`, err.message);
  }

  return deviceDbToApp(updatedDevice);

}




function deviceDbToApp(device: any): DeviceApp {

  const deviceApp = device.toObject();
  deviceApp.id = deviceApp._id.toString();
  delete deviceApp._id;
  delete deviceApp.__v;
  return deviceApp;

}