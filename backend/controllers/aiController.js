import Anthropic from '@anthropic-ai/sdk';
import Report from '../models/Report.js';
import { awardBadge } from '../utils/badgeHelper.js';

let anthropic = null;
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
    anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
}

export const getAiSuggestion = async (req, res) => {
    try {
        const { reportId } = req.body;
        const report = await Report.findOne({ reportId });
        if (!report) return res.status(404).json({ message: 'Report not found' });

        if (report.aiSuggestion && report.aiSuggestion.actionSteps && report.aiSuggestion.actionSteps.length > 0) {
            return res.json({ success: true, aiSuggestion: report.aiSuggestion });
        }

        // Parse frontend generated description if available
        const descriptionText = report.description || '';
        
        const timeMatch = descriptionText.match(/Date of Incident:\s*(.*)/i);
        const venueMatch = descriptionText.match(/Location Context:\s*(.*)/i);
        const personMatch = descriptionText.match(/Involved Parties:\s*(.*)/i);
        const proofMatch = descriptionText.match(/Available Evidence Context:\s*(.*)/i);
        
        let detailsText = descriptionText;
        const detailsMatch = descriptionText.match(/Incident Details:\n([\s\S]*?)(?:\nAvailable Evidence Context:|$)/i);
        if (detailsMatch) {
            detailsText = detailsMatch[1].trim();
        }

        const time = timeMatch ? timeMatch[1].trim() : "Not specified";
        const venue = venueMatch ? venueMatch[1].trim() : (report.location?.district || "Not specified");
        const person = personMatch ? personMatch[1].trim() : "Not specified";
        const proof = proofMatch ? proofMatch[1].trim() : "Not specified";
        const details = detailsText;

        if (!anthropic) {
            let mockIpc = "IPC Section 166 - Public servant disobeying law";
            if (report.category === 'Bribery') mockIpc = "Prevention of Corruption Act, Section 7 - Public servant taking bribe";
            else if (report.category === 'Land Fraud') mockIpc = "IPC Section 447 & 420 - Criminal trespass and cheating";
            else if (report.category === 'Police Misconduct') mockIpc = "IPC Section 166 & 166A - Public servant disobeying law / direction under law";
            else if (report.category === 'Government Contractor') mockIpc = "IPC Section 120B & 420 - Criminal conspiracy and cheating in government contracts";
            else if (report.category === 'Election Fraud') mockIpc = "Representation of the People Act, 1951 - Section 123 (Corrupt Practices)";

            const mockParsedAI = {
                legalReference: mockIpc,
                actionSteps: [
                    "Retain all original evidence and do not format storage devices.",
                    "File a formal RTI request demanding details of the blocked procedure.",
                    "Escalate the timeline anomaly to the State Vigilance Committee."
                ],
                contactAuthority: "State Vigilance Commission / CBI Anti-Corruption Branch",
                draftLetter: `To the Respected Authority,\n\nI am writing to formally report an incident of ${report.category}.\n\nIncident Details:\n${details}\n\nLocation/Venue: ${venue}\nDate and Time: ${time}\nPerson(s) involved: ${person}\n\nWe have the following evidence ready to be presented: ${proof}\n\nPlease take swift action in investigating this matter.\n\nRegards,\nA Concerned Citizen`,
                timeline: "Initial review within 48 hours. Formal inquiry ~15 days."
            };
            report.aiSuggestion = mockParsedAI;
            await report.save();
            return res.json({ success: true, aiSuggestion: mockParsedAI });
        }

        const systemPrompt = `You are a civic rights expert and anti-corruption advisor for India. Given a corruption report, you must: (1) Identify the exact law/IPC section violated, (2) Suggest 3 actionable steps the citizen should take immediately, (3) Name the exact government authority or helpline to contact (e.g., Lokpal, CBI, State Vigilance, RTI), (4) Provide a draft complaint letter the user can send, (5) Estimate typical resolution time. Be concise, specific, and empowering.

Output exactly as a JSON object with this exact structure:
{
  "legalReference": "...",
  "actionSteps": ["...", "...", "..."],
  "contactAuthority": "...",
  "draftLetter": "...",
  "timeline": "..."
}`;

        const userContext = `- Incident description: ${details}
- Location/Venue: ${venue}
- Date and Time: ${time}
- Person(s) involved: ${person}
- Evidence available: ${proof}
- Category: ${report.category}
- Department: ${report.department}`;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514", // Model requested by user
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{ role: "user", content: userContext }],
            temperature: 0.3
        });

        let aiJsonText = response.content[0].text;
        if (aiJsonText.includes('```json')) aiJsonText = aiJsonText.split('```json')[1].split('```')[0].trim();
        else if (aiJsonText.includes('```')) aiJsonText = aiJsonText.split('```')[1].split('```')[0].trim();
        const parsedAI = JSON.parse(aiJsonText);

        report.aiSuggestion = parsedAI;
        await report.save();
        res.json({ success: true, aiSuggestion: parsedAI });

    } catch (error) {
        console.error("AI Gen Error:", error);
        res.status(500).json({ message: 'Server Error during AI generation', error: error.message });
    }
};

