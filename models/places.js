const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  placeId: {
    type:String,
    default:''
  },
  favplace: {
    type: Object,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Place = mongoose.model('Place', PlaceSchema);

module.exports = Place;