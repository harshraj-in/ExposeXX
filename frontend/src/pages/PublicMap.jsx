import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import MapInsightPanel from '../components/MapInsightPanel';
import TimeSlider from '../components/TimeSlider';
import HeatmapLayer from '../components/HeatmapLayer';
import StatusBadge from '../components/StatusBadge';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#fff"></circle></svg>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    });
};

const iconMap = {
    'Critical': createCustomIcon('#dc2626'), 
    'High': createCustomIcon('#ea580c'), 
    'Medium': createCustomIcon('#eab308'), 
    'Low': createCustomIcon('#2563eb'), 
};

export default function PublicMap() {
    const { t } = useTranslation();
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [visualMode, setVisualMode] = useState('heatmap'); // 'heatmap' or 'pins'
    
    // TimeSlider State
    const [timeframe, setTimeframe] = useState('30d');

    // Fetch Base Heatmap Points based essentially on timeframe
    useEffect(() => {
        const fetchHeatmap = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/analytics/heatmap?timeframe=${timeframe}`);
                if (res.data.success) {
                    setHeatmapData(res.data.points || []);
                }
            } catch (err) {
                console.error("Failed to load heatmap tracking data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHeatmap();
    }, [timeframe]);

    // Apply Client-Side Layer Filters (Department / Category) efficiently
    const filteredPoints = useMemo(() => {
        return heatmapData.filter(p => {
            if (filterDepartment !== 'All' && p.department !== filterDepartment) return false;
            if (filterCategory !== 'All' && p.category !== filterCategory) return false;
            return true;
        });
    }, [heatmapData, filterCategory, filterDepartment]);

    const handleFilterChange = (type, value) => {
        if (type === 'department') setFilterDepartment(value);
        if (type === 'category') setFilterCategory(value);
        if (type === 'visualMode') setVisualMode(value);
    };

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col md:flex-row relative bg-gray-100 overflow-hidden text-left">
            
            <MapInsightPanel onFilterChange={handleFilterChange} />

            {/* Map Area */}
            <div className="flex-grow relative h-full w-full z-10 bg-gray-200">
                
                {loading && (
                    <div className="absolute inset-0 z-[1001] flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                        <Loader2 className="animate-spin h-10 w-10 text-ex-navy mb-4" />
                        <span className="text-ex-navy font-bold tracking-wide">{t('map.loading')}</span>
                    </div>
                )}
                
                <MapContainer center={[22.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    
                    {/* Modern Dark/Slick theme depending on design, using Carto Light for clarity with Heatmap colors */}
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    
                    {visualMode === 'heatmap' ? (
                        <HeatmapLayer points={filteredPoints} />
                    ) : (
                        filteredPoints.map((point) => (
                            <Marker key={point.id} position={[point.lat, point.lng]} icon={iconMap[point.severity] || iconMap['Medium']}>
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[200px]">
                                        <div className="flex justify-between items-start mb-2 border-b pb-2">
                                            <h3 className="font-bold text-sm">{point.category} <span className="text-xs font-normal block text-gray-500">{point.department}</span></h3>
                                            {point.isVerified && <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded ml-1 font-bold">{t('map.verified')}</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">{point.state}</p>
                                        <div className="text-xs text-gray-400 mb-2">{format(new Date(point.timestamp), 'dd MMM yyyy, HH:mm')}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))
                    )}
                </MapContainer>

                <TimeSlider timeframe={timeframe} setTimeframe={setTimeframe} />
            </div>
        </div>
    );
}
