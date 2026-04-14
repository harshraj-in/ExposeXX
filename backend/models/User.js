import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String }, // Optional but needed for auth / fintech verification
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Moderator', 'NGO', 'Citizen'], default: 'Citizen' },
  
  // Reporting Stats
  totalReports: { type: Number, default: 0 },
  verifiedReports: { type: Number, default: 0 },
  
  // Fintech Wallet
  rewardBalance: { type: Number, default: 0 },
  
  twoFactorSecret: { type: String }, // For TOTP
  isTwoFactorEnabled: { type: Boolean, default: false },
  badges: [{ type: String }] // For Civic Badges Feature
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log(`[AUTH] Comparing passwords for user: ${this.email}`);
  
  // CASE 1: Password is hashed with bcrypt ($2a, $2b, $2y are common prefixes)
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$')) {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log(`[AUTH] Bcrypt match result: ${isMatch}`);
    return isMatch;
  }
  
  // CASE 2: Fallback for plain text (Legacy/Seeded)
  const isPlainMatch = enteredPassword === this.password;
  console.log(`[AUTH] Plain text match result: ${isPlainMatch}`);
  if (isPlainMatch) {
    console.warn(`[AUTH] WARNING: User ${this.email} is using an unhashed password. Security update needed.`);
  }
  return isPlainMatch;
};

const User = mongoose.model('User', userSchema);
export default User;
