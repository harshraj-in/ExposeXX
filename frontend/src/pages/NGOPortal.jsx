import React, { useEffect, useState } from 'react';
import { Download, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { getReports } from '../storage';

const NGOPortal = () => {
    const { t } = useTranslation();
    const { user } = useStore();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = () => {
            setLoading(true);
            setTimeout(() => {
                const all = getReports();
                setReports(all);
                setLoading(false);
            }, 400);
        };
        if (user && (user.role === 'NGO' || user.role === 'Admin')) {
            fetchReports();
        } else {
            setLoading(false);
        }
    }, [user]);

    const exportCSV = () => {
        if (!reports.length) return;
        
        const csvData = reports.map(r => ({
            Case_ID: r.reportId,
            Category: r.category,
            State: r.location?.state || '',
            District: r.location?.district || '',
            Severity: r.severity,
            Status: r.status,
            Date_Filed: new Date(r.createdAt).toLocaleDateString(),
            Witnesses_Count: 0, // Mock for now
            Support_Upvotes: r.upvotes || 0,
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (!user || (user.role !== 'NGO' && user.role !== 'Admin')) {
        return <div className="text-center py-20 font-bold text-red-500">{t('ngo.accessRestricted')}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-ex-navy flex items-center">
                        <Users className="w-8 h-8 mr-3 text-ex-cyan" /> {t('ngo.title')}
                    </h1>
                    <p className="text-gray-500 mt-2">{t('ngo.subtitle')}</p>
                </div>
                <button onClick={exportCSV} className="btn-primary flex items-center bg-green-600 hover:bg-green-700 border-green-600">
                    <Download className="w-4 h-4 mr-2" /> {t('ngo.exportBtn')}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-ex-navy border-t-ex-cyan rounded-full animate-spin"></div></div>
            ) : (
                <div className="glass-card overflow-hidden border border-gray-200 shadow-xl rounded-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-ex-navy text-white text-sm">
                                    <th className="p-4 font-semibold uppercase">{t('dashboard.colReportId')}</th>
                                    <th className="p-4 font-semibold uppercase">{t('track.location')}</th>
                                    <th className="p-4 font-semibold uppercase">{t('dashboard.colCategory')}</th>
                                    <th className="p-4 font-semibold uppercase">{t('track.severity')}</th>
                                    <th className="p-4 font-semibold uppercase">{t('dashboard.colStatus')}</th>
                                    <th className="p-4 font-semibold uppercase text-center">{t('ngo.colWitnesses')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {reports.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">No reports available to monitor.</td></tr>
                                ) : reports.map((report) => (
                                    <tr key={report.reportId} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-sm font-bold text-ex-navy">{report.reportId}</td>
                                        <td className="p-4 text-sm font-medium text-gray-700">{report.location?.district}, {report.location?.state}</td>
                                        <td className="p-4 text-sm font-medium">{t(`report.categories.${report.category}`) || report.category}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded shadow-sm uppercase ${report.severity === 'Critical' ? 'bg-red-600 text-white' : report.severity === 'High' ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                                {report.severity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-ex-navy">{report.status}</td>
                                        <td className="p-4 text-sm text-center">
                                            <span className="bg-blue-50 text-blue-700 font-black px-3 py-1 rounded-full border border-blue-100">
                                                {report.witnesses?.length || 0}
                                            </span>
                                        </td>
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
