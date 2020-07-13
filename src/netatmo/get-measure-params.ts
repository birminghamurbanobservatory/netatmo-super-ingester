export interface GetMeasureParams {
  deviceId: string;
  moduleId: string;
  scale?: string; // e.g. 'max'
  accessToken: string;
  type: string[]; //e.g. ['temperature', 'humidity'] 
  dateBegin?: Date; 
  dateEnd?: Date; 
}