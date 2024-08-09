const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema
const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  ads: [
    {
      adId: {
        type: Schema.Types.ObjectId,
        ref: 'Ads', // Assuming you have an Ads collection
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the updatedAt field on save
CategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a model using the schema
const category = mongoose.model('category', CategorySchema);

module.exports = category;
