/**
 * MapContainer Component
 *
 * IMPORTANT: This component requires dynamic import to avoid SSR issues.
 *
 * Leaflet uses browser-specific APIs (like `window`) that are not available
 * during server-side rendering in Next.js. Always import this component
 * using Next.js dynamic import with ssr: false.
 *
 * @example
 * ```tsx
 * import dynamic from 'next/dynamic';
 *
 * const MapContainer = dynamic(
 *   () => import('@/components/molecules/MapContainer'),
 *   {
 *     ssr: false,
 *     loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
 *   }
 * );
 *
 * function MyPage() {
 *   return (
 *     <MapContainer
 *       center={[-23.5505, -46.6333]}
 *       zoom={12}
 *       markers={[{
 *         position: [-23.5505, -46.6333],
 *         popup: "Location Name"
 *       }]}
 *     />
 *   );
 * }
 * ```
 */

export { MapContainer, type MapContainerProps, type MapMarker } from '../MapContainer';
export { BRAZIL_CENTER, DEFAULT_ZOOM } from '../MapContainer';

// Note: BRAZIL_CENTER and DEFAULT_ZOOM need to be exported from MapContainer.tsx
