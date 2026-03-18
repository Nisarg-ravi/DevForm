const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 30,
    match: /^[a-z0-9]+$/, // Only lowercase letters and numbers
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  description: {
    type: String,
    maxlength: 500,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  memberCount: {
    type: Number,
    default: 0,
  },
  postCount: {
    type: Number,
    default: 0,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  rules: [{
    title: String,
    description: String,
  }],
  avatar: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Index for search
communitySchema.index({ name: 1 });
communitySchema.index({ displayName: 'text', description: 'text' });

module.exports = mongoose.model('Community', communitySchema);

