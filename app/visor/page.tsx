import ARViewer from "@/components/ARViewer";

// El visor AR es client-only en la práctica: ARViewer solo toca window/A-Frame
// dentro de efectos y handlers. Aquí solo extraemos lat/lng del link.
export default async function VisorPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  const { lat, lng } = await searchParams;
  return <ARViewer lat={lat} lng={lng} />;
}
