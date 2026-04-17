import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusBadge = ({ status }) => {
    const { t } = useTranslation();
    let colorClass = 'bg-gray-200 text-gray-800';

    switch (status) {
        case 'Submitted':
            colorClass = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700';
            break;
        case 'Under Review':
            colorClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
            break;
        case 'Escalated':
            colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
            break;
        case 'Resolved':
        case 'Verified':
            colorClass = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
            break;
        case 'Closed':
            colorClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
            break;
        default:
            break;
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center justify-center ${colorClass}`}>
            {t(`status.${status}`) || status}
        </span>
    );
};

export default StatusBadge;
