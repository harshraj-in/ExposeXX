import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../api/apiClient';
import { Search, Loader2, Calendar, FileText, AlertTriangle, MessageSquare, Shield, Send, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import { Link } from 'react-router-dom';

const TrackReport = () => {
    const [searchParams] = useSearchParams();
    const initReportId = searchParams.get('reportId') || '';
    const shouldOpenChat = searchParams.get('openChat') === 'true';
    const { t } = useTranslation();
    const { user } = useStore();
    
    const [reportId, setReportId] = useState(initReportId);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const isOwner = report && user && (report.user === user._id || (typeof report.user === 'object' && report.user._id === user._id));
    const isStaff = user && ['Admin', 'Moderator', 'NGO'].includes(user.role);
    const canAccessChat = isOwner || isStaff;
    
    // Safe Room / Chat
    const [showSafeRoom, setShowSafeRoom] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);

    const fetchReport = async (e) => {
        if (e) e.preventDefault();
        if (!reportId.trim()) return;

        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/api/reports/${reportId}`);
            setReport(res.data);
            // Auto-open chat if navigated from citizen dashboard
            if (shouldOpenChat) {
                setShowSafeRoom(true);
                fetchMessages(res.data._id);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('track.notFound'));
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    // Auto fetch if reportId is in URL
    React.useEffect(() => {
        if (initReportId) {
            fetchReport();
        }
        // eslint-disable-next-line
    }, []);

    const fetchMessages = async (id) => {
        setChatLoading(true);
        try {
            // Use the report's _id for message fetching via authenticated route
            const res = await apiClient.get(`/reports/${id}/messages`);
            setMessages(res.data.messages || []);
        } catch (err) {
            // If unauthenticated, just show empty chat — citizen can still send
            setMessages([]);
        } finally {
            setChatLoading(false);
        }
    };

    const openSafeRoom = () => {
        if (!user) {
            toast.info(t('track.mustLogin'));
            return;
        }
        if (!canAccessChat) {
            toast.error(t('track.unauthorized'));
            return;
        }
        setShowSafeRoom(true);
        if (report && messages.length === 0) {
            fetchMessages(report._id);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !report) return;
        setSendingMsg(true);
        try {
            const res = await apiClient.post(`/reports/${report._id}/messages`, { message: newMessage });
            setMessages(res.data.messages || []);
            setNewMessage('');
            toast.success(t('track.messageSent'));
        } catch (err) {
            // If not logged in, fall back to safe-messages route
            try {
                const fallback = await axios.post(`/api/safe-messages/${report.reportId}`, { message: newMessage });
                setMessages(prev => [...prev, { sender: 'user', message: newMessage, timestamp: new Date() }]);
                setNewMessage('');
                toast.success(t('track.messageSent'));
            } catch {
                toast.error(t('track.messageFailed'));
            }
        } finally {
            setSendingMsg(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-display font-bold text-ex-navy mb-4">{t('track.title')}</h1>
                <p className="text-gray-600 max-w-lg mx-auto">{t('track.subtitle')}</p>
            </div>
            
            <form onSubmit={fetchReport} className="flex gap-2 mb-12">
                <input 
                    type="text" 
                    value={reportId}
                    onChange={(e) => setReportId(e.target.value.toUpperCase())}
                    placeholder="EX-YYYY-XXXXXX"
                    className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-100 focus:border-ex-navy focus:ring-0 transition-all text-lg font-mono"
                />
                <button 
                    type="submit"
                    disabled={loading}
                    className="bg-ex-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                    {t('track.searchBtn')}
                </button>
            </form>

            {error && <p className="text-red-500 mb-6 font-medium text-center">{error}</p>}

            {report && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold font-mono text-ex-navy">{report.reportId}</h2>
                                <p className="text-sm text-gray-500 mt-1">{t('track.filedOn')} {format(new Date(report.createdAt), 'PPPP')}</p>
                            </div>
                            <StatusBadge status={report.status} />
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50/50">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('track.category')}</p>
                                <p className="font-medium text-ex-navy bg-gray-100 rounded px-3 py-1 inline-block">{report.category}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('track.severity')}</p>
                                <span className={`px-3 py-1 rounded text-sm font-bold ${
                                    report.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                    report.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>{report.severity}</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('track.location')}</p>
                                <p className="text-ex-navy font-medium">{report.location.district}, {report.location.state}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
                         <h3 className="text-xl font-bold text-ex-navy mb-8 flex items-center">
                            <Shield className="mr-2 text-ex-cyan" /> {t('track.timeline')}
                        </h3>
                        <div className="space-y-8">
                            {report.timeline.map((entry, idx) => (
                                <div key={idx} className="flex gap-6 relative">
                                    {idx !== report.timeline.length - 1 && (
                                        <div className="absolute left-3 top-8 bottom-[-32px] w-0.5 bg-gray-100"></div>
                                    )}
                                    <div className={`w-6 h-6 rounded-full flex-shrink-0 z-10 mt-1 ${
                                        idx === report.timeline.length - 1 ? 'bg-ex-cyan' : 'bg-gray-300'
                                    }`}></div>
                                    <div>
                                        <p className="font-bold text-ex-navy">{entry.status}</p>
                                        <p className="text-gray-600 mt-1">{entry.note}</p>
                                        <p className="text-xs text-gray-400 mt-2">{format(new Date(entry.updatedAt || report.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-left">
                            <div className="bg-blue-100 p-4 rounded-xl">
                                <MessageSquare className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 text-lg">Secure Safe Room</h4>
                                <p className="text-blue-700">Message moderators anonymously about this case.</p>
                                {!user && (
                                    <p className="text-blue-600 text-xs mt-1 font-bold">
                                        {t('track.pleaseSignIn')} <Link to="/login" className="underline hover:text-blue-800">{t('track.signInLink')}</Link>
                                    </p>
                                )}
                                {user && !canAccessChat && (
                                    <p className="text-red-600 text-xs mt-1 font-bold">
                                        {t('track.notAuthorizedMessage')}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={openSafeRoom}
                            disabled={!canAccessChat}
                            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold transition-all shadow-lg ${
                                canAccessChat 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                        >
                            {t('track.contactModerator')}
                        </button>
                    </div>
                </div>
            )}

            {showSafeRoom && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ex-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-ex-navy px-6 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-ex-cyan" />
                                <span className="font-bold tracking-wide">{t('track.safeRoomTitle')}</span>
                            </div>
                            <button onClick={() => setShowSafeRoom(false)} className="hover:bg-white/10 p-1 rounded-lg transition">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gray-50">
                            {chatLoading ? (
                                <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                    <MessageSquare className="h-12 w-12 opacity-20" />
                                    <p>{t('track.noMessages')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((m, idx) => (
                                        <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                                                m.sender === 'user' 
                                                    ? 'bg-ex-navy text-white rounded-tr-none' 
                                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                            }`}>
                                                <p className="text-[10px] opacity-70 uppercase font-black mb-1">{m.sender === 'user' ? t('track.reporterLabel') : t('track.authorityLabel')}</p>
                                                <p className="text-sm leading-relaxed">{m.message}</p>
                                                <p className="text-[9px] opacity-50 mt-2 text-right">{format(new Date(m.timestamp), 'HH:mm')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div ref={null} />
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={t('track.messagePlaceholder')}
                                    className="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-ex-navy transition"
                                />
                                <button 
                                    type="submit"
                                    disabled={!newMessage.trim() || sendingMsg}
                                    className="bg-ex-navy text-white p-3 rounded-full hover:bg-slate-800 transition disabled:opacity-50"
                                >
                                    {sendingMsg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackReport;
