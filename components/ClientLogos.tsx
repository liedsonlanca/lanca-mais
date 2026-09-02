import Image from "next/image";
import { clientes } from "@/lib/clients";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

// Faixa de marcas atendidas. Sem logos cadastrados, não renderiza nada —
// melhor a seção não existir do que existir vazia.
export default function ClientLogos() {
  if (clientes.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-linha bg-papel">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <Reveal>
          <p className="eyebrow text-center text-preto/58">
            Marcas que confiam na LANÇA+
          </p>
        </Reveal>

        <Stagger className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-10 lg:gap-x-16">
          {clientes.map((cliente) => (
            <StaggerItem key={cliente.nome}>
              <div className="relative h-9 w-32 lg:h-10 lg:w-36">
                <Image
                  src={cliente.logo}
                  alt={cliente.nome}
                  fill
                  sizes="144px"
                  // Logos chegam em cores variadas; o branco uniforme mantém a
                  // faixa coesa, e a cor volta ao passar o mouse.
                  className="object-contain opacity-45 brightness-0 invert transition-all duration-500 hover:opacity-100 hover:brightness-100 hover:invert-0"
                />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
