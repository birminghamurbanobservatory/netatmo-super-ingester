import {needToUpdateDevices} from './ingest';


describe('Testing of needToUpdateDevices function', () => {

  test('Should return true if no lastUpdate provided', () => {
    const result = needToUpdateDevices(undefined, 60);
    expect(result).toBe(true);
  });

  test('Should return true if max gap has been exceeded', () => {
    const timeNow = Date.now();
    const lastUpdate = new Date(timeNow - (1000 * 60 * 33)); // 33 mins ago  
    const result = needToUpdateDevices(lastUpdate, 30);
    expect(result).toBe(true);
  });

  test('Should return false if max gap has NOT been exceeded', () => {
    const timeNow = Date.now();
    const lastUpdate = new Date(timeNow - (1000 * 60 * 33)); // 33 mins ago  
    const result = needToUpdateDevices(lastUpdate, 40);
    expect(result).toBe(false);
  });

});