import DynamicText from './components/DynamicText';
import { useTranslation } from 'react-i18next';
import React, { useState, useMemo, useEffect } from 'react';
// { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { formatDistanceToNow } from 'date-fns';

const SUBMISSION_COLORS: Record<string, { color: string, radius: number }> = {
  'DEVELOPMENT_NEED': { color: '#1A237E', radius: 10 },
  'DEVELOPMENT NEED': { color: '#1A237E', radius: 10 },
  'SERVICE_FAILURE': { color: '#E65100', radius: 10 },
  'SERVICE FAILURE': { color: '#E65100', radius: 10 },
  'EMERGENCY': { color: '#C62828', radius: 12 },
};

function ExpandableText({ text }: { text: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return null;
  const isLong = text.length > 60;
  
  return (
    <div className="relative group">
      <DynamicText 
        originalText={text} 
        as="p"
        className={`text-[12px] text-[#3E2723] italic ${!expanded ? 'line-clamp-2' : ''}`}
      />
      {isLong && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-[10px] text-[#FF9933] font-bold uppercase tracking-wider mt-1"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function MarkerWithInfoWindow({ submission, style, isEmergency }: any) {
  const { t } = useTranslation();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);
  const lat = submission.location?.lat || submission.latitude;
  const lng = submission.location?.lng || submission.longitude;
  const type = submission.submission_type || 'DEVELOPMENT_NEED';

  return (
    <>
      <AdvancedMarker ref={markerRef} position={{lat, lng}} onClick={() => setOpen(true)}>
        <Pin background={style.color} glyphColor="#fff" borderColor="#fff" scale={isEmergency ? 1.2 : 0.9} />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="w-[220px] font-sans">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1.5" style={{ backgroundColor: style.color }}>
              {type.replace('_', ' ')}
            </span>
            <p className="font-bold text-[#1A1A2E] text-[13px] leading-tight mb-1">{submission.category}</p>
            <p className="text-[11px] text-[#6B7280] flex items-center gap-1 mb-2">
              📍 {[submission.village_ward, submission.district_en].filter(Boolean).join(', ')}
            </p>
            <ExpandableText text={submission.text_english || submission.text_original} />
            <p className="text-[10px] text-[#9E9E9E] font-medium mt-2">
              🕐 {submission.timestamp ? formatDistanceToNow(new Date(submission.timestamp), {addSuffix: true}) : 'Recently'}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function ThemeMarker({ theme }: any) {
  const { t } = useTranslation();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);
  
  const count = theme.submission_count || theme.actualCount || 1;
  const bubbleColor = count >= 10 ? '#C62828' : count >= 5 ? '#E65100' : '#1A237E';

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        position={{lat: theme.lat, lng: theme.lng}} 
        onClick={() => setOpen(true)}
        zIndex={count}
      >
        <div className="flex flex-col items-center group cursor-pointer hover:z-50 relative mt-2">
          {/* Main Pin Dot */}
          <div className="relative flex items-center justify-center">
            {/* Heat radius */}
            <div 
              className="absolute rounded-full opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
              style={{ 
                width: `${Math.max(40, Math.min(120, count * 8))}px`, 
                height: `${Math.max(40, Math.min(120, count * 8))}px`,
                backgroundColor: bubbleColor 
              }}
            ></div>
            {/* Center dot */}
            <div 
              className="w-4 h-4 rounded-full border-[2.5px] border-white shadow-md relative z-10 transition-transform group-hover:scale-125"
              style={{ backgroundColor: bubbleColor }}
            ></div>
          </div>
          
          {/* Label with white text-shadow to prevent blocky overlapping */}
          <div className="mt-1.5 text-center max-w-[140px] pointer-events-none transition-transform group-hover:scale-110 relative z-20">
            <div 
              className="text-[12px] font-extrabold leading-tight tracking-tight"
              style={{ 
                color: bubbleColor === '#1A237E' ? '#0F172A' : bubbleColor,
                textShadow: '1px 1px 0px rgba(255,255,255,0.9), -1px -1px 0px rgba(255,255,255,0.9), 1px -1px 0px rgba(255,255,255,0.9), -1px 1px 0px rgba(255,255,255,0.9), 0px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {theme.group_name || theme.theme_name}
            </div>
            <div 
              className="text-[10px] font-black"
              style={{ 
                color: bubbleColor,
                textShadow: '1px 1px 0px rgba(255,255,255,0.9), -1px -1px 0px rgba(255,255,255,0.9), 1px -1px 0px rgba(255,255,255,0.9), -1px 1px 0px rgba(255,255,255,0.9)'
              }}
            >
              ({count} issues)
            </div>
          </div>
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="w-[220px] font-sans">
            <h3 className="font-bold text-[14px] text-[#1A237E] mb-2 leading-tight">{theme.group_name || theme.theme_name}</h3>
            <div className="flex flex-col gap-1.5 mb-2">
              <p className="text-[12px] font-medium text-[#3E2723]">
                👥 {count} community voices
              </p>
              {theme.districts_affected && theme.districts_affected.length > 0 && (
                <p className="text-[11px] text-[#6B7280]">
                  📍 {theme.districts_affected.join(', ')}
                </p>
              )}
            </div>
            
            {theme.evidence_strength && (
              <div className="bg-[#F8F5F0] rounded p-2 mb-2">
                <span className="text-[10px] uppercase text-[#6B7280] font-bold block mb-0.5">{String(t("Evidence"))}</span>
                <span className="text-[12px] font-medium text-[#1A1A2E]">{theme.evidence_strength}</span>
              </div>
            )}
            
            {theme.relevant_scheme && (
              <div className="bg-[#E3F2FD] rounded p-2">
                <span className="text-[10px] uppercase text-[#1565C0] font-bold block mb-0.5">{String(t("Scheme"))}</span>
                <span className="text-[11px] font-medium text-[#1A1A2E] leading-tight block">{theme.relevant_scheme}</span>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function MapTab({ submissions, themesData, selectedConstituency }: { submissions: any[], themesData: any, selectedConstituency?: string }) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'individual' | 'themes'>('individual');
  const [filters, setFilters] = useState<Set<string>>(new Set(['All']));
  const [mapCenter, setMapCenter] = useState({lat: 26.2006, lng: 92.9376});
  const [mapZoom, setMapZoom] = useState(7);

  // Safe environment variable access for Vite
  const getApiKey = () => {
    try { if (process.env.GOOGLE_MAPS_PLATFORM_KEY) return process.env.GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    try { if ((import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY) return (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    try { if (typeof globalThis !== 'undefined' && (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY) return (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    return '';
  };
  const API_KEY = getApiKey();
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  const toggleFilter = (f: string) => {
    const next = new Set(filters);
    if (f === 'All') {
      next.clear();
      next.add('All');
    } else {
      next.delete('All');
      if (next.has(f)) next.delete(f);
      else next.add(f);
      
      if (next.size === 0) next.add('All');
    }
    setFilters(next);
  };

  const mapSubmissions = useMemo(() => {
    return submissions.filter(s => {
      if (!s.location?.lat || !s.location?.lng) {
        if (!s.latitude || !s.longitude) return false;
      }
      
      const type = s.submission_type || 'DEVELOPMENT_NEED';
      
      if (filters.has('All')) return true;
      if (filters.has('DEVELOPMENT_NEED') && (type === 'DEVELOPMENT_NEED' || type === 'DEVELOPMENT NEED')) return true;
      if (filters.has('SERVICE_FAILURE') && (type === 'SERVICE_FAILURE' || type === 'SERVICE FAILURE')) return true;
      if (filters.has('EMERGENCY') && type === 'EMERGENCY') return true;
      
      return false;
    });
  }, [submissions, filters]);

  const themesWithLocations = useMemo(() => {
    if (!themesData?.groups) return [];
    return themesData.groups.map((g: any) => {
      const devSubs = submissions.filter(s => s.submission_type === 'DEVELOPMENT_NEED' || s.submission_type === 'DEVELOPMENT NEED');
      
      let themeSubmissions = [];
      if (g.submission_ids && Array.isArray(g.submission_ids)) {
        themeSubmissions = devSubs.filter(s => 
          g.submission_ids.includes(s.id) && 
          ((s.location?.lat && s.location?.lng) || (s.latitude && s.longitude))
        );
      } else {
        const groupNameLower = g.group_name.toLowerCase();
        themeSubmissions = devSubs.filter(s => {
          if (!s.location?.lat && !s.latitude) return false;
          
          const textLower = (s.text_english || s.text_original || '').toLowerCase();
          const keywords = groupNameLower.split(' ').filter((w: string) => w.length > 3);
          return keywords.some((w: string) => textLower.includes(w)) || (s.tags && s.tags.some((t: string) => t.toLowerCase().includes(keywords[0])));
        });
      }

      if (themeSubmissions.length === 0) return null;
      
      const sumLat = themeSubmissions.reduce((sum, s) => sum + (s.location?.lat || s.latitude), 0);
      const sumLng = themeSubmissions.reduce((sum, s) => sum + (s.location?.lng || s.longitude), 0);
      
      return {
        ...g,
        lat: sumLat / themeSubmissions.length,
        lng: sumLng / themeSubmissions.length,
        actualCount: themeSubmissions.length
      };
    }).filter(Boolean);
  }, [themesData, submissions]);

  const mappedCount = mapSubmissions.length;
  const totalWithCoords = submissions.filter(s => (s.location?.lat && s.location?.lng) || (s.latitude && s.longitude)).length;

  let center = {lat: 26.2006, lng: 92.9376};
  let zoom = 7;
  
  if (selectedConstituency === '— All India (Overview) —') {
    center = {lat: 22.5937, lng: 78.9629};
    zoom = 5;
  } else if (selectedConstituency === '— All Assam (Overview) —') {
    center = {lat: 26.2006, lng: 92.9376};
    zoom = 7;
  } else if (selectedConstituency) {
    const activeData = viewMode === 'individual' ? mapSubmissions : themesWithLocations;
    if (activeData.length > 0) {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      activeData.forEach(s => {
        const lat = s.lat || s.location?.lat || s.latitude;
        const lng = s.lng || s.location?.lng || s.longitude;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      });
      center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
      zoom = 10;
    }
  }

  // Effect to update map when constituency or mode changes
  useEffect(() => {
    setMapCenter(center);
    setMapZoom(zoom);
  }, [selectedConstituency, viewMode, center.lat, center.lng, zoom]);


  return (
    <div className="flex flex-col h-full bg-[#F8F5F0]">
      {/* CONTROLS BAR */}
      <div className="w-full bg-[#FFFFFF] px-4 py-3 border-b border-[#F0EDE8] shadow-[0_2px_8px_rgba(0,0,0,0.06)] z-10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex bg-[#FDF6E3] rounded-[20px] p-0.5 border border-[#E8DCC8]">
            <button 
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-[20px] text-[13px] font-bold transition-colors ${viewMode === 'individual' ? 'bg-[#FF9933] text-white shadow-sm' : 'bg-transparent text-[#6B7280] hover:text-[#3E2723]'}`}
            >{String(t(" 📍 Submissions "))}</button>
            <button 
              onClick={() => setViewMode('themes')}
              className={`px-4 py-2 rounded-[20px] text-[13px] font-bold transition-colors ${viewMode === 'themes' ? 'bg-[#FF9933] text-white shadow-sm' : 'bg-transparent text-[#6B7280] hover:text-[#3E2723]'}`}
            >{String(t(" 🔍 Themes "))}</button>
          </div>
        </div>

        {viewMode === 'individual' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Development Need', 'Service Failure', 'Emergency'].map(f => {
              const filterKey = f === 'All' ? 'All' : f.toUpperCase().replace(' ', '_');
              const isActive = filters.has(filterKey);
              
              let colorCls = 'bg-white text-[#6B7280] border-[#E0E0E0]';
              if (isActive) {
                 if (filterKey === 'All') colorCls = 'bg-[#4B5563] text-white border-[#4B5563]';
                 else if (filterKey === 'DEVELOPMENT_NEED') colorCls = 'bg-[#1A237E] text-white border-[#1A237E]';
                 else if (filterKey === 'SERVICE_FAILURE') colorCls = 'bg-[#E65100] text-white border-[#E65100]';
                 else if (filterKey === 'EMERGENCY') colorCls = 'bg-[#C62828] text-white border-[#C62828]';
              }
              
              return (
                <button 
                  key={f}
                  onClick={() => toggleFilter(filterKey)}
                  className={`shrink-0 px-3 py-1.5 text-[12px] font-bold rounded-full border transition-colors ${colorCls}`}
                >
                  {f} {f === 'Emergency' ? '🔴' : f === 'Service Failure' ? '🟠' : f === 'Development Need' ? '🔵' : ''}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* MAP AREA */}
      <div className="relative w-full z-0" style={{ height: 'calc(100vh - 220px)' }}>
        {totalWithCoords === 0 ? (
          <div className="absolute inset-0 bg-[#F8F5F0] z-10 flex flex-col items-center justify-center text-center px-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8DCC8] max-w-sm">
                <span className="text-4xl mb-3 block">{String(t("📍"))}</span>
                <h3 className="text-[#1A237E] font-bold text-[16px] mb-2">{String(t("No GPS data yet"))}</h3>
                <p className="text-[#6B7280] text-[13px] mb-4">{String(t("📍 submissions with GPS will appear here."))}</p>
                <div className="bg-[#FFF3E0] p-3 rounded-lg border border-[#FFCC80]">
                  <p className="text-[#E65100] text-[12px] font-medium">{String(t("Citizens must select \"Yes — Use My Location\" when submitting."))}</p>
                </div>
             </div>
          </div>
        ) : !hasValidKey ? (
          <div className="absolute inset-0 bg-[#F8F5F0] z-10 flex flex-col items-center justify-center text-center px-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8DCC8] max-w-sm">
                <h3 className="text-[#1A237E] font-bold text-[16px] mb-2">{String(t("Google Maps Configuration Required"))}</h3>
                <p className="text-[#6B7280] text-[13px] mb-4 text-left">{String(t(" Please add your Google Maps Platform API key in the AI Studio environment variables to display the map. (Settings → Secrets → GOOGLE_MAPS_PLATFORM_KEY) "))}</p>
                <div className="bg-[#FFF3E0] p-3 rounded-lg border border-[#FFCC80] text-left">
                  <p className="text-[#E65100] text-[12px] font-medium mb-1">{String(t("Important: Required APIs"))}</p>
                  <p className="text-[#E65100] text-[11px]">{String(t(" To ensure address search, location pinning, and map rendering function correctly, you must enable the following APIs in your Google Cloud Console: "))}</p>
                  <ul className="list-disc list-inside text-[#E65100] text-[11px] mt-1 ml-1">
                    <li>{String(t("Maps JavaScript API"))}</li>
                    <li>{String(t("Places API"))}</li>
                    <li>{String(t("Geocoding API"))}</li>
                  </ul>
                </div>
             </div>
          </div>
        ) : (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={mapCenter}
              center={mapCenter}
              defaultZoom={mapZoom}
              zoom={mapZoom}
              onCameraChanged={(ev) => {
                setMapCenter(ev.detail.center);
                setMapZoom(ev.detail.zoom);
              }}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{width: '100%', height: '100%'}}
              gestureHandling="greedy"
              disableDefaultUI={false}
              zoomControl={true}
              mapTypeControl={true}
              streetViewControl={true}
              fullscreenControl={true}
            >
              {viewMode === 'individual' && mapSubmissions.map((s, index) => {
                const type = s.submission_type || 'DEVELOPMENT_NEED';
                const style = SUBMISSION_COLORS[type] || SUBMISSION_COLORS['DEVELOPMENT_NEED'];
                const isEmergency = type === 'EMERGENCY';
                return <MarkerWithInfoWindow key={s.id || index} submission={s} style={style} isEmergency={isEmergency} />;
              })}

              {viewMode === 'themes' && themesWithLocations.map((t:any, index) => (
                <ThemeMarker key={index} theme={t} />
              ))}
            </Map>
          </APIProvider>
        )}

        {totalWithCoords > 0 && (
          <div className="absolute bottom-6 right-2 bg-white rounded-lg p-3 shadow-[0_2px_8px_rgba(0,0,0,0.1)] z-10 pointer-events-none">
            <div className="flex flex-col gap-2 font-medium text-[#1A1A2E] text-[11px]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1A237E]"></div>{String(t(" Development Need"))}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#E65100]"></div>{String(t(" Service Failure"))}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#C62828] animate-pulse"></div>{String(t(" Emergency"))}</div>
            </div>
          </div>
        )}
      </div>

      {/* STATS STRIP BELOW MAP */}
      <div className="w-full bg-[#FFFFFF] px-4 py-2.5 border-t border-[#F0EDE8] shrink-0">
        <div className="flex items-center justify-between text-[12px] text-[#6B7280] font-medium max-w-2xl mx-auto">
          <span>📍 {mappedCount} submissions mapped</span>
          <span className="text-slate-300">{String(t("|"))}</span>
          <span>🔍 {themesWithLocations.length} themes identified</span>
        </div>
      </div>
    </div>
  );
}
