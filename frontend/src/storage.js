// ============================================================
// ExposeX Storage Helper — All localStorage operations live here
// ============================================================

const KEYS = {
  USERS: 'ex_users',
  SESSION: 'ex_session',
  REPORTS: 'ex_reports',
  REPORT_COUNTER: 'ex_report_counter',
  WITHDRAWALS: 'ex_withdrawals',
  SEEDED: 'ex_seeded',
};

// ─── Helpers ───────────────────────────────────────────────

const parse = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const store = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ─── Users ─────────────────────────────────────────────────

export const getUsers = () => parse(KEYS.USERS, []);

export const saveUser = (user) => {
  const users = getUsers();
  const existing = users.find(u => u.email === user.email);
  if (existing) throw new Error('An account with this email already exists.');
  const newUser = {
    id: generateId(),
    name: user.name,
    email: user.email,
    password: user.password,
    phone: user.phone || '',
    role: 'Citizen',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  store(KEYS.USERS, users);
  return newUser;
};

export const findUser = (email, password) => {
  // Hardcoded admin — never stored in localStorage
  if (email === 'admin@exposex.com' && password === 'Admin@123') {
    return { id: 'admin_001', name: 'System Admin', email, role: 'Admin' };
  }
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password.');
  return user;
};

// ─── Session ───────────────────────────────────────────────

export const getCurrentUser = () => parse(KEYS.SESSION, null);

export const setCurrentUser = (user) => store(KEYS.SESSION, user);

export const clearCurrentUser = () => localStorage.removeItem(KEYS.SESSION);

// ─── Report ID Generator ───────────────────────────────────

export const getNextReportId = () => {
  const year = new Date().getFullYear();
  const current = parseInt(localStorage.getItem(KEYS.REPORT_COUNTER) || '0', 10);
  const next = current + 1;
  localStorage.setItem(KEYS.REPORT_COUNTER, String(next));
  return `EX-${year}-${String(next).padStart(6, '0')}`;
};

// ─── Reports ───────────────────────────────────────────────

export const getReports = () => parse(KEYS.REPORTS, []);

export const saveReport = (reportData) => {
  const reports = getReports();
  const id = getNextReportId();
  const now = new Date().toISOString();
  const report = {
    id,
    reportId: id,
    ...reportData,
    status: 'Submitted',
    createdAt: now,
    timeline: [
      { status: 'Submitted', note: 'Report successfully submitted. Under initial review.', updatedAt: now }
    ],
    isFlagged: false,
    flags: 0,
    upvotes: 0,
  };
  reports.unshift(report);
  store(KEYS.REPORTS, reports);
  return report;
};

export const updateReport = (reportId, updates) => {
  const reports = getReports();
  const idx = reports.findIndex(r => r.reportId === reportId || r.id === reportId);
  if (idx === -1) throw new Error('Report not found.');
  reports[idx] = { ...reports[idx], ...updates };
  store(KEYS.REPORTS, reports);
  return reports[idx];
};

export const getReportById = (reportId) => {
  const reports = getReports();
  return reports.find(r => r.reportId === reportId || r.id === reportId) || null;
};

// ─── Engagement (Support / Witness / Comments / Abuse) ─────

export const getSupport = (reportId) => parse(`ex_support_${reportId}`, 0);
export const addSupport = (reportId) => {
  const val = getSupport(reportId) + 1;
  store(`ex_support_${reportId}`, val);
  return val;
};

export const getWitnessed = (reportId) => parse(`ex_witnessed_${reportId}`, []);
export const addWitnessed = (reportId, userId) => {
  const list = getWitnessed(reportId);
  if (!list.includes(userId)) {
    list.push(userId);
    store(`ex_witnessed_${reportId}`, list);
  }
  return list;
};

export const getComments = (reportId) => parse(`ex_comments_${reportId}`, []);
export const addComment = (reportId, comment) => {
  const comments = getComments(reportId);
  const newComment = {
    id: generateId(),
    text: comment.text,
    authorId: comment.authorId || 'anonymous',
    authorName: comment.authorName || 'Anonymous',
    timestamp: new Date().toISOString(),
  };
  comments.push(newComment);
  store(`ex_comments_${reportId}`, comments);
  return comments;
};

export const getAbuse = (reportId) => parse(`ex_abuse_${reportId}`, 0);
export const addAbuse = (reportId) => {
  const val = getAbuse(reportId) + 1;
  store(`ex_abuse_${reportId}`, val);
  // If flagged 3+ times, auto-flag the report
  if (val >= 3) {
    const reports = getReports();
    const idx = reports.findIndex(r => r.reportId === reportId || r.id === reportId);
    if (idx !== -1) {
      reports[idx].isFlagged = true;
      reports[idx].flags = val;
      store(KEYS.REPORTS, reports);
    }
  }
  return val;
};

// ─── Safe Room / Chat ──────────────────────────────────────

export const getChatMessages = (reportId) => parse(`ex_chat_${reportId}`, []);

export const addChatMessage = (reportId, { senderId, senderRole, message }) => {
  const msgs = getChatMessages(reportId);
  const newMsg = {
    id: generateId(),
    senderId,
    senderRole,
    sender: senderRole === 'moderator' ? 'admin' : 'user',
    message,
    timestamp: new Date().toISOString(),
  };
  msgs.push(newMsg);
  store(`ex_chat_${reportId}`, msgs);
  return msgs;
};

// ─── Internal Notes (Admin) ────────────────────────────────

export const getInternalNotes = (reportId) => parse(`ex_notes_${reportId}`, []);
export const addInternalNote = (reportId, note) => {
  const notes = getInternalNotes(reportId);
  notes.push({ note, timestamp: new Date().toISOString(), createdBy: { name: 'Moderator' } });
  store(`ex_notes_${reportId}`, notes);
  return notes;
};

// ─── Wallet & Withdrawals ─────────────────────────────────
export const getWallet = (userId) => parse(`ex_wallet_${userId}`, 0);
export const setWallet = (userId, amount) => store(`ex_wallet_${userId}`, amount);
export const creditWallet = (userId, amount) => {
  const current = getWallet(userId);
  setWallet(userId, current + amount);
};

export const getWithdrawals = () => parse(KEYS.WITHDRAWALS, []);

export const requestWithdrawal = (withdrawalData) => {
    const list = getWithdrawals();
    const newRequest = {
        id: generateId(),
        status: 'Pending',
        timestamp: new Date().toISOString(),
        ...withdrawalData
    };
    list.unshift(newRequest);
    store(KEYS.WITHDRAWALS, list);
    
    // Immediately deduct from balance to prevent double spending
    const current = getWallet(withdrawalData.userId);
    setWallet(withdrawalData.userId, current - withdrawalData.amount);
    
    return newRequest;
};

export const updateWithdrawalStatus = (id, status) => {
    const list = getWithdrawals();
    const idx = list.findIndex(w => w.id === id);
    if (idx === -1) return;

    // If rejected, refund the user
    if (status === 'Rejected') {
        const current = getWallet(list[idx].userId);
        setWallet(list[idx].userId, current + list[idx].amount);
    }

    list[idx].status = status;
    list[idx].processedAt = new Date().toISOString();
    store(KEYS.WITHDRAWALS, list);
};

// ─── AI Strength Scoring (local, no API) ──────────────────

export const evaluateStrength = ({ text = '', files = 0, location = '' }) => {
  let score = 0;
  const suggestions = [];
  if (text.length > 50) score += 20; else suggestions.push('Add more detail to your description (at least 50 characters).');
  if (text.length > 150) score += 20; else suggestions.push('Describe the incident in more detail — who, what, when, where.');
  if (text.length > 300) score += 10;
  if (files > 0) score += 25; else suggestions.push('Attach photo or video evidence to strengthen your case.');
  if (files >= 2) score += 10;
  if (location) score += 15; else suggestions.push('Specify the exact location of the incident.');
  if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}/.test(text)) score += 10;
  else suggestions.push('Mention the date of the incident.');
  return { score: Math.min(score, 100), suggestions };
};

