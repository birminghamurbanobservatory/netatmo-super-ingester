export interface DeviceApp {
  deviceId: string;
  lastChecked?: Date;
  location: Location;
  extras: Extras;
  modules: Module[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface Location {
  lat: number;
  lon: number;
  id?: string;
  validAt?: Date;
}

interface Extras {
  timezone: string;
  country: string;
  altitude: number;
  city: string;
  street: string;
}

interface Module {
  moduleId: string;
  types: string[];
  timeOfLatest?: Date;
  consecutiveFails?: number;
}
