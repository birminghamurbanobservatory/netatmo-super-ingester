import {round} from 'lodash';


/**
 * Calculates the rate per hour.
 * @param from 
 * @param to 
 * @param depth - if the depth is in millimetres, then it'll be the rate in mm/hr
 */
export function calculateRainRate(from: Date, to: Date, depth: number): number {

  const fromMs = from.getTime();
  const toMs = to.getTime();

  if (fromMs >= toMs) {
    throw new Error(`'from' date must be greater than 'to' date`);
  }

  if (depth === 0) {
    return 0;
  }

  const diffInMs = toMs - fromMs;
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const rate = depth / diffInHours;
  const nDecimalPlaces = 2;
  return round(rate, nDecimalPlaces);

}