// ─── Scoreboard Computation ────────────────────────────────

export const computeScoreboard = () => {
  const reports = getReports();
  const stateData = {};
  reports.forEach(r => {
    const state = r.location?.state || r.location || 'Unknown';
    if (!stateData[state]) {
      stateData[state] = { state, total: 0, resolved: 0, categories: {} };
    }
    stateData[state].total += 1;
    if (r.status === 'Resolved' || r.status === 'Closed') stateData[state].resolved += 1;
    const cat = r.category || 'Other';
    stateData[state].categories[cat] = (stateData[state].categories[cat] || 0) + 1;
  });
  return Object.values(stateData)
    .map(data => {
      const resolutionRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
      let maxCat = '-', maxCount = 0;
      for (const [cat, count] of Object.entries(data.categories)) {
        if (count > maxCount) { maxCount = count; maxCat = cat; }
      }
      return { ...data, resolutionRate, mostCommonCategory: maxCat };
    })
    .sort((a, b) => b.total - a.total);
};

// ─── City Coordinates (India) ─────────────────────────────

export const CITY_COORDS = {
  'mumbai': [19.0760, 72.8777], 'delhi': [28.7041, 77.1025], 'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946], 'hyderabad': [17.3850, 78.4867],
  'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639], 'pune': [18.5204, 73.8567],
  'ahmedabad': [23.0225, 72.5714], 'jaipur': [26.9124, 75.7873], 'surat': [21.1702, 72.8311],
  'lucknow': [26.8467, 80.9462], 'kanpur': [26.4499, 80.3319], 'nagpur': [21.1458, 79.0882],
  'indore': [22.7196, 75.8577], 'bhopal': [23.2599, 77.4126], 'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812], 'ghaziabad': [28.6692, 77.4538], 'ludhiana': [30.9010, 75.8573],
  'agra': [27.1767, 78.0081], 'nashik': [20.0059, 73.7897], 'faridabad': [28.4089, 77.3178],
  'meerut': [28.9845, 77.7064], 'rajkot': [22.3039, 70.8022], 'varanasi': [25.3176, 82.9739],
  'srinagar': [34.0837, 74.7973], 'aurangabad': [19.8762, 75.3433], 'dhanbad': [23.7957, 86.4304],
  'amritsar': [31.6340, 74.8723], 'navi mumbai': [19.0330, 73.0297], 'allahabad': [25.4358, 81.8463],
  'prayagraj': [25.4358, 81.8463], 'ranchi': [23.3441, 85.3096], 'howrah': [22.5958, 88.2636],
  'coimbatore': [11.0168, 76.9558], 'jabalpur': [23.1815, 79.9864], 'gwalior': [26.2183, 78.1828],
  'vijayawada': [16.5062, 80.6480], 'jodhpur': [26.2389, 73.0243], 'madurai': [9.9252, 78.1198],
  'raipur': [21.2514, 81.6296], 'kota': [25.2138, 75.8648], 'bhubaneswar': [20.2961, 85.8245],
  'chandigarh': [30.7333, 76.7794], 'thiruvananthapuram': [8.5241, 76.9366], 'dehradun': [30.3165, 78.0322],
  'panaji': [15.4909, 73.8278], 'shimla': [31.1048, 77.1734], 'imphal': [24.8170, 93.9368],
  'shillong': [25.5788, 91.8933], 'kohima': [25.6701, 94.1077], 'itanagar': [27.0844, 93.6053],
  'aizawl': [23.7307, 92.7173], 'agartala': [23.8315, 91.2868], 'gangtok': [27.3314, 88.6138],
};

