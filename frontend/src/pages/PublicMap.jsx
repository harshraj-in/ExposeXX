import React, { useEffect, useState, useMemo } from 'react';
import useStore from '../store/useStore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import MapInsightPanel from '../components/MapInsightPanel';
import TimeSlider from '../components/TimeSlider';
import HeatmapLayer from '../components/HeatmapLayer';
import StatusBadge from '../components/StatusBadge';
import { getReports, getCoordsForLocation } from '../storage';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (color) => L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#fff"></circle></svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24]
});

const iconMap = {
    'Critical': createCustomIcon('#dc2626'),
    'High': createCustomIcon('#ea580c'),
    'Medium': createCustomIcon('#eab308'),
    'Low': createCustomIcon('#2563eb'),
};

// Add a small jitter to avoid overlapping markers at same location
const jitter = (coord) => coord + (Math.random() - 0.5) * 0.05;

export default function PublicMap() {
    const { t } = useTranslation();
    const { theme } = useStore();

    // --- State & Hooks at Top ---
    const [timeframe, setTimeframe] = useState('30d');
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [visualMode, setVisualMode] = useState('heatmap');
    const [loading, setLoading] = useState(true);
    const [heatmapData, setHeatmapData] = useState([]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [timeframe, filterCategory, filterDepartment, visualMode]);

    const filteredPoints = useMemo(() => {
        const reports = getReports();
        const cutoffDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 9999;
        const cutoff = Date.now() - cutoffDays * 86400000;

        return reports
            .filter(r => new Date(r.createdAt).getTime() >= cutoff)
            .filter(p => {
                if (filterDepartment !== 'All' && p.department !== filterDepartment) return false;
                if (filterCategory !== 'All' && p.category !== filterCategory) return false;
                return true;
            })
            .map(r => {
                const [lat, lng] = getCoordsForLocation(r.location);
                return {
                    id: r.reportId,
                    lat: jitter(lat),
                    lng: jitter(lng),
                    severity: r.severity,
                    category: r.category,
                    department: r.department,
                    state: r.location?.state || r.location || '',
                    status: r.status,
                    timestamp: r.createdAt,
                    isVerified: r.status === 'Resolved',
                    reportId: r.reportId,
                };
            });
    }, [timeframe, filterCategory, filterDepartment]);

    const activeHeatmapData = useMemo(() => {
        if (visualMode !== 'heatmap') return [];
        // Group points by lat/lng (rounded to avoid jitter jitter) to calculate proper intensity
        const clusters = {};
        filteredPoints.forEach(p => {
            const key = `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
            if (!clusters[key]) clusters[key] = { lat: p.lat, lng: p.lng, count: 0 };
            clusters[key].count += 1;
        });
        return Object.values(clusters).map(c => ({
            lat: c.lat,
            lng: c.lng,
            intensity: Math.min(c.count, 10) // Scale intensity but cap it
        }));
    }, [filteredPoints, visualMode]);

    const handleFilterChange = (type, value) => {
        if (type === 'department') setFilterDepartment(value);
        if (type === 'category') setFilterCategory(value);
        if (type === 'visualMode') setVisualMode(value);
    };

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col md:flex-row relative bg-gray-100 dark:bg-slate-950 overflow-hidden text-left transition-colors duration-300">

            <MapInsightPanel onFilterChange={handleFilterChange} />

            {/* Map Area */}
            <div className="flex-grow relative h-full w-full z-10 bg-gray-200 dark:bg-slate-900">

                {loading && (
                    <div className="absolute inset-0 z-[1001] flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-ex-navy dark:text-white mb-4" />
                        <span className="text-xs font-bold tracking-tighter uppercase">{t('map.analyzing')}</span>
                    </div>
                )}

                <MapContainer center={[22.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url={theme === 'dark'
                            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                        }
                    />

                    {visualMode === 'heatmap' ? (
                        <HeatmapLayer points={activeHeatmapData} />
                    ) : (
                        filteredPoints.map((point) => (
                            <Marker key={point.id} position={[point.lat, point.lng]} icon={iconMap[point.severity] || iconMap['Medium']}>
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[200px]">
                                        <div className="flex justify-between items-start mb-2 border-b pb-2">
                                            <h3 className="font-bold text-sm">
                                                {t(`report.categories.${point.category}`) || point.category}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1">{point.state}</p>
                                        <span className="text-[10px] font-bold text-ex-cyan animate-pulse">{t('map.liveAnalysis')}</span>
                                        <StatusBadge status={point.status} />
                                        <p className="text-xs text-gray-400 mt-2">{format(new Date(point.timestamp), 'dd MMM yyyy')}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))
                    )}
                </MapContainer>

                <TimeSlider timeframe={timeframe} setTimeframe={setTimeframe} />

                {/* Legend */}
                <div className="absolute bottom-16 right-4 z-[1000] bg-white dark:bg-slate-800 rounded-xl shadow-lg p-3 border border-gray-200 dark:border-slate-700 text-xs">
                    <p className="font-bold text-gray-600 dark:text-gray-300 mb-2">{t('map.severity')}</p>
                    {[['Critical', '#dc2626'], ['High', '#ea580c'], ['Medium', '#eab308'], ['Low', '#2563eb']].map(([label, color]) => (
                        <div key={label} className="flex items-center mb-1">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                            <span className="text-gray-600 dark:text-gray-300">{t(`severity.${label.toLowerCase()}`)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
