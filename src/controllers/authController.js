const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../database/database'); // Assuming your database connection pool is configured in a separate file
const config = require('../config/config');
const sgMail = require('@sendgrid/mail');
const users = require('../models/users');
const post = require('../models/post');
const Category = require('../models/category');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const { google } = require('googleapis');
const { request } = require('express');
const Post = require('../models/post');
const User = require('../models/users');
//const verifyToken = require('../middleware/errorHandler');


// Api for registering users.

exports.register = [
  // Validation middleware
  body('name').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }).withMessage('Passwords must match. Please check your password again'),

  // Register function
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {name, email, password } = req.body;

    try {
      // Check if the email already exists in the database
      const existingUser = await users.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ errors: [{ msg: 'Email already exists' }] });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user instance and save to database
      const newUser = new users({
        name,
        email,
        password: hashedPassword
      });

      await newUser.save();

      res.json({ message: 'User registered successfully' });
    } catch (err) {
      return next(err);
    }
  }
];

// change password api //
// exports.changePassword = [
//   verifyToken,
//   // Validation middleware
//   body('currentPassword').notEmpty().withMessage('Current password is required'),
//   body('newPassword').notEmpty().withMessage('New password must be at least 5 characters long'),
//   body('confirmNewPassword').custom((value, { req }) => {
//     if (value !== req.body.newPassword) {
//       throw new Error('New passwords do not match');
//     }
//     return true;
//   }).withMessage('New passwords must match. Please check your new password again'),

//   // Change password function
//   async (req, res, next) => {
//     //console.log('req.user:', req.user); // Debugging line

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { currentPassword, newPassword } = req.body;
//     console.log(req.body);
//     const userId = req.user._id;
//     console.log(userId);
//      // Use _id or adjust based on your User model
//     if (!userId) {
//       return res.status(400).json({ errors: [{ msg: 'User ID not found' }] });
//     }

//     try {
//       // Find the user by ID
//       const user = await users.findById(userId);
//       console.log(user);
//       if (!user) {
//         return res.status(404).json({ errors: [{ msg: 'User not found' }] });
//       }

//       // Check if the current password is correct
//       const isMatch = await bcrypt.compare(currentPassword, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ errors: [{ msg: 'Current password is incorrect' }] });
//       }

//       // Hash the new password
//       const hashedNewPassword = await bcrypt.hash(newPassword, 10);

//       // Update the user's password
//       user.password = hashedNewPassword;
//       await user.save();

//       res.json({ message: 'Password changed successfully' });
//     } catch (err) {
//       return next(err);
//     }
//   }



// ];// change password api //


// Api for login in to dashboard

// exports.login = [
//   // Validation middleware
//   body('email').isEmail().withMessage('Valid email is required'),
//   body('password').notEmpty().withMessage('Password is required'),

  // Login function
//   async (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { email, password } = req.body;

//     try {
//       // Find user by email
//       const user = await users.findOne({ email });

//       if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//       }

//       // Check password
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(401).json({ error: 'Invalid credentials' });
//       }

//       //Generate JWT token
//       const token = jwt.sign(
//         { email: user.email, userId: user._id },
//         config.jwtSecret,
//         { expiresIn: '9h' }
//       );
//       // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '9h' });

//       res.json({ token });
//     } catch (err) {
//       return next(err);
//     }
//   }
// ];
exports.login = [
  // Validation middleware
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  // Login function
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      // Find user by email
      const user = await users.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, userId: user._id },
        config.jwtSecret,
        { expiresIn: '9h' }
      );
      res.json({ token });
    } catch (err) {
      return next(err);
    }
  }
];
// Api to send email for password reset

