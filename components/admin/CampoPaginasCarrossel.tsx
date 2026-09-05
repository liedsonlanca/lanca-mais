"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { enviarArquivo } from "@/lib/envio-arquivo";

// Páginas do carrossel.
//
// Um carrossel é um post de várias imagens. No trilho da home aparece só a
// primeira; as outras aparecem ao abrir a peça.
//
// A ordem é o conteúdo aqui, não um detalhe de arrumação: as páginas de um
// carrossel contam uma sequência, e trocar a segunda pela terceira quebra o
// argumento. Por isso cada miniatura mostra o número e dá para mover.
//
// As imagens vão ao formulário como vários campos escondidos de mesmo nome, e
// o servidor lê com getAll: a ordem do DOM é a ordem que chega lá, sem
// precisar serializar nada.
type Props = {
  /** Nome dos campos escondidos que levam as URLs ao formulário. */
  name: string;
  pasta: string;
  /** Páginas já salvas, ao editar uma peça que já existe. */
  inicial?: string[];
};

const MINIMO = 2;

export default function CampoPaginasCarrossel({
  name,
  pasta,
  inicial = [],
}: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const idCampo = useId();

  const [paginas, setPaginas] = useState<string[]>(inicial);
  const [enviando, setEnviando] = useState<{ feitas: number; total: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Ao terminar de salvar, o campo volta ao que está guardado. Sem isso as
  // páginas recém-enviadas ficariam na tela como se ainda estivessem pendentes,
  // e um segundo Salvar reaplicaria tudo.
  const { pending } = useFormStatus();
  const salvando = useRef(false);

  useEffect(() => {
    if (pending) {
      salvando.current = true;
      return;
    }
    if (salvando.current) {
      salvando.current = false;
      setEnviando(null);
      setErro(null);
      if (entrada.current) entrada.current.value = "";
    }
  }, [pending]);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    // Ordena pelo nome do arquivo, e não pela ordem em que o sistema os
    // entrega.
    //
    // A janela do Windows devolve os arquivos na ordem em que estavam
    // listados na tela, que costuma ser do mais recente para o mais antigo:
    // escolher seis páginas exportadas como 01 a 06 montava o carrossel de
    // trás para frente. Não é escolha da pessoa, é ordem de exibição — e
    // respeitá-la é respeitar um acidente.
    //
    // A comparação é numérica: sem isso, "10" viria antes de "2", que é o
    // erro clássico de ordenar número como texto.
    const arquivos = [...(e.target.files ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { numeric: true, sensitivity: "base" })
    );
    if (arquivos.length === 0) return;

    setErro(null);
    setEnviando({ feitas: 0, total: arquivos.length });

    try {
      // Um de cada vez, e não em paralelo: a barra mostra "3 de 7" em vez de
      // sete barras competindo, e numa conexão ruim uma falha não leva as
      // outras junto. As que já subiram ficam.
      for (const [i, arquivo] of arquivos.entries()) {
        const endereco = await enviarArquivo(arquivo, pasta, "imagem");
        setPaginas((atuais) => [...atuais, endereco]);
        setEnviando({ feitas: i + 1, total: arquivos.length });
      }
    } catch (falha) {
      setErro(
        falha instanceof Error ? falha.message : "Não foi possível enviar."
      );
    } finally {
      setEnviando(null);
      if (entrada.current) entrada.current.value = "";
    }
  }

  function mover(de: number, direcao: -1 | 1) {
    const para = de + direcao;
    if (para < 0 || para >= paginas.length) return;
    setPaginas((atuais) => {
      const nova = [...atuais];
      [nova[de], nova[para]] = [nova[para], nova[de]];
      return nova;
    });
  }

  function remover(i: number) {
    setPaginas((atuais) => atuais.filter((_, j) => j !== i));
  }

  const faltam = MINIMO - paginas.length;

  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wider text-preto/50">
        Páginas do carrossel ({paginas.length})
      </span>

      {/* Cada página vira um campo próprio, na ordem da tela. */}
      {paginas.map((endereco) => (
        <input key={endereco} type="hidden" name={name} value={endereco} />
      ))}

      <div className="mt-3 flex flex-wrap gap-3">
        {paginas.map((endereco, i) => (
          <div
            key={endereco}
            className="group relative h-32 w-[104px] overflow-hidden rounded-xl border border-linha bg-areia"
          >
            <Image
              src={endereco}
              alt={`Página ${i + 1}`}
              fill
              sizes="104px"
              className="object-cover"
            />

            <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-abismo/80 text-xs font-medium text-bege">
              {i + 1}
            </span>

            <button
              type="button"
              onClick={() => remover(i)}
              aria-label={`Remover a página ${i + 1}`}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-abismo/80 text-bege transition-colors duration-300 hover:bg-salmon-texto"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-3 w-3"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {/* As setas ficam sempre visíveis: escondidas no hover, some no
                celular, que é onde a agência mais mexe no painel. */}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-abismo/75 px-1 py-1">
              <button
                type="button"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                aria-label={`Mover a página ${i + 1} para trás`}
                className="flex h-6 w-8 items-center justify-center rounded text-bege transition-opacity duration-300 disabled:opacity-25"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === paginas.length - 1}
                aria-label={`Mover a página ${i + 1} para frente`}
                className="flex h-6 w-8 items-center justify-center rounded text-bege transition-opacity duration-300 disabled:opacity-25"
              >
                →
              </button>
            </div>
          </div>
        ))}

        {/* Acrescentar. É um label, e não um botão, para abrir o seletor de
            arquivos sem uma linha de JavaScript. */}
        <label
          htmlFor={idCampo}
          className="flex h-32 w-[104px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-linha text-2xl text-preto/35 transition-colors duration-300 hover:border-salmon hover:text-salmon-texto"
        >
          +
          <span className="sr-only">Acrescentar páginas</span>
        </label>
      </div>

      <input
        ref={entrada}
        id={idCampo}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={aoEscolher}
        className="sr-only"
      />

      {/* required num campo escondido faria o navegador reclamar de algo
          invisível, sem dizer onde. O aviso fica na tela. */}
      {faltam > 0 && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value=""
          onChange={() => {}}
          className="h-0 w-0 border-0 p-0 opacity-0"
        />
      )}

      {enviando && (
        <p className="mt-3 text-xs text-preto/55">
          Enviando {enviando.feitas} de {enviando.total}
        </p>
      )}

      {erro && (
        <p role="alert" className="mt-3 text-xs text-salmon-texto">
          {erro}
        </p>
      )}

      {!enviando && !erro && (
        <p className="mt-3 text-xs leading-relaxed text-preto/50">
          {faltam > 0
            ? `Escolha pelo menos ${MINIMO} imagens. Um carrossel de uma página só é uma peça estática.`
            : "As páginas entram na ordem do nome do arquivo, então exportar como 01, 02, 03 já resolve. A primeira é a capa, e é ela que aparece no trilho da home. JPG, PNG ou WEBP, até 8 MB cada, em pé (4:5)."}
        </p>
      )}
    </div>
  );
}
