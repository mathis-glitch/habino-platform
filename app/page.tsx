import dynamic from "next/dynamic";

// Map homepage must be client-side only (Leaflet is not SSR-safe)
const MapHomePage = dynamic(
  () => import("./components/map/MapHomePage").then((m) => ({ default: m.MapHomePage })),
  { ssr: false }
);

export default function HomePage() {
  return <MapHomePage />;
}
