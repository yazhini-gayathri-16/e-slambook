const mongoose = require("mongoose");

const slam = new mongoose.Schema({
  // Yourself section
  name: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  phonenumber: {
    type: String,
    required: true
  },
  instagram: {
    type: String,
    required: true
  },
  birthday: {
    type: Date,
    required: true
  },
  obsession: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Photo is required'
    }
  },

  // You section
  talent: {
    type: String,
    required: true
  },
  darksecret: {
    type: String,
    required: true
  },
  food: {
    type: String,
    required: true
  },
  favorite: {
    type: String,
    required: true
  },

  // Us section
  howWeMet: {
    type: String,
    required: true
  },
  firstImpression: {
    type: String,
    required: true
  },
  chaos: {
    type: String,
    required: true
  },
  likeAboutMe: {
    type: String,
    required: true
  },
  dislikeAboutMe: {
    type: String,
    required: true
  },
  nicknameForMe: {
    type: String,
    required: true
  },
  favThingAboutMe: {
    type: String,
    required: true
  },
  favMemory: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Slam', slam);