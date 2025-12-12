'use client';

import { useMemo } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in production
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default marker icon
const DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Brazil's geographic center coordinates
export const BRAZIL_CENTER: LatLngTuple = [-14.235, -51.9253];
export const DEFAULT_ZOOM = 4;

export interface MapMarker {
  position: LatLngTuple;
  popup?: string;
  title?: string;
}

export interface MapContainerProps {
  /**
   * Center coordinates for the map
   * @default Brazil's geographic center [-14.235, -51.9253]
   */
  center?: LatLngExpression;

  /**
   * Initial zoom level
   * @default 4
   */
  zoom?: number;

  /**
   * Map height in CSS units
   * @default "400px"
   */
  height?: string;

  /**
   * Map width in CSS units
   * @default "100%"
   */
  width?: string;

  /**
   * Array of markers to display on the map
   */
  markers?: MapMarker[];

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Enable scroll wheel zoom
   * @default true
   */
  scrollWheelZoom?: boolean;

  /**
   * Enable dragging
   * @default true
   */
  dragging?: boolean;
}

/**
 * MapContainer component - A wrapper around react-leaflet's MapContainer
 *
 * This component provides a base map configuration with Brazil's geographic center
 * as the default location. It handles SSR issues by being dynamically imported
 * in components that use it.
 *
 * @example
 * ```tsx
 * import dynamic from 'next/dynamic';
 *
 * const MapContainer = dynamic(
 *   () => import('@/components/molecules/MapContainer').then(mod => mod.MapContainer),
 *   { ssr: false, loading: () => <div>Loading map...</div> }
 * );
 *
 * function MyComponent() {
 *   return (
 *     <MapContainer
 *       center={[-23.5505, -46.6333]} // São Paulo
 *       zoom={12}
 *       markers={[{
 *         position: [-23.5505, -46.6333],
 *         popup: "São Paulo"
 *       }]}
 *     />
 *   );
 * }
 * ```
 */
export function MapContainer({
  center = BRAZIL_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '400px',
  width = '100%',
  markers = [],
  className = '',
  scrollWheelZoom = true,
  dragging = true,
}: MapContainerProps) {
  // Memoize map container style to prevent unnecessary re-renders
  const mapStyle = useMemo(
    () => ({
      height,
      width,
    }),
    [height, width]
  );

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        dragging={dragging}
        style={mapStyle}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position} title={marker.title}>
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}
      </LeafletMapContainer>
    </div>
  );
}

export default MapContainer;
