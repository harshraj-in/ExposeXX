import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Loader2, Calendar, MessageSquare, Shield, Send, X, Scale, Gavel, CheckCircle2, Building2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import { getReportById, getChatMessages, addChatMessage } from '../storage';
import { getLegalAdvice } from '../legalAdvisor';

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

    const isOwner = report && user && report.citizenId === user.id;
    const isStaff = user && user.role === 'Admin';
    const canAccessChat = isOwner || isStaff;

    // Safe Room / Chat
    const [showSafeRoom, setShowSafeRoom] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    const fetchReport = (e) => {
        if (e) e.preventDefault();
        if (!reportId.trim()) return;

        setLoading(true);
        setError('');
        setTimeout(() => {
            const found = getReportById(reportId.trim());
            if (found) {
                setReport(found);
                if (shouldOpenChat) {
                    setShowSafeRoom(true);
                    setMessages(getChatMessages(found.reportId));
                }
            } else {
                setError(t('track.notFound') || 'Report not found. Please check the ID and try again.');
                setReport(null);
            }
            setLoading(false);
        }, 400);
    };

    // Auto fetch if reportId is in URL
    React.useEffect(() => {
        if (initReportId) fetchReport();
        // eslint-disable-next-line
    }, []);

    const openSafeRoom = () => {
        if (!user) { toast.info(t('track.mustLogin') || 'Please login to access the Safe Room.'); return; }
        if (!canAccessChat) { toast.error(t('track.unauthorized') || 'Not authorized for this case.'); return; }
        setShowSafeRoom(true);
        setMessages(getChatMessages(report.reportId));
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !report) return;
        setSendingMsg(true);
        const updated = addChatMessage(report.reportId, {
            senderId: user.id,
            senderRole: user.role === 'Admin' ? 'moderator' : 'citizen',
            message: newMessage,
        });
        setMessages(updated);
        setNewMessage('');
        toast.success(t('track.messageSent') || 'Message sent.');
        setSendingMsg(false);
    };

    const getLocation = (loc) => {
        if (!loc) return 'Unknown';
        if (typeof loc === 'string') return loc;
        return `${loc.district || ''}, ${loc.state || ''}`.replace(/^,\s*/, '');
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
                                <span className={`px-3 py-1 rounded text-sm font-bold ${report.severity === 'Critical' ? 'bg-red-100 text-red-700' : report.severity === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {report.severity}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('track.location')}</p>
                                <p className="text-ex-navy font-medium">{getLocation(report.location)}</p>
                            </div>
                        </div>

                        {report.description && (
                            <div className="p-8 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Description</p>
                                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{report.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
                        <h3 className="text-xl font-bold text-ex-navy mb-8 flex items-center">
                            <Shield className="mr-2 text-ex-cyan" /> {t('track.timeline')}
                        </h3>
                        <div className="space-y-8">
                            {(report.timeline || []).map((entry, idx) => (
                                <div key={idx} className="flex gap-6 relative">
                                    {idx !== (report.timeline || []).length - 1 && (
                                        <div className="absolute left-3 top-8 bottom-[-32px] w-0.5 bg-gray-100"></div>
                                    )}
                                    <div className={`w-6 h-6 rounded-full flex-shrink-0 z-10 mt-1 ${idx === (report.timeline || []).length - 1 ? 'bg-ex-cyan' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <p className="font-bold text-ex-navy">{entry.status}</p>
                                        <p className="text-gray-600 mt-1">{entry.note}</p>
                                        <p className="text-xs text-gray-400 mt-2 flex items-center"><Calendar className="h-3 w-3 mr-1" />{format(new Date(entry.updatedAt || report.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Legal Advisor Section */}
                    {(() => {
                        const advice = getLegalAdvice(report.category);
                        return (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-3">
                                    <div className="bg-ex-navy text-white p-6 rounded-2xl flex items-center justify-between shadow-xl">
                                        <div className="flex items-center">
                                            <div className="bg-ex-cyan/20 p-3 rounded-xl mr-4"><Gavel className="h-6 w-6 text-ex-cyan" /></div>
                                            <div>
                                                <h3 className="text-xl font-bold font-display tracking-tight">AI Legal Advisor</h3>
                                                <p className="text-blue-200 text-xs">Rule-based assessment for the {report.category} category</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest bg-blue-500/30 px-3 py-1.5 rounded-full border border-blue-400/30">Local Engine Active</div>
                                    </div>
                                </div>

                                <div className="glass-card p-6 border-t-4 border-t-red-500 shadow-sm">
                                    <h4 className="font-bold text-sm mb-4 flex items-center text-red-700 uppercase tracking-wide">
                                        <Scale className="h-4 w-4 mr-2" /> Applicable Laws
                                    </h4>
                                    <ul className="space-y-3">
                                        {advice.laws.map((law, i) => (
                                            <li key={i} className="text-sm font-medium text-gray-800 leading-snug flex items-start">
                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 mr-2 shrink-0"></span> {law}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="glass-card p-6 border-t-4 border-t-ex-cyan shadow-sm">
                                    <h4 className="font-bold text-sm mb-4 flex items-center text-ex-navy uppercase tracking-wide">
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-ex-cyan" /> Recommended Steps
                                    </h4>
                                    <ul className="space-y-3">
                                        {advice.steps.map((step, i) => (
                                            <li key={i} className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="glass-card p-6 border-t-4 border-t-blue-600 shadow-sm">
                                    <h4 className="font-bold text-sm mb-4 flex items-center text-blue-800 uppercase tracking-wide">
                                        <Building2 className="h-4 w-4 mr-2" /> Authority to Contact
                                    </h4>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-sm font-bold text-blue-900 mb-1">{advice.authority}</p>
                                        <p className="text-[10px] text-blue-700 opacity-70">Official grievance channel for this category.</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Safe Room CTA */}
                    <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-left">
                            <div className="bg-blue-100 p-4 rounded-xl"><MessageSquare className="h-8 w-8 text-blue-600" /></div>
                            <div>
                                <h4 className="font-bold text-blue-900 text-lg">Secure Safe Room</h4>
                                <p className="text-blue-700">Message moderators anonymously about this case.</p>
                                {!user && (
                                    <p className="text-blue-600 text-xs mt-1 font-bold">
                                        {t('track.pleaseSignIn')} <Link to="/login" className="underline hover:text-blue-800">{t('track.signInLink')}</Link>
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={openSafeRoom}
                            disabled={!canAccessChat}
                            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold transition-all shadow-lg ${canAccessChat ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                        >
                            {t('track.contactModerator')}
                        </button>
                    </div>
                </div>
            )}

            {/* Safe Room Modal */}
            {showSafeRoom && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ex-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-ex-navy px-6 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-ex-cyan" />
                                <span className="font-bold tracking-wide">{t('track.safeRoomTitle')} — {report?.reportId}</span>
                            </div>
                            <button onClick={() => setShowSafeRoom(false)} className="hover:bg-white/10 p-1 rounded-lg transition"><X className="h-6 w-6" /></button>
                        </div>

                        <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gray-50">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                    <MessageSquare className="h-12 w-12 opacity-20" />
                                    <p>{t('track.noMessages')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((m, idx) => (
                                        <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${m.sender === 'user' ? 'bg-ex-navy text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                                <p className="text-[10px] opacity-70 uppercase font-black mb-1">{m.sender === 'user' ? t('track.reporterLabel') : t('track.authorityLabel')}</p>
                                                <p className="text-sm leading-relaxed">{m.message}</p>
                                                <p className="text-[9px] opacity-50 mt-2 text-right">{format(new Date(m.timestamp), 'HH:mm')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
