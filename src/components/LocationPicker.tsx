import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface LocationPickerProps {
  initialCenter: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
  highContrast?: boolean;
  searchContext?: {
    state: string;
    district: string;
  }
}

export function LocationPicker({ initialCenter, onLocationSelect, highContrast, searchContext }: LocationPickerProps) {
  const { t } = useTranslation();
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({lat: initialCenter[0], lng: initialCenter[1]});
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Safe environment variable access for Vite
  const getApiKey = () => {
    try { if (process.env.GOOGLE_MAPS_PLATFORM_KEY) return process.env.GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    try { if ((import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY) return (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    try { if (typeof globalThis !== 'undefined' && (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY) return (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    return '';
  };
  const API_KEY = getApiKey();
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  useEffect(() => {
    setMapCenter({lat: initialCenter[0], lng: initialCenter[1]});
    setMapZoom(14);
  }, [initialCenter]);

  const handleSelect = (lat: number, lng: number) => {
    setPosition({lat, lng});
    onLocationSelect(lat, lng);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    
    let query = searchQuery;
    if (searchContext?.district && !query.toLowerCase().includes(searchContext.district.toLowerCase())) {
       query += `, ${searchContext.district}`;
    }
    if (searchContext?.state && !query.toLowerCase().includes(searchContext.state.toLowerCase())) {
       query += `, ${searchContext.state}`;
    }
    if (!query.toLowerCase().includes('india')) {
       query += ', India';
    }

    try {
      // Use internal geocode API to proxy the Google Maps Geocoding request
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.lat && data.lng) {
        setMapCenter({ lat: data.lat, lng: data.lng });
        setMapZoom(15);
      } else {
        // Fallback to nominatim if Google Maps fails or is not configured
        const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData && fallbackData.length > 0) {
          const lat = parseFloat(fallbackData[0].lat);
          const lon = parseFloat(fallbackData[0].lon);
          setMapCenter({ lat, lon });
          setMapZoom(15);
        } else {
          setSearchError("Location not found.");
        }
      }
    } catch (error) {
      console.error(error);
      setSearchError("Error searching location.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (navigator.geolocation) {
              setIsSearching(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  setMapZoom(16);
                  setIsSearching(false);
                },
                (err) => {
                  console.error(err);
                  setSearchError("Could not access your location. Please check browser permissions.");
                  setIsSearching(false);
                }
              );
            } else {
              setSearchError("Geolocation is not supported by your browser.");
            }
          }}
          className="bg-[#FF9933] text-white p-3 rounded-xl hover:bg-[#E68A2E] transition-colors flex items-center justify-center shrink-0"
          title="Use my current location"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e as unknown as React.FormEvent);
            }
          }}
          placeholder={t("Search map for location...")}
          className={`flex-1 rounded-xl p-3 h-[42px] focus:outline-none border text-sm ${highContrast ? "bg-black border-yellow-400 text-yellow-400" : "bg-[#FFFEF7] border-[#C8B99A] text-[#3E2723]"}`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-[#1A237E] text-white px-4 rounded-xl text-sm font-bold disabled:bg-[#9E9E9E]"
        >
          {isSearching ? "..." : "Search"}
        </button>
      </div>
      {searchError && (
        <p className="text-xs text-red-600 font-bold">{searchError}</p>
      )}

      <div className="w-full h-[300px] rounded-xl overflow-hidden border-2 border-[#C8B99A] z-0 relative">
        {!hasValidKey ? (
           <div className="absolute inset-0 bg-[#F8F5F0] z-10 flex flex-col items-center justify-center text-center px-4 overflow-y-auto py-4">
              <h3 className="text-[#1A237E] font-bold text-[14px] mb-2">Map Unavailable</h3>
              <p className="text-[#6B7280] text-[12px] mb-4">Please add Google Maps API Key to settings.</p>
              <div className="bg-[#FFF3E0] p-3 rounded-lg border border-[#FFCC80] text-left max-w-[90%]">
                <p className="text-[#E65100] text-[11px] font-medium mb-1">Important: Required APIs</p>
                <p className="text-[#E65100] text-[10px]">
                  Enable the following APIs in Google Cloud Console:
                </p>
                <ul className="list-disc list-inside text-[#E65100] text-[10px] mt-1 ml-1">
                  <li>Maps JavaScript API</li>
                  <li>Places API</li>
                  <li>Geocoding API</li>
                </ul>
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
              mapId="LOCATION_PICKER_MAP"
              onClick={(e) => {
                 if (e.detail.latLng) {
                   handleSelect(e.detail.latLng.lat, e.detail.latLng.lng);
                 }
              }}
              gestureHandling="greedy"
              disableDefaultUI={false}
              zoomControl={true}
              style={{ height: '100%', width: '100%' }}
            >
              {position && (
                <AdvancedMarker position={position}>
                  <Pin background={highContrast ? '#FFD700' : '#D32F2F'} glyphColor="#fff" borderColor="#fff" />
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        )}
        <div className="absolute top-2 left-2 z-[10] bg-white/90 px-3 py-1.5 rounded-lg shadow text-xs font-bold text-[#3E2723] pointer-events-none">
          Click on the map to place pin
        </div>
      </div>
    </div>
  );
}
