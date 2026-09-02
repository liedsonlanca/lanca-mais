# Site da LANÇA+

Site institucional da agência, em Next.js 16 (App Router + Turbopack), React 19 e Tailwind CSS 4.

```bash
npm run dev
```

Abre em http://localhost:3000.

## Direção visual

Site **claro**, com um único acento (salmão) e tipografia de display em corpo
grande. A abertura apresenta a frase-problema do cliente — *"Sua marca tem
qualidade. Sua presença digital mostra isso?"* — revelada palavra a palavra.

O escuro ficou reservado a três lugares, e só a eles: o **hero** de cada página,
a **faixa do slogan** e o **rodapé**. É o contraste que faz a abertura ter
impacto e o corpo do site respirar.

A base é **branca**. As seções alternam `papel` (branco) e `areia` para separar
um bloco do seguinte; duas seções vizinhas nunca repetem o mesmo fundo. Os cards
são brancos com borda e uma sombra suave — no branco puro a borda sozinha não
separa o card do fundo.

### Tokens

Definidos em [`app/globals.css`](app/globals.css) e expostos ao Tailwind por `@theme inline`:

Claro (o corpo do site), sobre base branca:

| Token | Uso |
| --- | --- |
| `papel` `#ffffff` | fundo principal |
| `areia` `#f7f5f0` | seções alternadas |
| `branco` `#ffffff` | cards, com `border-linha` + `shadow-[var(--sombra-cartao)]` |
| `linha` `#e9e5dd` | bordas e divisores |
| `preto` `#0a0a08` | texto |
| `salmon` `#dd8a55` | preenchimentos: botões, ponto do eyebrow, glow |
| `salmon-texto` `#a85c2c` | **todo salmão em texto sobre claro** |

Duas decisões que parecem detalhe e não são:

- A banda alternada é `areia`, não o `bege` da marca: encostado no branco puro o
  bege (`#ede5d2`) fica amarelado.
- `text-salmon` sobre branco dá **2,68:1** de contraste — reprova até para texto
  grande. Por isso existe `salmon-texto` (**4,96:1**). Em fundo claro, salmão só
  entra como preenchimento; em texto, use `salmon-texto`.

O acento do `WordReveal` resolve isso sozinho pela classe `.acento`, que lê a
superfície: escurecida por padrão, salmão puro dentro de `.superficie-escura`.

### Régua de lançamento

Gesto próprio da marca, repetido para dar unidade: uma régua salmão de 3px que
**cresce**. Aparece na borda esquerda das abas de serviço e dos cards do método
(cresce de cima a baixo no hover), sob o nome nos cards da equipe (cresce para o
lado) e como trilho do método (preenche conforme a rolagem).

### Cards precisam contrastar com o fundo

No branco puro, card branco não existe como painel — foi o que deixou as listas
"apagadas". A regra: **seção branca, card `areia`**; seção `areia`, card branco.
Sempre com `border-linha` e `shadow-[var(--sombra-cartao)]`.

Escuro (hero, faixa do slogan e rodapé — nada além disso):

| Token | Uso |
| --- | --- |
| `abismo` `#050504` | fundo |
| `carvao` `#101010` / `grafite` `#171714` | superfícies |
| `borda` `#2a2a24` | bordas |
| `bege` `#ede5d2` | texto sobre escuro |

Ao criar seção nova, use os tokens claros. `text-bege` e `bg-abismo` só valem
dentro de `Hero`, `PageHero`, `SloganBand` e `Footer`.

Utilitários próprios: `.eyebrow` (rótulo de seção), `.glow-salmon` (halo ambiente),
`.noise` (textura de ruído), `.numeral-fantasma` (numerais 01–09 dos cards).

### Tipografia

Palmore (display) e Google Sans (texto), carregadas localmente de `public/fonts`
via `next/font/local` em [`app/fonts.ts`](app/fonts.ts).

**Regra:** a Palmore fica só nos títulos grandes (h1 e h2 de seção). Títulos de
card, rótulos e numerais usam a Google Sans — em corpo pequeno a Palmore trava a
leitura, e seus algarismos viram quase letras (o `01` lia-se como `Ol`).

Por isso `.numeral-fantasma` define a família sans e **não** define cor: a cor
fica nas utilitárias do Tailwind em cada uso. Definida no CSS fora de camada, ela
venceria as utilitárias e travaria os estados de `group-hover`.

## Sistema de movimento

`motion` (Framer Motion) e `lenis` para rolagem com inércia.

