import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, null if anonymous
  reportId: { type: String, required: true, unique: true },
  title: { type: String }, // User requested 'title' field
  category: { 
    type: String, 
    required: true,
    enum: ['Bribery', 'Land Fraud', 'Police Misconduct', 'Government Contractor', 'Election Fraud', 'Other']
  },
  department: { type: String, default: 'General' }, // Added for departmental routing
  location: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, required: true },
    gps: { type: String } // Optional string coordinate representation
  },
  description: { type: String, required: true },
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  status: {
    type: String,
    required: true,
    enum: ['Submitted', 'Under Review', 'Assigned', 'Action Taken', 'Verified', 'Rejected', 'Resolved', 'Closed'],
    default: 'Submitted'
  },
  evidenceUrls: [{ type: String }], // Cloudinary integration
  rewardGiven: { type: Boolean, default: false }, // Fintech reward mechanism tracking
  isFaceBlurRequested: { type: Boolean, default: false }, // Specific to frontend UI indicator
  
  // Phase 2: Anonymity Control
  isAnonymousMode: { 
      type: String, 
      enum: ['none', 'verified-anonymous', 'full-anonymous'],
      default: 'full-anonymous'
  },
  isHighRisk: { type: Boolean, default: false },
  
  reporterContact: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  aiSuggestion: {
    legalReference: { type: String },
    actionSteps: [{ type: String }],
    contactAuthority: { type: String },
    draftLetter: { type: String },
    timeline: { type: String },
    rtiLetter: { type: String }
  },
  timeline: [{
    status: { type: String },
    note: { type: String },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
  }],
  
  messages: [{
    sender: { type: String, enum: ['admin', 'user'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  internalNotes: [{
    note: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  statusHistory: [{
      status: { type: String },
      updatedAt: { type: Date, default: Date.now }
  }],

  // Phase 2: Social Layer
  upvotes: { type: Number, default: 0 },
  comments: [{
      text: { type: String },
      createdAt: { type: Date, default: Date.now },
      isOfficial: { type: Boolean, default: false }
  }],
  witnesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Phase 2: Moderation & Escalation
  flags: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false },
  moderatorNotes: { type: String },
  isEscalated: { type: Boolean, default: false },

  rating: { type: Number, min: 1, max: 5 },
  ratingFeedback: { type: String }

}, {
  timestamps: true
});

// reportId is already indexed via unique:true on the field definition
reportSchema.index({ 'location.state': 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ upvotes: -1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
