/**
 * ExposeX Legal Advisor Engine
 * Maps report categories to Indian Laws, Steps, and Authorities.
 */

const LEGAL_DATA = {
    'Bribery': {
        laws: [
            'Prevention of Corruption Act, 1988 (Section 7, 13)',
            'Indian Penal Code (Sections 161 - 165)',
            'Central Vigilance Commission Act, 2003'
        ],
        steps: [
            'Gather specific evidence (Audio/Video/Witnesses).',
            'Do NOT pay the bribe if it can be avoided; report immediately.',
            'File a formal complaint with the State Anti-Corruption Bureau (ACB).',
            'Use RTI to track the status of your internal complaint.'
        ],
        authority: 'State Anti-Corruption Bureau (ACB) or Central Bureau of Investigation (CBI)'
    },
    'Corruption': {
        laws: [
            'The Lokpal and Lokayuktas Act, 2013',
            'Prevention of Corruption Act (Amendment 2018)',
            'Indian Penal Code (Section 409 - Criminal Breach of Trust)'
        ],
        steps: [
            'Identify the specific misuse of public funds or authority.',
            'Collect documentary evidence (Tenders, Receipts, Audit reports).',
            'Submit a complaint to the Lokayukta of your state.',
            'If it involves central government employees, approach the CVC.'
        ],
        authority: 'Lokayukta (State) or Central Vigilance Commission (CVC)'
    },
    'Election Fraud': {
        laws: [
            'Representation of the People Act, 1951 (Sections 123, 135)',
            'Indian Penal Code (Sections 171A - 171I)',
            'Election Commission Guidelines'
        ],
        steps: [
            'Report immediately to the District Election Officer (DEO).',
            'Use the cVIGIL app for real-time reporting of violations.',
            'Maintain a record of the location and time of the fraud.'
        ],
        authority: 'Election Commission of India (ECI) / Chief Electoral Officer'
    },
    'Land Fraud': {
        laws: [
            'Indian Penal Code (Section 420 - Cheating)',
            'The Registration Act, 1908',
            'RERA (Real Estate Regulatory Authority) Act, 2016'
        ],
        steps: [
            'Verify land records on the state government "Bhu-Abhilekh" portal.',
            'File an FIR at the local police station for cheating/forgery.',
            'Approach RERA if the fraud involves a real estate developer.',
            'Apply for a stay order in the Civil Court if construction is illegal.'
        ],
        authority: 'District Registrar, RERA, or Civil Court'
    },
    'Police Misconduct': {
        laws: [
            'The Police Act, 1861',
            'CRPC Section 154 (Right to file FIR)',
            'Indian Penal Code (Section 166 - Public servant disobeying law)'
        ],
        steps: [
            'Note the officer\'s name, batch number, and vehicle plate.',
            'Record the incident if safe to do so.',
            'Escalate to the Superintendent of Police (SP) or DCP.',
            'File a complaint with the Police Complaints Authority (PCA).'
        ],
        authority: 'Police Complaints Authority (PCA) or National Human Rights Commission (NHRC)'
    },
    'Harassment': {
        laws: [
            'Indian Penal Code (Section 354, 509)',
            'Sexual Harassment of Women at Workplace Act, 2013',
            'Information Technology Act, 2000 (Section 67 for online harassment)'
        ],
        steps: [
            'Keep all digital logs (Screenshots, Emails, Messages).',
            'Report to the Internal Complaints Committee (ICC) if at work.',
            'File a complaint on the National Commission for Women (NCW) portal.',
            'Approach the local Women\'s Help Desk (Dial 1091).'
        ],
        authority: 'National Commission for Women (NCW) or Local Police Station'
    },
    'Land Encroachment': {
        laws: [
            'Indian Penal Code (Section 441 - Criminal Trespass)',
            'The Public Premises (Eviction of Unauthorised Occupants) Act, 1971',
            'State-specific Land Revenue Codes'
        ],
        steps: [
            'Check the official area map at the Tehsildar office.',
            'Issue a legal notice to the encroacher.',
            'File a written complaint with the District Collector or SDM.',
            'Request a boundary survey through the Revenue Department.'
        ],
        authority: 'Tehsildar / District Collector Office'
    },
    'Other': {
        laws: [
            'Indian Penal Code (General Provisions)',
            'The Consumer Protection Act, 2019'
        ],
        steps: [
            'Clearly define the grievance and the public interest involved.',
            'Identify the relevant department head.',
            'Search for the Citizens Charter of the involved organization.'
        ],
        authority: 'Public Grievance Portal (PGPortal) or District Magistrate'
    }
};

export const getLegalAdvice = (category) => {
    return LEGAL_DATA[category] || LEGAL_DATA['Other'];
};
