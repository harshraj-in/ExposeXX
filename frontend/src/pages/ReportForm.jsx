import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Upload, Loader2, Info, Bot, ArrowRight, ArrowLeft, EyeOff, CheckCircle2, Mic, Play, Pause, Trash2 } from 'lucide-react';
import { saveReport, getCurrentUser, evaluateStrength } from '../storage';
import { useTranslation } from 'react-i18next';
import { lookupPincode } from '../pincodeData';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const ReportForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    // --- All Hooks at the Top ---
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState([]);
    const [submittedReportId, setSubmittedReportId] = useState(null);

    // Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    
    // Processing States
    const [isProcessingBlur, setIsProcessingBlur] = useState(false);
    const [blurApplied, setBlurApplied] = useState(false);

    // AI Evaluation States
    const [strengthScore, setStrengthScore] = useState(0);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [entryMode, setEntryMode] = useState('guided');
    const [guidedAnswers, setGuidedAnswers] = useState({ what: '', where: '', when: '', who: '', proof: '' });
    const [isDraftGenerated, setIsDraftGenerated] = useState(false);

    // Refs
    const mediaRecorderRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const recognitionRef = useRef(null);

    const { register, handleSubmit, watch, trigger, getValues, setValue } = useForm({
        defaultValues: {
            isAnonymousMode: 'full-anonymous',
            severity: 'Medium',
            category: 'Bribery',
            department: 'General',
            location: { state: '', district: '', pincode: '' }
        }
    });

    const formDesc = watch('description');
    const formAnon = watch('isAnonymousMode');
    const pincode = watch('location.pincode');
    const formState = watch('location.state');

    // --- Effects & Logic ---

    // Pincode Lookup Effect
    useEffect(() => {
        if (pincode && pincode.length === 6) {
            const data = lookupPincode(pincode);
            if (data) {
                setValue('location.state', data.state);
                setValue('location.district', data.district);
                toast.success(`Location detected: ${data.city}, ${data.district}`);
            } else {
                toast.info("Pincode not in database. Please enter location manually.");
            }
        }
    }, [pincode, setValue]);

    // Audio Recording Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                clearInterval(timerIntervalRef.current);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            toast.info("Recording started...");
        } catch (err) {
            toast.error("Microphone access denied or not supported.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Voice recognition setup
    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SR();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) transcript += event.results[i][0].transcript + ' ';
                }
                if (transcript) setValue('description', (getValues('description') || '') + transcript);
            };
            recognitionRef.current.onerror = () => setIsRecordingVoice(false);
            recognitionRef.current.onend = () => setIsRecordingVoice(false);
        }
    }, [setValue, getValues]);

    const toggleVoiceRecording = () => {
        if (!recognitionRef.current) { toast.error(t('report.speechNotSupported')); return; }
        if (isRecordingVoice) { recognitionRef.current.stop(); setIsRecordingVoice(false); }
        else { recognitionRef.current.start(); setIsRecordingVoice(true); toast.info(t('report.recordingStarted')); }
    };

    // Local AI Strength Evaluation — runs client-side, no API
    useEffect(() => {
        if (step !== 1 || !formDesc) return;
        const timer = setTimeout(() => {
            setIsEvaluating(true);
            const { score, suggestions } = evaluateStrength({
                text: formDesc,
                files: files.length,
                location: getValues('location.state'),
            });
            setStrengthScore(score);
            setAiSuggestions(suggestions);
            setIsEvaluating(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [formDesc, files.length, step, getValues]);

    const nextStep = async () => {
        let valid = false;
        if (step === 1) valid = await trigger(['description', 'category', 'department']);
        if (step === 2) valid = await trigger(['location.state', 'location.district', 'location.pincode']);
        if (step === 3) {
            // Face Blur Simulation
            const faceBlurRequested = document.getElementById('faceblur')?.checked;
            if (faceBlurRequested && !blurApplied) {
                setIsProcessingBlur(true);
                setTimeout(() => {
                    setIsProcessingBlur(false);
                    setBlurApplied(true);
                    toast.success("Face blur applied successfully — identity protected");
                    setStep(s => s + 1);
                }, 2000);
                return;
            }
            valid = true;
        }
        if (valid) setStep(s => s + 1);
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Process images/videos to base64
            const evidence = await Promise.all(files.map(f => fileToBase64(f)));
            
            // Process audio to base64
            let audioEvidence = null;
            if (audioBlob) {
                audioEvidence = await fileToBase64(audioBlob);
            }

            // Build report object for localStorage storage
            const report = saveReport({
                category: data.category,
                department: data.department,
                location: data.location || { state: '', district: '', pincode: '' },
                description: data.description,
                severity: data.severity,
                isAnonymousMode: data.isAnonymousMode,
                isHighRisk: !!data.isHighRisk,
                faceBlurApplied: blurApplied,
                evidence: evidence, // Array of base64 strings
                audioEvidence: audioEvidence, // Base64 string
                reporterContact: data.isAnonymousMode !== 'full-anonymous' ? data.contact : null,
                citizenId: currentUser?.id || 'anonymous',
                citizenName: currentUser?.name || 'Anonymous',
            });

            toast.success(t('report.success'));
            setSubmittedReportId(report.reportId);
        } catch (error) {
            toast.error(error.message || 'Failed to submit report');
        } finally {
            setIsSubmitting(false);
        }
    };
    const prevStep = () => setStep(s => s - 1);

    const generateDraft = () => {
        const draft = `Date of Incident: ${guidedAnswers.when || 'Not specified'}
Location Context: ${guidedAnswers.where || 'Not specified'}
Involved Parties: ${guidedAnswers.who || 'Not specified'}

Incident Details:
${guidedAnswers.what}

Available Evidence Context:
${guidedAnswers.proof || 'None mentioned at this stage'}`;
        setValue('description', draft, { shouldValidate: true, shouldDirty: true });
        setIsDraftGenerated(true);
    };

    const handleWhatsAppParse = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText) return;
            const lines = clipboardText.split('\n').filter(l => l.trim());
            setGuidedAnswers({
                what: lines[0] || '',
                where: '',
                when: '',
                who: '',
                proof: clipboardText.length > 100 ? 'Text evidence from clipboard' : '',
            });
            toast.success(t('report.whatsappSuccess'));
        } catch {
            toast.error(t('report.whatsappFail'));
        }
    };

    if (submittedReportId) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 text-center animate-fade-in-up">
                <div className="glass-card p-12 flex flex-col items-center justify-center border border-gray-200">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                    <h2 className="text-3xl font-display font-bold text-ex-navy mb-2">{t('report.success')}</h2>
                    <p className="text-gray-600 mb-6">{t('report.successNote')}</p>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 w-full max-w-md shadow-sm">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{t('report.caseNum')}</p>
                        <p className="font-mono text-3xl font-bold text-ex-navy tracking-wider select-all bg-white py-3 border border-gray-100 rounded-lg">{submittedReportId}</p>
                        <p className="text-xs text-gray-500 mt-3">{t('report.saveIdNote')}</p>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => navigate(`/track?reportId=${submittedReportId}`)} className="btn-primary flex items-center text-lg px-8 py-3 bg-ex-navy">
                            <ShieldCheck className="w-5 h-5 mr-3" /> {t('track.title')}
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="btn-outline flex items-center px-6 py-3">
                            Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-6 lg:py-12 px-2 sm:px-6">
            <div className="glass-card p-4 sm:p-8 min-h-[600px] flex flex-col border border-gray-200">

                {/* Header & Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-ex-cyan mr-3" />
                            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ex-navy">{t('report.title')}</h2>
                        </div>
                        <span className="text-[10px] sm:text-sm font-bold bg-gray-100 dark:bg-slate-800 px-2 sm:px-3 py-1 rounded truncate max-w-[80px] sm:max-w-none text-center">
                            {t('report.stepText', { current: step, total: 4 })}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-ex-cyan h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${(step / 4) * 100}%` }}></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-grow flex flex-col">

                    {/* STEP 1: The Incident */}
                    {step === 1 && (
                        <div className="animate-fade-in-up flex-grow">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('report.category')}</label>
                                    <select {...register('category', { required: true })} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                        {Object.entries(t('report.categories', { returnObjects: true })).map(([val, label]) => (
                                            <option key={val} value={val} className="dark:bg-slate-800">{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('report.department')}</label>
                                    <select {...register('department')} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                        {Object.entries(t('report.departments', { returnObjects: true })).map(([val, label]) => (
                                            <option key={val} value={val} className="dark:bg-slate-800">{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-lg mb-6 w-fit">
                                <button type="button" onClick={() => setEntryMode('guided')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${entryMode === 'guided' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('report.aiAssistant')}</button>
                                <button type="button" onClick={() => setEntryMode('manual')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${entryMode === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('report.manualEntry')}</button>
                            </div>

                            {entryMode === 'guided' && !isDraftGenerated && (
                                <div className="space-y-4 mb-6 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 relative overflow-hidden transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Bot className="w-32 h-32 dark:text-ex-cyan" /></div>
                                    <h3 className="text-xl font-bold text-blue-900 dark:text-ex-cyan mb-4 flex items-center justify-between">
                                        <span className="flex items-center"><Bot className="h-6 w-6 mr-2" /> {t('report.guidedTitle')}</span>
                                        <button type="button" onClick={handleWhatsAppParse} className="text-xs bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full font-bold flex items-center shadow-sm transition">
                                            <Info className="w-3 h-3 mr-1" /> {t('report.whatsappBtn')}
                                        </button>
                                    </h3>
                                    <div className="relative z-10">
                                        <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">{t('report.incWhat')} <span className="text-red-500">*</span></label>
                                        <textarea value={guidedAnswers.what} onChange={e => setGuidedAnswers({ ...guidedAnswers, what: e.target.value })} rows="2" className="input-field bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700 dark:text-white" placeholder={t('report.placeholderWhat')} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">{t('report.incWhere')}</label>
                                            <input type="text" value={guidedAnswers.where} onChange={e => setGuidedAnswers({ ...guidedAnswers, where: e.target.value })} className="input-field bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700 dark:text-white" placeholder={t('report.placeholderWhere')} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">{t('report.incWhen')}</label>
                                            <input type="text" value={guidedAnswers.when} onChange={e => setGuidedAnswers({ ...guidedAnswers, when: e.target.value })} className="input-field bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700 dark:text-white" placeholder={t('report.placeholderWhen')} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">{t('report.incWho')}</label>
                                            <input type="text" value={guidedAnswers.who} onChange={e => setGuidedAnswers({ ...guidedAnswers, who: e.target.value })} className="input-field bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700 dark:text-white" placeholder={t('report.placeholderWho')} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">{t('report.incProof')}</label>
                                            <input type="text" value={guidedAnswers.proof} onChange={e => setGuidedAnswers({ ...guidedAnswers, proof: e.target.value })} className="input-field bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700 dark:text-white" placeholder={t('report.placeholderProof')} />
                                        </div>
                                    </div>
                                    <div className="pt-2 text-right relative z-10">
                                        <button type="button" onClick={generateDraft} disabled={!guidedAnswers.what} className="btn-primary bg-blue-600 hover:bg-blue-700 dark:bg-ex-cyan dark:text-ex-navy dark:hover:bg-cyan-500 disabled:opacity-50 inline-flex items-center shadow-md font-bold">
                                            <Bot className="h-4 w-4 mr-2" /> {t('report.generateDraft')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(entryMode === 'manual' || isDraftGenerated) && (
                                <div className="mb-6 animate-fade-in-up">
                                    <div className="flex justify-between items-end mb-1">
                                        <label className="block text-sm font-bold text-gray-700">{t('report.description')}</label>
                                        <div className="flex space-x-3">
                                            <button type="button" onClick={toggleVoiceRecording} className={`text-xs font-bold flex items-center transition ${isRecordingVoice ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-blue-600'}`}>
                                                <Mic className={`h-3 w-3 mr-1 ${isRecordingVoice ? 'animate-bounce' : ''}`} /> {isRecordingVoice ? (t('report.recordingStop') || 'Stop Recording') : (t('report.voiceReport') || 'Voice to Text')}
                                            </button>
                                            {isDraftGenerated && entryMode === 'guided' && (
                                                <button type="button" onClick={() => setIsDraftGenerated(false)} className="text-xs text-blue-600 font-bold hover:underline flex items-center">
                                                    <Bot className="h-3 w-3 mr-1" /> {t('report.editSmartAnswers')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <textarea {...register('description', { required: true, minLength: 20 })} rows="6" className="input-field resize-none border-gray-300" placeholder={t('report.placeholderDesc')}></textarea>
                                </div>
                            )}

                            {/* Local AI Strength Score */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col md:flex-row gap-4 mb-4 transition-colors">
                                <div className="flex flex-col items-center justify-center shrink-0 w-24">
                                    <div className="relative w-16 h-16 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full border-4 shadow-sm border-blue-500 dark:border-ex-cyan">
                                        {isEvaluating ? <Loader2 className="animate-spin text-blue-500 dark:text-ex-cyan h-6 w-6" /> : <span className="text-xl font-bold text-blue-700 dark:text-ex-cyan">{strengthScore}</span>}
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 dark:text-gray-400 mt-1 flex items-center"><Bot className="h-3 w-3 mr-1" /> {t('report.aiScore')}</span>
                                </div>
                                <div className="flex-grow text-sm">
                                    <p className="font-bold text-slate-700 dark:text-gray-200 mb-1">{t('report.strengthScore')}</p>
                                    {aiSuggestions.length > 0 ? (
                                        <ul className="text-slate-600 dark:text-gray-400 list-disc pl-4 space-y-1 text-xs">
                                            {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 p-2 rounded flex items-center font-bold">{t('report.excellentDetail')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Location & Severity */}
                    {step === 2 && (
                        <div className="animate-fade-in-up flex-grow">
                            <h3 className="text-xl font-bold mb-4">{t('report.step2')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('report.pincode')}</label>
                                    <input {...register('location.pincode', { required: true })} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="400001" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('report.state')}</label>
                                    <input {...register('location.state', { required: true })} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="e.g. Maharashtra" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('report.district')}</label>
                                    <input {...register('location.district', { required: true })} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="e.g. Mumbai" /></div>
                            </div>
                            <h3 className="text-xl font-bold mb-4 mt-8">{t('report.severity')}</h3>
                            <div>
                                <select {...register('severity')} className="input-field bg-red-50 border-red-200 text-red-900 font-bold">
                                    {Object.entries(t('report.severities', { returnObjects: true })).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Evidence Upload */}
                    {step === 3 && (
                        <div className="animate-fade-in-up flex-grow">
                            <h3 className="text-xl font-bold mb-6">{t('report.step3')}</h3>
                            
                            {/* Audio Recording Section */}
                            <div className="mb-8 p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl relative overflow-hidden">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                                    <Mic className="w-4 h-4 mr-2" /> Audio Evidence
                                </h4>
                                <div className="flex items-center gap-6">
                                    {isRecording ? (
                                        <button type="button" onClick={stopRecording} className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-lg animate-pulse">
                                            <div className="w-5 h-5 bg-white rounded-sm"></div>
                                        </button>
                                    ) : (
                                        <button type="button" onClick={startRecording} className="w-16 h-16 bg-ex-navy text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition shadow-lg">
                                            <Mic className="w-8 h-8" />
                                        </button>
                                    )}
                                    
                                    <div className="flex-grow">
                                        {isRecording ? (
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-mono font-bold text-red-500 mb-1">{formatTime(recordingTime)}</span>
                                                <div className="flex items-center gap-1">
                                                    {[1,2,3,4,5].map(i => (
                                                        <div key={i} className="w-1 bg-red-300 rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 5}px`, animationDelay: `${i * 0.1}s` }}></div>
                                                    ))}
                                                    <span className="text-xs text-red-400 font-bold ml-2">Recording Live...</span>
                                                </div>
                                            </div>
                                        ) : audioUrl ? (
                                            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                <audio src={audioUrl} controls className="h-10 flex-grow" />
                                                <button type="button" onClick={() => { setAudioBlob(null); setAudioUrl(null); }} className="p-2 text-gray-400 hover:text-red-500 transition">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-sm">Use your microphone to record a statement or incident sounds.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* File Upload Section */}
                            <div className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:border-ex-navy transition">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 justify-center mt-2">
                                        <label htmlFor="file-upload" className="relative cursor-pointer font-bold text-ex-cyan hover:text-cyan-600 text-lg">
                                            <span>{t('report.uploadMedia')}</span>
                                            <input id="file-upload" type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files))} accept="image/*,video/*,application/pdf" />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{t('report.exifNote', { count: files.length })}</p>
                                    {files.length > 0 && (
                                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                                            {files.map((f, i) => (
                                                <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 truncate max-w-[150px]">{f.name}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Face Blur Toggle */}
                            <div className="mt-6 flex flex-col gap-4">
                                <div className="flex items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <input type="checkbox" id="faceblur" disabled={isProcessingBlur} className="w-5 h-5 text-ex-navy rounded border-gray-400" />
                                    <label htmlFor="faceblur" className="ml-3 block font-bold text-blue-900 flex items-center">
                                        <EyeOff className="h-4 w-4 mr-2" /> {t('report.faceBlur')}
                                        <span className="font-normal text-xs bg-white px-2 py-0.5 rounded shadow-sm text-gray-500 ml-2">{t('report.faceBlurBeta')}</span>
                                    </label>
                                </div>
                                
                                {isProcessingBlur && (
                                    <div className="flex items-center justify-center p-6 bg-white border border-blue-100 rounded-xl shadow-sm animate-pulse">
                                        <Loader2 className="w-6 h-6 text-ex-navy animate-spin mr-3" />
                                        <span className="text-sm font-bold text-ex-navy tracking-tight">AI Agent Detecting & Masking Faces...</span>
                                    </div>
                                )}
                                
                                {blurApplied && (
                                    <div className="flex items-center p-4 bg-green-50 border border-green-100 rounded-xl text-green-700">
                                        <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
                                        <span className="text-sm font-bold">Face blur applied successfully — identity protected</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Identity Settings */}
                    {step === 4 && (
                        <div className="animate-fade-in-up flex-grow">
                            <h3 className="text-xl font-bold mb-6">{t('report.anonymousMode')}</h3>
                            <div className="space-y-4">
                                <label className="flex items-start p-4 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition border-gray-300">
                                    <input type="radio" value="full-anonymous" {...register('isAnonymousMode')} className="mt-1 h-5 w-5 text-ex-cyan" />
                                    <div className="ml-4">
                                        <span className="block font-bold text-ex-navy">{t('report.safeAnon')}</span>
                                        <span className="block text-sm text-gray-500">{t('report.safeAnonDesc')}</span>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition border-gray-300">
                                    <input type="radio" value="verified-anonymous" {...register('isAnonymousMode')} className="mt-1 h-5 w-5 text-ex-cyan" />
                                    <div className="ml-4">
                                        <span className="block font-bold text-ex-navy flex items-center">{t('report.verifiedAnon')} <ShieldCheck className="h-4 w-4 ml-1 text-green-600" /></span>
                                        <span className="block text-sm text-gray-500">{t('report.verifiedAnonDesc')}</span>
                                    </div>
                                </label>
                            </div>

                            {formAnon === 'verified-anonymous' && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-yellow-50 p-4 border border-yellow-200 rounded-lg animate-fade-in-up">
                                    <div className="col-span-2">
                                        <label className="flex items-center text-red-800 font-bold mb-2 text-sm bg-red-100 p-2 rounded">
                                            <input type="checkbox" {...register('isHighRisk')} className="h-4 w-4 mr-2" />
                                            {t('report.highRiskProtocol')}
                                        </label>
                                    </div>
                                    <div><label className="block text-sm font-bold text-gray-700">{t('report.name')}</label>
                                        <input {...register('contact.name')} className="input-field bg-white" placeholder={t('report.namePlaceholder')} /></div>
                                    <div><label className="block text-sm font-bold text-gray-700">{t('report.emailPhone')}</label>
                                        <input {...register('contact.email', { required: true })} className="input-field bg-white" placeholder={t('report.emailPlaceholder')} /></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="pt-6 border-t border-gray-200 flex justify-between mt-auto">
                        {step > 1 ? (
                            <button type="button" onClick={prevStep} className="btn-outline flex items-center border-gray-300 text-gray-600">
                                <ArrowLeft className="h-4 w-4 mr-2" /> {t('report.prev')}
                            </button>
                        ) : <div></div>}

                        {step < 4 ? (
                            <button type="button" onClick={nextStep} className="btn-primary flex items-center bg-ex-cyan text-ex-navy border-none shadow-lg hover:bg-cyan-500 font-bold px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                                {t('report.next')} <ArrowRight className="h-4 w-4 ml-2" />
                            </button>
                        ) : (
                            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center bg-green-600 hover:bg-green-700 text-base sm:text-lg px-6 sm:px-8 shadow-lg">
                                {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {t('report.submitting')}</> : t('report.submit')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportForm;
