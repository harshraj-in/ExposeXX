import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusBadge = ({ status }) => {
    const { t } = useTranslation();
    let colorClass = 'bg-gray-200 text-gray-800';

    switch (status) {
        case 'Submitted':
            colorClass = 'bg-gray-200 text-gray-800';
            break;
        case 'Under Review':
            colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
            break;
        case 'Escalated':
            colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
            break;
        case 'Resolved':
            colorClass = 'bg-green-100 text-green-800 border-green-200';
            break;
        case 'Closed':
            colorClass = 'bg-red-100 text-red-800 border-red-200';
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
