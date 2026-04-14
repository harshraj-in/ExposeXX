import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { IndianRupee, FileText, CheckCircle, Clock, Banknote, History, ShieldQuestion, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function CitizenDashboard() {
    const { user } = useStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [withdrawHistory, setWithdrawHistory] = useState([]);
    
    // Withdraw Modal
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [method, setMethod] = useState('UPI');
    const [upiId, setUpiId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rewardRes, reportRes, withdrawRes] = await Promise.all([
                apiClient.get('/rewards'),
                apiClient.get('/reports/my'),
                apiClient.get('/rewards/withdraw')
            ]);
            setStats(rewardRes.data.user);
            setReports(reportRes.data.reports || []);
            setWithdrawHistory(withdrawRes.data.requests || []);
        } catch (error) {
            toast.error("Failed to load dashboard data");
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/rewards/withdraw', {
                amount: Number(withdrawAmount),
                method,
                upiId
            });
            toast.success("Withdrawal request submitted! Pending admin review.");
            setShowWithdraw(false);
            setWithdrawAmount('');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit withdrawal");
        }
    };

    if (!stats) return <div className="p-8 text-center"><span className="animate-pulse">{t('dashboard.loading')}</span></div>;

    const pendingReports = reports.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto py-10 px-4 sm:px-6"
        >
            <h1 className="text-3xl font-display font-bold text-ex-navy mb-8">{t('dashboard.title')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* User Stats Wrapper */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* STATS 1: Reporting Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-blue-500 shadow-sm premium-card-hover">
                            <div className="flex items-center justify-between mb-4">
                                <FileText className="text-blue-500 h-8 w-8" />
                                <span className="text-2xl font-black text-gray-800">{stats.totalReports}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('dashboard.totalSubmissions')}</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-green-500 shadow-sm premium-card-hover">
                            <div className="flex items-center justify-between mb-4">
                                <CheckCircle className="text-green-500 h-8 w-8" />
                                <span className="text-2xl font-black text-gray-800">{stats.verifiedReports}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('dashboard.verifiedResolves')}</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-orange-500 shadow-sm premium-card-hover">
                            <div className="flex items-center justify-between mb-4">
                                <Clock className="text-orange-500 h-8 w-8" />
                                <span className="text-2xl font-black text-gray-800">{pendingReports}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('dashboard.pendingReview')}</p>
                        </motion.div>
                    </div>

                    {/* TABLE: My Complaints */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold text-ex-navy mb-4 flex items-center">
                            <ShieldQuestion className="h-5 w-5 mr-2"/> {t('dashboard.complaintHistory')}
                        </h2>
                        {reports.length === 0 ? (
                            <p className="text-gray-500 text-sm">{t('dashboard.noReports')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600">{t('dashboard.colReportId')}</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600">{t('dashboard.colCategory')}</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600">{t('dashboard.colDate')}</th>
                                            <th className="py-3 px-4 font-bold text-sm text-gray-600">{t('dashboard.colStatus')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(r => (
                                            <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-mono text-xs">{r.reportId}</td>
                                                <td className="py-3 px-4 text-sm font-medium">{t(`report.categories.${r.category}`) || r.category}</td>
                                                <td className="py-3 px-4 text-sm text-gray-500">{format(new Date(r.createdAt), 'dd MMM yyyy')}</td>
                                                <td className="py-3 px-4 flex items-center space-x-2">
                                                    <StatusBadge status={r.status} />
                                                    <button 
                                                        onClick={() => navigate(`/track?reportId=${r.reportId}&openChat=true`)}
                                                        className="text-[10px] text-blue-600 font-bold hover:underline flex items-center"
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                        {t('dashboard.trackChat')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Widget: Wallet */}
                <div className="space-y-8">
                    <div className="glass-card p-6 bg-gradient-to-br from-ex-navy to-slate-800 border-none text-white shadow-xl relative overflow-hidden">
                        <Banknote className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10 pointer-events-none transform -rotate-12" />
                        
                        <h2 className="text-lg font-bold text-blue-100 mb-6 uppercase tracking-wider flex items-center">
                            <IndianRupee className="w-5 h-5 mr-2" /> {t('dashboard.rewardWallet')}
                        </h2>
                        
                        <div className="mb-8 relative z-10">
                            <p className="text-sm text-ex-cyan mb-1">{t('dashboard.availableBalance')}</p>
                            <div className="flex items-baseline">
                                <span className="text-3xl font-bold mr-1">₹</span>
                                <motion.h3 
                                    className="text-5xl font-black animate-glow"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                >
                                    {stats.rewardBalance.toLocaleString()}
                                </motion.h3>
                                {stats.rewardBalance > 0 && (
                                    <div className="ml-3 px-2 py-0.5 bg-ex-cyan/20 rounded-full glow-pulse">
                                      <span className="text-[10px] text-ex-cyan font-black uppercase tracking-tighter">Active</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowWithdraw(true)} 
                            disabled={stats.rewardBalance <= 0}
                            className="w-full py-3 bg-ex-cyan hover:bg-cyan-500 text-ex-navy font-bold rounded-lg shadow-lg disabled:opacity-50 transition"
                        >
                            {t('dashboard.withdrawFunds')}
                        </button>
                    </div>

                    {/* Withdrawal History */}
                    {withdrawHistory.length > 0 && (
                        <div className="glass-card p-6 border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 flex items-center">
                                <History className="w-4 h-4 mr-2"/> {t('dashboard.recentWithdrawals')}
                            </h3>
                            <ul className="space-y-3">
                                {withdrawHistory.map(w => (
                                    <li key={w._id} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded">
                                        <div>
                                            <p className="font-bold">₹{w.amount}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(w.createdAt), 'dd MMM')}</p>
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                                            w.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>{w.status}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdraw && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-ex-navy mb-4">{t('dashboard.requestWithdrawal')}</h3>
                        <p className="text-sm text-gray-600 mb-6">{t('dashboard.withdrawNote')}</p>
                        
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">{t('dashboard.amount')}</label>
                                <input type="number" required max={stats.rewardBalance} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="input-field" placeholder={`Max ₹${stats.rewardBalance}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">{t('dashboard.transferMethod')}</label>
                                <select value={method} onChange={e => setMethod(e.target.value)} className="input-field">
                                    <option value="UPI">UPI ID</option>
                                    <option value="BANK" disabled>Bank Transfer (Coming Soon)</option>
                                </select>
                            </div>
                            {method === 'UPI' && (
                                <div>
                                    <label className="block text-sm font-bold mb-1">UPI ID</label>
                                    <input type="text" required value={upiId} onChange={e => setUpiId(e.target.value)} className="input-field" placeholder="e.g. name@okhdfcbank" />
                                </div>
                            )}

                            <div className="flex space-x-3 mt-6">
                                <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 py-2 bg-gray-100 text-gray-800 font-bold rounded hover:bg-gray-200 transition">{t('dashboard.cancel')}</button>
                                <button type="submit" className="flex-1 py-2 bg-ex-navy text-white font-bold rounded hover:bg-slate-800 transition">{t('dashboard.confirm')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
