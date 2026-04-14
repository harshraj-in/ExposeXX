import React, { useState, useEffect } from 'react';
import { 
    X, Shield, MessageSquare, StickyNote, CheckCircle, 
    XCircle, Clock, MapPin, User, FileText, Send, 
    ExternalLink, ZoomIn, Play, Pause, ChevronRight,
    Bot, RefreshCw
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';

const CaseInvestigationModal = ({ reportId, onClose, onUpdate, userMode = false }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('discussion'); // 'discussion' or 'notes'
    const [message, setMessage] = useState('');
    const [note, setNote] = useState('');
    const [statusUpdate, setStatusUpdate] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/reports/${reportId}/details`);
            setReport(res.data);
            setStatusUpdate(res.data.status);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error('Investigation Details Load Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: errorMsg
            });
            toast.error(`Failed to load investigation details: ${errorMsg}`);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [reportId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        try {
            const res = await apiClient.post(`/reports/${reportId}/messages`, { message });
            setReport({ ...report, messages: res.data.messages });
            setMessage('');
            toast.success('Message sent to reporter');
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        try {
            const res = await apiClient.post(`/reports/${reportId}/notes`, { note });
            setReport({ ...report, internalNotes: res.data.notes });
            setNote('');
            toast.success('Internal note added');
        } catch (error) {
            toast.error('Failed to add note');
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiClient.patch(`/reports/${reportId}/status`, {
                status: statusUpdate,
                note: statusNote
            });
            toast.success(`Case status updated to ${statusUpdate}`);
            if (statusUpdate === 'Verified' || statusUpdate === 'Resolved') {
                toast.info('Fixed Reward of ₹1000 credited to reporter.');
            }
            fetchDetails();
            onUpdate(); // Refresh parent list
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60]">
                <div className="bg-white p-8 rounded-2xl flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-cw-navy border-t-cw-saffron rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-bold">Loading Investigation Files...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-[60] p-4 lg:p-8 animate-fade-in">
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
                
                {/* Header */}
                <div className="bg-cw-navy px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Shield className="h-6 w-6 text-cw-saffron" />
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold flex items-center">
                                Case Investigation Unit <ChevronRight className="h-4 w-4 mx-2 opacity-50" /> {report.reportId}
                            </h2>
                            <p className="text-xs text-white/60 font-medium">Submitted on {format(new Date(report.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    
                    {/* LEFT PANEL: Case Details & Media */}
                    <div className="w-full lg:w-3/5 overflow-y-auto p-6 space-y-8 bg-white custom-scrollbar border-r border-gray-200">
                        
                        {/* Status Summary */}
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex space-x-8">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                                    <StatusBadge status={report.status} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Severity</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        report.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                        report.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>{report.severity}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                                    <p className="text-sm font-bold text-cw-navy">{report.category}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Involved Department</p>
                                <p className="text-sm font-bold text-gray-700">{report.department}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <section>
                            <h3 className="text-sm font-black text-cw-navy uppercase tracking-wider mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-cw-saffron" /> Detailed Complaint
                            </h3>
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-gray-800 leading-relaxed text-sm whitespace-pre-wrap shadow-inner">
                                {report.description}
                            </div>
                        </section>

                        {/* Evidence Media Viewer */}
                        <section>
                            <h3 className="text-sm font-black text-cw-navy uppercase tracking-wider mb-4 flex items-center">
                                <Bot className="h-4 w-4 mr-2 text-cw-saffron" /> Evidence & Proof ({report.evidenceUrls.length})
                            </h3>
                            {report.evidenceUrls.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {report.evidenceUrls.map((url, idx) => {
                                        const cleanUrl = url.replace(/\\/g, '/');
                                        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(cleanUrl);
                                        const isLocal = !cleanUrl.startsWith('http');
                                        
                                        // Handle local path construction carefully
                                        let finalUrl = cleanUrl;
                                        if (isLocal) {
                                            const pathPrefix = cleanUrl.startsWith('/') ? '' : '/';
                                            finalUrl = `http://localhost:5000${pathPrefix}${cleanUrl}`;
                                        }

                                        return (
                                            <div key={idx} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video flex items-center justify-center">
                                                {isVideo ? (
                                                    <video className="w-full h-full object-cover" controls>
                                                        <source src={finalUrl} />
                                                    </video>
                                                ) : (
                                                    <img src={finalUrl} alt={`Evidence ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                                )}
                                                {!isVideo && (
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <button onClick={() => window.open(finalUrl, '_blank')} className="bg-white p-2 rounded-full shadow-lg transform hover:scale-110 transition">
                                                            <ZoomIn className="h-5 w-5 text-cw-navy" />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] text-white backdrop-blur-sm">
                                                    File {idx + 1}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center justify-center">
                                    <XCircle className="h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-gray-400 text-xs font-bold">No digital evidence uploaded for this case.</p>
                                </div>
                            )}
                        </section>

                        {/* Location Details */}
                        <section className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 ring-1 ring-blue-200/50">
                            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-4 flex items-center">
                                <MapPin className="h-4 w-4 mr-2" /> Incident Geography
                            </h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-700/60 uppercase">State</p>
                                    <p className="text-sm font-bold text-cw-navy">{report.location.state}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-700/60 uppercase">District</p>
                                    <p className="text-sm font-bold text-cw-navy">{report.location.district}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-700/60 uppercase">Pincode</p>
                                    <p className="text-sm font-bold text-cw-navy">{report.location.pincode}</p>
                                </div>
                            </div>
                        </section>

                        {/* Reporter Profile (Admin Only) */}
                        {!userMode && (
                            <section className="bg-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <User className="w-32 h-32" />
                                </div>
                                <h3 className="text-sm font-black text-cw-saffron uppercase tracking-wider mb-4 flex items-center">
                                    <User className="h-4 w-4 mr-2" /> Reporter Intelligence
                                </h3>
                                <div className="flex items-center space-x-6 relative z-10">
                                    {report.isAnonymousMode === 'full-anonymous' ? (
                                        <div className="flex items-center text-slate-400 italic">
                                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mr-3">
                                                <Shield className="h-5 w-5" />
                                            </div>
                                            <span>Identity Protected (Full Anonymous Mode)</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-cw-saffron/20 border border-cw-saffron/30 rounded-full flex items-center justify-center text-cw-saffron text-xl font-bold">
                                                {report.reporterContact?.name?.[0] || 'V'}
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                                                <div>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase">Name</p>
                                                    <p className="text-sm font-bold">{report.reporterContact?.name || 'Verified Citizen'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase">Contact</p>
                                                    <p className="text-sm font-bold">{report.reporterContact?.email || report.reporterContact?.phone}</p>
                                                </div>
                                                {report.user && (
                                                    <div className="col-span-2 mt-1">
                                                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold border border-green-500/30">
                                                            Total Reports Filed: {report.user.totalReports}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT PANEL: Chat & Management */}
                    <div className="w-full lg:w-2/5 flex flex-col bg-white border-l border-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.05)]">
                        
                        {/* Tab Switcher */}
                        <div className="flex bg-gray-50 border-b border-gray-200 shrink-0">
                            <button onClick={() => setActiveTab('discussion')} className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'discussion' ? 'bg-white text-cw-navy border-b-2 border-cw-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                <MessageSquare className="h-4 w-4 mr-2" /> Discussion
                            </button>
                            {!userMode && (
                                <>
                                    <button onClick={() => setActiveTab('notes')} className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'notes' ? 'bg-white text-cw-navy border-b-2 border-cw-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <StickyNote className="h-4 w-4 mr-2" /> Internal Notes
                                    </button>
                                    <button onClick={() => setActiveTab('status')} className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'status' ? 'bg-white text-cw-navy border-b-2 border-cw-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <RefreshCw className="h-4 w-4 mr-2" /> Resolve
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            
                            {/* DISCUSSION TAB */}
                            {activeTab === 'discussion' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col custom-scrollbar bg-slate-50/50">
                                        {report.messages.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                                                <MessageSquare className="h-12 w-12 mb-2" />
                                                <p className="text-sm font-bold">Start a secure dialogue</p>
                                            </div>
                                        ) : (
                                            report.messages.map((m, i) => (
                                                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${m.sender === 'admin' ? 'bg-cw-navy text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                                                        <p className="font-bold text-[10px] mb-1 opacity-70 uppercase tracking-tighter">
                                                            {m.sender === 'admin' ? 'Investigating Authority' : 'Reporter'}
                                                        </p>
                                                        {m.message}
                                                        <p className="text-[8px] mt-1 text-right opacity-50">{format(new Date(m.timestamp), 'HH:mm')}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Secure reply to reporter..." className="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-cw-navy transition" />
                                        <button disabled={!message.trim()} className="bg-cw-navy text-white p-3 rounded-full hover:bg-slate-800 transition disabled:opacity-50">
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* NOTES TAB */}
                            {activeTab === 'notes' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-[10px] text-amber-800 font-bold flex items-center mb-2">
                                            <Shield className="h-3 w-3 mr-2" /> INTERNAL LOGS: VISIBLE TO OFFICIALS ONLY
                                        </div>
                                        {report.internalNotes.map((n, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group hover:border-cw-saffron transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-slate-100 text-[9px] px-2 py-0.5 rounded font-black text-slate-600 uppercase">
                                                        {n.createdBy?.name || 'Moderator'}
                                                    </span>
                                                    <span className="text-[8px] text-gray-400 font-bold">{format(new Date(n.timestamp), 'dd MMM, HH:mm')}</span>
                                                </div>
                                                <p className="text-xs text-gray-700 leading-normal">{n.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleAddNote} className="p-4 bg-white border-t border-gray-100">
                                        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type team internal note..." rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs mb-3 focus:ring-1 focus:ring-cw-navy transition" />
                                        <button disabled={!note.trim()} className="w-full bg-cw-navy text-white py-2.5 rounded-lg flex items-center justify-center font-bold text-xs uppercase hover:bg-slate-800 transition disabled:opacity-50">
                                            <StickyNote className="h-3 w-3 mr-2" /> Add Private Note
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* STATUS TAB */}
                            {activeTab === 'status' && (
                                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-black text-cw-navy uppercase tracking-widest mb-4">Finalize Resolution</h4>
                                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Case Phase</label>
                                                <select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-cw-navy focus:border-cw-navy focus:ring-0 transition">
                                                    <option value="Submitted">Submitted (Initial)</option>
                                                    <option value="Under Review">Under Review</option>
                                                    <option value="Assigned">Assigned to official</option>
                                                    <option value="Action Taken">Action Taken</option>
                                                    <option value="Verified">Verified & Close (Trigger Reward)</option>
                                                    <option value="Resolved">Resolved / Complete</option>
                                                    <option value="Rejected">Rejected Application</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Process Note (Public)</label>
                                                <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} required rows="4" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-cw-navy focus:ring-0 transition" placeholder="Explain this resolution step for the public timeline..."></textarea>
                                            </div>
                                            
                                            {(statusUpdate === 'Verified' || statusUpdate === 'Resolved') && (
                                                <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-start animate-fade-in">
                                                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 shrink-0 mt-1" />
                                                    <div>
                                                        <p className="text-xs font-bold text-green-800">Reward Protocol Ready</p>
                                                        <p className="text-[10px] text-green-700 leading-normal">Marking this as Verified will instantly trigger a ₹1000 credit to the citizen's balance.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {statusUpdate === 'Rejected' && (
                                                <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start animate-fade-in shadow-sm">
                                                    <XCircle className="h-5 w-5 text-red-600 mr-3 shrink-0 mt-1" />
                                                    <div>
                                                        <p className="text-xs font-bold text-red-800">Case Dismissal</p>
                                                        <p className="text-[10px] text-red-700 leading-normal">Provide a clear legal reason for rejection to avoid appeals.</p>
                                                    </div>
                                                </div>
                                            )}

                                            <button type="submit" disabled={isSubmitting || !statusNote.trim()} className="w-full bg-cw-navy text-white py-4 rounded-xl flex items-center justify-center font-bold text-sm uppercase tracking-widest shadow-lg hover:shadow-cw-navy/20 transition disabled:opacity-50">
                                                {isSubmitting ? 'Processing...' : 'Execute Decision'}
                                            </button>
                                        </form>
                                    </div>
                                    
                                    {/* Timeline History */}
                                    <div>
                                        <h4 className="text-xs font-black text-cw-navy uppercase tracking-widest mb-4 flex items-center">
                                            <Clock className="h-3 w-3 mr-2" /> Audit Trail
                                        </h4>
                                        <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                                            {report.timeline.slice().reverse().map((t, idx) => (
                                                <div key={idx} className="relative pl-8">
                                                    <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10 transition group-hover:border-cw-navy">
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-cw-navy">{t.status}</p>
                                                        <p className="text-[10px] text-gray-500 mb-1">{format(new Date(t.updatedAt), 'MMM dd, HH:mm')}</p>
                                                        <p className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg leading-tight">{t.note}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseInvestigationModal;
