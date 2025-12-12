'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import {
  BRAZILIAN_STATE_LABELS,
  type FacilityAddressFormData,
} from '@/schemas/facility-address.schema';

/**
 * Props for the FacilityLocationDisplay component
 */
export interface FacilityLocationDisplayProps {
  /**
   * Address data to display
   */
  address: Partial<FacilityAddressFormData>;

  /**
   * Optional custom CSS class name
   */
  className?: string;

  /**
   * Optional custom height for the map
   * @default "300px"
   */
  mapHeight?: string;

  /**
   * Show map alongside address (responsive)
   * @default true
   */
  showMap?: boolean;
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
 * Format CEP for display (ensures hyphen)
 */
const formatCEPDisplay = (cep?: string): string => {
  if (!cep) return '';
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cep;
};

/**
 * FacilityLocationDisplay Component
 *
 * A read-only component for displaying facility address and location on a map.
 * Features:
 * - Formatted address display with all fields
 * - Static map with marker at facility coordinates
 * - "Open in Google Maps" link
 * - Responsive layout (stacked on mobile, side-by-side on desktop)
 * - Graceful handling of missing data
 *
 * @example
 * ```tsx
 * import { FacilityLocationDisplay } from '@/components/molecules';
 *
 * function FacilityDetail() {
 *   const address = {
 *     street: 'Av. Paulista',
 *     number: '1578',
 *     complement: 'Andar 15',
 *     neighborhood: 'Bela Vista',
 *     city: 'São Paulo',
 *     state: 'SP',
 *     postal_code: '01310-200',
 *     country: 'Brasil',
 *     latitude: -23.5613,
 *     longitude: -46.6563,
 *   };
 *
 *   return <FacilityLocationDisplay address={address} />;
 * }
 * ```
 *
 * @example Without map
 * ```tsx
 * <FacilityLocationDisplay address={address} showMap={false} />
 * ```
 *
 * @example Custom styling
 * ```tsx
 * <FacilityLocationDisplay
 *   address={address}
 *   className="shadow-lg"
 *   mapHeight="400px"
 * />
 * ```
 */
export function FacilityLocationDisplay({
  address,
  className = '',
  mapHeight = '300px',
  showMap = true,
}: FacilityLocationDisplayProps) {
  // Check if we have valid coordinates
  const hasCoordinates =
    address.latitude != null &&
    address.longitude != null &&
    !isNaN(address.latitude) &&
    !isNaN(address.longitude);

  // Generate Google Maps URL
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`
    : null;

  // Check if we have any address data to display
  const hasAddressData =
    address.street ||
    address.number ||
    address.neighborhood ||
    address.city ||
    address.state ||
    address.postal_code;

  if (!hasAddressData && !hasCoordinates) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Endereço não disponível
      </div>
    );
  }

  // Build formatted address lines
  const addressLines: string[] = [];

  // Line 1: Street, Number, Complement
  if (address.street || address.number) {
    const line1Parts: string[] = [];
    if (address.street) line1Parts.push(address.street);
    if (address.number) line1Parts.push(address.number);
    if (address.complement) line1Parts.push(address.complement);
    addressLines.push(line1Parts.join(', '));
  }

  // Line 2: Neighborhood
  if (address.neighborhood) {
    addressLines.push(address.neighborhood);
  }

  // Line 3: City - State, CEP
  if (address.city || address.state || address.postal_code) {
    const line3Parts: string[] = [];
    if (address.city && address.state) {
      const stateLabel = BRAZILIAN_STATE_LABELS[address.state] || address.state;
      line3Parts.push(`${address.city} - ${stateLabel}`);
    } else if (address.city) {
      line3Parts.push(address.city);
    } else if (address.state) {
      const stateLabel = BRAZILIAN_STATE_LABELS[address.state] || address.state;
      line3Parts.push(stateLabel);
    }
    if (address.postal_code) {
      line3Parts.push(formatCEPDisplay(address.postal_code));
    }
    addressLines.push(line3Parts.join(', '));
  }

  // Line 4: Country
  if (address.country) {
    addressLines.push(address.country);
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Responsive Grid: Stacks on mobile, side-by-side on larger screens */}
      <div className={`grid gap-4 ${showMap && hasCoordinates ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Address Display */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="text-sm font-medium text-foreground">Endereço</div>
              {addressLines.map((line, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Google Maps Link */}
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir no Google Maps
            </a>
          )}

          {/* Coordinates (optional, for reference) */}
          {hasCoordinates && (
            <div className="text-xs text-muted-foreground font-mono pt-2 border-t">
              <div>Lat: {address.latitude?.toFixed(6)}°</div>
              <div>Lng: {address.longitude?.toFixed(6)}°</div>
            </div>
          )}
        </div>

        {/* Static Map Display */}
        {showMap && hasCoordinates && (
          <div
            className="rounded-lg overflow-hidden border border-border"
            style={{ height: mapHeight }}
          >
            <MapContainer
              center={[address.latitude!, address.longitude!]}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
              doubleClickZoom={false}
              touchZoom={false}
              keyboard={false}
              attributionControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[address.latitude!, address.longitude!]}
                icon={defaultIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Localização da Unidade</div>
                    {address.street && address.number && (
                      <div>{address.street}, {address.number}</div>
                    )}
                    {address.city && address.state && (
                      <div>{address.city} - {address.state}</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}

FacilityLocationDisplay.displayName = 'FacilityLocationDisplay';

export default FacilityLocationDisplay;
