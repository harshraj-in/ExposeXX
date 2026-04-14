import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { ThumbsUp, MessageSquare, Flag, ShieldCheck, ShieldAlert, Clock, Filter, AlertTriangle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import StatusBadge from '../components/StatusBadge';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';

const PublicFeed = () => {
    const { t } = useTranslation();
    const [reports, setReports] = useState([]);
    const [sort, setSort] = useState('urgent');
    const [loading, setLoading] = useState(true);
    const { user } = useStore();

    const fetchFeed = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/reports/feed?sort=${sort}`);
            setReports(res.data);
        } catch (error) {
            toast.error(t('feed.failedLoad') || "Failed to load feed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
        // eslint-disable-next-line
    }, [sort]);

    const handleUpvote = async (id) => {
        try {
            const res = await apiClient.post(`/reports/${id}/upvote`);
            if (res.data.success) {
                setReports(reports.map(r => r.reportId === id ? { ...r, upvotes: res.data.upvotes } : r));
            }
        } catch (error) {
            toast.error("Error upvoting");
        }
    };

    const handleFlag = async (id) => {
        if (!window.confirm(t('feed.confirmFlag') || "Report this post for abuse or fake information?")) return;
        try {
            await apiClient.post(`/reports/${id}/flag`);
            toast.success(t('feed.messageFlagged') || "Post flagged for moderation");
        } catch (error) {
            toast.error(t('feed.failedFlag') || "Failed to flag");
        }
    };

    const handleWitness = async (id) => {
        if (!user) {
            toast.error("Please login to verify as a witness.");
            return;
        }
        if (!window.confirm("Are you verifying that you witnessed this incident? This action is legally protected.")) return;
        try {
            const res = await apiClient.post(`/reports/${id}/witness`);
            if (res.data.success) {
                toast.success("You are now a verified witness.");
                fetchFeed(); // Refresh to show potential severity escalation
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add witness");
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-ex-navy">{t('feed.title')}</h1>
                    <p className="text-gray-500 mt-1 text-sm">{t('feed.subtitle')}</p>
                </div>
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select 
                        className="bg-transparent text-sm font-medium outline-none cursor-pointer"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="recent">{t('feed.recent')}</option>
                        <option value="top">{t('feed.top')}</option>
                        <option value="urgent">{t('feed.urgent')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-ex-navy border-t-ex-cyan rounded-full animate-spin"></div></div>
            ) : (
                <div className="space-y-6">
                    {reports.map(report => (
                        <div key={report.reportId} className={`bg-white rounded-xl shadow-md border overflow-hidden ${report.isFlagged ? 'opacity-60 grayscale' : 'border-gray-200'}`}>
                            {/* Card Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                                <div className="flex flex-col">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="text-xs font-bold font-mono bg-gray-200 text-gray-700 px-2 py-1 rounded">{report.reportId}</span>
                                        <span className="text-xs font-bold text-ex-navy bg-cyan-100 px-2 py-1 rounded">{report.department}</span>
                                        {report.evidenceUrls && report.evidenceUrls.length > 0 ? (
                                            <span className="text-xs font-bold flex items-center text-green-700 bg-green-100 px-2 py-1 rounded">
                                                <ShieldCheck className="h-3 w-3 mr-1"/> {t('feed.verifiedProof')}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded border border-dashed border-gray-300">
                                                <AlertTriangle className="h-3 w-3 mr-1"/> {t('feed.unverified')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                        <Clock className="h-3 w-3 mr-1"/> {formatDistanceToNow(new Date(report.createdAt))} {t('feed.ago')} 
                                        <span className="mx-2">•</span> 
                                        {report.location.district}, {report.location.state}
                                    </div>
                                </div>
                                <StatusBadge status={report.status} />
                            </div>

                            {/* Card Body */}
                            <div className="p-6">
                                <p className="text-gray-800 leading-relaxed text-sm md:text-base">
                                    {report.isFlagged ? <span className="italic text-gray-400">[Content hidden pending moderator review]</span> : report.description}
                                </p>
                            </div>

                            {/* Card Footer */}
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-sm font-medium text-gray-500">
                                <div className="flex space-x-6">
                                    <button onClick={() => handleUpvote(report.reportId)} className="flex items-center hover:text-ex-cyan transition text-ex-navy">
                                        <ThumbsUp className="h-4 w-4 mr-1.5"/> {report.upvotes} {t('feed.support')}
                                    </button>
                                    <button onClick={() => handleWitness(report.reportId)} className="flex items-center hover:text-blue-600 transition" title={t('feed.witness')}>
                                        <Eye className="h-4 w-4 mr-1.5"/> {t('feed.witness')}
                                    </button>
                                    <button className="flex items-center hover:text-ex-navy transition font-bold text-gray-700">
                                        <MessageSquare className="h-4 w-4 mr-1.5"/> {report.comments?.length || 0} {t('feed.comments')}
                                    </button>
                                </div>
                                <button onClick={() => handleFlag(report.reportId)} className="flex items-center text-red-400 hover:text-red-600 transition">
                                    <Flag className="h-4 w-4 mr-1"/> {t('feed.reportAbuse')}
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {reports.length === 0 && (
                        <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
                            {t('feed.noReports')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicFeed;
