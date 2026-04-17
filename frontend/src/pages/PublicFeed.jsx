import React, { useEffect, useState, useCallback } from 'react';
import { ThumbsUp, MessageSquare, Flag, ShieldCheck, AlertTriangle, Clock, Filter, Eye, X, Send, Maximize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import StatusBadge from '../components/StatusBadge';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';
import {
    getReports, addSupport, getSupport, addWitnessed, getWitnessed,
    getComments, addComment, addAbuse, updateReport
} from '../storage';

const PublicFeed = () => {
    const { t } = useTranslation();
    const [reports, setReports] = useState([]);
    const [sort, setSort] = useState('urgent');
    const [loading, setLoading] = useState(true);
    const { user } = useStore();

    // Comment modal state
    const [commentReportId, setCommentReportId] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [localComments, setLocalComments] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    const loadFeed = useCallback(() => {
        setLoading(true);
        const all = getReports();
        let sorted = [...all];
        if (sort === 'urgent') {
            const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
            sorted.sort((a, b) => (urgencyOrder[a.severity] ?? 3) - (urgencyOrder[b.severity] ?? 3));
        } else if (sort === 'top') {
            sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        } else {
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        setReports(sorted);
        setLoading(false);
    }, [sort]);

    useEffect(() => { loadFeed(); }, [loadFeed]);

    const handleUpvote = (reportId) => {
        const newCount = addSupport(reportId);
        updateReport(reportId, { upvotes: newCount });
        setReports(prev => prev.map(r => (r.reportId === reportId || r.id === reportId) ? { ...r, upvotes: newCount } : r));
        toast.success('Support registered!');
    };

    const handleWitness = (reportId) => {
        if (!user) { toast.error('Please login to verify as a witness.'); return; }
        if (!window.confirm('Are you verifying that you witnessed this incident?')) return;
        const list = addWitnessed(reportId, user.id);
        toast.success(`You are a verified witness. Total witnesses: ${list.length}`);
    };

    const handleFlag = (reportId) => {
        if (!window.confirm(t('feed.confirmFlag') || 'Report this post for abuse?')) return;
        addAbuse(reportId);
        loadFeed();
        toast.success(t('feed.messageFlagged') || 'Post flagged for moderation');
    };

    const openComments = (reportId) => {
        setCommentReportId(reportId);
        setLocalComments(getComments(reportId));
    };

    const submitComment = () => {
        if (!commentText.trim()) return;
        if (!user) { toast.error('Please login to comment.'); return; }
        const updated = addComment(commentReportId, {
            text: commentText,
            authorId: user.id,
            authorName: user.name,
        });
        setLocalComments(updated);
        setCommentText('');
        toast.success('Comment added!');
    };

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 px-2 sm:px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-ex-navy dark:text-white">{t('feed.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm">{t('feed.subtitle')}</p>
                </div>
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <select
                        className="bg-transparent text-xs md:text-sm font-medium outline-none cursor-pointer dark:text-white flex-1 sm:flex-none"
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
                        <div key={report.reportId} className={`bg-white dark:bg-slate-900 rounded-xl shadow-md border overflow-hidden transition-colors duration-300 ${report.isFlagged ? 'opacity-60 grayscale' : 'border-gray-200 dark:border-slate-800'}`}>
                            {/* Card Header */}
                            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start bg-gray-50/50 dark:bg-slate-800/20 gap-3">
                                <div className="flex flex-col">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="text-[10px] sm:text-xs font-bold font-mono bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">{report.reportId}</span>
                                        <span className="text-[10px] sm:text-xs font-bold text-ex-navy dark:text-ex-cyan bg-cyan-100 dark:bg-ex-cyan/10 px-2 py-1 rounded">{report.department}</span>
                                        {(report.evidence && report.evidence.length > 0) || (report.evidenceUrls && report.evidenceUrls.length > 0) ? (
                                            <span className="text-[10px] sm:text-xs font-bold flex items-center text-green-700 bg-green-100 px-2 py-1 rounded">
                                                <ShieldCheck className="h-3 w-3 mr-1" /> {t('feed.verifiedProof')}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] sm:text-xs font-bold flex items-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded border border-dashed border-gray-300 dark:border-slate-700">
                                                <AlertTriangle className="h-3 w-3 mr-1" /> {t('feed.unverified')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                        <Clock className="h-3 w-3 mr-1" />{formatDistanceToNow(new Date(report.createdAt))} {t('feed.ago')}
                                        <span className="mx-2">•</span>
                                        {report.location?.district || report.location}, {report.location?.state || ''}
                                    </div>
                                </div>
                                <StatusBadge status={report.status} />
                            </div>

                            {/* Card Body */}
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                        report.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800' : 
                                        report.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800' : 
                                        report.severity === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800' : 
                                        'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800'
                                    }`}>
                                        {report.severity}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{report.category}</span>
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm md:text-base">
                                    {report.isFlagged ? <span className="italic text-gray-400 dark:text-gray-500">[Content hidden pending moderator review]</span> : report.description}
                                </p>

                                {/* Evidence Preview (Fix #6) */}
                                {report.evidence && report.evidence.length > 0 && !report.isFlagged && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {report.evidence.slice(0, 3).map((src, idx) => {
                                            const isVideo = src.startsWith('data:video');
                                            return (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => !isVideo && setSelectedImage(src)}
                                                    className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 cursor-zoom-in"
                                                >
                                                    {isVideo ? (
                                                        <video src={src} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <Maximize2 className="text-white w-4 h-4" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {report.evidence.length > 3 && (
                                            <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <span className="text-xs font-bold">+{report.evidence.length - 3}</span>
                                                <span className="text-[10px] uppercase tracking-tighter">{t('feed.more')}</span>
                                            </div>
                                        )}
                                        <div className="w-full mt-1 flex items-center text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">
                                            <ShieldCheck className="h-3 w-3 mr-1" /> {t('feed.evidenceAttached')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="bg-gray-50 dark:bg-slate-800/20 px-4 py-3 md:px-6 md:py-3 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs font-medium text-gray-500 dark:text-gray-400 gap-4">
                                <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:space-x-6 w-full sm:w-auto">
                                    <button onClick={() => handleUpvote(report.reportId)} className="flex items-center hover:text-ex-cyan transition text-ex-navy dark:text-ex-cyan font-bold">
                                        <ThumbsUp className="h-4 w-4 mr-1.5" /> {getSupport(report.reportId) || report.upvotes || 0}
                                    </button>
                                    <button onClick={() => handleWitness(report.reportId)} className="flex items-center hover:text-blue-600 dark:hover:text-ex-cyan transition" title={t('feed.witness')}>
                                        <Eye className="h-4 w-4 mr-1.5" /> {getWitnessed(report.reportId).length}
                                    </button>
                                    <button onClick={() => openComments(report.reportId)} className="flex items-center hover:text-ex-navy dark:hover:text-white transition font-bold text-gray-700 dark:text-gray-300">
                                        <MessageSquare className="h-4 w-4 mr-1.5" /> {getComments(report.reportId).length}
                                    </button>
                                </div>
                                <button onClick={() => handleFlag(report.reportId)} className="flex items-center text-red-400 hover:text-red-600 transition w-full sm:w-auto justify-center sm:justify-end">
                                    <Flag className="h-4 w-4 mr-1" /> {t('feed.reportAbuse')}
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

            {/* Comment Modal */}
            {commentReportId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800">
                        <div className="bg-ex-navy px-6 py-4 flex items-center justify-between text-white">
                            <span className="font-bold">{t('feed.commentsTitle')} — {commentReportId}</span>
                            <button onClick={() => setCommentReportId(null)}><X className="h-5 w-5" /></button>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900/50">
                            {localComments.length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-sm">{t('feed.noComments')}</p>
                            ) : localComments.map((c, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-xs font-bold text-ex-navy dark:text-ex-cyan mb-1">{c.authorName}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-200">{c.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submitComment()}
                                placeholder={user ? 'Write a comment...' : 'Login to comment'}
                                className="flex-1 bg-gray-100 dark:bg-slate-800 border-none dark:text-white rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-ex-navy transition"
                                disabled={!user}
                            />
                            <button onClick={submitComment} disabled={!commentText.trim() || !user} className="bg-ex-navy dark:bg-ex-cyan text-white dark:text-ex-navy p-3 rounded-full disabled:opacity-50">
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Overlay */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                    >
                        <X className="w-10 h-10" />
                    </button>
                    <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={selectedImage} 
                            alt="Evidence Detail" 
                            className="w-full h-full object-contain rounded-lg shadow-2xl animate-zoom-in" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicFeed;
