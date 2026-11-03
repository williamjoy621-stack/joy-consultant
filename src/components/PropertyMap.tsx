import React, { useState, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { PropertyItem } from '../types.ts';
import { MapPin, Compass, ArrowUpRight } from 'lucide-react';

interface PropertyMarkerItemProps {
  property: PropertyItem;
  isSelected: boolean;
  onSelect: (property: PropertyItem) => void;
  onInspect: (property: PropertyItem) => void;
}

const PropertyMarkerItem: React.FC<PropertyMarkerItemProps> = ({
  property,
  isSelected,
  onSelect,
  onInspect,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const lat = parseFloat(property.coordinatesLat) || 6.4589;
  const lng = parseFloat(property.coordinatesLng) || 3.7845;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat, lng }}
        title={property.title}
        onClick={() => onSelect(property)}
      >
        <Pin
          background={isSelected ? '#C59B27' : '#0B192C'}
          borderColor={'#FFFFFF'}
          glyphColor={isSelected ? '#0B192C' : '#C59B27'}
          scale={isSelected ? 1.25 : 1.05}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={290}
          onCloseClick={() => onSelect(property)}
        >
          <div className="p-1 text-[#0B192C]">
            <div className="text-[11px] font-mono-tabular text-slate-500">
              {property.referenceCode} · {property.sizeSqm} sqm
            </div>
            <h4 className="font-semibold text-sm mt-0.5 leading-snug">
              {property.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1">{property.location}</p>
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <span className="font-mono-tabular font-bold text-xs text-[#0B192C]">
                ₦{Number(property.priceNgn).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => onInspect(property)}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#0B192C] text-white rounded hover:bg-[#162B49] transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                Inspect Land
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

interface PropertyMapProps {
  properties: PropertyItem[];
  onInspectProperty: (property: PropertyItem) => void;
  showOfficePin?: boolean;
  heightClass?: string;
}

const OFFICE_COORDS = {
  lat: 6.4281,
  lng: 3.4219,
  title: 'JOY CONSULTANT Head Office — Plot 1420 Adeola Odeku St, Victoria Island, Lagos',
};

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  onInspectProperty,
  showOfficePin = false,
  heightClass = 'h-[440px]',
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [selectedId, setSelectedId] = useState<number | null>(
    properties[0]?.id ?? null
  );
  const [officeMarkerRef, officeMarker] = useAdvancedMarkerRef();
  const [officeInfoOpen, setOfficeInfoOpen] = useState(showOfficePin);

  const handleSelectProperty = useCallback((prop: PropertyItem) => {
    setSelectedId((prev) => (prev === prop.id ? null : prop.id));
  }, []);

  const defaultCenter = showOfficePin
    ? { lat: OFFICE_COORDS.lat, lng: OFFICE_COORDS.lng }
    : {
        lat: parseFloat(properties[0]?.coordinatesLat || '6.4589'),
        lng: parseFloat(properties[0]?.coordinatesLng || '3.7845'),
      };

  if (!apiKey) {
    return (
      <div
        className={`w-full ${heightClass} rounded-xl border border-slate-200 bg-[#0B192C] text-white p-6 flex flex-col justify-between`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono-tabular text-[#C59B27]">
            CADASTRAL GEOSPATIAL DIRECTORY
          </span>
          <Compass className="w-5 h-5 text-[#C59B27]" />
        </div>
        <div className="my-auto max-w-md">
          <h4 className="text-xl font-serif-display font-semibold">
            Verified Coordinates Across Nigerian Growth Corridors
          </h4>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Every listed parcel includes verified Surveyor-General coordinates.
            Select any land parcel below to view its GPS location and title registry details.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
          {properties.slice(0, 3).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onInspectProperty(p)}
              className="text-left p-2.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="font-mono-tabular text-[#C59B27]">{p.referenceCode}</div>
              <div className="font-medium truncate mt-0.5">{p.title}</div>
              <div className="text-[11px] text-slate-400 font-mono-tabular mt-0.5">
                {p.coordinatesLat}°N, {p.coordinatesLng}°E
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100`}>
      <APIProvider apiKey={apiKey} libraries={['marker']}>
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={defaultCenter}
          defaultZoom={showOfficePin ? 11 : 7}
          gestureHandling="cooperative"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {showOfficePin && (
            <>
              <AdvancedMarker
                ref={officeMarkerRef}
                position={{ lat: OFFICE_COORDS.lat, lng: OFFICE_COORDS.lng }}
                title={OFFICE_COORDS.title}
                onClick={() => setOfficeInfoOpen((v) => !v)}
              >
                <Pin
                  background="#C59B27"
                  borderColor="#0B192C"
                  glyphColor="#0B192C"
                  scale={1.3}
                />
              </AdvancedMarker>
              {officeInfoOpen && officeMarker && (
                <InfoWindow
                  anchor={officeMarker}
                  maxWidth={260}
                  onCloseClick={() => setOfficeInfoOpen(false)}
                >
                  <div className="p-1 text-[#0B192C]">
                    <div className="text-[11px] font-mono-tabular text-[#C59B27] font-semibold">
                      CORPORATE HEADQUARTERS
                    </div>
                    <div className="font-semibold text-xs mt-0.5">
                      JOY CONSULTANT Advisory HQ
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Plot 1420 Adeola Odeku Street, Victoria Island, Lagos, Nigeria
                    </p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {properties.map((prop) => (
            <PropertyMarkerItem
              key={prop.id}
              property={prop}
              isSelected={selectedId === prop.id}
              onSelect={handleSelectProperty}
              onInspect={onInspectProperty}
            />
          ))}
        </GoogleMap>
      </APIProvider>

      {/* Quick Coordinate Jump Bar */}
      <div className="absolute bottom-3 left-3 right-3 bg-[#0B192C]/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center justify-between gap-3 text-xs overflow-x-auto">
        <span className="text-slate-300 whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
          <span>Active Survey Pins ({properties.length})</span>
        </span>
        <div className="flex items-center gap-2 overflow-x-auto">
          {properties.slice(0, 4).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                selectedId === p.id
                  ? 'bg-[#C59B27] text-[#0B192C] font-semibold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {p.referenceCode} · {p.city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
