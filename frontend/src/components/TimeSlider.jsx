import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, PlayCircle, PauseCircle } from 'lucide-react';

export default function TimeSlider({ timeframe, setTimeframe }) {
    const { t } = useTranslation();
    const options = [
        { id: '24h', label: t('map.last24h') },
        { id: '7d', label: t('map.last7d') },
        { id: '30d', label: t('map.last30Days') },
        { id: 'all', label: t('map.allTime') }
    ];

    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-200 flex items-center space-x-4">
            <Clock className="w-5 h-5 text-gray-500" />
            <div className="flex space-x-1">
                {options.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setTimeframe(opt.id)}
                        className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                            timeframe === opt.id 
                            ? 'bg-cw-navy text-white shadow-md scale-105' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-cw-navy'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            
        </div>
    );
}