exports.forgotPassword = [
  // Validation middleware
  body('email').isEmail().withMessage('Valid email is required'),

  // Forgot password function
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      // Find user by email using Mongoose
      const user = await users.findOne({ email });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Send password reset email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.emailUser,
          pass: config.emailPassword
        }
      });

      const mailOptions = {
        from: config.emailUser,
        to: email,
        subject: 'Password Reset',
        text: `Click this link to reset your password: http://localhost:3000/reset-password/${email}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return next(error);
        }
        console.log('Email sent: ' + info.response);
        res.json({ message: 'Password reset email sent' });
      });
    } catch (err) {
      return next(err);

    }
  }
];

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|gif/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb('Error: Images only!');
//     }
//   }
// });



// // Api for creating post

// exports.post = [
//   // Validation middleware
//   body('title').notEmpty().withMessage('Title is required'),
//   body('price').notEmpty().withMessage('Price is required').isNumeric().withMessage('Price must be a number'),
//   body('status').notEmpty().withMessage('Status is required').isIn(['active', 'sold', 'inactive']).withMessage('Status must be one of the following: active, sold, inactive'),
//   body('categoryId').notEmpty().withMessage('Category ID is required').isMongoId().withMessage('Invalid Category ID'),
//   body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid User ID'),
//   body('description').optional().isString().withMessage('Description must be a string'),
//   body('images').optional().isArray().withMessage('Images must be an array of strings'),
//   body('isPinned').optional().isBoolean().withMessage('IsPinned must be a boolean'),
//   body('pinExpiryDate').optional().isISO8601().withMessage('Invalid pin expiry date format'),
//   body('transactions').optional().isArray().withMessage('Transactions must be an array').custom((value) => {
//     return value.every(transaction => 
//       typeof transaction.transactionId === 'string' && 
//       typeof transaction.status === 'string'
//     );
//   }).withMessage('Each transaction must have a transactionId and status'),

//   // New validation rules for income, subject, and expense
//   body('income').notEmpty().withMessage('Income is required').isNumeric().withMessage('Income must be a number'),
//   body('subject').notEmpty().withMessage('Subject is required').isString().withMessage('Subject must be a string'),
//   body('expense').notEmpty().withMessage('Expense is required').isNumeric().withMessage('Expense must be a number'),

//   // Add form function
//   async (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { title, price, status, categoryId, userId, description, images, isPinned, pinExpiryDate, transactions, income, subject, expense } = req.body;

//     try {
//       // Create a new item document
//       const newItem = new post({
//         title,
//         price,
//         status,
//         categoryId,
//         userId,
//         description,
//         images,
//         isPinned,
//         pinExpiryDate,
//         transactions,
//         income,      
//         subject,    
//         expense      
//       });

//       // Save the item document to MongoDB
//       await newItem.save();

//       res.json({ message: 'Post added successfully' });
//     } catch (err) {
//       return next(err);
//     }
//   }
// ];

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   }
// });
// const upload = multer({ storage: storage });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // File naming
  }
});
const upload = multer({ storage: storage });
// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|gif/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb('Error: Images only!');
//     }
//   }
// });







function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']; // Note: 'Authorization' should be lowercase 'authorization' in headers
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}



exports.post = [

  verifyToken,
  
  // Middleware for handling file uploads
  upload.array('images', 10), // Adjust 'images' to your field name and 10 to the number of files you want to allow

  // Validation middleware
  body('title').notEmpty().withMessage('Title is required'),
  body('price').notEmpty().withMessage('Price is required').isNumeric().withMessage('Price must be a number'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('images').optional().isArray().withMessage('Images must be an array of strings'),
  body('pinExpiryDate').optional().isISO8601().withMessage('Invalid pin expiry date format'),
  body('transactions').optional().isArray().withMessage('Transactions must be an array').custom((value) => {
    return value.every(transaction =>
      typeof transaction.transactionId === 'string' &&
      typeof transaction.status === 'string'
    );
  }).withMessage('Each transaction must have a transactionId and status'),
  body('income').notEmpty().withMessage('Income is required').isNumeric().withMessage('Income must be a number'),
  body('subject').notEmpty().withMessage('Subject is required').isString().withMessage('Subject must be a string'),
  body('expense').notEmpty().withMessage('Expense is required').isNumeric().withMessage('Expense must be a number'),
  async (req, res, next) => {
    console.log(req.user);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, price, categoryId, description, pinExpiryDate, transactions, income, subject, expense } = req.body;
    const images = req.files ? req.files.map(file => file.filename) : [];
    const authenticatedUserId = req.user.userId;
    console.log(authenticatedUserId);
    try {
      const fetchedCategoryId = categoryId || await getDefaultCategoryId();
      //const fetchedUserId = await getDefaultUserId();
      const fetchedStatus = await determineDefaultStatus();
  

      const newPost = new post({
        title,
        price,
        status: fetchedStatus,
        userId: authenticatedUserId,
        categoryId: fetchedCategoryId,
        description,
        images,
        pinExpiryDate,
        transactions,
        income,
        subject,
        expense
      });
      
      await newPost.save();
      res.json({ message: 'Post added successfully' });
    } catch (err) {
      return next(err);
    }
  }

];

async function getDefaultCategoryId() {
  // Fetch or return default category ID
  const defaultCategory = await Category.findOne(); // Adjust query as necessary
  console.log(defaultCategory);
  return defaultCategory ? defaultCategory._id : null;
}



async function determineDefaultStatus() {
  console.log(determineDefaultStatus);
  // Determine or return default status
  return 'inactive'; // Default status example
}
// post second api testing//

// Update a post
exports.updatePost = [
  verifyToken,
  upload.array('images', 10), // Adjust 'images' to your field name and 10 to the number of files you want to allow

  // Validation middleware (adjust as necessary for update)
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('price').optional().notEmpty().isNumeric().withMessage('Price must be a number'),
  body('status').optional().isIn(['active', 'sold', 'inactive']).withMessage('Status must be one of the following: active, sold, inactive'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('isPinned').optional().isBoolean().withMessage('IsPinned must be a boolean'),
  body('pinExpiryDate').optional().isISO8601().withMessage('Invalid pin expiry date format'),
  body('transactions').optional().isArray().withMessage('Transactions must be an array').custom((value) => {
    return value.every(transaction => 
      typeof transaction.transactionId === 'string' && 
      typeof transaction.status === 'string'
    );
  }).withMessage('Each transaction must have a transactionId and status'),
  body('income').optional().isNumeric().withMessage('Income must be a number'),
  body('subject').optional().isString().withMessage('Subject must be a string'),
  body('expense').optional().isNumeric().withMessage('Expense must be a number'),

  // Update post handler
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    console.log(id);

    // Validate and convert the ID

    const { title, price, status, description, isPinned, pinExpiryDate, transactions, income, subject, expense } = req.body;
    const images = req.files ? req.files.map(file => file.filename) : []; // Get filenames of uploaded images

    try {
      // Fetch or set default values for categoryId, userId if not provided
      const fetchedCategoryId = await getDefaultCategoryId(); // Fetch default category ID if not provided
      //const fetchedUserId = await getDefaultUserId(); // Fetch default user ID if not provided
      const fetchedStatus = status || await determineDefaultStatus(); // Use provided status or default

      // Update the post document
      const updatedData = {
        title,
        price,
        status: fetchedStatus,
        categoryId: fetchedCategoryId,
        //userId: fetchedUserId,
        description,
        images: images.length ? images : undefined, // Only include if images exist
        isPinned,
        pinExpiryDate,
        transactions,
        income,
        subject,
        expense
      };

      const updatedPost = await post.findByIdAndUpdate(id, updatedData, { new: true });
      if (!updatedPost) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.json({ message: 'Post updated successfully', post: updatedPost });
    } catch (err) {
      return next(err);
    }
  }
];




exports.deletePost = [
  verifyToken, // Ensure user is authenticated
  async (req, res, next) => {
    const { id } = req.params;
    // Check if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    try {
      // Find and delete the post by ID
      const deletedPost = await post.findByIdAndDelete(id);
      if (!deletedPost) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.json({ message: 'Post deleted successfully' });
    } catch (err) {
      console.error(err); // Log the error for debugging
      return next(err); // Pass the error to the error-handling middleware
    }
  }
];

// APi to retrieve all posts has been created

exports.getpost = async (req, res, next) => {
  console.log('Get All Post Data Here'); // Debugging log
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 6; // Default to 6 items per page
  const skip = (page - 1) * limit; // Calculate how many documents to skip

  try {
    // Fetch form data from the MongoDB collection using Mongoose with pagination
    const forms = await post.find().skip(skip).limit(limit);
console.log(forms);
    // Count total documents for pagination purposes
    const totalDocuments = await post.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalDocuments / limit);

    // Send the response with the form data and pagination info
    res.status(200).json({
      message: 'Form data retrieved successfully',
      data: forms,
      pagination: {
        totalDocuments,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (err) {
    console.error('Error fetching form data:', err); // Log error for debugging
    res.status(500).json({ message: 'An error occurred while retrieving form data', error: err.message });
  }
};
// APi to retrieve all users has been created

exports.getUsers = [
  verifyToken,
  // Middleware function to handle GET requests for user data
  async (req, res, next) => {
    try {
      // Fetch all users from the database using Mongoose
      const allusers = await users.find();

      res.json({ message: 'User list fetched successfully', data: allusers });
    } catch (err) {
      console.error('Error in GET request:', err); // Log error for debugging
      return next(err);
    }
  }
];


// Api to search posts using title and subject

exports.search = [
  verifyToken,
  // Middleware function to handle GET requests for search
  async (req, res, next) => {
    try {
      const { title, subject } = req.query;

      // Build the query object
      const query = {};
      if (title) {
        query.title = { $regex: new RegExp(title, 'i') }; // Case-insensitive regex search
      }
      if (subject) {
        query.subject = { $regex: new RegExp(subject, 'i') }; // Case-insensitive regex search
      }

      // Fetch matching posts from the database
      const results = await post.find(query);

      res.json({ message: 'Search results fetched successfully', data: results });
    } catch (err) {
      console.error('Error in search request:', err); // Log error for debugging
      next(err); // Pass error to the error handling middleware
    }
  }
];


//  add categories Rest Api's 


exports.categories = [
  verifyToken,
  // Middleware function to handle GET requests for user data
  async (req, res, next) => {
    try {
    console.log('Received request to create category');
    const category = new Category(req.body); // Ensure you use the correct model name
    await category.save();
    res.status(200).json({message: 'category added successfully'});
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: error.message });
    next(error); // Call next if you have an error-handling middleware
  }
}
];

exports.getcategory = [
  verifyToken,
  // Middleware function to handle GET requests for user data
  async (req, res, next) => {
    try {
      // Fetch all users from the database using Mongoose
      const category = await Category.find();

      res.json({ message: 'category list fetched successfully', data: category });
    } catch (err) {
      console.error('Error in GET request:', err); // Log error for debugging
      return next(err);
    }
  }
];



// api to fetch youtube subscribers....

const youtube = google.youtube({
  version: 'v3',
  auth: config.youtubeApiKey,
});

// Controller function to get subscriber count
exports.getSubscriberCount = [
  verifyToken,

  // Middleware function to handle GET requests for user data
  async (req, res, next) => {
    try {
    const response = await youtube.channels.list({
      part: 'statistics',
      id: config.youtubeChannelId,
    });

    console.log('YouTube API Response:', response.data);

    const channel = response.data.items[0];
    const subscriberCount = channel.statistics.subscriberCount;
    res.json({ subscriberCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching channel data', error: error.message });
  }

  }
];
// user only posts for my add page //

exports.getuserpost = [
  verifyToken,
  async (req, res, next) => {
    console.log(req.user);
    try {
      const userId = req.user.userId; // Safely get the user ID

      if (!userId) {
        return res.status(400).json({ message: 'User ID not found' });
      }

      console.log(`Fetching posts for user ID: ${userId}`);

      // Get pagination parameters from the query string
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      // Fetch posts by the user ID with pagination
      const posts = await post.find({ userId })
        .skip(skip)
        .limit(limit)
        .exec(); // Ensure the query is executed

      const totalPosts = await post.countDocuments({ userId });

      console.log(`Posts found: ${posts.length}`);

      if (posts.length === 0) {
        console.log(`No posts found for user ID: ${userId}`);
        return res.status(404).json({ message: 'No posts found for this user' });
      }

      // Return paginated posts with metadata
      res.json({
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: page,
        posts,
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
];

//user only posts for my add page //
//form update get//
exports.geteditdata = [
  verifyToken, // Verify the token before proceeding
  async (req, res) => {
    try {
      // Log the request ID for debugging
      const { id } = req.params.id;
      
      console.log('Fetching post with ID:', req.params.id);

      // Fetch the post by ID
      const posts = await post.findById(req.params.id); // Ensure 'Post' is correctly initialized
       
      console.log(posts);

      if (!posts) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Send the post data as response
      res.json(posts);
    } catch (error) {
      // Log the error for debugging
      console.error('Server error:', error);
      // console.log(post)
      res.status(500).json({ message: 'Server error' });
    }
  }
];
//retry practice//

// change password api //
exports.changePassword = [
  verifyToken,
  // Validation middleware
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Confirm password does not match new password');
    }
    return true;
  }),
  // Change password function
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { currentPassword, password } = req.body;
    const userId = req.user.userId; // Assuming user ID is stored in req.user after authentication
    console.log(userId);
    try {
      // Find user by ID
      const user = await users.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      // Hash the new password and update
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      return next(err);
    }
  }
];
// search api seller list //
exports.getsearchseller = [
  verifyToken,
  async (req, res, next) => {
    try {
      const {
        subscriberFrom,
        subscriberTo,
        priceFrom,
        priceTo,
        network,
      } = req.query;
      // Build the query object
      const query = {};
      // Network filter (case-insensitive search)
      if (network) {
        query.network = { $regex: new RegExp(network, 'i') }; // Case-insensitive regex search
      }
      // Subscriber count range filter
      if (subscriberFrom && subscriberTo) {
        query.subscriber = {}; // Initialize subscriberCount filter object
        if (subscriberFrom) {
          const subscriberFromNum = parseInt(subscriberFrom, 10);
          if (!isNaN(subscriberFromNum)) {
            query.subscriber.$gte = subscriberFromNum; // Greater than or equal to
          }
        }
        if (subscriberTo) {
          const subscriberToNum = parseInt(subscriberTo, 10);
          if (!isNaN(subscriberToNum)) {
            query.subscriber.$lte = subscriberToNum; // Less than or equal to
          }
        }
      }
      // Price range filter
      if (priceFrom && priceTo) {
        query.price = {}; // Initialize price filter object
        if (priceFrom) {
          const priceFromNum = parseFloat(priceFrom);
          if (!isNaN(priceFromNum)) {
            query.price.$gte = priceFromNum; // Greater than or equal to
          }
        }
        if (priceTo) {
          const priceToNum = parseFloat(priceTo);
          if (!isNaN(priceToNum)) {
            query.price.$lte = priceToNum; // Less than or equal to
          }
        }
      }

      const page = parseInt(req.query.page, 10) || 1; // Default to 1 if not provided
    const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 if not provided

    // Example of using `page` and `limit` to paginate results
    const offset = (page - 1) * limit;

       // Convert page and limit to integers
       const pageNumber = parseInt(page, 10);
       const pageSize = parseInt(limit, 5);
 
       // Validate page and limit
       if (isNaN(pageNumber) || pageNumber <= 0) {
         return res.status(400).json({ message: 'Invalid page number' });
       }
       if (isNaN(pageSize) || pageSize <= 0) {
         return res.status(400).json({ message: 'Invalid limit' });
       }
 
       // Calculate pagination parameters
       const skip = (pageNumber - 1) * pageSize;
       const results = await post.find(query).skip(skip).limit(pageSize);
 
       // Count total results for pagination info
       const totalResults = await post.countDocuments(query);
 
       // Log the results for debugging
       console.log('Search Results:', results);
 
       // Respond with paginated results
       res.json({
         message: 'Search results fetched successfully',
         data: results,
         pagination: {
           totalResults,
           totalPages: Math.ceil(totalResults / pageSize),
           currentPage: pageNumber,
           pageSize
         }
       });
     } catch (err) {
       console.error('Error in search request:', err); // Log error for debugging
       next(err); // Pass error to the error handling middleware
     }
   }
 ];
//search api seller list //

// favorites api listing post //
exports.favourites = [
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      // console.log(userId);
      const postId = req.body.postId; // Ensure postId is passed in the request body
      // console.log(postId);
      // Check if the user exists
      const user = await User.findById(userId);
      console.log(user);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Check if the post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      // Add post to user's favorites if it's not already there
      if (!user.favorites.includes(postId)) {
        user.favorites.push(postId);
        await user.save();
      }
      res.status(200).json({ message: 'Post added to favorites', favorites: user.favorites });
    } catch (error) {
      console.error('Error saving to favorites:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
];


exports.getFavourites = [
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      // Check if the user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Retrieve the postIds from user's favorites
      const favoritePostIds = user.favorites;

      // Get pagination parameters from the query string
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      // Fetch all posts that are in the favorites array with pagination
      const posts = await Post.find({ _id: { $in: favoritePostIds } })
        .skip(skip)
        .limit(limit)
        .exec();

      // Get the total number of favorite posts
      const totalFavorites = await Post.countDocuments({ _id: { $in: favoritePostIds } });

      console.log(`Favorites found: ${posts.length}`);

      if (posts.length === 0) {
        console.log(`No favorites found for user ID: ${userId}`);
        return res.status(404).json({ message: 'No favorites found for this user' });
      }

      // Return paginated favorites with metadata
      res.status(200).json({
        totalFavorites,
        totalPages: Math.ceil(totalFavorites / limit),
        currentPage: page,
        favorites: posts,
      });

    } catch (error) {
      console.error('Error fetching favorites:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
];

// user me api //
exports.userprofile = [
  verifyToken,
  // Middleware function to handle GET requests for user data
  async (req, res, next) => {
    try {
      // Ensure req.userid is set by the verifyToken middleware
      const userId = req.user.userId;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in request' });
      }
      // Fetch the user from the database using Mongoose
      const user = await users.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User data fetched successfully', data: user });
    } catch (err) {
      console.error('Error in GET request:', err); // Log error for debugging
      return next(err);
    }
  }
];
//user me api //
