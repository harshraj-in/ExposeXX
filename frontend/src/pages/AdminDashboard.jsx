import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import { Download, Bot, RefreshCw, Eye, Flag, Star, ShieldAlert, Banknote } from 'lucide-react';
import CaseInvestigationModal from '../components/CaseInvestigationModal';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState('');
    const [noteUpdate, setNoteUpdate] = useState('');
    const [currentView, setCurrentView] = useState('All'); // 'All', 'Flagged', 'AI Insights', 'Withdrawals'
    const [aiInsights, setAiInsights] = useState('');
    const [loadingInsights, setLoadingInsights] = useState(false);
    
    // Withdrawals
    const [withdrawals, setWithdrawals] = useState([]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/reports');
            setReports(res.data);
            
            // Also fetch withdrawals
            const wRes = await apiClient.get('/rewards/admin/withdrawals');
            setWithdrawals(wRes.data.requests);
        } catch (error) {
            toast.error(t('admin.failLoad'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await apiClient.patch(`/reports/${selectedReport.reportId}/status`, {
                status: statusUpdate,
                note: noteUpdate
            });
            toast.success(t('admin.updateSuccess'));
            setSelectedReport(null);
            fetchReports();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update');
        }
    };
    
    const handleClearFlag = async (id) => {
        try {
            await apiClient.patch(`/reports/${id}/status`, {
                isFlagged: false,
                note: 'Moderator reviewed and cleared abuse flags.'
            });
            toast.success('Abuse flags cleared. Post is visible again.');
            fetchReports();
        } catch (error) {
            toast.error('Failed to clear flag');
        }
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ID,Category,Department,Severity,Status,State,Rating\n"
            + reports.map(r => `${r.reportId},${r.category},${r.department},${r.severity},${r.status},${r.location.state},${r.rating||'N/A'}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "exposex_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleInsights = () => {
        setCurrentView('AI Insights');
        if (!aiInsights) fetchAiInsights();
    };

    const fetchAiInsights = async () => {
        setLoadingInsights(true);
        try {
            const res = await apiClient.get('/ai/insights');
            if (res.data.success) {
                setAiInsights(res.data.insights);
            }
        } catch (err) {
            toast.error("Failed to load AI insights");
        } finally {
            setLoadingInsights(false);
        }
    };

    const flaggedReports = reports.filter(r => r.isFlagged);
    const displayedReports = currentView === 'Flagged' ? flaggedReports : reports;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-ex-navy">{t('admin.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('admin.subtitle')}</p>
                </div>
                
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setCurrentView('All')}
                        className={`flex items-center px-4 py-3 text-sm font-bold border-r border-gray-100 transition ${currentView === 'All' ? 'bg-ex-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {t('admin.tabs.all')}
                    </button>
                    <button 
                        onClick={() => setCurrentView('Flagged')}
                        className={`flex items-center px-4 py-3 text-sm font-bold border-r border-gray-100 transition ${currentView === 'Flagged' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Flag className="h-4 w-4 mr-2" /> {t('admin.tabs.flagged')}
                    </button>
                    <button 
                        onClick={handleInsights}
                        className={`flex items-center px-4 py-3 text-sm font-bold border-r border-gray-100 transition ${currentView === 'AI Insights' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Bot className="h-4 w-4 mr-2" /> {t('admin.tabs.aiInsights')}
                    </button>
                    <button 
                        onClick={() => setCurrentView('Withdrawals')}
                        className={`flex items-center px-4 py-3 text-sm font-bold transition ${currentView === 'Withdrawals' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Banknote className="h-4 w-4 mr-2" /> {t('admin.tabs.withdrawals')}
                    </button>
                </div>
            </div>

            {/* Top Level Action Bar */}
            {currentView !== 'AI Insights' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 flex justify-between items-center">
                     <p className="text-sm text-gray-500 font-bold flex items-center"><ShieldAlert className="h-4 w-4 text-ex-cyan mr-2"/> Anti-Spam Velocity Limits: Active (Max 5 req/hr per IP)</p>
                     <div className="flex space-x-3">
                        <button onClick={handleExport} className="btn-outline flex items-center px-4 py-2 text-sm">
                            <Download className="h-4 w-4 mr-2" /> {t('admin.exportLogs')}
                        </button>
                     </div>
                </div>
            )}

            {/* Table Area */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-bold text-lg text-ex-navy">{currentView} Incidents</h2>
                    <button onClick={fetchReports} className="text-gray-500 hover:text-ex-navy">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    {currentView !== 'Withdrawals' && (
                        <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                <th className="p-4 border-b border-gray-200">{t('admin.table.colIdFlags')}</th>
                                <th className="p-4 border-b border-gray-200">{t('admin.table.colDeptCat')}</th>
                                <th className="p-4 border-b border-gray-200">{t('admin.table.colStatusEsc')}</th>
                                <th className="p-4 border-b border-gray-200">{t('admin.table.colReporter')}</th>
                                <th className="p-4 border-b border-gray-200">{t('admin.table.colRating')}</th>
                                <th className="p-4 border-b border-gray-200 text-center">{t('admin.table.colManage')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedReports.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-medium">{t('admin.table.noIncidents')}</td></tr>
                            ) : displayedReports.map(report => (
                                <tr key={report._id} className={`hover:bg-gray-50 border-b border-gray-100 last:border-0 transition ${report.isFlagged ? 'bg-red-50/30' : ''}`}>
                                    <td className="p-4 text-sm font-mono text-gray-600">
                                        <span className="block text-xs font-bold text-ex-navy mb-1">{report.reportId}</span>
                                        <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded">{format(new Date(report.createdAt), 'dd MMM yyyy')}</span>
                                        {report.isFlagged && <span className="block mt-1 text-[10px] text-red-600 font-bold flex items-center bg-red-100 rounded px-1.5 py-0.5"><Flag className="h-3 w-3 mr-0.5"/> {report.flags} {t('admin.table.abuseFlags')}</span>}
                                    </td>
                                    
                                    <td className="p-4 text-sm">
                                        <span className="font-bold text-ex-navy block">{t(`report.departments.${report.department}`) || report.department}</span>
                                        <span className="text-xs text-gray-500">{t(`report.categories.${report.category}`) || report.category}</span>
                                    </td>
                                    
                                    <td className="p-4">
                                        <StatusBadge status={report.status} />
                                        {report.isEscalated && <span className="block mt-1 text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded inline-block">{t('admin.table.escalatedAuto')}</span>}
                                        {report.isHighRisk && <span className="block mt-1 text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded inline-block">{t('admin.table.highRisk')}</span>}
                                    </td>
                                    
                                    <td className="p-4 text-xs">
                                        {report.isAnonymousMode === 'full-anonymous' ? (
                                            <span className="italic text-gray-400">{t('admin.table.hiddenServer')}</span>
                                        ) : (
                                            <div>
                                                <span className="font-bold text-green-700 block mb-0.5">{t('admin.table.verifiedReporter')}</span>
                                                {report.reporterContact?.name && <span className="block">{report.reporterContact.name}</span>}
                                                <span className="text-gray-500">{report.reporterContact?.email}</span>
                                            </div>
                                        )}
                                    </td>
                                    
                                    <td className="p-4 text-sm">
                                        {report.rating ? (
                                            <div className="flex items-center text-yellow-500 font-bold">
                                                {report.rating} <Star className="h-4 w-4 ml-1 fill-yellow-500" />
                                            </div>
                                        ) : <span className="text-gray-300 text-xs">-</span>}
                                    </td>

                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <button onClick={() => setSelectedReport(report)}
                                                className="text-white hover:bg-slate-800 bg-ex-navy p-2 rounded transition flex items-center justify-center text-xs font-bold w-full"
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> {t('admin.investigate')}
                                            </button>
                                            
                                            {report.isFlagged && (
                                                <button onClick={() => handleClearFlag(report.reportId)} className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-2 rounded transition flex items-center justify-center text-[10px] font-bold w-full uppercase">
                                                    {t('admin.markSafe')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                    {currentView === 'Withdrawals' && (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                    <th className="p-4 border-b border-gray-200">{t('admin.withdrawals.colUser')}</th>
                                    <th className="p-4 border-b border-gray-200">{t('admin.withdrawals.colAmount')}</th>
                                    <th className="p-4 border-b border-gray-200">{t('admin.withdrawals.colMethod')}</th>
                                    <th className="p-4 border-b border-gray-200">{t('admin.withdrawals.colStatus')}</th>
                                    <th className="p-4 border-b border-gray-200 text-center">{t('admin.withdrawals.colActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.length === 0 ? (
                                    <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-medium">{t('admin.withdrawals.noPending')}</td></tr>
                                ) : withdrawals.map(w => (
                                    <tr key={w._id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{w.userId?.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{w.userId?.email}</div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap font-black text-ex-navy">
                                            ₹{w.amount}
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-800">{w.method}</div>
                                            <div className="text-xs text-gray-500">{w.upiId || 'N/A'}</div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                                                w.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>{t(`admin.withdrawals.status.${w.status}`)}</span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-center text-sm">
                                            {w.status === 'pending' ? (
                                                <div className="flex flex-col space-y-2">
                                                    <button onClick={async () => {
                                                        await apiClient.put(`/rewards/withdraw/${w._id}`, { status: 'approved' });
                                                        toast.success(t('admin.withdrawals.approved'));
                                                        fetchReports(); // re-fetch state
                                                    }} className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-2 rounded justify-center font-bold">{t('admin.withdrawals.approve')}</button>
                                                    
                                                    <button onClick={async () => {
                                                        await apiClient.put(`/rewards/withdraw/${w._id}`, { status: 'rejected' });
                                                        toast.success(t('admin.withdrawals.rejected'));
                                                        fetchReports();
                                                    }} className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded justify-center font-bold">{t('admin.withdrawals.reject')}</button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">{t('admin.withdrawals.processed')}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            {currentView === 'AI Insights' && (
                <div className="bg-ex-navy text-white p-8 rounded-xl shadow-lg border border-gray-200 mt-8">
                    <h3 className="text-xl mx-auto font-display font-bold mb-4 flex items-center text-ex-cyan">
                        <Bot className="w-6 h-6 mr-2" /> ExposeX AI Analyst
                    </h3>
                    {loadingInsights ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-white border-t-ex-cyan rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-300">Claude is analyzing the latest case reports for structural anomalies...</p>
                        </div>
                    ) : (
                        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                            <p className="text-lg leading-relaxed">{aiInsights || "No insights could be generated at this time."}</p>
                            <p className="text-xs text-gray-400 mt-6 mt-4">Analyses are generated proactively based on cross-referencing locations, departments, and text similarities. For advanced correlations requiring PII, human oversight is required.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal for Detailed Investigation */}
            {selectedReport && (
                <CaseInvestigationModal 
                    reportId={selectedReport._id} 
                    onClose={() => setSelectedReport(null)} 
                    onUpdate={fetchReports} 
                />
            )}
        </div>
    );
};

export default AdminDashboard;
