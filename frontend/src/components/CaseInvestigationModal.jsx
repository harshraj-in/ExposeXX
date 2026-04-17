import React, { useState, useEffect } from 'react';
import {
    X, Shield, MessageSquare, StickyNote, CheckCircle,
    XCircle, Clock, MapPin, FileText, Send,
    ChevronRight, RefreshCw, Gavel, Scale, Play, Video, EyeOff, Maximize2
} from 'lucide-react';
import { toast } from 'react-toastify';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import {
    getChatMessages, addChatMessage,
    getInternalNotes, addInternalNote,
    updateReport, creditWallet
} from '../storage';
import { getLegalAdvice } from '../legalAdvisor';

const CaseInvestigationModal = ({ report: initialReport, onClose, onUpdate }) => {
    const [report, setReport] = useState(initialReport);
    const [activeTab, setActiveTab] = useState('discussion');
    const [message, setMessage] = useState('');
    const [note, setNote] = useState('');
    const [statusUpdate, setStatusUpdate] = useState(initialReport.status);
    const [statusNote, setStatusNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messages, setMessages] = useState([]);
    const [internalNotes, setInternalNotes] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        setMessages(getChatMessages(report.reportId));
        setInternalNotes(getInternalNotes(report.reportId));
    }, [report.reportId]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        const updated = addChatMessage(report.reportId, {
            senderId: 'admin_001',
            senderRole: 'moderator',
            message,
        });
        setMessages(updated);
        setMessage('');
        toast.success('Message sent to reporter');
    };

    const handleAddNote = (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        const updated = addInternalNote(report.reportId, note);
        setInternalNotes(updated);
        setNote('');
        toast.success('Internal note added');
    };

    const handleUpdateStatus = (e) => {
        e.preventDefault();
        if (!statusNote.trim()) return;
        setIsSubmitting(true);
        try {
            const now = new Date().toISOString();
            const newTimeline = [
                ...(report.timeline || []),
                { status: statusUpdate, note: statusNote, updatedAt: now }
            ];
            const updated = updateReport(report.reportId, {
                status: statusUpdate,
                timeline: newTimeline,
            });
            // Credit wallet on Verified/Resolved
            if ((statusUpdate === 'Verified' || statusUpdate === 'Resolved') && report.citizenId && !report.citizenId.startsWith('anon')) {
                creditWallet(report.citizenId, 1000);
                toast.info('₹1000 credited to reporter\'s wallet!');
            }
            setReport(updated);
            toast.success(`Case status updated to ${statusUpdate}`);
            onUpdate();
        } catch (err) {
            toast.error('Failed to update status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLocation = (loc) => {
        if (!loc) return 'Unknown';
        if (typeof loc === 'string') return loc;
        return `${loc.district || ''}, ${loc.state || ''}, ${loc.pincode || ''}`.replace(/^,\s*|,\s*,$/, '');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-[60] p-4 lg:p-8 animate-fade-in">
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20">

                {/* Header */}
                <div className="bg-ex-navy px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Shield className="h-6 w-6 text-ex-cyan" />
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

                    {/* LEFT PANEL: Case Details */}
                    <div className="w-full lg:w-3/5 overflow-y-auto p-6 space-y-8 bg-white border-r border-gray-200">

                        {/* Status Summary */}
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex space-x-8">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                                    <StatusBadge status={report.status} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Severity</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.severity === 'Critical' ? 'bg-red-100 text-red-700' : report.severity === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {report.severity}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                                    <p className="text-sm font-bold text-ex-navy">{report.category}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Department</p>
                                <p className="text-sm font-bold text-gray-700">{report.department}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <section>
                            <h3 className="text-sm font-black text-ex-navy uppercase tracking-wider mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-ex-cyan" /> Detailed Complaint
                            </h3>
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-gray-800 leading-relaxed text-sm whitespace-pre-wrap shadow-inner">
                                {report.description}
                            </div>
                        </section>

                        {/* Location */}
                        <section className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-4 flex items-center">
                                <MapPin className="h-4 w-4 mr-2" /> Incident Geography
                            </h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-700/60 uppercase">State</p>
                                    <p className="text-sm font-bold text-ex-navy">{report.location?.state || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-700/60 uppercase">District</p>
                                    <p className="text-sm font-bold text-ex-navy">{report.location?.district || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-700/60 uppercase">Pincode</p>
                                    <p className="text-sm font-bold text-ex-navy">{report.location?.pincode || '—'}</p>
                                </div>
                            </div>
                        </section>

                        {/* Evidence Section (Bug Fix #6, #5, #4) */}
                        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-black text-ex-navy uppercase tracking-wider mb-4 flex items-center justify-between">
                                <div className="flex items-center"><Shield className="h-4 w-4 mr-2 text-ex-cyan" /> Proof & Evidence</div>
                                {report.faceBlurApplied && (
                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center border border-blue-200">
                                        <EyeOff className="h-3 w-3 mr-1" /> Face Blur Applied
                                    </span>
                                )}
                            </h3>

                            <div className="space-y-4">
                                {/* Base64 Files */}
                                {report.evidence && report.evidence.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {report.evidence.map((src, i) => {
                                            const isVideo = src.startsWith('data:video');
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={() => !isVideo && setSelectedImage(src)}
                                                    className={`group relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-32 flex items-center justify-center ${!isVideo ? 'cursor-zoom-in' : ''}`}
                                                >
                                                    {isVideo ? (
                                                        <video src={src} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={src} alt={`Evidence ${i}`} className="w-full h-full object-cover" />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                                        {isVideo ? <Video className="text-white w-6 h-6" /> : <Maximize2 className="text-white w-6 h-6" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    !report.audioEvidence && (
                                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs">No visual evidence provided</p>
                                        </div>
                                    )
                                )}

                                {/* Audio Evidence */}
                                {report.audioEvidence && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center">
                                            <Play className="w-3 h-3 mr-1" /> Audio Statement
                                        </p>
                                        <audio src={report.audioEvidence} controls className="w-full h-8" />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Reporter */}
                        <section className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-sm font-black text-ex-cyan uppercase tracking-wider mb-4">Reporter Intelligence</h3>
                            {report.isAnonymousMode === 'full-anonymous' ? (
                                <div className="flex items-center text-slate-400 italic">
                                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mr-3">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <span>Identity Protected (Full Anonymous Mode)</span>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-bold">{report.reporterContact?.name || report.citizenName || 'Verified Citizen'}</p>
                                    <p className="text-xs text-slate-400">{report.reporterContact?.email || '—'}</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT PANEL: Chat & Management */}
                    <div className="w-full lg:w-2/5 flex flex-col bg-white border-l border-gray-100">

                        {/* Tab Switcher */}
                        <div className="flex bg-gray-50 border-b border-gray-200 shrink-0">
                            <button onClick={() => setActiveTab('discussion')} className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'discussion' ? 'bg-white text-ex-navy border-b-2 border-ex-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                <MessageSquare className="h-4 w-4 mr-2" /> Discussion
                            </button>
                            <button onClick={() => setActiveTab('notes')} className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'notes' ? 'bg-white text-ex-navy border-b-2 border-ex-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                <StickyNote className="h-4 w-4 mr-2" /> Internal Notes
                            </button>
                            <button onClick={() => setActiveTab('status')} className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'status' ? 'bg-white text-ex-navy border-b-2 border-ex-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Resolve
                            </button>
                            <button onClick={() => setActiveTab('legal')} className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'legal' ? 'bg-white text-ex-navy border-b-2 border-ex-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                <Gavel className="h-4 w-4 mr-2" /> Legal Advice
                            </button>
                        </div>

                        {/* LEGAL ADVICE TAB */}
                        {activeTab === 'legal' && (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                                {(() => {
                                    const advice = getLegalAdvice(report.category);
                                    return (
                                        <>
                                            <div className="bg-ex-navy text-white p-4 rounded-xl shadow-md">
                                                <h4 className="font-bold text-sm flex items-center"><Gavel className="w-4 h-4 mr-2 text-ex-cyan" /> Assessment Engine</h4>
                                                <p className="text-[10px] text-blue-200 mt-1">Found matching laws for "{report.category}"</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                    <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 flex items-center"><Scale className="w-4 h-4 mr-2" /> Applicable Sections</h5>
                                                    <ul className="space-y-2">
                                                        {advice.laws.map((law, i) => (
                                                            <li key={i} className="text-xs font-bold text-gray-800 flex items-start">
                                                                <ChevronRight className="w-3 h-3 text-red-500 mt-0.5 mr-1" /> {law}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                    <h5 className="text-[10px] font-black text-ex-navy uppercase tracking-widest mb-3 flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-ex-cyan" /> Suggested Procedure</h5>
                                                    <ul className="space-y-2">
                                                        {advice.steps.map((step, i) => (
                                                            <li key={i} className="text-xs text-gray-600 leading-relaxed border-l-2 border-ex-cyan pl-3">
                                                                {step}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                                                    <h5 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Referral Authority</h5>
                                                    <p className="font-bold text-sm">{advice.authority}</p>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* DISCUSSION TAB */}
                        {activeTab === 'discussion' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                    {messages.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-16">
                                            <MessageSquare className="h-12 w-12 mb-2" />
                                            <p className="text-sm font-bold">Start a secure dialogue</p>
                                        </div>
                                    ) : messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${m.sender === 'admin' ? 'bg-ex-navy text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                                                <p className="font-bold text-[10px] mb-1 opacity-70 uppercase tracking-tighter">
                                                    {m.sender === 'admin' ? 'Investigating Authority' : 'Reporter'}
                                                </p>
                                                {m.message}
                                                <p className="text-[8px] mt-1 text-right opacity-50">{format(new Date(m.timestamp), 'HH:mm')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                                    <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Secure reply to reporter..." className="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-ex-navy transition" />
                                    <button disabled={!message.trim()} className="bg-ex-navy text-white p-3 rounded-full hover:bg-slate-800 transition disabled:opacity-50"><Send className="h-5 w-5" /></button>
                                </form>
                            </>
                        )}

                        {/* NOTES TAB */}
                        {activeTab === 'notes' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-[10px] text-amber-800 font-bold flex items-center mb-2">
                                        <Shield className="h-3 w-3 mr-2" /> INTERNAL LOGS: VISIBLE TO OFFICIALS ONLY
                                    </div>
                                    {internalNotes.map((n, i) => (
                                        <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-ex-cyan transition">
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
                                    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Type internal note..." rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs mb-3 focus:ring-1 focus:ring-ex-navy transition" />
                                    <button disabled={!note.trim()} className="w-full bg-ex-navy text-white py-2.5 rounded-lg flex items-center justify-center font-bold text-xs uppercase hover:bg-slate-800 transition disabled:opacity-50">
                                        <StickyNote className="h-3 w-3 mr-2" /> Add Private Note
                                    </button>
                                </form>
                            </>
                        )}

                        {/* STATUS TAB */}
                        {activeTab === 'status' && (
                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <h4 className="text-xs font-black text-ex-navy uppercase tracking-widest mb-4">Finalize Resolution</h4>
                                    <form onSubmit={handleUpdateStatus} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Case Phase</label>
                                            <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-ex-navy focus:border-ex-navy focus:ring-0 transition">
                                                <option value="Submitted">Submitted (Initial)</option>
                                                <option value="Under Review">Under Review</option>
                                                <option value="Assigned">Assigned to official</option>
                                                <option value="Action Taken">Action Taken</option>
                                                <option value="Verified">Verified &amp; Close (Trigger Reward)</option>
                                                <option value="Resolved">Resolved / Complete</option>
                                                <option value="Rejected">Rejected Application</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Process Note (Public)</label>
                                            <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} required rows="4" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-ex-navy focus:ring-0 transition" placeholder="Explain this resolution step for the public timeline..."></textarea>
                                        </div>

                                        {(statusUpdate === 'Verified' || statusUpdate === 'Resolved') && (
                                            <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-start">
                                                <CheckCircle className="h-5 w-5 text-green-600 mr-3 shrink-0 mt-1" />
                                                <div>
                                                    <p className="text-xs font-bold text-green-800">Reward Protocol Ready</p>
                                                    <p className="text-[10px] text-green-700 leading-normal">Marking as Verified will credit ₹1000 to the citizen's wallet.</p>
                                                </div>
                                            </div>
                                        )}
                                        {statusUpdate === 'Rejected' && (
                                            <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start">
                                                <XCircle className="h-5 w-5 text-red-600 mr-3 shrink-0 mt-1" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-800">Case Dismissal</p>
                                                    <p className="text-[10px] text-red-700 leading-normal">Provide a clear reason for rejection to avoid appeals.</p>
                                                </div>
                                            </div>
                                        )}

                                        <button type="submit" disabled={isSubmitting || !statusNote.trim()} className="w-full bg-ex-navy text-white py-4 rounded-xl flex items-center justify-center font-bold text-sm uppercase tracking-widest shadow-lg hover:shadow-ex-navy/20 transition disabled:opacity-50">
                                            {isSubmitting ? 'Processing...' : 'Execute Decision'}
                                        </button>
                                    </form>
                                </div>

                                {/* Timeline Audit Trail */}
                                <div>
                                    <h4 className="text-xs font-black text-ex-navy uppercase tracking-widest mb-4 flex items-center">
                                        <Clock className="h-3 w-3 mr-2" /> Audit Trail
                                    </h4>
                                    <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                                        {(report.timeline || []).slice().reverse().map((t, idx) => (
                                            <div key={idx} className="relative pl-8">
                                                <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10">
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-ex-navy">{t.status}</p>
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

export default CaseInvestigationModal;
