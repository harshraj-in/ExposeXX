import React, { useState, useEffect } from 'react';
import { Bot, Flame, Activity, Loader2, Building2, Filter, Menu, X, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMapAnalytics } from '../storage';

export default function MapInsightPanel({ onFilterChange }) {
    const { t } = useTranslation();
    const [insights, setInsights] = useState([]);
    const [indices, setIndices] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchAnalytics = () => {
            setLoading(true);
            setTimeout(() => {
                const data = getMapAnalytics();
                setInsights(data.insights);
                setIndices(data.indices);
                setTrends(data.trendingZones);
                setLoading(false);
            }, 600);
        };
        fetchAnalytics();
    }, []);

    const PanelContent = () => (
        <>
            <div className="flex items-center mb-8 pt-4 md:pt-0">
                <Globe2 className="text-ex-cyan h-7 w-7 mr-3 animate-pulse" />
                <h2 className="text-2xl font-bold font-display text-ex-navy dark:text-white">{t('map.intelligenceMap')}</h2>
            </div>
            
            {/* Filters */}
            <div className="space-y-5 mb-10 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-inner">
                <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 flex items-center mb-2 tracking-widest"><Building2 className="h-3 w-3 mr-1.5"/> {t('map.departmentLayer')}</label>
                    <select className="w-full text-sm p-3 rounded-xl border-2 border-gray-100 focus:border-ex-cyan dark:border-slate-600 dark:bg-slate-800 dark:text-white transition-all outline-none" onChange={(e) => onFilterChange('department', e.target.value)}>
                        <option value="All">{t('map.allDepartments')}</option>
                        <option value="Police">{t('report.departments.Police')}</option>
                        <option value="Revenue">{t('report.departments.Revenue')}</option>
                        <option value="Transport">{t('report.departments.Transport')}</option>
                        <option value="General">{t('report.departments.General')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 flex items-center mb-2 tracking-widest"><Filter className="h-3 w-3 mr-1.5"/> {t('map.category')}</label>
                    <select className="w-full text-sm p-3 rounded-xl border-2 border-gray-100 focus:border-ex-cyan dark:border-slate-600 dark:bg-slate-800 dark:text-white transition-all outline-none" onChange={(e) => onFilterChange('category', e.target.value)}>
                        <option value="All">{t('map.allCategories')}</option>
                        <option value="Bribery">{t('report.categories.Bribery')}</option>
                        <option value="Land Fraud">{t('report.categories.Land Fraud')}</option>
                        <option value="Police Misconduct">{t('report.categories.Police Misconduct')}</option>
                        <option value="Election Fraud">{t('report.categories.Election Fraud')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 mb-2 tracking-widest">{t('map.visualMode')}</label>
                    <select className="w-full text-sm p-3 rounded-xl border-2 border-gray-100 focus:border-ex-cyan dark:border-slate-600 dark:bg-slate-800 dark:text-white transition-all outline-none" onChange={(e) => onFilterChange('visualMode', e.target.value)}>
                        <option value="heatmap">{t('map.heatmapView')}</option>
                        <option value="pins">{t('map.pinsView')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                    <Loader2 className="w-10 h-10 animate-spin text-ex-navy dark:text-white mb-4" />
                    <span className="text-xs font-bold tracking-tighter uppercase">{t('map.analyzing')}</span>
                </div>
            ) : (
                <div className="space-y-8 flex-grow overflow-y-auto pr-2 custom-scrollbar pb-10">
                    
                    {/* Trending Zones */}
                    {trends.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-5 rounded-2xl transition-colors shadow-sm">
                            <h3 className="text-red-800 dark:text-red-400 font-black flex items-center text-[10px] uppercase tracking-widest mb-4"><Flame className="w-4 h-4 mr-2"/> {t('map.trendingZones')}</h3>
                            <div className="space-y-3">
                                {trends.map(t => (
                                    <div key={t.state} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-red-100 dark:border-red-900/20 group hover:scale-[1.02] transition-transform">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{t.state}</span>
                                        <span className="text-red-600 dark:text-red-400 font-black text-xs">+{t.increase}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Corruption Index */}
                    <div>
                        <h3 className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 mb-5 flex items-center tracking-widest"><Activity className="w-4 h-4 mr-2"/> {t('map.liveIndex')}</h3>
                        <div className="space-y-3">
                            {indices.map(idx => (
                                <div key={idx.state} className="flex justify-between items-center p-3 border-2 border-gray-50 dark:border-slate-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all group">
                                    <span className="text-sm font-bold text-ex-navy dark:text-white">{idx.state}</span>
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm ${idx.index >= 60 ? 'bg-red-100 text-red-700' : idx.index >= 30 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {idx.label.split(' ')[0]}
                                        </span>
                                        <span className="text-sm font-black text-ex-navy dark:text-white tabular-nums">{idx.index}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-ex-navy text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <Bot className="w-32 h-32" />
                        </div>
                        <h3 className="text-ex-cyan font-black text-[10px] uppercase tracking-[0.2em] mb-5 flex items-center relative z-10"><Bot className="w-4 h-4 mr-2 shadow-ex-cyan/50 shadow-lg"/> {t('map.aiInsights')}</h3>
                        <ul className="space-y-4 relative z-10">
                            {insights.map((insight, idx) => (
                                <li key={idx} className="text-xs leading-relaxed flex items-start text-blue-100/80">
                                    <div className="w-1.5 h-1.5 rounded-full bg-ex-cyan mt-1.5 mr-3 shrink-0 shadow-ex-cyan/50 shadow-sm"></div>
                                    <span className="group-hover:text-white transition-colors">{insight}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center relative z-10">
                            <span className="text-[10px] font-bold text-ex-cyan animate-pulse">{t('map.liveAnalysis')}</span>
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-ex-cyan rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-ex-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-ex-cyan rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* Mobile Toggle */}
            <button 
                className="md:hidden fixed top-20 right-4 z-[1001] bg-ex-navy text-white p-3 rounded-full shadow-2xl border-2 border-white/10 backdrop-blur-md"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-[1000] w-80 bg-white dark:bg-slate-900 border-r-2 border-gray-100 dark:border-slate-800 p-7 flex flex-col shadow-2xl transition-all duration-500 ease-in-out md:relative md:translate-x-0 pt-24 md:pt-10
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <PanelContent />
            </div>
            
            {/* Mobile overlay backdrop */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-ex-navy/40 z-[999] md:hidden backdrop-blur-md transition-all duration-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
