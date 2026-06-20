import Link from "next/link";

// Placeholder de Fase 1. En la Fase 2 esta ruta pasa a ser el visor AR
// client-only (A-Frame + AR.js) que ancla la animación en lat/lng.
export default async function VisorPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  const { lat, lng } = await searchParams;
  const hasCoords = lat != null && lng != null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-[480px] text-center">
        <div className="text-clay flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase">
          <span className="bg-clay h-px w-[18px]" />
          Visor AR
          <span className="bg-clay h-px w-[18px]" />
        </div>
        <h1 className="font-display mt-4 text-[28px] leading-tight font-medium">
          El visor llega en la siguiente fase
        </h1>

        {hasCoords ? (
          <div className="border-line bg-card mt-6 inline-flex gap-6 rounded-2xl border px-5 py-4 font-mono text-[13px]">
            <div>
              <span className="text-soft block text-[10px] tracking-[0.14em] uppercase">
                Lat
              </span>
              {lat}
            </div>
            <div>
              <span className="text-soft block text-[10px] tracking-[0.14em] uppercase">
                Lng
              </span>
              {lng}
            </div>
          </div>
        ) : (
          <p className="text-soft mt-6 text-sm">
            Abre este visor desde un link generado en el panel.
          </p>
        )}

        <p className="text-soft mx-auto mt-6 max-w-[90%] text-sm leading-relaxed">
          Aquí, al apuntar la cámara hacia esta coordenada, verás la animación
          anclada en el espacio real.
        </p>

        <Link
          href="/crear"
          className="text-clay border-clay mt-8 inline-block rounded-full border-[1.5px] px-5 py-3 text-sm font-semibold"
        >
          ← Crear otro aviso
        </Link>
      </div>
    </main>
  );
}