// State capital fallbacks
const STATE_COORDS = {
  'maharashtra': [19.7515, 75.7139], 'delhi': [28.7041, 77.1025], 'karnataka': [15.3173, 75.7139],
  'telangana': [18.1124, 79.0193], 'tamil nadu': [11.1271, 78.6569], 'west bengal': [22.9868, 87.8550],
  'gujarat': [22.2587, 71.1924], 'rajasthan': [27.0238, 74.2179], 'uttar pradesh': [26.8467, 80.9462],
  'madhya pradesh': [22.9734, 78.6569], 'bihar': [25.0961, 85.3131], 'andhra pradesh': [15.9129, 79.7400],
  'punjab': [31.1471, 75.3412], 'haryana': [29.0588, 76.0856], 'jharkhand': [23.6102, 85.2799],
  'odisha': [20.9517, 85.0985], 'kerala': [10.8505, 76.2711], 'assam': [26.2006, 92.9376],
  'uttarakhand': [30.0668, 79.0193], 'himachal pradesh': [31.1048, 77.1734], 'chhattisgarh': [21.2787, 81.8661],
  'goa': [15.2993, 74.1240], 'tripura': [23.9408, 91.9882], 'manipur': [24.6637, 93.9063],
  'meghalaya': [25.4670, 91.3662], 'nagaland': [26.1584, 94.5624], 'arunachal pradesh': [28.2180, 94.7278],
  'mizoram': [23.1645, 92.9376], 'sikkim': [27.5330, 88.5122],
};

export const getCoordsForLocation = (location) => {
  if (!location) return [20.5937, 78.9629]; // India center fallback
  const district = (location.district || '').toLowerCase().trim();
  const state = (location.state || '').toLowerCase().trim();
  return CITY_COORDS[district] || STATE_COORDS[state] || [20.5937, 78.9629];
};

