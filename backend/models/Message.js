const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      default: 'general',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
