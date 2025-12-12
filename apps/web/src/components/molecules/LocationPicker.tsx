'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon, LatLng, LeafletMouseEvent, Map as LeafletMap } from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

/**
 * Location data structure
 */
export interface LocationData {
  latitude: number;
  longitude: number;
}

/**
 * Props for the LocationPicker component
 */
export interface LocationPickerProps {
  /**
   * Current latitude value (controlled)
   */
  latitude?: number | null;

  /**
   * Current longitude value (controlled)
   */
  longitude?: number | null;

  /**
   * Callback fired when location changes
   * Used to update form values via React Hook Form setValue
   */
  onChange?: (location: LocationData) => void;

  /**
   * Optional custom height for the map container
   * @default "400px"
   */
  height?: string;

  /**
   * Optional custom width for the map container
   * @default "100%"
   */
  width?: string;

  /**
   * Optional custom CSS class name
   */
  className?: string;
}

/**
 * Configure Leaflet default marker icon
 * This fixes the marker icon issue in production builds
 */
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Default center coordinates (Brazil's geographic center)
 */
const DEFAULT_CENTER: [number, number] = [-14.235, -51.9253];
const DEFAULT_ZOOM = 4;

/**
 * Component that handles map click events and marker placement
 */
interface MapClickHandlerProps {
  position: LatLng | null;
  onPositionChange: (position: LatLng) => void;
}

function MapClickHandler({ position, onPositionChange }: MapClickHandlerProps) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPositionChange(e.latlng);
    },
  });

  return position ? (
    <Marker
      position={position}
      icon={defaultIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          onPositionChange(newPosition);
        },
      }}
    />
  ) : null;
}

/**
 * Component to add search control to the map
 */
interface SearchControlProps {
  onLocationFound: (location: LatLng) => void;
}

function SearchControl({ onLocationFound }: SearchControlProps) {
  const map = useMapEvents({});
  const searchControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || searchControlRef.current) return;

    // Create search provider
    const provider = new OpenStreetMapProvider();

    // Create search control
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: 'bar',
      showMarker: false, // We'll handle the marker ourselves
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: 'Digite um endereço...',
    });

    // Add control to map
    map.addControl(searchControl);
    searchControlRef.current = searchControl;

    // Listen to geosearch results
    map.on('geosearch/showlocation', (result: any) => {
      const { x, y } = result.location;
      const newPosition = new LatLng(y, x);
      onLocationFound(newPosition);
    });

    // Cleanup
    return () => {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current);
        searchControlRef.current = null;
      }
    };
  }, [map, onLocationFound]);

  return null;
}

/**
 * LocationPicker Component
 *
 * An interactive map component for selecting geographic coordinates.
 * Features:
 * - Click on map to place a marker
 * - Drag the marker to adjust position
 * - Search for addresses using the search box
 * - Real-time coordinate display
 * - Integrates with React Hook Form
 *
 * @example
 * ```tsx
 * // With React Hook Form
 * import { useForm } from 'react-hook-form';
 * import { LocationPicker } from '@/components/molecules';
 *
 * function MyForm() {
 *   const { watch, setValue } = useForm();
 *   const latitude = watch('latitude');
 *   const longitude = watch('longitude');
 *
 *   return (
 *     <LocationPicker
 *       latitude={latitude}
 *       longitude={longitude}
 *       onChange={({ latitude, longitude }) => {
 *         setValue('latitude', latitude);
 *         setValue('longitude', longitude);
 *       }}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Standalone usage
 * import { LocationPicker } from '@/components/molecules';
 *
 * function MyComponent() {
 *   const [location, setLocation] = useState({ latitude: -23.5505, longitude: -46.6333 });
 *
 *   return (
 *     <LocationPicker
 *       latitude={location.latitude}
 *       longitude={location.longitude}
 *       onChange={setLocation}
 *       height="500px"
 *     />
 *   );
 * }
 * ```
 */
export function LocationPicker({
  latitude,
  longitude,
  onChange,
  height = '400px',
  width = '100%',
  className = '',
}: LocationPickerProps) {
  // Convert form values to LatLng position
  const [position, setPosition] = useState<LatLng | null>(() => {
    if (latitude != null && longitude != null) {
      return new LatLng(latitude, longitude);
    }
    return null;
  });

  // Update position when props change
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setPosition(new LatLng(latitude, longitude));
    } else {
      setPosition(null);
    }
  }, [latitude, longitude]);

  // Handle position changes (click, drag, search)
  const handlePositionChange = (newPosition: LatLng) => {
    setPosition(newPosition);

    if (onChange) {
      onChange({
        latitude: Number(newPosition.lat.toFixed(8)),
        longitude: Number(newPosition.lng.toFixed(8)),
      });
    }
  };

  // Determine map center
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : DEFAULT_CENTER;

  const zoom = position ? 13 : DEFAULT_ZOOM;

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          position={position}
          onPositionChange={handlePositionChange}
        />

        <SearchControl onLocationFound={handlePositionChange} />
      </MapContainer>

      {/* Coordinates Display */}
      {position && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-1">
            Coordenadas
          </div>
          <div className="text-sm font-mono text-gray-900 space-y-0.5">
            <div>
              <span className="text-gray-600">Lat:</span>{' '}
              <span className="font-medium">{position.lat.toFixed(6)}°</span>
            </div>
            <div>
              <span className="text-gray-600">Lng:</span>{' '}
              <span className="font-medium">{position.lng.toFixed(6)}°</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Overlay - only shown when no position is set */}
      {!position && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 rounded-lg shadow-md p-3 z-[1000] max-w-xs">
          <div className="text-sm text-blue-900 text-center">
            <p className="font-semibold mb-1">Como selecionar a localização:</p>
            <ul className="text-xs space-y-1 text-left">
              <li>• Clique no mapa para marcar</li>
              <li>• Arraste o marcador para ajustar</li>
              <li>• Use a busca para encontrar endereços</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
