export type CaseStudy = {
  slug: string;
  client: string;
  niche: string;
  image: string;
  summary: string;
  services: string[];
  result: string;
};

// Placeholders — substitua por cases reais de clientes (com autorização) antes de publicar.
export const caseStudies: CaseStudy[] = [
  {
    slug: "clinica-estetica",
    client: "[Nome do cliente]",
    niche: "Estética",
    image: "/images/team/LFF_0691_resized.jpg",
    summary:
      "Reposicionamento de perfil e estruturação de linha editorial para clínica de estética que não tinha consistência de conteúdo.",
    services: ["Gestão de Marketing", "Audiovisual"],
    result: "[+X% em seguidores / leads em Y meses]",
  },
  {
    slug: "escritorio-advocacia",
    client: "[Nome do cliente]",
    niche: "Direito",
    image: "/images/team/LFF_0726_resized.jpg",
    summary:
      "Construção de autoridade digital para escritório de advocacia com conteúdo educativo dentro das restrições da OAB.",
    services: ["Consultoria", "Identidade Visual"],
    result: "[+X% em engajamento em Y meses]",
  },
  {
    slug: "clinica-saude",
    client: "[Nome do cliente]",
    niche: "Saúde",
    image: "/images/team/LFF_0655_resized.jpg",
    summary:
      "Estratégia de conteúdo e tráfego pago para consultório médico com foco em geração de agendamentos qualificados.",
    services: ["Tráfego Pago", "Gestão de Marketing"],
    result: "[CPL de R$ X / Y agendamentos por mês]",
  },
  {
    slug: "negocio-imobiliario",
    client: "[Nome do cliente]",
    niche: "Imóveis",
    image: "/images/team/LFF_0551_resized.jpg",
    summary:
      "Novo site institucional e identidade visual para imobiliária que precisava de reposicionamento de marca.",
    services: ["Desenvolvimento Web", "Identidade Visual"],
    result: "[X leads via site em Y meses]",
  },
];
