// const mongoose = require('mongoose');

// const formSchema = new mongoose.Schema({
//   subject: { type: String, required: true },
//   price: { type: Number, required: true },
//   income: { type: Number, required: true },
//   expense: { type: Number, required: true },
//   description: { type: String, required: true },
//   upload: { type: String, required: true } // Adjust type as necessary
// });

// const Form = mongoose.model('post', formSchema);

// module.exports = Form;

const mongoose = require('mongoose');
const { Schema } = mongoose;


const itemSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: true
  },
  images: [
    {
      type: String
    }
  ],
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Categories', // Reference to Categories model
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Users', // Reference to Users model
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false // Default value is false
  },
  pinExpiryDate: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now // Set default to current date
  },
  updatedAt: {
    type: Date,
    default: Date.now // Set default to current date
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive'], // Possible values
    required: true
  },
  transactions: [
    {
      transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transactions', // Reference to Transactions model
        required: true
      },
      status: {
        type: String,
        required: true
      }
    }
  ],
  income: {
    type: Number,
    required: false // Add this field for income
  },
  subject: {
    type: String,
    required: false // Add this field for subject
  },
  expense: {
    type: Number,
    required: false // Add this field for expense
  }
});

// Create and export the model
const Post = mongoose.model('post', itemSchema);

module.exports = Post;

