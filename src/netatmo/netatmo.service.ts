const axios = require('axios').default;
import {Credentials} from './credentials.class';
import * as querystring from 'querystring';
import * as check from 'check-types';
import * as logger from 'node-logger';
import retry from 'bluebird-retry';
import {GetMeasureParams} from './get-measure-params';
import {round} from 'lodash';
import {Measurement} from './measurement';

let _cachedAccessTokenObj: {accessToken: string, expiresAt: Date};

//-------------------------------------------------
// Get Access Token
//-------------------------------------------------
export async function getAccessToken(credentials: Credentials): Promise<string> {

  let response;

  try {
    
    // Need to use querystring.stringify as Netatmo expects body to be x-www-form-urlencoded formatted
    response = await axios.post(
      'https://api.netatmo.net/oauth2/token',
      querystring.stringify({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        username: credentials.username,
        password: credentials.password,
        grant_type: 'password' 
      })
    );

  } catch (err) {

    let errMsg = `Token request failed. Reason: ${err.message}.`;
    if (err.response && err.response.data && err.response.data.error) {
      errMsg += ` Netatmo Error: ${err.response.data.error}.`;
    }
    throw new Error(errMsg);
    
  }

  const accessToken = response.data.access_token;
  if (check.not.nonEmptyString(accessToken)) {
    throw new Error('Did not receive an access_token from the Netamo API');
  }
  return accessToken;

}


//-------------------------------------------------
// Get Access Token Cached
//-------------------------------------------------
export async function getAccessTokenWithCaching(credentials: Credentials): Promise<string> {

  if (_cachedAccessTokenObj) {
    const buffer = 1000 * 60; // a minute, leaves plenty of time to make the actual request, even with a delay.
    if ((Date.now() + buffer) < _cachedAccessTokenObj.expiresAt.getTime()) {
      return _cachedAccessTokenObj.accessToken;
    }
  }

  let response;

  try {
    
    // Need to use querystring.stringify as Netatmo expects body to be x-www-form-urlencoded formatted
    response = await axios.post(
      'https://api.netatmo.net/oauth2/token',
      querystring.stringify({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        username: credentials.username,
        password: credentials.password,
        grant_type: 'password' 
      })
    );

  } catch (err) {

    let errMsg = `Token request failed. Reason: ${err.message}.`;
    if (err.response && err.response.data && err.response.data.error) {
      errMsg += ` Netatmo Error: ${err.response.data.error}.`;
    }
    throw new Error(errMsg);
    
  }

  const accessToken = response.data.access_token;
  if (check.not.nonEmptyString(accessToken)) {
    throw new Error('Did not receive an access_token from the Netamo API');
  }

  _cachedAccessTokenObj = {
    accessToken,
    expiresAt: new Date(Date.now() + (response.data.expires_in * 1000))
  };

  return accessToken;

}


//-------------------------------------------------
// Get Public Data
//-------------------------------------------------
export async function getPublicData(params: {accessToken: string; latNE: number; lonNE: number; latSW: number; lonSW: number}): Promise<any> {

  let response;
  try {

    response = await axios.get(
      'https://api.netatmo.net/api/getpublicdata',
      {
        headers: {Authorization: `Bearer ${params.accessToken}`},
        params: {
          lat_ne: params.latNE,
          lon_ne: params.lonNE,
          lat_sw: params.latSW,
          lon_sw: params.lonSW
        }
      }
    );

  } catch (err) {

    let errMsg = `Public data request failed. Reason: ${err.message}.`;
    if (err.response && err.response.data && err.response.data.error) {
      logger.debug('Netatmo error response', err.response.data);
      if (check.nonEmptyString(err.response.data.error)) {
        errMsg += ` Netatmo Error: ${err.response.data.error}.`;
      }
      if (check.nonEmptyObject(err.response.data.error) && check.nonEmptyString(err.response.data.error.message)) {
        errMsg += ` Netatmo Error: ${err.response.data.error.message}.`;
      }
    }
    throw new Error(errMsg);

  }

  if (response.data && Array.isArray(response.data.body)) {
    return response.data.body;
  } else {
    throw new Error('Netatmo getpublicdata response is not formatted as expected');
  }

}



//-------------------------------------------------
// getPublicData with retries
//-------------------------------------------------
// The getpublicdata point has been returning the following error a lot:
// {
//     "error": {
//         "message": "Internal error",
//         "code": 500
//     }
// }
// With no obvious reason as to the cause. In postman I can make the request and it will work fine one moment, then return this error the next.
// The following function adds a wrapper around the request, in order to keep retrying a set number of times.
export async function getPublicDataWithRetries(params: any, nRetries = 5): Promise<{publicData: any; successfulOnAttempt: number}> {

  let attemptNumber = 1;

  const publicData = await retry(async () => {
    let data;
    try {
      data = await getPublicData(params);
      logger.debug(`Successful on attempt number ${attemptNumber}`);
    } catch (error) {
      logger.debug(`Failed attempt number ${attemptNumber}`);
      attemptNumber += 1;
      throw error; // important to throw it again in order for it to retry
    }
    return data;
  }, {
    interval: 1000, // initial wait time between attempts in millisecond
    max_tries: nRetries, // maximum number of attempts
    throw_original: true // to throw the last thrown error instance rather than a timeout error.
  });

  return {publicData, successfulOnAttempt: attemptNumber};

}



//-------------------------------------------------
// Get Measure
//-------------------------------------------------
export async function getMeasure(params: GetMeasureParams): Promise<Measurement[]> {

  const formattedParams: any = {
    access_token: params.accessToken,
    scale: params.scale || 'max',
    device_id: params.deviceId,
    module_id: params.moduleId,
    type: params.type.join(','),
    optimize: false, // the data is far easier to work with when not optimised.
  };

  if (params.dateBegin) {
    formattedParams.date_begin = round(params.dateBegin.getTime() / 1000);
  }

  if (params.dateEnd) {
    formattedParams.date_end = round(params.dateEnd.getTime() / 1000);
  }

  let response;
  try {

    response = await axios.get(
      'https://api.netatmo.net/api/getmeasure',
      {
        params: formattedParams
      }
    );

  } catch (err) {

    let errMsg = `getMeasure request failed. Reason: ${err.message}.`;
    if (err.response && err.response.data && err.response.data.error) {
      logger.debug('Netatmo error response', err.response.data);
      if (check.nonEmptyString(err.response.data.error)) {
        errMsg += ` Netatmo Error: ${err.response.data.error}.`;
      }
      if (check.nonEmptyObject(err.response.data.error) && check.nonEmptyString(err.response.data.error.message)) {
        errMsg += ` Netatmo Error: ${err.response.data.error.message}.`;
      }
    }
    throw new Error(errMsg);

  }

  if (response.data && check.object(response.data.body)) {
    const measurements = optimisedGetMeasureBodyToMeasurements(response.data.body, params.type);
    return measurements;
  } else {
    logger.debug(response.data);
    throw new Error('Netatmo getmeasure response is not formatted as expected');
  }

}


export function optimisedGetMeasureBodyToMeasurements(body: any, types: string[]): Measurement[] {

  const measurements = [];

  Object.keys(body).forEach((netTimeStamp) => {
    const measurement: Measurement = {
      time: new Date(Number(netTimeStamp) * 1000)
    };
    types.forEach((type, idx) => {
      const value = body[netTimeStamp][idx];
      // let's filter out any null values
      if (value !== null) {
        measurement[type] = value;
      }
    });
    // Not much point in adding the measurement if all values are null
    if (Object.keys(measurement).length > 1) {
      measurements.push(measurement);
    }
  });

  return measurements;

}