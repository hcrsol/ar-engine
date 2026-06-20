import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh justify-center px-5 py-12 sm:py-16">
      <div className="w-full max-w-[480px]">
        <header className="mb-10">
          <div className="text-clay flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase">
            <span className="bg-clay h-px w-[18px]" />
            Geolocalización AR
          </div>
          <h1 className="font-display mt-3.5 text-[34px] leading-[1.05] font-medium tracking-[-0.01em]">
            Ancla una campaña
            <br />a un punto del mundo
          </h1>
          <p className="text-soft mt-3 max-w-[90%] text-sm leading-relaxed">
            Genera un link. Quien lo abra y apunte la cámara al lugar, lo ve en
            realidad aumentada — sin instalar nada.
          </p>
        </header>

        <ol className="mb-9 space-y-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="border-line bg-card flex gap-4 rounded-2xl border p-4"
            >
              <span className="text-clay font-mono text-xs font-medium">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="text-[13px] font-semibold">{step.title}</div>
                <p className="text-soft mt-1 text-xs leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/crear"
          className="bg-clay block rounded-full px-4 py-4 text-center text-sm font-semibold text-white transition active:scale-[0.99]"
        >
          Crear un aviso
        </Link>

        <footer className="text-soft border-line mt-10 border-t pt-5 text-[11px] leading-relaxed">
          Producto v1 — visor link-only con animación de demostración. La
          precisión depende del GPS y la brújula del teléfono; sus límites están
          documentados, no ocultos.
        </footer>
      </div>
    </main>
  );
}

const STEPS = [
  {
    title: "Elige el punto",
    body: "Pega las coordenadas o el link de Google Maps del lugar donde vivirá la campaña.",
  },
  {
    title: "Genera el link",
    body: "Obtienes una URL y un QR para compartir. No hay que instalar ninguna app.",
  },
  {
    title: "Apunta y mira",
    body: "Quien abra el link en el teléfono, vaya al lugar y apunte la cámara, ve el aviso anclado.",
  },
];
