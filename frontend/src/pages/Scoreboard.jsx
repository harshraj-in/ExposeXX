import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Scoreboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndCalculate = async () => {
            try {
                const res = await axios.get('/api/reports/map-data');
                const reports = res.data;

                // Group by state
                const stateData = {};
                
                reports.forEach(report => {
                    const state = report.location?.state || 'Unknown';
                    if (!stateData[state]) {
                        stateData[state] = {
                            state,
                            total: 0,
                            resolved: 0,
                            categories: {}
                        };
                    }
                    
                    stateData[state].total += 1;
                    
                    if (report.status === 'Resolved' || report.status === 'Closed') {
                        stateData[state].resolved += 1;
                    }

                    const cat = report.category || 'Other';
                    stateData[state].categories[cat] = (stateData[state].categories[cat] || 0) + 1;
                });

                // Calculate metrics
                const processed = Object.values(stateData).map(data => {
                    const resolutionRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
                    
                    // Find most common category
                    let maxCat = '-';
                    let maxCount = 0;
                    for (const [cat, count] of Object.entries(data.categories)) {
                        if (count > maxCount) {
                            maxCount = count;
                            maxCat = cat;
                        }
                    }

                    return {
                        ...data,
                        resolutionRate,
                        mostCommonCategory: maxCat
                    };
                });

                // Sort by total reports descending
                processed.sort((a, b) => b.total - a.total);
                
                setStats(processed);
                setLoading(false);
            } catch (err) {
                console.error("Scoreboard error:", err);
                setError("Failed to load scoreboard data");
                setLoading(false);
            }
        };

        fetchAndCalculate();
    }, []);

    const getBadgeColor = (rate) => {
        if (rate > 60) return 'bg-green-100 text-green-800 border-green-200';
        if (rate >= 30) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto py-12 px-4 shadow-sm"
        >
            <div className="text-center mb-10">
                <h1 className="text-4xl font-display font-bold text-ex-navy flex justify-center items-center">
                    <Trophy className="h-10 w-10 text-ex-cyan mr-4" /> 
                    {t('scoreboard.title')}
                </h1>
                <p className="text-gray-600 mt-3 max-w-2xl mx-auto">{t('scoreboard.subtitle')}</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-ex-navy border-t-ex-cyan rounded-full animate-spin"></div></div>
            ) : error ? (
                <div className="text-red-500 text-center py-10 bg-red-50 rounded-xl">{error}</div>
            ) : (
                <div className="glass-card overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-ex-navy text-white text-sm">
                                    <th className="p-4 font-semibold uppercase tracking-wider">{t('scoreboard.rank')}</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider">{t('scoreboard.state')}</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider text-center">{t('scoreboard.total')}</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider text-center">{t('scoreboard.resolved')}</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider">{t('scoreboard.rate')}</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider">{t('scoreboard.primary')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {stats.map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-500 bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full">
                                                #{index + 1}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-ex-navy">{row.state}</td>
                                        <td className="p-4 text-center font-mono font-medium">{row.total}</td>
                                        <td className="p-4 text-center font-mono text-gray-600">{row.resolved}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeColor(row.resolutionRate)}`}>
                                                {row.resolutionRate}% {t('scoreboard.resolvedPercent')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-600">
                                            {row.mostCommonCategory}
                                        </td>
                                    </tr>
                                ))}
                                {stats.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">No data available yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Scoreboard;
