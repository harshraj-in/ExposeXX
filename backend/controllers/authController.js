import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Email: ${email}`);
    
    const user = await User.findOne({ email });

    if (!user) {
        console.log(`[LOGIN FAILED] User not found: ${email}`);
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`[LOGIN FLOW] User found, checking password...`);
    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
        console.log(`[LOGIN SUCCESS] User authenticated: ${email}`);
        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          rewardBalance: user.rewardBalance,
          token: generateToken(user._id),
        });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to authenticate user', error: error.message });
  }
};

// @desc    Register a new user (Citizen) or privileged accounts (if Admin)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    console.log(`[REGISTER ATTEMPT] Email: ${email}, Role: ${role || 'Citizen'}`);
    const userExists = await User.findOne({ email });
    if (userExists) {
        console.log(`[REGISTER FAILED] User already exists: ${email}`);
        return res.status(400).json({ message: 'User already exists' });
    }

    // Restrict role elevation: only allow Admin to create Non-Citizens
    let finalRole = 'Citizen'; // Default for public
    if (req.user && req.user.role === 'Admin' && role) {
        finalRole = role;
    }

    console.log(`[REGISTER FLOW] Creating user in DB... (Role: ${finalRole})`);
    const user = await User.create({
      name,
      email,
      phone,
      password, // Should be raw here, hashed by model pre-save
      role: finalRole
    });

    if (user) {
      console.log(`[REGISTER SUCCESS] User created: ${email}`);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        rewardBalance: user.rewardBalance,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      badges: user.badges || [],
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
