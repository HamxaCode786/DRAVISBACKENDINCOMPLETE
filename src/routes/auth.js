const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication rest apis routes

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);

// dashboard rest apis routes

router.post('/post',authController.post);
router.post('/updateposts/:id',authController.updatePost);
router.delete('/deletepost/:id',authController.deletePost);
router.get('/getpost',authController.getpost);
router.get('/getUsers',authController.getUsers);
router.get('/searchpost',authController.search);
router.post('/addcategory',authController.categories);
router.get('/getcategory',authController.getcategory);
router.get('/subscribers', authController.getSubscriberCount);
router.post('/changepassword',authController.changePassword);
router.get('/loginuser', authController.getuserpost);
router.get('/updatepost/:id', authController.geteditdata);
router.get('/seller', authController.getsearchseller);



module.exports = router;