| Componente | Papel |
| --- | --- |
| [`SmoothScroll`](components/motion/SmoothScroll.tsx) | rolagem com inércia (Lenis) |
| [`MotionProvider`](components/motion/MotionProvider.tsx) | `reducedMotion="user"` em todo o site |
| [`Reveal`](components/motion/Reveal.tsx) | entrada de bloco: sobe, desfoca e ganha nitidez |
| [`Stagger`](components/motion/Stagger.tsx) | listas em cascata (use o export nomeado `StaggerItem`) |
| [`WordReveal`](components/motion/WordReveal.tsx) | títulos revelados palavra a palavra |
| [`Counter`](components/motion/Counter.tsx) | números que contam de 0 ao valor |
| [`app/template.tsx`](app/template.tsx) | transição de entrada entre páginas |

Duas armadilhas já resolvidas, que voltam se alguém mexer:

- `StaggerItem` é export nomeado de propósito. Propriedade estática
  (`Stagger.Item`) não sobrevive à fronteira entre server e client component.
- A margem de `whileInView` / `useInView` é **só vertical**
  (`0px 0px -80px 0px`). Um valor uniforme como `-80px` também recua as bordas
  laterais, e elementos estreitos encostados na margem esquerda nunca
  intersectam — foi o que deixou o contador `+40` parado em zero.

Acessibilidade: quem tem `prefers-reduced-motion: reduce` não recebe rolagem
suave, parallax nem animações de transform.

## Estrutura

```
app/
  page.tsx              home
  servicos/             lista + [slug] (7 serviços)
  portfolio/  sobre/  blog/ (+ [slug])  contato/
  sitemap.ts  robots.ts  opengraph-image.tsx
components/
  Hero  Header  Footer  SectionHeading  PageHero  CtaFinal
  ServiceRows           abas de serviço (numeral, ícone, texto, seta)
  SloganBand            faixa de assinatura da marca
  WorkShowcase          trilho de trabalhos que desliza sozinho, com lightbox
  Lightbox              visualização em tela cheia (imagem ou vídeo)
  ClientLogos           faixa de marcas atendidas (some se a lista estiver vazia)
  MethodSteps           linha do tempo do método, com trilho que preenche na rolagem
  ServiceIcon           ícone de cada serviço, compartilhado pela home e pela grade
  FooterMap             faixa da sede no rodapé (embed do Google Maps, lazy)
  ContactForm  NicheMarquee  WhatsAppButton  JsonLd  FaqJsonLd
  motion/               primitivas de animação
lib/
  site-config.ts        marca, contatos, serviços, FAQ, métricas
  service-pages.ts      conteúdo longo de cada página de serviço
  blog-posts.ts  portfolio.ts
  showcase.ts           peças da vitrine [SUBSTITUIR por posts reais]
  clients.ts            logos de clientes (vazio de propósito)
  scroll.ts             ponte para o Lenis (rolar ao topo, parar/retomar)
```

## Vitrine: o trilho que desliza sozinho

Três armadilhas resolvidas em [components/WorkShowcase.tsx](components/WorkShowcase.tsx),
que voltam se alguém reescrever o laço:

- **scrollLeft arredonda para inteiro.** Somar 0,26px por quadro e reler do
  elemento devolve sempre o mesmo valor, e o trilho nunca sai do lugar. A
  posição é acumulada num float e só então atribuída.
- **Sem scroll-snap e sem scroll-behavior: smooth** no contêiner. O snap
  puxaria o trilho de volta a cada quadro; o smooth animaria cada incremento.
- **Pausa por listener nativo, não por handler do React.** pointerenter e
  pointerleave não borbulham, e o React os deriva de pointerout delegado na
  raiz — o disparo direto não aciona o handler sintético.

A lista é renderizada duas vezes e o scroll volta ao passar da metade: como as
metades são idênticas, o laço não tem emenda. A cópia é aria-hidden e fora da
ordem de tabulação.

## Duas escalas de opacidade

Texto claro sobre escuro e texto escuro sobre claro **não** usam os mesmos
valores: bege a 55% sobre preto tem muito mais presença do que preto a 55%
sobre branco. As duas escalas foram calibradas separadamente, e o hero ainda
tem o padrão da marca competindo com o texto.

Ao criar texto secundário, parta de `text-preto/70` no claro e `text-bege/85` no
escuro; para texto de apoio, `text-preto/55` e `text-bege/68`.

Medido no hero: o parágrafo dá **9,2:1** e os textos de apoio **6,3:1** contra a
parte mais clara do padrão de fundo — ambos passam no AA.

## Páginas de serviço

Estrutura de `/servicos/[slug]`, montada só com dados que já existem em
`lib/service-pages.ts`:

| Seção | Vem de |
| --- | --- |
| Hero + painel Benefícios | `heroKicker`, `heroSubtitle`, `results` |
| Manifesto | `manifesto` |
| Faixa de imagem | `heroImage` |
| Como funciona | `process` |
| O que você recebe (chips) | `deliverables` |
| Diferenciais | `features` |
| Serviços relacionados | os 3 seguintes em `services` |

