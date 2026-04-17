import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !points || points.length === 0) return;

        // Leaflet.heat expects an array of [lat, lng, intensity] arrays
        const heatPoints = points.map(p => [p.lat, p.lng, p.intensity]);

        // Dynamically find max intensity from data, capped to a sensible baseline
        // so that even sparsely populated areas can still render as Red if they rank high
        const dataMax = points.reduce((max, p) => Math.max(max, p.intensity), 1);
        const mapMax = Math.min(dataMax, 5.0); // Make it easier to hit the 'Red' state

        const heatLayer = L.heatLayer(heatPoints, {
            radius: 30, // Precise radius
            blur: 20, // Clean blur for hotspots
            maxZoom: 15,
            max: mapMax, 
            gradient: {
                0.4: '#eab308', // Yellow (Low)
                0.7: '#f97316', // Orange (Moderate)
                1.0: '#dc2626'  // Red-Orange (High)
            }
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
}
