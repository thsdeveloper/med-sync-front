'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('@/components/molecules/MapContainer').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

export default function MapDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Map Demo - Brazil Center</h1>
        <p className="text-muted-foreground mb-4">
          Default map centered on Brazil's geographic center
        </p>
        <Suspense
          fallback={
            <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
          }
        >
          <MapContainer />
        </Suspense>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Map with Markers - Major Cities</h2>
        <p className="text-muted-foreground mb-4">
          Map showing major Brazilian cities
        </p>
        <Suspense
          fallback={
            <div className="h-[500px] w-full bg-muted animate-pulse rounded-lg" />
          }
        >
          <MapContainer
            zoom={5}
            height="500px"
            markers={[
              {
                position: [-23.5505, -46.6333],
                popup: 'São Paulo - SP',
                title: 'São Paulo',
              },
              {
                position: [-22.9068, -43.1729],
                popup: 'Rio de Janeiro - RJ',
                title: 'Rio de Janeiro',
              },
              {
                position: [-15.7801, -47.9292],
                popup: 'Brasília - DF',
                title: 'Brasília',
              },
              {
                position: [-12.9714, -38.5014],
                popup: 'Salvador - BA',
                title: 'Salvador',
              },
              {
                position: [-25.4284, -49.2733],
                popup: 'Curitiba - PR',
                title: 'Curitiba',
              },
            ]}
          />
        </Suspense>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Custom Zoom - São Paulo</h2>
        <p className="text-muted-foreground mb-4">
          Focused view on São Paulo city
        </p>
        <Suspense
          fallback={
            <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
          }
        >
          <MapContainer
            center={[-23.5505, -46.6333]}
            zoom={12}
            height="400px"
            markers={[
              {
                position: [-23.5505, -46.6333],
                popup: '<strong>São Paulo</strong><br/>Largest city in Brazil',
                title: 'São Paulo',
              },
            ]}
          />
        </Suspense>
      </div>
    </div>
  );
}