## Imagens

As fotos da equipe entram otimizadas em `public/images/team` (2:3, 1000×1500,
~50 KB cada). As originais do cliente ficam em `IMAGENS/`, fora do controle de
versão. Para reprocessar, use `sharp`:

```bash
node -e "require('sharp')('IMAGENS/foto.jpg').rotate().resize(1000,1500,{fit:'cover',position:'top'}).jpeg({quality:82,mozjpeg:true}).toFile('public/images/team/nome.jpg')"
```

## SEO

`metadataBase`, Open Graph e Twitter Card no layout raiz; `sitemap.xml` e
`robots.txt` gerados; imagem de compartilhamento renderizada em
[`app/opengraph-image.tsx`](app/opengraph-image.tsx) com a tipografia da marca.
Dados estruturados em `ProfessionalService`, `WebSite` e `FAQPage` — campos
ainda em placeholder são omitidos do JSON-LD em vez de publicar dado falso.

## Pendências antes de publicar

Já preenchidos: contatos (WhatsApp, e-mail, endereço), CNPJ e a equipe real
(5 integrantes, com fotos).

Ainda faltam dados reais — todos marcados com colchetes:

```bash
grep -rn "AJUSTAR\|INSTAGRAM\|TIKTOK\|CONFIRMAR\|Nome do cliente" lib/
```

- [ ] `lib/site-config.ts` — @ real do Instagram e do TikTok (hoje ambos chutados como `@lancamais`)
- [ ] `lib/site-config.ts` — confirmar o domínio: está deduzido do e-mail como `lancamais.com`
- [ ] `lib/site-config.ts` — métricas de prova social marcadas com `[AJUSTAR]`
- [ ] `lib/site-config.ts` — os 3 depoimentos (com autorização do cliente)
- [ ] `lib/portfolio.ts` — os 4 cases e seus resultados
- [ ] `lib/showcase.ts` — a vitrine está com fotos da equipe como provisório; o certo são capturas de posts e vídeos reais (4:5)
- [ ] `lib/clients.ts` — logos dos clientes; enquanto a lista estiver vazia a faixa "Marcas que confiam na LANÇA+" não é renderizada
- [ ] Definir o destino do formulário: hoje ele só abre o WhatsApp com a mensagem pronta, sem registrar o lead em lugar nenhum

## Pré-lançamento: a página Em breve

Por padrão todo visitante cai em `/em-breve` e o site fica invisível. Quem
acerta a senha recebe um cookie de 30 dias e passa a navegar normalmente.

O portão **falha fechado de propósito**: um deploy novo, sem nenhuma variável,
nasce em pré-lançamento. Assim o conteúdo ainda de exemplo nunca vai ao ar por
esquecimento.

| Arquivo | Papel |
| --- | --- |
| `proxy.ts` | o porteiro. No Next 16 o arquivo `middleware` virou `proxy` |
| `app/em-breve/page.tsx` | a página pública |
| `components/FormularioAcesso.tsx` | botão "Acessar site" e campo de senha |
| `app/api/acesso/route.ts` | valida a senha e grava o cookie |

Detalhes que importam:

- O porteiro **reescreve** em vez de redirecionar, então a URL original
  permanece: quem chega por um link interno volta direto para ele após entrar.
- O cookie é `httpOnly`, fora do alcance de scripts da página.
- Com `SENHA_PREVIA` ativa, o `robots.txt` passa a barrar todos os buscadores e
  a página Em breve é `noindex`.
- **Para abrir o site ao público, defina `SITE_PUBLICO=1`.** Nada mais.

Em desenvolvimento, a senha vem de `.env.local` (que o git ignora). Depois de
criar ou mudar esse arquivo, reinicie o servidor: o `proxy` só é lido na
inicialização.

## Deploy

Duas variáveis no painel da Vercel:

| Variável | Para quê |
| --- | --- |
| `SENHA_PREVIA` | senha para entrar no site durante o pré-lançamento |
| `SITE_PUBLICO` | defina como `1` no dia de abrir o site ao público |
| `NEXT_PUBLIC_SITE_URL` | domínio de produção; alimenta `metadataBase`, sitemap, robots e JSON-LD |

O projeto ainda não está versionado nem ligado à Vercel. O caminho mais curto,
a partir da raiz do projeto:

```bash
npx vercel
```

O comando pede login pelo navegador na primeira vez, cria o projeto e publica.
Depois, `npx vercel --prod` promove para produção.

Alternativa que vale mais a longo prazo: subir para o GitHub e ligar o
repositório à Vercel, para cada push publicar sozinho.

```bash
npm run build
```
