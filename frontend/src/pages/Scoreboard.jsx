import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { computeScoreboard } from '../storage';

const Scoreboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Compute scoreboard purely from localStorage data
        setTimeout(() => {
            const result = computeScoreboard();
            setStats(result);
            setLoading(false);
        }, 300);
    }, []);

    const getBadgeColor = (rate) => {
        if (rate > 60) return 'bg-green-100 text-green-800 border-green-200';
        if (rate >= 30) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    const getRankBadge = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto py-8 md:py-12 px-2 sm:px-4"
        >
            <div className="text-center mb-10">
                <h1 className="text-2xl md:text-4xl font-display font-bold text-ex-navy dark:text-white flex justify-center items-center">
                    <Trophy className="h-8 w-8 md:h-10 md:w-10 text-ex-cyan mr-3 md:mr-4" />
                    {t('scoreboard.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-3 text-xs md:text-sm max-w-xl mx-auto">{t('scoreboard.subtitle')}</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-ex-navy border-t-ex-cyan rounded-full animate-spin"></div></div>
            ) : (
                <div className="glass-card overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-ex-navy dark:bg-slate-800 text-white text-[10px] md:text-sm">
                                    <th className="p-2 md:p-4 font-semibold uppercase tracking-wider">{t('scoreboard.rank')}</th>
                                    <th className="p-2 md:p-4 font-semibold uppercase tracking-wider">{t('scoreboard.state')}</th>
                                    <th className="p-2 md:p-4 font-semibold uppercase tracking-wider text-center">{t('scoreboard.total')}</th>
                                    <th className="p-2 md:p-4 font-semibold uppercase tracking-wider text-center">{t('scoreboard.resolved')}</th>
                                    <th className="p-2 md:p-4 font-semibold uppercase tracking-wider">{t('scoreboard.rate')}</th>
                                    <th className="p-2 md:p-4 font-semibold uppercase tracking-wider">{t('scoreboard.primary')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {stats.map((row, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                                    >
                                        <td className="p-2 md:p-4">
                                            <div className={`font-bold text-sm md:text-lg w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-transform group-hover:scale-110 ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400' : 
                                                index === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-gray-300' :
                                                index === 2 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' :
                                                'bg-gray-50 text-gray-400 dark:bg-slate-800/50 dark:text-gray-500 text-[10px]'
                                            }`}>
                                                {getRankBadge(index)}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-ex-navy dark:text-white">{row.state}</td>
                                        <td className="p-4 text-center font-mono font-medium text-gray-700 dark:text-gray-300">{row.total}</td>
                                        <td className="p-4 text-center font-mono text-gray-600 dark:text-gray-400">{row.resolved}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                                row.resolutionRate > 60 ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800' : 
                                                row.resolutionRate >= 30 ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800' : 
                                                'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800'
                                            }`}>
                                                {row.resolutionRate}% {t('scoreboard.resolvedPercent')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">{row.mostCommonCategory}</td>
                                    </motion.tr>
                                ))}
                                {stats.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">{t('scoreboard.noData')}</td>
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
