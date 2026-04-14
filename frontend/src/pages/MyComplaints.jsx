import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import useStore from '../store/useStore';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../components/StatusBadge';
import { Star, FileText, Loader2, ListOrdered, CheckCircle } from 'lucide-react';

const MyComplaints = () => {
    const { t } = useTranslation();
    const { submittedReports } = useStore();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Rating State
    const [ratingVal, setRatingVal] = useState(5);
    const [ratingFeedback, setRatingFeedback] = useState('');
    const [activeRatingId, setActiveRatingId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!submittedReports || submittedReports.length === 0) {
                setLoading(false);
                return;
            }
            
            try {
                // Fetch individually (or create a batch endpoint)
                const promises = submittedReports.map(id => apiClient.get(`/reports/${id}`));
                const results = await Promise.allSettled(promises);
                
                const validReports = results
                    .filter(res => res.status === 'fulfilled')
                    .map(res => res.value.data);
                
                setReports(validReports.reverse()); // newest first
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [submittedReports]);

    const submitRating = async (reportId) => {
        try {
            await apiClient.post(`/reports/${reportId}/rate`, {
                rating: ratingVal,
                feedback: ratingFeedback
            });
            toast.success(t('myComplaints.thankYou'));
            setActiveRatingId(null);
            // Update local state to hide rating box
            setReports(prev => prev.map(r => r.reportId === reportId ? { ...r, rating: ratingVal } : r));
        } catch (error) {
            toast.error(t('myComplaints.failRating'));
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-display font-bold text-cw-navy mb-8 flex items-center">
                <ListOrdered className="h-8 w-8 mr-3 text-cw-saffron" />
                {t('myComplaints.title')}
            </h1>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-cw-navy h-8 w-8" /></div>
            ) : reports.length === 0 ? (
                <div className="glass-card text-center p-16 text-gray-500">
                    <p>{t('myComplaints.empty')}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {reports.map((report) => (
                        <div key={report.reportId} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-mono font-bold text-lg text-cw-navy">{report.reportId}</h3>
                                    <span className="text-xs text-gray-500">{t(`report.departments.${report.department}`) || report.department} | {t(`report.categories.${report.category}`) || report.category}</span>
                                </div>
                                <StatusBadge status={report.status} />
                            </div>
                            
                            <div className="p-6">
                                <h4 className="font-bold flex items-center mb-4 text-gray-700">
                                    <FileText className="h-4 w-4 mr-2" /> {t('myComplaints.timeline')}
                                </h4>
                                <div className="space-y-4 pl-2 border-l-2 border-gray-200 ml-2">
                                    {report.timeline?.map((step, idx) => (
                                        <div key={idx} className="relative pl-6">
                                            <div className="absolute -left-[23px] top-1 h-3 w-3 bg-cw-saffron rounded-full border-2 border-white"></div>
                                            <p className="text-sm font-bold">{step.status}</p>
                                            <p className="text-xs text-gray-600">{step.note}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Post Resolution Rating UI */}
                                {report.status === 'Closed' && !report.rating && (
                                    <div className="mt-8 bg-blue-50 border border-blue-100 p-5 rounded-lg">
                                        <h4 className="font-bold text-blue-900 mb-2">{t('myComplaints.rateResolution')}</h4>
                                        <p className="text-sm text-blue-700 mb-4">{t('myComplaints.rateResolutionNote', { department: report.department })}</p>
                                        
                                        <div className="flex space-x-2 mb-4">
                                            {[1,2,3,4,5].map(star => (
                                                <button 
                                                    key={star} 
                                                    onClick={() => setRatingVal(star)}
                                                    className={`${star <= ratingVal ? 'text-yellow-400' : 'text-gray-300'} transition cursor-pointer`}
                                                >
                                                    <Star fill={star <= ratingVal ? 'currentColor' : 'none'} className="h-8 w-8" />
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <textarea 
                                            placeholder={t('myComplaints.feedbackPlaceholder')}
                                            className="input-field mb-3 bg-white"
                                            rows="2"
                                            value={ratingFeedback}
                                            onChange={e => setRatingFeedback(e.target.value)}
                                        ></textarea>
                                        <button onClick={() => submitRating(report.reportId)} className="btn-primary py-2 text-sm w-full md:w-auto">{t('myComplaints.submitRating')}</button>
                                    </div>
                                )}

                                {report.rating && (
                                    <div className="mt-6 flex items-center text-green-700 bg-green-50 p-3 rounded">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        <span className="font-medium text-sm">{t('myComplaints.ratedMsg', { rating: report.rating })}</span>
                                    </div>
                                )}

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyComplaints;
