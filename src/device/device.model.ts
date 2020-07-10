import * as mongoose from 'mongoose';


const moduleSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    required: true
  },
  types: {
    type: [String],
    required: true
  },
  timeOfLatest: {
    type: Date,
    required: true
  },
  // Keep a tally of failed getMeasure requests, could come in handy for diagnosing if a module is no longer connected to a particular device, and therefore we should delete this module to save making unnesecary requests in the future.
  consecutiveFails: {
    type: Number,
    default: 0
  } 
}, {
  _id : false // don't give these subdocuments a _id
});


const schema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  lastChecked: {
    type: Date,
    required: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lon: {
      type: Number,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    validAt: {
      type: Date,
      required: true
    }
  },
  extras: {
    timezone: String,
    country: String,
    altitude: Number,
    city: String,
    street: String
  },  
  modules: [moduleSchema]
}, {
  timestamps: true, // automatically adds createdAt and updatedAt fields
});   


//-------------------------------------------------
// Indexes
//-------------------------------------------------
schema.index({deviceId: 1}, {unique: true}); // prevents duplicates
schema.index({lastChecked: 1}); // so we can quickly find the device which has gone the longest without being checked


//-------------------------------------------------
// Create Model (and expose it to our app)
//-------------------------------------------------
export default mongoose.model('Device', schema);