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
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 md:px-6 py-2 md:py-3 rounded-2xl md:rounded-full shadow-lg border border-gray-200 dark:border-slate-800 flex items-center space-x-2 md:space-x-4 transition-all duration-300 w-[90%] md:w-auto overflow-x-auto no-scrollbar">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400 shrink-0" />
            <div className="flex space-x-1 shrink-0">
                {options.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setTimeframe(opt.id)}
                        className={`text-[10px] md:text-xs font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all whitespace-nowrap ${
                            timeframe === opt.id 
                            ? 'bg-ex-navy text-white shadow-md scale-105' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-ex-navy dark:hover:text-ex-cyan'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            
        </div>
    );
}
