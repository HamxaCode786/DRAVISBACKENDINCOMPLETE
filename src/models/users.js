// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const UserSchema = new Schema({
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     password: {
//         type: String,
//         required: true
//     }
// });
// module.exports = mongoose.model('User', UserSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for the User collection
const userSchema = new Schema({
  name: {
    type: String,
    required: false // Change to true if name is required
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: false // Change to true if password is required
  },
  isVerified: {
    type: Boolean,
    default: false // Set default value if not provided
  },
  verificationToken: {
    type: String,
    required: false // Change to true if verificationToken is required
  },
  createdAt: {
    type: Date,
    default: Date.now // Set default to current date if not provided
  },
  updatedAt: {
    type: Date,
    default: Date.now // Set default to current date if not provided
  },
  favorites: {
    type: [mongoose.Schema.Types.ObjectId], // Array of ObjectId types
    ref: 'Post', // Reference to the Post model
    default: [] // Initialize as an empty array
  },
  ratings: [
    {
      ratingId: {
        type: Schema.Types.ObjectId, // Reference to Ratings collection
        ref: 'Ratings' // Reference to Ratings model
      },
      ratingValue: {
        type: Number,
        required: true
      }
    }
  ]
});

// Create and export the model
const User = mongoose.model('User', userSchema);

module.exports = User;
