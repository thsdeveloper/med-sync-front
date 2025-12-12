'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationData } from '@/components/molecules/LocationPicker';

// Dynamic import to prevent SSR issues with Leaflet
const LocationPicker = dynamic(
  () => import('@/components/molecules/LocationPicker').then((mod) => mod.LocationPicker),
  { ssr: false }
);

export default function LocationPickerDemo() {
  const [location, setLocation] = useState<LocationData>({
    latitude: -23.5505,
    longitude: -46.6333,
  });

  const handleLocationChange = (newLocation: LocationData) => {
    setLocation(newLocation);
    console.log('Location changed:', newLocation);
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">LocationPicker Component Demo</h1>
      <p className="text-gray-600 mb-8">
        Interactive map component with click-to-place marker, drag functionality, and address search
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Map */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Interactive Map</h2>
          <LocationPicker
            latitude={location.latitude}
            longitude={location.longitude}
            onChange={handleLocationChange}
            height="500px"
          />
        </div>

        {/* Information Panel */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Location Data</h2>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Latitude</label>
              <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                {location.latitude.toFixed(8)}°
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Longitude</label>
              <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                {location.longitude.toFixed(8)}°
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Click on map to place marker</li>
                <li>✓ Drag marker to adjust position</li>
                <li>✓ Search for addresses</li>
                <li>✓ Real-time coordinate updates</li>
                <li>✓ React Hook Form integration</li>
                <li>✓ Responsive mobile design</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Instructions:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Click anywhere on the map to place a marker</li>
                <li>Drag the marker to fine-tune the position</li>
                <li>Use the search box to find addresses</li>
                <li>Watch the coordinates update in real-time</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Usage with React Hook Form</h2>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <pre className="text-sm overflow-x-auto">
            <code>{`import { useForm } from 'react-hook-form';
import { LocationPicker } from '@/components/molecules';

function FacilityAddressForm() {
  const { watch, setValue } = useForm();
  const latitude = watch('latitude');
  const longitude = watch('longitude');

  return (
    <LocationPicker
      latitude={latitude}
      longitude={longitude}
      onChange={({ latitude, longitude }) => {
        setValue('latitude', latitude);
        setValue('longitude', longitude);
      }}
    />
  );
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