// @desc    Generate RTI Letter
// @route   POST /api/ai/generate-rti
export const generateRtiLetter = async (req, res) => {
    try {
        const { reportId } = req.body;
        const report = await Report.findOne({ reportId });
        if (!report) return res.status(404).json({ message: 'Report not found' });

        if (report.aiSuggestion && report.aiSuggestion.rtiLetter) {
            return res.json({ success: true, rtiLetter: report.aiSuggestion.rtiLetter });
        }

        const descriptionText = report.description || '';
        const timeMatch = descriptionText.match(/Date of Incident:\s*(.*)/i);
        const venueMatch = descriptionText.match(/Location Context:\s*(.*)/i);
        const detailsMatch = descriptionText.match(/Incident Details:\n([\s\S]*?)(?:\nAvailable Evidence Context:|$)/i);
        
        const time = timeMatch ? timeMatch[1].trim() : "Not specified";
        const venue = venueMatch ? venueMatch[1].trim() : (report.location?.district || "Not specified");
        const details = detailsMatch ? detailsMatch[1].trim() : descriptionText;

        if (!anthropic) {
            const mockRti = `FORM A\nForm of application for seeking information under the Right to Information Act, 2005\n\nTo,\nThe Public Information Officer (PIO),\n${report.department} Department,\n${report.location.state}.\n\n1. Name of the Applicant: Concerned Citizen\n2. Address: ${report.location.district}\n\n3. Particulars of Information Required:\nI seek the following information under Section 6 of the RTI Act 2005 regarding an incident of ${report.category} that occurred at ${venue} on ${time}:\n\na) Please provide a copy of all official records/CCTV footage related to this incident if available.\nb) Please provide the action taken report on any internal complaints regarding this matter.\nc) Details of the officers on duty during this incident.\n\n4. Format: I would like this information in printed format.\n\nPlease provide the requested information within 30 days as mandated by the Act.\n\nSignature:\nDate:`;
            
            if (!report.aiSuggestion) report.aiSuggestion = {};
            report.aiSuggestion.rtiLetter = mockRti;
            await report.save();

            if (req.user) {
                await awardBadge(req.user._id, 'RTI Warrior');
            }

            return res.json({ success: true, rtiLetter: mockRti });
        }

        const systemPrompt = `You are an expert Indian lawyer specializing in the Right to Information (RTI) Act, 2005. 
Given the details of an incident, generate a ready-to-file RTI application in standard formal Indian format (Form A or equivalent). 
Include:
- The correct PIO / department mapping based on the provided department.
- Reference to RTI Act 2005, Section 6.
- 3 to 4 specific points of information being sought, directly related to the incident description.
- Proper filing placeholders like applicant name, date, and signature.
Do NOT use markdown code blocks, just output the plain text letter.`;

        const userContext = `Department: ${report.department}
State: ${report.location.state}
Category: ${report.category}
Date/Time: ${time}
Location: ${venue}
Incident: ${details}`;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: userContext }],
            temperature: 0.3
        });

        let aiText = response.content[0].text;

        if (!report.aiSuggestion) report.aiSuggestion = {};
        report.aiSuggestion.rtiLetter = aiText;
        await report.save();
        
        if (req.user) {
            await awardBadge(req.user._id, 'RTI Warrior');
        }

        res.json({ success: true, rtiLetter: aiText });

    } catch (error) {
        console.error("RTI Gen Error:", error);
        res.status(500).json({ message: 'Server Error during RTI generation', error: error.message });
    }
};

