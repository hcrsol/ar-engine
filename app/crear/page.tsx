import Link from "next/link";

// Placeholder de Fase 0. El panel real (parser de coordenadas, QR, compartir)
// se construye en la Fase 1 sobre esta misma ruta.
export default function CrearPage() {
  return (
    <main className="flex min-h-dvh justify-center px-5 py-12 sm:py-16">
      <div className="w-full max-w-[480px]">
        <header className="mb-10">
          <div className="text-clay flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase">
            <span className="bg-clay h-px w-[18px]" />
            Panel de creación
          </div>
          <h1 className="font-display mt-3.5 text-[34px] leading-[1.05] font-medium tracking-[-0.01em]">
            Crear un aviso
          </h1>
          <p className="text-soft mt-3 text-sm leading-relaxed">
            El panel de creación llega en la siguiente fase. Aquí pegarás las
            coordenadas y generarás el link del visor.
          </p>
        </header>

        <Link
          href="/"
          className="text-clay border-clay inline-block rounded-full border-[1.5px] px-5 py-3 text-sm font-semibold"
        >
          ← Volver
        </Link>
      </div>
    </main>
  );
}
