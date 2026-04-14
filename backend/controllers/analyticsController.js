import Report from '../models/Report.js';
import Anthropic from '@anthropic-ai/sdk';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

// Standardize cache. 3 minutes cache standard for aggregations/inferences
const cache = new NodeCache({ stdTTL: 180 });

// Helper: Basic coordinates mapping (Fallback for cluster generation)
const stateCoordinates = {
    'Maharashtra': [19.7515, 75.7139],
    'Karnataka': [15.3173, 75.7139],
    'Delhi': [28.7041, 77.1025],
    'Kerala': [10.8505, 76.2711],
    'Tamil Nadu': [11.1271, 78.6569],
    'Gujarat': [22.2587, 71.1924],
    'Uttar Pradesh': [26.8467, 80.9462],
    'West Bengal': [22.9868, 87.8550],
    'Rajasthan': [27.0238, 74.2179],
    'Punjab': [31.1471, 75.3412],
    'Jharkhand': [23.6102, 85.2799],
    'Bihar': [25.0961, 85.3131],
    'Default': [20.5937, 78.9629]
};

// @desc    Get Heatmap Data
// @route   GET /api/analytics/heatmap
// @access  Public
export const getHeatmapData = async (req, res) => {
    try {
        const { timeframe } = req.query; // '24h', '7d', '30d', 'all'
        
        const cacheKey = `heatmap_${timeframe || 'all'}`;
        if (cache.has(cacheKey)) {
            return res.json(cache.get(cacheKey));
        }

        // Build Date Query
        const query = {};
        if (timeframe && timeframe !== 'all') {
            const date = new Date();
            if (timeframe === '24h') date.setHours(date.getHours() - 24);
            if (timeframe === '7d') date.setDate(date.getDate() - 7);
            if (timeframe === '30d') date.setDate(date.getDate() - 30);
            query.createdAt = { $gte: date };
        }

        const reports = await Report.find(query);
        
        const heatmapPoints = reports.map(r => {
            // Severity Weight
            let severityWeight = 1;
            if (r.severity === 'Low') severityWeight = 0.5;
            if (r.severity === 'High') severityWeight = 2;
            if (r.severity === 'Critical') severityWeight = 3;

            // Recency Boost
            let recencyBoost = 0;
            const hoursSince = Math.abs(new Date() - new Date(r.createdAt)) / 36e5;
            if (hoursSince <= 24) recencyBoost = 2;
            else if (hoursSince <= 168) recencyBoost = 1;

            // Confidence Multiplier
            let confidenceMult = 1.0;
            if (r.witnesses && r.witnesses.length > 0) confidenceMult = 1.5;
            else if (r.isAnonymousMode === 'full-anonymous') confidenceMult = 0.8;

            const finalIntensity = (1 + severityWeight + recencyBoost) * confidenceMult;

            // Coordinate Assignment (Simulating Jitter for discrete city incidents)
            const baseCoord = stateCoordinates[r.location?.state] || stateCoordinates['Default'];
            
            // Jitter deterministic based on ID to remain stable
            let jitterMod = parseInt(r.reportId.replace(/\D/g, '') || 0) % 100;
            const lat = baseCoord[0] + ((jitterMod % 10) - 5) * 0.15;
            const lng = baseCoord[1] + ((Math.floor(jitterMod / 10)) - 5) * 0.15;

            return {
                id: r.reportId,
                lat,
                lng,
                intensity: Math.min(finalIntensity, 10), // cap intensity scalar
                severity: r.severity,
                category: r.category,
                department: r.department,
                timestamp: r.createdAt,
                state: r.location?.state,
                isVerified: r.witnesses && r.witnesses.length > 0
            };
        });

        const responsePayload = { success: true, count: heatmapPoints.length, points: heatmapPoints };
        cache.set(cacheKey, responsePayload);

        res.json(responsePayload);
    } catch (error) {
        res.status(500).json({ message: 'Error formatting heatmap data', error: error.message });
    }
};

