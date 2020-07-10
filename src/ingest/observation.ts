export interface Observation {
  madeBySensor?: string;
  hasResult?: Result;
  resultTime?: string;
  location?: Location;
  observedProperty?: string;
  aggregation?: string;
  usedProcedures?: string[];
  phenomenonTime?: PhenomenonTime;
}

interface Result {
  value?: any;
  unit?: string;
  flags?: string[];
}

interface Location {
  id?: string;
  geometry?: Geometry;
  validAt?: string;
}

interface Geometry {
  type?: string;
  coordinates?: any;
}

interface PhenomenonTime {
  hasBeginning: Date;
  hasEnd: Date;
}