// ─── Seed Data ────────────────────────────────────────────

export const seedData = () => {
  if (localStorage.getItem(KEYS.SEEDED)) return;

  // Seed citizen account
  const users = getUsers();
  if (!users.find(u => u.email === 'citizen@test.com')) {
    users.push({
      id: 'seed_citizen_001',
      name: 'Demo Citizen',
      email: 'citizen@test.com',
      password: 'Test@123',
      phone: '9876543210',
      role: 'Citizen',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    });
    store(KEYS.USERS, users);
  }

  // Seed reports
  const now = Date.now();
  const seedReports = [
    {
      id: 'EX-2024-000001', reportId: 'EX-2024-000001',
      category: 'Bribery', department: 'Police',
      severity: 'High',
      location: { state: 'Maharashtra', district: 'Mumbai', pincode: '400001' },
      description: 'A traffic constable at the Andheri checkpoint demanded ₹500 to avoid issuing a challan for a minor lane violation. He refused to provide a proper receipt and threatened to seize the vehicle.',
      evidenceText: 'Dashcam footage available',
      status: 'Under Review',
      citizenId: 'seed_citizen_001', citizenName: 'Anonymous',
      isAnonymousMode: 'full-anonymous',
      createdAt: new Date(now - 10 * 86400000).toISOString(),
      isFlagged: false, flags: 0, upvotes: 12,
      timeline: [
        { status: 'Submitted', note: 'Report filed anonymously. Triaged for review.', updatedAt: new Date(now - 10 * 86400000).toISOString() },
        { status: 'Under Review', note: 'Assigned to Anti-Corruption Cell, Mumbai North.', updatedAt: new Date(now - 7 * 86400000).toISOString() }
      ]
    },
    {
      id: 'EX-2024-000002', reportId: 'EX-2024-000002',
      category: 'Corruption', department: 'Municipal Corporation',
      severity: 'Critical',
      location: { state: 'Delhi', district: 'New Delhi', pincode: '110001' },
      description: 'Contract for road repair work worth ₹45 lakhs awarded to an ineligible contractor with ties to a councilmember. Quality of work is substandard and roads have already deteriorated within 2 months.',
      evidenceText: 'Tender documents, photos of damaged road',
      status: 'Resolved',
      citizenId: 'seed_citizen_001', citizenName: 'Anonymous',
      isAnonymousMode: 'full-anonymous',
      createdAt: new Date(now - 45 * 86400000).toISOString(),
      isFlagged: false, flags: 0, upvotes: 34,
      timeline: [
        { status: 'Submitted', note: 'Report received.', updatedAt: new Date(now - 45 * 86400000).toISOString() },
        { status: 'Under Review', note: 'Escalated to Vigilance Directorate.', updatedAt: new Date(now - 42 * 86400000).toISOString() },
        { status: 'Resolved', note: 'Contractor blacklisted. FIR registered. Road work ordered re-done at contractor expense.', updatedAt: new Date(now - 20 * 86400000).toISOString() }
      ]
    },
    {
      id: 'EX-2024-000003', reportId: 'EX-2024-000003',
      category: 'Harassment', department: 'Education',
      severity: 'Medium',
      location: { state: 'Karnataka', district: 'Bangalore', pincode: '560001' },
      description: 'School principal is demanding ₹2000 per student as "voluntary donations" for end-of-year activities but making it mandatory with threats of exclusion from events. Several parents have complained.',
      evidenceText: 'WhatsApp group message screenshots',
      status: 'Submitted',
      citizenId: 'anon_seed_002', citizenName: 'Anonymous',
      isAnonymousMode: 'full-anonymous',
      createdAt: new Date(now - 3 * 86400000).toISOString(),
      isFlagged: false, flags: 0, upvotes: 7,
      timeline: [
        { status: 'Submitted', note: 'Report under initial review by the moderation team.', updatedAt: new Date(now - 3 * 86400000).toISOString() }
      ]
    },
    {
      id: 'EX-2024-000004', reportId: 'EX-2024-000004',
      category: 'Land Encroachment', department: 'Revenue Department',
      severity: 'Critical',
      location: { state: 'Uttar Pradesh', district: 'Lucknow', pincode: '226001' },
      description: 'Government land reserved for public park construction has been illegally encroached upon by a builder with alleged nexus to local MLA. Construction started without any permits.',
      evidenceText: 'Satellite images, survey records',
      status: 'Under Review',
      citizenId: 'anon_seed_003', citizenName: 'Anonymous',
      isAnonymousMode: 'full-anonymous',
      createdAt: new Date(now - 15 * 86400000).toISOString(),
      isFlagged: false, flags: 0, upvotes: 28,
      timeline: [
        { status: 'Submitted', note: 'Report received with documentary evidence.', updatedAt: new Date(now - 15 * 86400000).toISOString() },
        { status: 'Under Review', note: 'SDM office contacted for ground verification.', updatedAt: new Date(now - 12 * 86400000).toISOString() }
      ]
    },
  ];

  store(KEYS.REPORTS, seedReports);
  localStorage.setItem(KEYS.REPORT_COUNTER, '4');
  localStorage.setItem(KEYS.SEEDED, '1');
};

