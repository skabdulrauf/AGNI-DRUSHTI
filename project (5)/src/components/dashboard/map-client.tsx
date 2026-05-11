"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, LayersControl, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for default marker icons
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom user location icon
const userIcon = L.divIcon({
  html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse ring-4 ring-blue-500/30"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Custom Zone Icon
const zoneIcon = (color: string) => L.divIcon({
  html: `<div class="w-8 h-8 rounded-full border-4 border-white/20 shadow-2xl flex items-center justify-center transition-all hover:scale-125" style="background-color: ${color}; box-shadow: 0 0 20px ${color}80">
          <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  className: 'marker-pulse',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function SetViewOnSelect({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 9, { animate: true });
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
      <Popup className="custom-popup">
        <div className="p-1 font-bold text-blue-400">Your Current Location</div>
      </Popup>
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
    <div className="absolute bottom-24 left-3 z-[1000]">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={handleLocate}
        className={`glass-panel border-white/10 hover:bg-white/20 transition-all h-10 w-10 ${isLocating ? 'text-primary scale-110 shadow-[0_0_15px_rgba(255,92,26,0.3)]' : 'text-white'}`}
      >
        <LocateFixed className="w-5 h-5" />
      </Button>
    </div>
  );
}

export default function MapClient({ zones, hotspots, complaints, onZoneSelect, selectedZoneCenter }: any) {
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
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CARTO'
      />

      <LayersControl position="bottomleft">
        <LayersControl.BaseLayer checked name="Dark Matter">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Satellite View">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Street Map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      <ZoomControl position="bottomleft" />
      <LocateControl />
      <LocationMarker />
      
      {selectedZoneCenter && <SetViewOnSelect center={selectedZoneCenter} />}

      {/* Zone Markers */}
      {zones.map((zone: any) => (
        <Marker 
          key={zone.id}
          position={[zone.lat, zone.lng]}
          icon={zoneIcon('#FF5C1A')}
          eventHandlers={{
            click: () => onZoneSelect(zone)
          }}
        >
          <Popup className="custom-popup" closeButton={false}>
            <div className="p-2 text-center">
              <h3 className="font-bold text-white text-[10px]">{zone.name}</h3>
              <p className="text-[8px] text-primary font-bold uppercase tracking-widest mt-1">Interdiction Active</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* NASA FIRMS Hotspots */}
      {hotspots.map((h: any, i: number) => (
        <CircleMarker 
          key={`hotspot-${i}`}
          center={[h.lat, h.lng]}
          radius={2.5}
          pathOptions={{ 
            color: '#FFB830', 
            fillColor: '#FFB830', 
            fillOpacity: 0.7,
            stroke: false
          }}
        />
      ))}

      {/* Citizen Complaints */}
      {complaints.map((c: any) => (
        <Marker 
          key={c.id} 
          position={[c.lat, c.lng]} 
          icon={icon}
        >
          <Popup className="custom-popup">
            <div className="p-2 min-w-[120px]">
              <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">CITIZEN INTEL</span>
              <h3 className="font-bold mt-1 text-white text-[10px]">{c.description}</h3>
              <p className="text-[8px] text-white/50 mt-1 uppercase">Status: <span className="text-primary font-bold">{c.status}</span></p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
