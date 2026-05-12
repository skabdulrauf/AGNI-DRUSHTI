"use client";

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, LayersControl, useMapEvents, ZoomControl, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Standard Leaflet Icon Fix
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = L.divIcon({
  html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse ring-4 ring-blue-500/30"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const getZoneColor = (type: string) => {
  switch (type) {
    case 'Tiger Reserve': return '#FF4500'; // Lava Red
    case 'National Park': return '#228B22'; // Emerald
    case 'Biosphere Reserve': return '#008080'; // Teal
    case 'Wildlife Sanctuary': return '#DAA520'; // Gold
    default: return '#FF5C1A'; // Agni Orange
  }
};

const zoneIcon = (color: string) => L.divIcon({
  html: `<div class="w-8 h-8 rounded-full border-4 border-white/20 shadow-2xl flex items-center justify-center transition-all hover:scale-125" style="background-color: ${color}; box-shadow: 0 0 20px ${color}80">
          <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  className: 'marker-pulse',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const getLiveRisk = (zone: any, hotspots: any[]) => {
  const nearby = hotspots.filter(h => {
    const dist = Math.sqrt(Math.pow(h.lat - zone.lat, 2) + Math.pow(h.lng - zone.lng, 2));
    return dist < 0.5;
  });

  const count = nearby.length;
  if (count >= 5) return { label: 'EXTREME', color: 'text-destructive', value: Math.min(99, 90 + count) };
  if (count >= 3) return { label: 'HIGH', color: 'text-primary', value: 70 + (count * 5) };
  if (count >= 1) return { label: 'MEDIUM', color: 'text-accent', value: 40 + (count * 10) };
  return { label: 'LOW', color: 'text-green-500', value: 12 };
};

function SetViewOnSelect({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      map.flyTo(center, 14, { animate: true, duration: 2 });
    }
  }, [center, map]);
  return null;
}

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 12, { animate: true });
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <div className="px-2 py-1 font-bold text-blue-400 text-[10px] uppercase">Position LOCKED</div>
      </Tooltip>
    </Marker>
  );
}

function LocateControl() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    map.locate();
    setTimeout(() => setIsLocating(false), 2000);
  };

  return (
    <div className="absolute bottom-20 left-3 z-[1000]">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={handleLocate}
        className={`glass-panel border-white/10 h-10 w-10 ${isLocating ? 'text-primary scale-110 shadow-[0_0_15px_rgba(255,92,26,0.3)]' : 'text-white'}`}
      >
        <LocateFixed className="w-5 h-5" />
      </Button>
    </div>
  );
}

function MapContent({ zones = [], hotspots = [], complaints = [], onZoneSelect, selectedZoneCenter }: any) {
  const map = useMap();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!map) return;
    
    // Strict readiness check to prevent appendChild errors
    const checkReady = () => {
      const container = map.getContainer();
      if (container && container.offsetParent !== null) {
        setIsReady(true);
      } else {
        // Recursive check via animation frame for better DOM synchronization
        requestAnimationFrame(checkReady);
      }
    };
    
    checkReady();
  }, [map]);

  if (!isReady) return null;

  return (
    <>
      <LayersControl position="bottomleft">
        <LayersControl.BaseLayer name="Tactical Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked name="Satellite View">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Global Streets">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      <ZoomControl position="topleft" />
      <LocateControl />
      <LocationMarker />
      
      {selectedZoneCenter && <SetViewOnSelect center={selectedZoneCenter} />}

      {zones.map((zone: any) => {
        const risk = getLiveRisk(zone, hotspots);
        return (
          <Marker 
            key={zone.id}
            position={[zone.lat, zone.lng]}
            icon={zoneIcon(getZoneColor(zone.type))}
            eventHandlers={{
              click: () => onZoneSelect(zone)
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="custom-tooltip bg-transparent border-none shadow-none">
              <div className="liquid-glass p-3 rounded-xl border border-white/10 shadow-2xl min-w-[140px] text-center backdrop-blur-xl pointer-events-none">
                <h3 className="font-bold text-white text-[10px] uppercase tracking-tighter mb-1">{zone.name}</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${risk.color}`}>
                    LIVE RISK: {risk.label}
                  </span>
                  <span className="text-[7px] text-white/30 font-bold">{risk.value}%</span>
                </div>
                <p className="text-[6px] text-white/40 uppercase tracking-[0.2em] mt-1 font-bold">{zone.state} Grid</p>
              </div>
            </Tooltip>
          </Marker>
        );
      })}

      {hotspots.map((h: any, i: number) => (
        <CircleMarker 
          key={`hotspot-${i}`}
          center={[h.lat, h.lng]}
          radius={3}
          pathOptions={{ color: '#FFB830', fillColor: '#FFB830', fillOpacity: 0.8, stroke: true, weight: 1 }}
        />
      ))}

      {complaints.map((c: any) => (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={icon}>
          <Tooltip direction="top" offset={[0, -20]}>
            <div className="p-2 min-w-[140px] text-center pointer-events-none">
              <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">SITREP DETECTED</span>
              <h3 className="font-bold mt-2 text-white text-[11px] uppercase tracking-tighter leading-tight">{c.description}</h3>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

export default function MapClient(props: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-[#0a0f0a]" />;

  return (
    <MapContainer 
      center={[20.5937, 78.9629]} 
      zoom={5} 
      className="w-full h-full z-0"
      zoomControl={false}
      preferCanvas={true} 
    >
      <MapContent {...props} />
    </MapContainer>
  );
}
