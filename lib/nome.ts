// A conferência do nome que a pessoa digita no chat.
//
// ---------- O que ela pega, e o que não pega ----------
//
// A exigência antiga era só "duas palavras de duas letras", e passava "oin
// oi", "asd asd", "kkk kkk". Aqui entram os sinais de nome inventado que dá
// para ver sem saber quem a pessoa é: palavra que não é nome (oi, teste,
// fulano), letra repetida em sequência, palavra sem vogal, a mesma palavra
// duas vezes, sequência de teclado, número ou símbolo.
//
// O que não dá para pegar é o nome falso bem escrito: "João Silva" passa,
// seja ou não o nome de quem digitou. Isso só se confirma no WhatsApp. O
// objetivo é tirar o lixo óbvio do painel e do CRM, não fazer cadastro.
//
// Usada nos dois lados: no navegador, para avisar na hora; no servidor,
// porque o navegador é de quem está digitando.

/** Palavras que aparecem no lugar do nome e não são nome. */
const NAO_SAO_NOMES = new Set([
  "oi", "ola", "oie", "oin", "opa", "eae", "eai", "salve", "hey", "hi", "hello",
  "teste", "testando", "test", "nome", "sobrenome", "meu", "minha", "eu", "voce",
  "fulano", "fulana", "ciclano", "beltrano", "sicrano", "ninguem", "anonimo",
  "anonima", "cliente", "visitante", "usuario",
  "sim", "nao", "ok", "bom", "boa", "dia", "tarde", "noite", "tudo", "bem",
  "kk", "kkk", "haha", "hahaha", "rs", "rsrs", "lol", "aff", "xd",
  "asd", "asdf", "qwe", "qwer", "qwerty", "abc", "abcd", "xyz", "aaa", "xxx",
  "lanca", "nada", "sei", "la", "quem", "pergunta",
]);

/** Partículas que podem vir no meio do nome sem contar como palavra. */
const PARTICULAS = new Set(["da", "de", "do", "das", "dos", "e"]);

/** Sequências de teclado e de alfabeto que alguém digita sem pensar. */
const SEQUENCIAS = ["qwert", "asdfg", "zxcvb", "abcde", "hjkl", "yuiop", "mnbv"];

const semAcento = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Arruma espaços e põe a primeira letra de cada palavra em maiúscula. */
export function arrumarNome(bruto: string) {
  return bruto
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((p, i) =>
      i > 0 && PARTICULAS.has(p.toLowerCase())
        ? p.toLowerCase()
        : // Maiúscula no começo e depois de hífen ou apóstrofo: Ana-Clara, D'Ávila.
          p
            .toLocaleLowerCase("pt-BR")
            .replace(/(^|[-'’])(\p{L})/gu, (_, antes: string, letra: string) =>
              antes + letra.toLocaleUpperCase("pt-BR")
            )
    )
    .join(" ")
    .slice(0, 120);
}

/**
 * O problema do nome, em uma frase para mostrar à pessoa, ou null se ele
 * parece um nome de verdade.
 */
export function problemaNoNome(bruto: string): string | null {
  const nome = bruto.trim().replace(/\s+/g, " ");

  if (/[0-9@#$%&*_+=<>{}[\]|\\/!?;:]/.test(nome)) {
    return "Use só letras no nome.";
  }

  const palavras = nome
    .split(" ")
    .filter((p) => p && !PARTICULAS.has(p.toLowerCase()));

  if (palavras.length < 2) return "Escreva nome e sobrenome.";

  for (const palavra of palavras) {
    const p = semAcento(palavra).replace(/['’-]/g, "");
    if (p.length < 2) return "Escreva nome e sobrenome completos.";
    if (!/^[a-zç]+$/.test(p)) return "Use só letras no nome.";
    if (NAO_SAO_NOMES.has(p)) return "Escreva seu nome de verdade, por favor.";
    if (!/[aeiouy]/.test(p)) return "Escreva seu nome de verdade, por favor.";
    if (/(.)\1\1/.test(p)) return "Escreva seu nome de verdade, por favor.";
    if (SEQUENCIAS.some((s) => p.includes(s))) return "Escreva seu nome de verdade, por favor.";
  }

  const normais = palavras.map((p) => semAcento(p));
  if (new Set(normais).size < normais.length) {
    return "Escreva seu nome de verdade, por favor.";
  }

  // Nome curto demais no total ("Li Ai"): quatro letras não fazem nome e
  // sobrenome de ninguém.
  if (normais.join("").length < 5) return "Escreva nome e sobrenome completos.";

  return null;
}
