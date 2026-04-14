import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Upload, Loader2, Info, Bot, ArrowRight, ArrowLeft, EyeOff, CheckCircle2, Mic } from 'lucide-react';
import apiClient from '../api/apiClient';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';

const ReportForm = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState([]);
    const [submittedReportId, setSubmittedReportId] = useState(null);
    
    // AI Evaluation State
    const [strengthScore, setStrengthScore] = useState(0);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [isEvaluating, setIsEvaluating] = useState(false);
    
    // Toggle state for Face Blur (simulated)
    const [faceBlurEnabled, setFaceBlurEnabled] = useState(false);

    // Guided Mode State
    const [entryMode, setEntryMode] = useState('guided'); // 'guided' or 'manual'
    const [guidedAnswers, setGuidedAnswers] = useState({
        what: '',
        where: '',
        when: '',
        who: '',
        proof: ''
    });
    const [isDraftGenerated, setIsDraftGenerated] = useState(false);

    // Feature 10: Voice Report
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);

    // Feature 11: WhatsApp Parser
    const [isParsingWhatsapp, setIsParsingWhatsapp] = useState(false);

    const navigate = useNavigate();
    const { addSubmittedReport } = useStore();

    const { register, handleSubmit, watch, trigger, getValues, setValue } = useForm({
        defaultValues: { 
            isAnonymousMode: 'full-anonymous', 
            severity: 'Medium', 
            category: 'Bribery',
            department: 'General'
        }
    });

    const formDesc = watch('description');
    const formAnon = watch('isAnonymousMode');

    // Voice recognition setup
    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        currentTranscript += transcript + ' ';
                    }
                }
                if (currentTranscript) {
                    const currentDesc = getValues("description") || '';
                    setValue("description", currentDesc + currentTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, [setValue, getValues]);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            toast.error(t('report.speechNotSupported')); // Added to JSON next
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
            toast.info(t('report.recordingStarted'));
        }
    };
    
    // Debounced AI Draft Evaluation
    useEffect(() => {
        if (step !== 1 || !formDesc) return;
        const timer = setTimeout(async () => {
            setIsEvaluating(true);
            try {
                const res = await apiClient.post('/ai/evaluate-draft', {
                    text: formDesc,
                    category: getValues('category'),
                    location: getValues('location'),
                    evidenceCount: files.length
                });
                if (res.data.success) {
                    setStrengthScore(res.data.strengthScore);
                    setAiSuggestions(res.data.suggestions);
                }
            } catch (err) {
                console.error("AI Eval offline", err);
            } finally {
                setIsEvaluating(false);
            }
        }, 1200); // 1.2s typing pause
        return () => clearTimeout(timer);
    }, [formDesc, step, files.length, getValues]);

    const nextStep = async () => {
        let valid = false;
        if (step === 1) valid = await trigger(["description", "category", "department"]);
        if (step === 2) valid = await trigger(["location.state", "location.district", "location.pincode"]);
        if (step === 3) valid = true; // Evidence is optional
        if (valid) setStep(s => s + 1);
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
            if (!clipboardText) {
                toast.error(t('report.whatsappFail'));
                return;
            }
            
            setIsParsingWhatsapp(true);
            const res = await apiClient.post('/ai/parse-whatsapp', { text: clipboardText });
            if (res.data.success) {
                const parsed = res.data.parsed;
                setGuidedAnswers({
                    what: parsed.what || '',
                    where: parsed.where || '',
                    when: parsed.when || '',
                    who: parsed.who || '',
                    proof: parsed.proof || ''
                });
                toast.success(t('report.whatsappSuccess'));
            }
        } catch (error) {
            toast.error(t('report.whatsappFail'));
        } finally {
            setIsParsingWhatsapp(false);
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('category', data.category);
            formData.append('department', data.department);
            formData.append('location', JSON.stringify(data.location));
            formData.append('description', data.description);
            formData.append('severity', data.severity);
            formData.append('isAnonymousMode', data.isAnonymousMode);
            formData.append('isHighRisk', data.isHighRisk ? 'true' : 'false');
            formData.append('isFaceBlurRequested', faceBlurEnabled ? 'true' : 'false');
            
            if (data.isAnonymousMode !== 'full-anonymous' && data.contact) {
                formData.append('reporterContact', JSON.stringify(data.contact));
            }

            Array.from(files).forEach((file) => formData.append('evidence', file));

            const res = await apiClient.post('/reports', formData);

            if (res.data.success) {
                toast.success(t('report.success'));
                addSubmittedReport(res.data.reportId); // Add to MyComplaints tracking
                if (faceBlurEnabled) toast.info(t('report.faceBlurInfo'));
                setSubmittedReportId(res.data.reportId);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report');
        } finally {
            setIsSubmitting(false);
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

                    <button onClick={() => navigate(`/ai-advisor?reportId=${submittedReportId}`)} className="btn-primary flex items-center text-lg px-8 py-3 bg-ex-navy">
                        <Bot className="w-5 h-5 mr-3" /> {t('report.continueAi')}
                    </button>
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
                            <ShieldCheck className="h-8 w-8 text-ex-cyan mr-3" />
                            <h2 className="text-3xl font-display font-bold text-ex-navy">{t('report.title')}</h2>
                        </div>
                        <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded">{t('report.stepText', { current: step, total: 4 })}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-ex-cyan h-2 rounded-full transition-all duration-300" style={{ width: `${(step/4)*100}%` }}></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-grow flex flex-col">
                    
                    {/* STEP 1: The Incident */}
                    {step === 1 && (
                        <div className="animate-fade-in-up flex-grow">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('report.category')}</label>
                                    <select {...register("category", { required: true })} className="input-field">
                                        {Object.entries(t('report.categories', { returnObjects: true })).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('report.department')}</label>
                                    <select {...register("department")} className="input-field">
                                        {Object.entries(t('report.departments', { returnObjects: true })).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
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
                                <div className="space-y-4 mb-6 bg-blue-50 p-6 rounded-xl border border-blue-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <Bot className="w-32 h-32" />
                                    </div>
                                    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center justify-between">
                                        <span className="flex items-center"><Bot className="h-6 w-6 mr-2" /> {t('report.guidedTitle')}</span>
                                        <button type="button" onClick={handleWhatsAppParse} disabled={isParsingWhatsapp} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-full font-bold flex items-center shadow-sm disabled:opacity-50 transition">
                                            {isParsingWhatsapp ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Info className="w-3 h-3 mr-1" />}
                                            {t('report.whatsappBtn')}
                                        </button>
                                    </h3>
                                    
                                    <div className="relative z-10">
                                        <label className="block text-sm font-bold text-blue-900 mb-1">{t('report.incWhat')} <span className="text-red-500">*</span></label>
                                        <textarea value={guidedAnswers.what} onChange={e => setGuidedAnswers({...guidedAnswers, what: e.target.value})} rows="2" className="input-field bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500" placeholder={t('report.placeholderWhat')} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">

                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 mb-1">{t('report.incWhere')}</label>
                                            <input type="text" value={guidedAnswers.where} onChange={e => setGuidedAnswers({...guidedAnswers, where: e.target.value})} className="input-field bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500" placeholder={t('report.placeholderWhere')} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 mb-1">{t('report.incWhen')}</label>
                                            <input type="text" value={guidedAnswers.when} onChange={e => setGuidedAnswers({...guidedAnswers, when: e.target.value})} className="input-field bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500" placeholder={t('report.placeholderWhen')} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">

                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 mb-1">{t('report.incWho')}</label>
                                            <input type="text" value={guidedAnswers.who} onChange={e => setGuidedAnswers({...guidedAnswers, who: e.target.value})} className="input-field bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500" placeholder={t('report.placeholderWho')} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 mb-1">{t('report.incProof')}</label>
                                            <input type="text" value={guidedAnswers.proof} onChange={e => setGuidedAnswers({...guidedAnswers, proof: e.target.value})} className="input-field bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500" placeholder={t('report.placeholderProof')} />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2 text-right relative z-10">
                                        <button type="button" onClick={generateDraft} disabled={!guidedAnswers.what} className="btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50 inline-flex items-center shadow-md">
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
                                            <button type="button" onClick={toggleRecording} className={`text-xs font-bold flex items-center transition ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-blue-600'}`}>
                                                <Mic className={`h-3 w-3 mr-1 ${isRecording ? 'animate-bounce' : ''}`} /> {isRecording ? t('report.recordingStop') : t('report.voiceReport')}
                                            </button>
                                            {isDraftGenerated && entryMode === 'guided' && (
                                                <button type="button" onClick={() => setIsDraftGenerated(false)} className="text-xs text-blue-600 font-bold hover:underline flex items-center">
                                                    <Bot className="h-3 w-3 mr-1" /> {t('report.editSmartAnswers')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <textarea {...register("description", { required: true, minLength: 20 })} rows="6" className="input-field resize-none border-gray-300" placeholder={t('report.placeholderDesc')}></textarea>
                                </div>
                            )}

                            {/* Live AI Strength Score */}
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col md:flex-row gap-4 mb-4">
                                <div className="flex flex-col items-center justify-center shrink-0 w-24">
                                    <div className="relative w-16 h-16 flex items-center justify-center bg-white rounded-full border-4 shadow-sm border-blue-500">
                                        {isEvaluating ? <Loader2 className="animate-spin text-blue-500 h-6 w-6"/> : <span className="text-xl font-bold text-blue-700">{strengthScore}</span>}
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 mt-1 flex items-center"><Bot className="h-3 w-3 mr-1"/> {t('report.aiScore')}</span>
                                </div>
                                <div className="flex-grow text-sm">
                                    <p className="font-bold text-slate-700 mb-1">{t('report.strengthScore')}</p>
                                    {aiSuggestions.length > 0 ? (
                                        <ul className="text-slate-600 list-disc pl-4 space-y-1">
                                            {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-green-600 bg-green-50 p-2 rounded flex items-center font-bold">
                                            {t('report.excellentDetail')}
                                        </p>
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
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">{t('report.state')}</label>
                                    <input {...register("location.state", { required: true })} className="input-field" placeholder="e.g. Maharashtra" />
                                </div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">{t('report.district')}</label>
                                    <input {...register("location.district", { required: true })} className="input-field" placeholder="e.g. Mumbai" />
                                </div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">{t('report.pincode')}</label>
                                    <input {...register("location.pincode", { required: true })} className="input-field" placeholder="400001" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-4 mt-8">{t('report.severity')}</h3>
                             <div>
                                <select {...register("severity")} className="input-field bg-red-50 border-red-200 text-red-900 font-bold">
                                    {Object.entries(t('report.severities', { returnObjects: true })).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Smart Evidence Upload */}
                    {step === 3 && (
                        <div className="animate-fade-in-up flex-grow">
                            <h3 className="text-xl font-bold mb-6">{t('report.step3')}</h3>
                            
                             <div className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:border-ex-navy transition">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                     <div className="flex text-sm text-gray-600 justify-center mt-2">
                                        <label htmlFor="file-upload" className="relative cursor-pointer font-bold text-ex-cyan hover:text-cyan-600 focus-within:outline-none text-lg">
                                            <span>{t('report.uploadMedia')}</span>
                                            <input id="file-upload" type="file" multiple className="sr-only" onChange={(e) => setFiles(e.target.files)} accept="image/*,video/*,audio/*,application/pdf" />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{t('report.exifNote', { count: files.length })}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                                 <input type="checkbox" id="faceblur" checked={faceBlurEnabled} onChange={(e)=>setFaceBlurEnabled(e.target.checked)} className="w-5 h-5 text-ex-navy rounded border-gray-400" />
                                <label htmlFor="faceblur" className="ml-3 block font-bold text-blue-900 flex items-center">
                                    <EyeOff className="h-4 w-4 mr-2"/> {t('report.faceBlur')}
                                    <span className="font-normal text-xs bg-white px-2 py-0.5 rounded shadow-sm text-gray-500 ml-2">{t('report.faceBlurBeta')}</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Identity Settings */}
                    {step === 4 && (
                        <div className="animate-fade-in-up flex-grow">
                            <h3 className="text-xl font-bold mb-6">{t('report.anonymousMode')}</h3>
                            
                            <div className="space-y-4">
                                 <label className="flex items-start p-4 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition border-gray-300">
                                    <input type="radio" value="full-anonymous" {...register("isAnonymousMode")} className="mt-1 h-5 w-5 text-ex-cyan" />
                                    <div className="ml-4">
                                        <span className="block font-bold text-ex-navy">{t('report.safeAnon')}</span>
                                        <span className="block text-sm text-gray-500">{t('report.safeAnonDesc')}</span>
                                    </div>
                                </label>

                                 <label className="flex items-start p-4 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition border-gray-300">
                                    <input type="radio" value="verified-anonymous" {...register("isAnonymousMode")} className="mt-1 h-5 w-5 text-ex-cyan" />
                                    <div className="ml-4">
                                        <span className="block font-bold text-ex-navy flex items-center">{t('report.verifiedAnon')} <ShieldCheck className="h-4 w-4 ml-1 text-green-600"/></span>
                                        <span className="block text-sm text-gray-500">{t('report.verifiedAnonDesc')}</span>
                                    </div>
                                </label>
                            </div>

                             {formAnon === 'verified-anonymous' && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-yellow-50 p-4 border border-yellow-200 rounded-lg animate-fade-in-up">
                                    <div className="col-span-2">
                                        <label className="flex items-center text-red-800 font-bold mb-2 text-sm bg-red-100 p-2 rounded">
                                            <input type="checkbox" {...register("isHighRisk")} className="h-4 w-4 mr-2" />
                                            {t('report.highRiskProtocol')}
                                        </label>
                                    </div>
                                    <div><label className="block text-sm font-bold text-gray-700">{t('report.name')}</label>
                                        <input {...register("contact.name")} className="input-field bg-white" placeholder={t('report.namePlaceholder')} /></div>
                                    <div><label className="block text-sm font-bold text-gray-700">{t('report.emailPhone')}</label>
                                        <input {...register("contact.email", { required: true })} className="input-field bg-white" placeholder={t('report.emailPlaceholder')} /></div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="pt-6 border-t border-gray-200 flex justify-between mt-auto">
                        {step > 1 ? (
                            <button type="button" onClick={prevStep} className="btn-outline flex items-center border-gray-300 text-gray-600">
                                <ArrowLeft className="h-4 w-4 mr-2"/> {t('report.prev')}
                            </button>
                        ) : <div></div>}

                        {step < 4 ? (
                            <button type="button" onClick={nextStep} className="btn-primary flex items-center bg-ex-navy">
                                {t('report.next')} <ArrowRight className="h-4 w-4 ml-2"/>
                            </button>
                        ) : (
                            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center bg-green-600 hover:bg-green-700 text-lg px-8 shadow-lg">
                                {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-5 w-5"/> {t('report.submitting')}</> : t('report.submit')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportForm;
