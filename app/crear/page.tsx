import Link from "next/link";
import PoiForm from "@/components/PoiForm";

export default function CrearPage() {
  return (
    <main className="flex min-h-dvh justify-center px-5 py-12 sm:py-16">
      <div className="w-full max-w-[480px]">
        <header className="mb-9">
          <Link
            href="/"
            className="text-soft hover:text-clay font-mono text-[11px] tracking-[0.14em] uppercase"
          >
            ← Inicio
          </Link>
          <div className="text-clay mt-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase">
            <span className="bg-clay h-px w-[18px]" />
            Panel de creación
          </div>
          <h1 className="font-display mt-3.5 text-[34px] leading-[1.05] font-medium tracking-[-0.01em]">
            Crear un aviso
          </h1>
          <p className="text-soft mt-3 max-w-[90%] text-sm leading-relaxed">
            Elige el punto del mundo donde vivirá la campaña y genera el link
            del visor.
          </p>
        </header>

        <PoiForm />

        <footer className="text-soft border-line mt-10 border-t pt-5 text-[11px] leading-relaxed">
          Esta pasada genera un link con la coordenada. El visor AR ancla una
          animación de demostración en ese punto. La subida de tu propia
          campaña se conecta en una fase posterior.
        </footer>
      </div>
    </main>
  );
}
