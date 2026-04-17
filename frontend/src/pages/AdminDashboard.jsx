import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import { Download, RefreshCw, Eye, Flag, ShieldAlert, Banknote, CheckCircle, XCircle } from 'lucide-react';
import CaseInvestigationModal from '../components/CaseInvestigationModal';
import { useTranslation } from 'react-i18next';
import { getReports, getWithdrawals, updateWithdrawalStatus } from '../storage';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [reports, setReports] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [currentView, setCurrentView] = useState('All');

    const fetchData = () => {
        setLoading(true);
        setTimeout(() => {
            setReports(getReports());
            setWithdrawals(getWithdrawals());
            setLoading(false);
        }, 200);
    };

    useEffect(() => { fetchData(); }, []);

    const handleUpdateWithdrawal = (id, status) => {
        updateWithdrawalStatus(id, status);
        toast.info(`Request marked as ${status}`);
        fetchData();
    };

    const handleExport = () => {
        const csvContent = 'data:text/csv;charset=utf-8,'
            + 'ID,Category,Department,Severity,Status,State\n'
            + reports.map(r => {
                const state = r.location?.state || r.location || '';
                return `${r.reportId},${r.category},${r.department},${r.severity},${r.status},${state}`;
            }).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'exposex_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const flaggedReports = reports.filter(r => r.isFlagged);
    const displayedReports = currentView === 'Flagged' ? flaggedReports : reports;

    const getLocation = (loc) => {
        if (!loc) return '';
        if (typeof loc === 'string') return loc;
        return `${loc.district || ''}, ${loc.state || ''}`.replace(/^,\s*/, '');
    };

    return (
        <div className="max-w-7xl mx-auto py-4 md:py-8 px-2 sm:px-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-display text-ex-navy dark:text-white">{t('admin.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">{t('admin.subtitle')}</p>
                </div>
                <div className="flex flex-wrap md:flex-nowrap rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm w-full md:w-auto">
                    <button
                        onClick={() => setCurrentView('All')}
                        className={`flex-1 md:flex-none flex items-center justify-center px-3 md:px-4 py-3 text-[10px] md:text-sm font-bold transition ${currentView === 'All' ? 'bg-ex-navy text-white' : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                        <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${loading ? 'animate-spin' : ''}`} /> {t('admin.tabs.all')}
                    </button>
                    <button
                        onClick={() => setCurrentView('Flagged')}
                        className={`flex-1 md:flex-none flex items-center justify-center px-3 md:px-4 py-3 text-[10px] md:text-sm font-bold transition ${currentView === 'Flagged' ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                        <Flag className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> {t('admin.tabs.flagged')}
                    </button>
                    <button
                        onClick={() => setCurrentView('Withdrawals')}
                        className={`flex-1 md:flex-none flex items-center justify-center px-3 md:px-4 py-3 text-[10px] md:text-sm font-bold transition ${currentView === 'Withdrawals' ? 'bg-ex-cyan text-ex-navy' : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                        <Banknote className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> {t('admin.tabs.withdrawals') || 'Withdrawals'}
                    </button>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 mb-8 flex justify-between items-center transition-colors">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold flex items-center">
                    <ShieldAlert className="h-4 w-4 text-ex-cyan mr-2" /> {t('admin.totalReports', { count: reports.length })}
                </p>
                <button onClick={handleExport} className="btn-outline flex items-center px-4 py-2 text-sm border-gray-200 dark:border-slate-700 dark:text-gray-300">
                    <Download className="h-4 w-4 mr-2" /> {t('admin.exportLogs')}
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <h2 className="font-bold text-lg text-ex-navy dark:text-white">{currentView === 'All' ? t('admin.allIncidents') : t('admin.flaggedIncidents')}</h2>
                    <button onClick={fetchData} className="text-gray-500 hover:text-ex-navy dark:hover:text-ex-cyan transition">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {currentView === 'Withdrawals' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-slate-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider">
                                    <th className="p-4 border-b border-gray-200 dark:border-slate-700">Citizen</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-slate-700">Amount</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-slate-700">UPI / Details</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-slate-700">Status</th>
                                    <th className="p-4 border-b border-gray-200 dark:border-slate-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.length === 0 ? (
                                    <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-medium">No withdrawal requests found.</td></tr>
                                ) : withdrawals.map(w => (
                                    <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 transition">
                                        <td className="p-4 text-sm font-bold text-ex-navy dark:text-white">{w.userName}</td>
                                        <td className="p-4 text-sm font-black text-ex-navy dark:text-ex-cyan">₹{w.amount}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{w.upiId || 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                                                w.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                w.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end space-x-2">
                                            {w.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleUpdateWithdrawal(w.id, 'Paid')} className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition" title="Approve & Mark Paid">
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleUpdateWithdrawal(w.id, 'Rejected')} className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition" title="Reject & Refund">
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            {/* ... existing table headers ... */}
                            <thead>
                                <tr className="bg-gray-100 dark:bg-slate-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider">
                                    <th className="p-2 md:p-4 border-b border-gray-200 dark:border-slate-700">{t('admin.table.colIdFlags')}</th>
                                    <th className="p-2 md:p-4 border-b border-gray-200 dark:border-slate-700">{t('admin.table.colDeptCat')}</th>
                                    <th className="p-2 md:p-4 border-b border-gray-200 dark:border-slate-700">{t('admin.table.colLocation')}</th>
                                    <th className="p-2 md:p-4 border-b border-gray-200 dark:border-slate-700">{t('admin.table.colStatusEsc')}</th>
                                    <th className="p-2 md:p-4 border-b border-gray-200 dark:border-slate-700">{t('admin.table.colSeverity')}</th>
                                    <th className="p-2 md:p-4 border-b border-gray-200 dark:border-slate-700 text-center">{t('admin.table.colManage')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="p-10 text-center text-gray-400">{t('admin.loading')}</td></tr>
                                ) : displayedReports.length === 0 ? (
                                    <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-medium">{t('admin.table.noIncidents')}</td></tr>
                                ) : displayedReports.map(report => (
                                    <tr key={report.reportId} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 last:border-0 transition ${report.isFlagged ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                        <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                                            <span className="block text-xs font-bold text-ex-navy dark:text-ex-cyan mb-1">{report.reportId}</span>
                                            <span className="text-[10px] bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{format(new Date(report.createdAt), 'dd MMM yyyy')}</span>
                                            {report.isFlagged && (
                                                <span className="block mt-1 text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center bg-red-100 dark:bg-red-900/30 rounded px-1.5 py-0.5">
                                                    <Flag className="h-3 w-3 mr-0.5" /> {report.flags} {t('admin.table.abuseFlags')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="font-bold text-ex-navy dark:text-white block">{report.department}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{report.category}</span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{getLocation(report.location)}</td>
                                        <td className="p-4"><StatusBadge status={report.status} /></td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                                report.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800' : 
                                                report.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800' : 
                                                report.severity === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800' : 
                                                'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800'
                                            }`}>
                                                {t(`severity.${report.severity.toLowerCase()}`)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setSelectedReport(report)}
                                                className="text-white hover:bg-slate-800 bg-ex-navy dark:bg-ex-cyan dark:text-ex-navy dark:hover:bg-cyan-500 p-2 rounded transition flex items-center justify-center text-xs font-bold w-full uppercase tracking-tighter"
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> {t('admin.investigate')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Case Investigation Modal */}
            {selectedReport && (
                <CaseInvestigationModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
