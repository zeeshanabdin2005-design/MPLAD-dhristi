const fs = require('fs');

const code = `import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Map, MapPin, Layers, Filter, Maximize2, AlertTriangle, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { getProjects } from '../services/projectService';
import { getAllRiskAssessments } from '../services/riskService';
import { MpladsProject, RiskAssessment } from '../types';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function GisIntelligence() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedProjects, fetchedAssessments] = await Promise.all([
          getProjects(),
          getAllRiskAssessments()
        ]);
        
        const assessMap = new Map(fetchedAssessments.map(a => [a.projectId, a.level]));
        
        // Filter projects that actually have coords (or give them default for the demo if synthetic)
        const mapped = fetchedProjects.filter(p => p.lat && p.lng).map(p => ({
          ...p,
          riskLevel: assessMap.get(p.id) || 'LOW'
        }));
        
        setProjects(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const center: [number, number] = projects.length > 0 ? [projects[0].lat!, projects[0].lng!] : [23.2599, 77.4126];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading geospatial data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <Map className="h-8 w-8 text-emerald-600" /> GIS Intelligence
          </h1>
          <p className="text-slate-500 font-medium">Spatial analysis and proximity-based anomaly detection.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden relative flex flex-col md:flex-row shadow-sm">
        
        {/* Map Container */}
        <div className="flex-1 relative z-0">
           <MapContainer
             center={center}
             zoom={10}
             style={{ height: '100%', width: '100%', background: '#f8fafc' }}
             zoomControl={false}
           >
             <TileLayer
               url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
             />
             
             {/* Render Projects */}
             {projects.map(p => (
               <Marker 
                 key={p.id} 
                 position={[p.lat, p.lng]}
                 icon={p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL' ? redIcon : p.riskLevel === 'MEDIUM' ? goldIcon : greenIcon}
               >
                 <Popup className="bg-slate-50 text-slate-800 border-slate-200">
                   <div className="p-1">
                     <div className="font-bold text-sm mb-1">{p.id}</div>
                     <div className="text-xs text-slate-600 mb-2 truncate w-48">{p.name || p.district}</div>
                     <Badge variant="outline" className={p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200 mb-2' : p.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200 mb-2' : 'bg-emerald-50 text-emerald-700 border-emerald-200 mb-2'}>
                       {p.riskLevel} RISK
                     </Badge>
                     <Button size="sm" className="w-full h-7 text-xs bg-[#0F2A43]" onClick={() => navigate(\`/projects/\${p.id}\`)}>View Project</Button>
                   </div>
                 </Popup>
               </Marker>
             ))}
           </MapContainer>
        </div>

        {/* Sidebar Panel */}
        <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col z-[400]">
           <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Layers className="h-4 w-4 text-emerald-500" /> Mapped Records</h3>
           </div>
           
           <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No project coordinates available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span>Total Mapped</span>
                    <span className="font-bold text-slate-800">{projects.length}</span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                     Only projects containing explicit \`lat\`/\`lng\` coordinates are rendered.
                  </div>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/GisIntelligence.tsx', code);
