import Device from './device.model';
import {DeviceNotFound} from './errors/DeviceNotFound';
import {GetDeviceFail} from './errors/GetDeviceFail';
import {DeviceApp} from './device-app';
import {UpdateDeviceFail} from './errors/UpdateDeviceFail';
import {CreateDeviceFail} from './errors/CreateDeviceFail';
import {GetOldestLastCheckedDeviceFail} from './errors/GetOldestLastCheckedDeviceFail';
import {DeleteDeviceFail} from './errors/DeleteDeviceFail';
import {CountDevicesFail} from './errors/CountDevicesFail';


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
    throw new DeviceNotFound(`No oldest device could be found`);
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


export async function deleteDevice(deviceId: string): Promise<DeviceApp> {

  let deletedDevice;
  try {
    deletedDevice = await Device.findOneAndDelete({deviceId});
  } catch (err) {
    throw new DeleteDeviceFail(`Failed to delete document for device '${deviceId}'.`, err.message);
  }

  if (!deletedDevice) {
    throw new DeviceNotFound(`Could not find device ${deviceId} and therefore could not delete it.`);
  }

  return deviceDbToApp(deletedDevice);

}


export async function countDevices(): Promise<number> {

  let count;
  try {
    count = await Device.countDocuments({});
  } catch (err) {
    throw new CountDevicesFail('Failed to count devices.', err.message);
  }

  return count;
}




function deviceDbToApp(device: any): DeviceApp {

  const deviceApp = device.toObject();
  delete deviceApp._id; // don't need this.
  delete deviceApp.__v;
  return deviceApp;

}