// ─── AI Advisor & RTI Generation (local stubs) ────────────

export const getAISuggestion = (reportId) => {
  const report = getReportById(reportId);
  if (!report) return null;
  const dept = report.department || 'Authority';
  return {
    success: true,
    aiSuggestion: {
      legalReference: `Under Section 7 of the Prevention of Corruption Act (1988), ${report.category} by a public servant is a cognizable offense.`,
      actionSteps: [
        `Submit a formal written complaint to the head of the ${dept}.`,
        "Collect at least two witness statements to support your claims.",
        "Keep a record of all correspondence with the department.",
        "If no action is taken within 15 days, escalate to the Vigilance Commission."
      ],
      contactAuthority: `Vigilance Officer, ${dept} State HQ`,
      timeline: "Expected response within 12-15 working days.",
      draftLetter: `To,
The Public Grievance Officer,
${dept} Department.

Subject: Formal Complaint regarding ${report.category} (Ref: ${report.reportId})

Respected Sir/Madam,
I am writing to bring to your notice a serious incident of ${report.category} that occurred in ${report.location?.district}. 

Details: ${report.description}

I request you to look into this matter urgently. I have submitted this evidence via the ExposeX Transparency Platform.

Sincerely,
Citizen ${report.reportId}`
    }
  };
};

export const generateRTILetter = (reportId) => {
  const report = getReportById(reportId);
  if (!report) return null;
  return {
    success: true,
    rtiLetter: `APPLICATION FORM FOR SEEKING INFORMATION UNDER RTI ACT, 2005

To,
The Public Information Officer (PIO),
${report.department} Department, ${report.location?.state}.

1. Full Name of Applicant: [Citizen Name]
2. Address: [Citizen Address]
3. Particulars of Information required:
   a. Subject matter: Investigation status of Complaint Ref ${report.reportId}
   b. Period: From ${new Date(report.createdAt).toLocaleDateString()} to ${new Date().toLocaleDateString()}
   c. Description: Please provide the current status, officer assigned, and daily progress report of the investigation into the ${report.category} complaint filed regarding ${report.location?.district}.

4. Whether the applicant is below poverty line: No
5. Fee Details: Rs. 10/- (IPO No: [Number])

Place: ${report.location?.district}
Date: ${new Date().toLocaleDateString()}`
  };
};

export const getPulseData = () => {
    const reports = getReports();
    return reports.slice(0, 10).map(r => ({
        location: r.location,
        category: r.category,
        createdAt: r.createdAt
    }));
};

export const getMapAnalytics = () => {
    const reports = getReports();
    const states = {};
    const categories = {};
    
    reports.forEach(r => {
        const s = r.location?.state || 'Unknown';
        states[s] = (states[s] || 0) + 1;
        categories[r.category] = (categories[r.category] || 0) + 1;
    });

    const indices = Object.entries(states).map(([state, count]) => {
        const index = Math.min(count * 5, 100);
        return {
            state,
            index,
            label: index > 50 ? 'High 🔥' : index > 20 ? 'Moderate ⚡' : 'Low 🛡️'
        };
    });

    const trendingZones = Object.entries(states).slice(0, 2).map(([state]) => ({
        state,
        increase: Math.floor(Math.random() * 40) + 10
    }));

    const insights = [
        `${Object.keys(states)[0] || 'Delhi'} shows a ${Math.floor(Math.random() * 20) + 10}% spike in reports this week.`,
        `${Object.keys(categories)[0] || 'Bribery'} remains the most reported category nationwide.`,
        "Community vigilance is up by 45% based on upvote engagement."
    ];

    return { indices, trendingZones, insights };
};
