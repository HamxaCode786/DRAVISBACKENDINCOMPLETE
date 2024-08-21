const express = require('express');
const mongoose = require('mongoose');
const User = require('./src/models/users');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path')

const app = express();
require('dotenv').config();

// Other middleware configurations...

app.use(cors({
    origin: 'http://localhost:3000', // Your React app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));
// Routes
const authRoutes = require('./src/routes/auth');
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
 app.use('/api/auth', authRoutes);

// app.use(cors({
    //origin: 'http://localhost:5000'
  //}));

 // MongoDB Connection
mongoose.connect("mongodb+srv://sarmadamjad:root@cluster0.vvddblk.mongodb.net/socialmedia", {
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('Error connecting to MongoDB:', err));


// Default route to test the server
app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.use(express.json()); // For parsing application/json

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Start server
const PORT = process.env.PORT;
const api_key = process.env.api_key;
app.listen(PORT,api_key, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

