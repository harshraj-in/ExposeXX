import React, { useState, useEffect } from 'react';
import { AlertCircle, Bot, Flame, Activity, Loader2, Building2, Filter, Menu, X, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/apiClient';

export default function MapInsightPanel({ onFilterChange }) {
    const { t } = useTranslation();
    const [insights, setInsights] = useState([]);
    const [indices, setIndices] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [insightRes, indexRes, trendRes] = await Promise.all([
                    apiClient.get('/analytics/insights'),
                    apiClient.get('/analytics/index'),
                    apiClient.get('/analytics/trends')
                ]);
                setInsights(insightRes.data.insights || []);
                
                // Sort indices descending to show top offenders
                const sortedIndices = (indexRes.data.indices || []).sort((a,b) => b.index - a.index);
                setIndices(sortedIndices);
                
                setTrends(trendRes.data.trendingZones || []);
            } catch (error) {
                console.error("Failed fetching map analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const PanelContent = () => (
        <>
            <div className="flex items-center mb-6 pt-4 md:pt-0">
                <Globe2 className="text-ex-cyan h-6 w-6 mr-2" />
                <h2 className="text-xl font-bold font-display text-ex-navy">{t('map.intelligenceMap')}</h2>
            </div>
            
            {/* Filters */}
            <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 flex items-center mb-1"><Building2 className="h-3 w-3 mr-1"/> {t('map.departmentLayer')}</label>
                    <select className="w-full text-sm p-2 rounded border border-gray-300" onChange={(e) => onFilterChange('department', e.target.value)}>
                        <option value="All">{t('map.all')} {t('form.step.category.placeholder') || 'Departments'}</option>
                        <option value="Police">Police</option>
                        <option value="Revenue">Revenue / Land</option>
                        <option value="Municipal">Municipal Corporation</option>
                        <option value="Transport">Transport (RTO)</option>
                        <option value="General">General / Others</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 flex items-center mb-1"><Filter className="h-3 w-3 mr-1"/> {t('map.category')}</label>
                    <select className="w-full text-sm p-2 rounded border border-gray-300" onChange={(e) => onFilterChange('category', e.target.value)}>
                        <option value="All">{t('map.all')} {t('map.category')}</option>
                        <option value="Bribery">Bribery</option>
                        <option value="Land Fraud">Land Fraud</option>
                        <option value="Police Misconduct">Police Misconduct</option>
                        <option value="Election Fraud">Election Fraud</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">{t('map.visualMode')}</label>
                    <select className="w-full text-sm p-2 rounded border border-gray-300" onChange={(e) => onFilterChange('visualMode', e.target.value)}>
                        <option value="heatmap">{t('map.heatmapView')}</option>
                        <option value="pins">{t('map.pinsView')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : (
                <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* Trending Zones */}
                    {trends.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                            <h3 className="text-red-800 font-bold flex items-center text-sm uppercase tracking-wide mb-2"><Flame className="w-4 h-4 mr-1"/> {t('map.trendingZones')}</h3>
                            {trends.map(t => (
                                <div key={t.state} className="flex justify-between items-center bg-white p-2 rounded shadow-sm mb-2 text-sm">
                                    <span className="font-bold text-gray-700">{t.state}</span>
                                    <span className="text-red-600 font-bold">+{t.increase}%</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Corruption Index Top 3 */}
                    <div>
                        <h3 className="text-xs uppercase font-bold text-gray-500 mb-3 flex items-center"><Activity className="w-4 h-4 mr-1"/> {t('map.liveIndex')}</h3>
                        <div className="space-y-2">
                            {indices.slice(0, 3).map(idx => (
                                <div key={idx.state} className="flex justify-between items-center p-2 border border-gray-100 rounded hover:bg-gray-50">
                                    <span className="text-sm font-bold text-ex-navy">{idx.state}</span>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${idx.index >= 60 ? 'bg-red-100 text-red-700' : idx.index >= 30 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{idx.label.replace('🔥','')}</span>
                                        <span className="text-sm font-black bg-gray-800 text-white px-2 py-0.5 rounded-sm">{idx.index}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-ex-navy text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                            <Bot className="w-24 h-24" />
                        </div>
                        <h3 className="text-ex-cyan font-bold text-sm uppercase tracking-wider mb-4 flex items-center relative z-10"><Bot className="w-4 h-4 mr-2"/> {t('map.aiInsights')}</h3>
                        <ul className="space-y-3 relative z-10">
                            {insights.map((insight, idx) => (
                                <li key={idx} className="text-xs leading-relaxed flex items-start">
                                    <div className="w-1.5 h-1.5 rounded-full bg-ex-cyan mt-1.5 mr-2 shrink-0"></div>
                                    <span>{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* Mobile Toggle */}
            <button 
                className="md:hidden fixed top-20 right-4 z-[1001] bg-ex-navy text-white p-2 rounded-full shadow-lg"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-[1000] w-80 bg-white border-r border-gray-200 p-6 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 pt-20 md:pt-6
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <PanelContent />
            </div>
            
            {/* Mobile overlay backdrop */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[999] md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
