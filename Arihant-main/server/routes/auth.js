const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getUserProfile } = require('../controllers/userController');
const validate = require('../middleware/validate');
const admin = require('../config/firebase-admin');

const router = express.Router();

// Rate limiter: max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes before trying again.' }
});

// Rate limiter: max 5 register attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please wait before trying again.' }
});

// Validation rules
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// Get current user details (Optimized Lean Query)
router.get('/me', auth, getUserProfile);

// Register
router.post('/register', registerLimiter, registerRules, validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', loginLimiter, loginRules, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password. Please try again.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// Google Login via Firebase
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Firebase ID token is required' });

    // 1. Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // 2. Find or Create User in MongoDB
    let user = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }] 
    });

    if (!user) {
      // First time login - create user
      user = await User.create({
        firebaseUid: uid,
        email: email.toLowerCase(),
        name: name || 'Google User',
        image: picture,
        provider: 'google',
        role: 'customer'
      });
    } else if (!user.firebaseUid) {
      // User existed (local auth) but is now signing in with Google
      user.firebaseUid = uid;
      if (!user.image) user.image = picture;
      if (!user.provider || user.provider === 'local') user.provider = 'google';
      await user.save();
    }

    // 3. Generate Backend JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.ACCESS_TOKEN_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        image: user.image 
      } 
    });
  } catch (error) {
    console.error('Firebase verify error:', error);
    res.status(401).json({ message: 'Authentication failed. Invalid Google token.', errorDetail: error.message });
  }
});

module.exports = router;
