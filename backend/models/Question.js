const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    value: {
      type: Number,
      enum: [1, -1]
    }
  }],
  answers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  }],
  views: {
    type: Number,
    default: 0
  },
  isAnswered: {
    type: Boolean,
    default: false
  },
  selectedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  score: {
    type: Number,
    default: 0
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual for vote count
questionSchema.virtual('voteCount').get(function() {
  return this.votes.reduce((total, vote) => total + vote.value, 0);
});

// Update score before saving
questionSchema.pre('save', function(next) {
  this.score = this.voteCount - (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
  next();
});

// Index for search
questionSchema.index({ title: 'text', body: 'text', tags: 'text' });

module.exports = mongoose.model('Question', questionSchema);
