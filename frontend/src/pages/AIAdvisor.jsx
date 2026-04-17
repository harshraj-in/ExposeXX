import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Bot, FileText, Scale, Clock, PhoneCall, Copy, CheckCircle2, ArrowRight, Loader2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAISuggestion, generateRTILetter } from '../storage';
import { toast } from 'react-toastify';

const AIAdvisor = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const reportId = searchParams.get('reportId');
    const [loading, setLoading] = useState(true);
    const [suggestion, setSuggestion] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    
    // RTI Feature State
    const [rtiLoading, setRtiLoading] = useState(false);
    const [rtiLetter, setRtiLetter] = useState(null);

    useEffect(() => {
        if (!reportId) {
            setError("No Report ID provided. Please submit a report first.");
            setLoading(false);
            return;
        }

        const fetchSuggestion = () => {
            setLoading(true);
            setTimeout(() => {
                const res = getAISuggestion(reportId);
                if (res) {
                    setSuggestion(res.aiSuggestion);
                } else {
                    setError("Report not found for AI analysis.");
                }
                setLoading(false);
            }, 800);
        };

        fetchSuggestion();
    }, [reportId]);

    const handleCopy = () => {
        if (suggestion?.draftLetter) {
            navigator.clipboard.writeText(suggestion.draftLetter);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Copied to clipboard!");
        }
    };

    const handleGenerateRTI = () => {
        setRtiLoading(true);
        setTimeout(() => {
            const res = generateRTILetter(reportId);
            if (res) {
                setRtiLetter(res.rtiLetter);
                toast.success("RTI Letter generated!");
            } else {
                toast.error("Failed to generate RTI letter");
            }
            setRtiLoading(false);
        }, 600);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-ex-navy border-t-ex-cyan rounded-full animate-spin"></div>
                    <Bot className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-ex-navy h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold font-display">{t('ai.analyzing')}</h3>
                <p className="text-gray-500 mt-2 text-center max-w-md">{t('ai.analyzingNote')}</p>
            </div>
        );
    }

    if (error && !suggestion) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center px-4">
                <div className="bg-red-50 text-red-800 p-4 rounded mb-6">{error}</div>
                <Link to="/track" className="btn-primary">Go to Track Report</Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-ex-navy flex items-center">
                        <Bot className="h-8 w-8 mr-3 text-ex-cyan" /> 
                        {t('ai.title')}
                    </h1>
                    <p className="text-gray-600 mt-1">Generated specifically for Report ID: <span className="font-mono font-bold">{reportId}</span></p>
                </div>
                <Link to="/track" className="mt-4 md:mt-0 text-ex-navy hover:text-ex-cyan font-bold flex items-center">
                    {t('ai.trackStatus')} <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md text-sm mb-8 flex items-start">
                <Info className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                <p><strong>Disclaimer:</strong> {t('ai.disclaimer')} Use this to expedite your complaint with appropriate administrative bodies.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column - Action steps & refs */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 border-t-4 border-t-blue-600">
                        <h3 className="font-bold text-lg mb-3 flex items-center"><Scale className="h-5 w-5 mr-2 text-blue-600"/> {t('ai.legalRef')}</h3>
                        <p className="text-gray-800 font-medium">{suggestion?.legalReference}</p>
                    </div>

                    <div className="glass-card p-6 border-t-4 border-t-ex-cyan">
                        <h3 className="font-bold text-lg mb-3 flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-ex-cyan"/> {t('ai.actionSteps')}</h3>
                        <ul className="space-y-3">
                            {suggestion?.actionSteps?.map((step, idx) => (
                                <li key={idx} className="flex text-sm text-gray-700">
                                    <span className="bg-ex-cyan text-white rounded-full h-5 w-5 flex items-center justify-center shrink-0 mr-2 mt-0.5 text-xs font-bold">{idx+1}</span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="glass-card p-6 border-t-4 border-t-rose-600">
                        <h3 className="font-bold text-lg mb-3 flex items-center"><PhoneCall className="h-5 w-5 mr-2 text-rose-600"/> {t('ai.authority')}</h3>
                        <p className="text-gray-800 font-bold bg-gray-100 p-3 rounded text-center">{suggestion?.contactAuthority}</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-sm mb-1 flex items-center text-gray-500"><Clock className="h-4 w-4 mr-1"/> {t('ai.estResolution')}</h3>
                            <p className="text-sm font-medium">{suggestion?.timeline}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Draft Letter */}
                <div className="lg:col-span-2">
                    <div className="glass-card h-full flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                            <h3 className="font-bold text-lg flex items-center"><FileText className="h-5 w-5 mr-2 text-gray-600"/> {t('ai.draftLetter')}</h3>
                            <button 
                                onClick={handleCopy}
                                className="flex items-center text-sm font-medium bg-white border border-gray-300 shadow-sm px-3 py-1.5 rounded hover:bg-gray-50 transition"
                            >
                                {copied ? <span className="text-green-600 flex items-center"><CheckCircle2 className="h-4 w-4 mr-1" /> {t('ai.copied')}</span> : <><Copy className="h-4 w-4 mr-1" /> {t('ai.copyClipboard')}</>}
                            </button>
                        </div>
                        <div className="p-6 flex-grow bg-white font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 border-b border-gray-100 overflow-y-auto max-h-[600px] print:hidden">
                            {suggestion?.draftLetter}
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end rounded-b-xl print:hidden">
                            <button 
                                onClick={handleGenerateRTI} 
                                disabled={rtiLoading || rtiLetter}
                                className="btn-primary flex items-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {rtiLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
                                {t('ai.generateRti')}
                            </button>
                        </div>
                    </div>

                    {/* RTI Letter Card */}
                    {rtiLetter && (
                        <div className="glass-card mt-8 flex flex-col print:border-none print:shadow-none print:m-0">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-xl print:hidden">
                                <h3 className="font-bold text-lg flex items-center text-blue-800"><FileText className="h-5 w-5 mr-2"/> {t('ai.officialRti')}</h3>
                                <button 
                                    onClick={handlePrint}
                                    className="flex items-center text-sm font-medium bg-blue-600 text-white shadow-sm px-4 py-2 rounded hover:bg-blue-700 transition"
                                >
                                    {t('ai.downloadPdf')}
                                </button>
                            </div>
                            <div className="p-8 flex-grow bg-white font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 rounded-b-xl print:text-black print:p-0">
                                {rtiLetter}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAdvisor;
