# MapContainer Component

A wrapper around react-leaflet's MapContainer component configured for use in MedSync with proper Next.js SSR handling.

## Features

- 🗺️ **Pre-configured for Brazil**: Default center at Brazil's geographic coordinates
- 🚀 **SSR-safe**: Designed for Next.js dynamic import to avoid hydration errors
- 📍 **Marker Support**: Easy marker placement with popups
- 🎨 **Styled**: Integrated with project's design system
- ⚡ **Type-safe**: Full TypeScript support with proper Leaflet types

## Installation

The component requires the following packages (already installed):

```bash
pnpm add leaflet react-leaflet @types/leaflet
```

## Usage

**IMPORTANT**: This component MUST be imported dynamically to avoid SSR issues:

### Basic Example

```tsx
import dynamic from 'next/dynamic';

const MapContainer = dynamic(
  () => import('@/components/molecules/MapContainer').then(mod => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
    ),
  }
);

export default function MyPage() {
  return (
    <div>
      <h1>My Map</h1>
      <MapContainer />
    </div>
  );
}
```

### With Custom Center and Zoom

```tsx
<MapContainer
  center={[-23.5505, -46.6333]} // São Paulo coordinates
  zoom={12}
  height="500px"
/>
```

### With Markers

```tsx
<MapContainer
  center={[-23.5505, -46.6333]}
  zoom={12}
  markers={[
    {
      position: [-23.5505, -46.6333],
      popup: 'Hospital São Paulo',
      title: 'Hospital 1'
    },
    {
      position: [-23.5489, -46.6388],
      popup: 'Clínica Central',
      title: 'Clínica 1'
    }
  ]}
/>
```

### Using Constants

```tsx
import { BRAZIL_CENTER, DEFAULT_ZOOM } from '@/components/molecules/MapContainer';

// Use in your component
<MapContainer center={BRAZIL_CENTER} zoom={DEFAULT_ZOOM} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `LatLngExpression` | `BRAZIL_CENTER` | Map center coordinates |
| `zoom` | `number` | `4` | Initial zoom level |
| `height` | `string` | `"400px"` | Map height in CSS units |
| `width` | `string` | `"100%"` | Map width in CSS units |
| `markers` | `MapMarker[]` | `[]` | Array of markers to display |
| `className` | `string` | `""` | Additional CSS classes |
| `scrollWheelZoom` | `boolean` | `true` | Enable scroll wheel zoom |
| `dragging` | `boolean` | `true` | Enable map dragging |

### MapMarker Type

```typescript
interface MapMarker {
  position: LatLngTuple; // [latitude, longitude]
  popup?: string;        // HTML content for popup
  title?: string;        // Marker title (tooltip)
}
```

## Constants

- `BRAZIL_CENTER`: `[-14.235, -51.9253]` - Brazil's geographic center
- `DEFAULT_ZOOM`: `4` - Default zoom level for Brazil view

## Styling

The component uses the project's design system:
- Border radius from `--radius` CSS variable
- Font family from `--font-sans`
- Border color from `border-border` Tailwind class

Custom styles are defined in `globals.css`:

```css
.leaflet-container {
  font-family: var(--font-sans);
  z-index: 0;
}

.leaflet-popup-content-wrapper {
  border-radius: var(--radius);
}
```

## Demo

A demo page is available at `/map-demo` showing various use cases:
- Default Brazil center view
- Multiple markers (Brazilian cities)
- Custom zoom on São Paulo

## Common Issues

### Hydration Errors

**Problem**: "Text content does not match server-rendered HTML" or similar errors.

**Solution**: Ensure you're using dynamic import with `ssr: false`:

```tsx
const MapContainer = dynamic(
  () => import('@/components/molecules/MapContainer').then(mod => mod.MapContainer),
  { ssr: false }
);
```

### Marker Icons Not Showing

**Problem**: Default marker icons appear broken.

**Solution**: The component handles this automatically by configuring Leaflet's default icon. No action needed.

### Map Not Rendering

**Problem**: Map container appears empty.

**Solution**: Ensure a height is set either via the `height` prop or CSS. Maps require explicit height.

## Technical Details

### Why Dynamic Import?

Leaflet relies on browser APIs (`window`, `document`) that don't exist during Next.js server-side rendering. Dynamic import with `ssr: false` ensures the component only loads on the client.

### Tile Provider

Uses OpenStreetMap tiles (free and open source):
- URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Attribution: Required by OpenStreetMap license

## Future Enhancements

Potential improvements for future iterations:
- [ ] Custom marker icons support
- [ ] Clustering for multiple markers
- [ ] Geocoding integration
- [ ] Drawing tools
- [ ] Route visualization
- [ ] GeoJSON layer support

## References

- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