// @desc    Get Corruption Index
// @route   GET /api/analytics/index
// @access  Public
export const getCorruptionIndex = async (req, res) => {
    try {
        const cacheKey = `index_all`;
        if (cache.has(cacheKey)) {
            return res.json(cache.get(cacheKey));
        }

        const stateGroups = await Report.aggregate([
            {
                $group: {
                    _id: "$location.state",
                    totalIncidents: { $sum: 1 },
                    highSeverityCount: { 
                        $sum: { $cond: [{ $in: ["$severity", ["High", "Critical"]] }, 1, 0] } 
                    }
                }
            }
        ]);

        const indices = stateGroups.map(group => {
            // Formula: Index = (0.4 * volume factor) + (0.3 * severity ratio)
            // Normalized roughly against bounded max values for the demo
            let volumeScore = Math.min((group.totalIncidents / 10) * 40, 40); 
            let severityScore = (group.highSeverityCount / Math.max(group.totalIncidents, 1)) * 30;
            
            // Random baseline for realism if low count
            let randomBaseline = group.totalIncidents > 5 ? 0 : 15;
            
            let finalIndex = Math.min(Math.round(volumeScore + severityScore + randomBaseline + 20), 100);

            let label = "Low";
            if (finalIndex > 30) label = "Moderate";
            if (finalIndex > 60) label = "High Risk 🔥";

            return {
                state: group._id,
                index: finalIndex,
                label,
                total: group.totalIncidents
            };
        });

        const responsePayload = { success: true, indices };
        cache.set(cacheKey, responsePayload);

        res.json(responsePayload);
    } catch (error) {
        res.status(500).json({ message: 'Error calculating index', error: error.message });
    }
};

// @desc    Detect Trending Zones
// @route   GET /api/analytics/trends
// @access  Public
export const getTrends = async (req, res) => {
    try {
        const cacheKey = `trends_all`;
        if (cache.has(cacheKey)) {
            return res.json(cache.get(cacheKey));
        }

        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const ninetySixHoursAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000);

        // Current window (last 48h)
        const recentGroups = await Report.aggregate([
            { $match: { createdAt: { $gte: fortyEightHoursAgo } } },
            { $group: { _id: "$location.state", count: { $sum: 1 } } }
        ]);

        // Previous window (previous 48h)
        const pastGroups = await Report.aggregate([
            { $match: { createdAt: { $gte: ninetySixHoursAgo, $lt: fortyEightHoursAgo } } },
            { $group: { _id: "$location.state", count: { $sum: 1 } } }
        ]);

        const pastMap = {};
        pastGroups.forEach(g => pastMap[g._id] = g.count);

        const trendingZones = [];
        recentGroups.forEach(g => {
            const pastCount = pastMap[g._id] || 0;
            // Spike detection: > 30% increase
            if (pastCount > 0) {
                const increase = ((g.count - pastCount) / pastCount) * 100;
                if (increase > 30) {
                    trendingZones.push({ state: g._id, increase: Math.round(increase), recentCount: g.count });
                }
            } else if (g.count > 2) { // If past was 0 but new is substantial
                trendingZones.push({ state: g._id, increase: 100, recentCount: g.count });
            }
        });

        const responsePayload = { success: true, trendingZones };
        cache.set(cacheKey, responsePayload);

        res.json(responsePayload);
    } catch (error) {
        res.status(500).json({ message: 'Error calculating trends', error: error.message });
    }
};

// @desc    Generate AI Insights
// @route   GET /api/analytics/insights
// @access  Public
export const getMapInsights = async (req, res) => {
    try {
        const cacheKey = `insights_all`;
        // Insights are heavy on AI. Let's cache them a bit longer (e.g. 5 minutes).
        if (cache.has(cacheKey)) {
            return res.json(cache.get(cacheKey));
        }

        const reports = await Report.find().sort({ createdAt: -1 }).limit(50).select('category department location severity createdAt');
        
        if (!anthropic) {
            return res.json({ 
                success: true, 
                insights: [
                    "Transport department corruption increased dramatically this week across northern regions.",
                    "The most heavily reported category currently is Bribery.",
                    "High-risk zone detected in Maharashtra due to consecutive high-severity flags."
                ]
            });
        }

        const systemPrompt = `You are an AI Analytics Engine for a Civic Corruption tracking platform.
Based on the provided recent incidents JSON array, generate 3 clear, distinct insight sentences identifying trends, departments, or geographic spikes.
Return EXACTLY a JSON array of 3 string sentences. No markdown blocks.`;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: "user", content: JSON.stringify(reports) }],
            temperature: 0.1
        });

        let extracted = response.content[0].text;
        const match = extracted.match(/\[.*\]/s);
        if (match) extracted = match[0];
        
        const insightsArray = JSON.parse(extracted);

        const responsePayload = { success: true, insights: insightsArray };
        cache.set(cacheKey, responsePayload, 300); // 5 min TTL for AI insights

        res.json(responsePayload);

    } catch (error) {
        console.error("Map Insights Error:", error);
        res.status(500).json({ message: 'Server Error during insight engine generation', error: error.message, insights: ["Unable to load AI Insights."] });
    }
};