// @desc    Evaluate Draft Complaint Strength (Phase 2)
// @route   POST /api/ai/evaluate-draft
export const evaluateDraft = async (req, res) => {
    try {
        const { text, category, location, evidenceCount } = req.body;
        
        let score = 0;
        let suggestions = [];

        // Simulated AI evaluation logic to save tokens, but provides immediate value
        if (!text || text.length < 20) {
            suggestions.push("Describe the incident in more detail (who, what, when).");
        } else {
            score += 30; // Base score for having reasonable text
            if (text.toLowerCase().includes('date') || text.match(/\d{1,2}[\/\-]\d{1,2}/)) score += 15;
            else suggestions.push("Mention the specific date or time the incident occurred.");
            
            if (text.toLowerCase().includes('rs') || text.toLowerCase().includes('rupees') || text.match(/\d+/)) score += 15;
            else suggestions.push("Identify specific amounts or transaction details if applicable.");
            
            if (text.toLowerCase().includes('officer') || text.toLowerCase().includes('inspector') || text.toLowerCase().includes('clerk')) score += 10;
            else suggestions.push("Specify the designation or name of the official involved.");
        }

        if (category && category !== 'Other') score += 10;
        else suggestions.push("Categorize the incident properly for routing.");

        if (location && location.district) score += 10;
        else suggestions.push("Provide the exact district and state.");

        if (evidenceCount > 0) score += 10;
        else suggestions.push("Attach media or documents. Unverified claims hold less legal weight.");

        if (score > 100) score = 100;

        res.json({
            success: true,
            strengthScore: score,
            suggestions
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get AI Pattern Insights
// @route   GET /api/ai/insights
// @access  Private/Admin
export const getAiInsights = async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 }).limit(30).select('category department location description severity status');
        
        if (!anthropic) {
            return res.json({ 
                success: true, 
                insights: "Mock Insight: Spike in bribery cases localized around Transport departments in Maharashtra. Suspected seasonal correlation with tax filings. Recommend heightened audit in RTO offices." 
            });
        }

        const systemPrompt = `You are an expert Data Analyst specializing in anti-corruption patterns. Analyze the provided recent incident reports and provide a 4-5 sentence high-level summary of any noticeable trends, hotspots, or concerning anomalies across departments, locations, or severity. Note: you cannot output markdown. Plain text only.`;

        const userContext = JSON.stringify(reports);

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: "user", content: userContext }],
            temperature: 0.2
        });

        res.json({ success: true, insights: response.content[0].text });

    } catch (error) {
        console.error("AI Insights Error:", error);
        res.status(500).json({ message: 'Server Error during insight generation', error: error.message });
    }
};

// @desc    Parse WhatsApp Forward
// @route   POST /api/ai/parse-whatsapp
export const parseWhatsapp = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Text required' });

        if (!anthropic) {
            // Mock parsing
            return res.json({
                success: true,
                parsed: {
                    what: text.substring(0, 50) + "...",
                    where: "Extracting...",
                    when: "Extracting...",
                    who: "Extracting...",
                    proof: "Screenshot/Text"
                }
            });
        }

        const systemPrompt = `You are a data extraction assistant. A user has copy-pasted a WhatsApp forward about a civic incident (e.g., corruption, bribery). 
Extract the following information and return ONLY a valid JSON object matching exactly these keys: "what", "where", "when", "who", "proof". 
If you cannot find the information for a key, return an empty string for it.`;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: "user", content: text }],
            temperature: 0.1
        });

        // Use regex to carefully extract JSON block just in case Claude adds intro/outro text
        let jsonStr = response.content[0].text;
        const jsonMatch = jsonStr.match(/\{[\s\S]*?\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        const parsed = JSON.parse(jsonStr);

        res.json({ success: true, parsed });

    } catch (error) {
        console.error("WhatsApp Parse Error:", error);
        res.status(500).json({ message: 'Server Error during parsing' });
    }
};
