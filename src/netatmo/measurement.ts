export interface Measurement {
  time: Date,
  temperature?: number;
  humidity?: number;
  rain?: number;
  pressure?: number;
  windStrength?: number;
  windAngle?: number;
  gustStrength?: number;
  gustAngle?: number;
}