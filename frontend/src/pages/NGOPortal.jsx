import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { Download, Users, FileText, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';

const NGOPortal = () => {
    const { t } = useTranslation();
    const { user } = useStore();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                // NGOs can see all reports (since their role gives adminOrModerator pass)
                const res = await apiClient.get('/reports');
                setReports(res.data);
            } catch (err) {
                toast.error("Failed to load reports");
            } finally {
                setLoading(false);
            }
        };
        if (user && user.role === 'NGO') {
            fetchReports();
        } else {
            setLoading(false);
        }
    }, [user]);

    const exportCSV = () => {
        if (!reports.length) return;
        
        // Strip PII and format
        const csvData = reports.map(r => ({
            Case_ID: r.reportId,
            Category: r.category,
            State: r.location?.state,
            District: r.location?.district,
            Severity: r.severity,
            Status: r.status,
            Date_Filed: new Date(r.createdAt).toLocaleDateString(),
            Witnesses_Count: r.witnesses?.length || 0,
            Support_Upvotes: r.upvotes,
            Description: `"${(r.description || '').replace(/"/g, '""').substring(0, 150)}..."` 
        }));

        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(obj => Object.values(obj).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'exposex_ngo_export.csv');
        a.click();
    };

    if (!user || user.role !== 'NGO') {
        return <div className="text-center py-20 font-bold text-red-500">{t('ngo.accessRestricted')}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-ex-navy flex items-center">
                        <Users className="w-8 h-8 mr-3 text-ex-cyan" /> {t('ngo.title')}
                    </h1>
                    <p className="text-gray-500 mt-2">{t('ngo.subtitle')}</p>
                </div>
                <button onClick={exportCSV} className="btn-primary flex items-center bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" /> {t('ngo.exportBtn')}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-ex-navy border-t-ex-cyan rounded-full animate-spin"></div></div>
            ) : (
                <div className="glass-card overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700 text-sm">
                                    <th className="p-4 font-semibold">{t('dashboard.colReportId')}</th>
                                    <th className="p-4 font-semibold">{t('track.location')}</th>
                                    <th className="p-4 font-semibold">{t('dashboard.colCategory')}</th>
                                    <th className="p-4 font-semibold">{t('track.severity')}</th>
                                    <th className="p-4 font-semibold">{t('dashboard.colStatus')}</th>
                                    <th className="p-4 font-semibold">{t('ngo.colWitnesses')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {reports.map((report) => (
                                    <tr key={report._id} className="hover:bg-slate-50">
                                        <td className="p-4 font-mono text-sm font-bold text-gray-700">{report.reportId}</td>
                                        <td className="p-4 text-sm">{report.location?.district}, {report.location?.state}</td>
                                        <td className="p-4 text-sm font-medium">{t(`report.categories.${report.category}`) || report.category}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded shadow-sm ${report.severity === 'Critical' ? 'bg-red-500 text-white' : report.severity === 'High' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                {report.severity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-ex-navy">{report.status}</td>
                                        <td className="p-4 text-sm text-center font-bold text-blue-600 bg-blue-50">{report.witnesses?.length || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NGOPortal;
