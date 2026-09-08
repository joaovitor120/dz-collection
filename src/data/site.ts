import type { Category, PriceBucket } from '@/types';

/**
 * Conteúdo institucional e de contato — todo extraído da loja atual da
 * DZ Collection. O que a loja não informa (e-mail, endereço, redes sociais,
 * prazos e cobertura de entrega) não aparece aqui e não aparece no site.
 */

export const WHATSAPP_NUMBER = '5527996441300';
export const WHATSAPP_DISPLAY = '+55 27 99644-1300';

export const site = {
  name: 'DZ Collection',
  legalName: 'DZ Collection',
  cnpj: '32.666.481/0001-65',
  tagline: 'Seu estilo começa pelo olhar.',
  shortDescription:
    'Óculos que transformam seu look. Proteção UV400 + estilo + personalidade.',
  intro:
    'Mais do que óculos de sol, acreditamos que cada detalhe do seu look deve refletir sua personalidade. Aqui você encontra modelos selecionados para unir estilo, elegância, proteção UV400 e qualidade em cada momento da sua rotina.',
  /** "Nossa História", como está publicada na loja atual. */
  story: [
    'Na DZ Collection, acreditamos que um óculos de sol vai muito além de um acessório. Ele traduz personalidade, confiança e estilo, valorizando quem você é em cada momento.',
    'Nossa missão é oferecer modelos cuidadosamente selecionados, unindo design, qualidade e proteção para que você se sinta elegante em qualquer ocasião. Cada peça é escolhida pensando em mulheres e homens que buscam sofisticação, conforto e autenticidade.',
    'Trabalhamos com produtos que oferecem proteção UV400, acabamento de qualidade e as principais tendências da moda, para que você tenha segurança sem abrir mão do estilo.',
    'Mais do que vender óculos, queremos proporcionar uma experiência de compra simples, segura e encantadora, com atendimento humanizado e dedicação em cada pedido.',
    'Seja para o dia a dia, uma viagem, um momento especial ou uma nova fase da sua vida, a DZ Collection acredita que o acessório certo pode transformar não apenas o seu visual, mas também a sua confiança.',
  ],
} as const;

/** Benefícios: apenas os que a loja atual realmente comunica. */
export const benefits = [
  {
    title: 'Proteção UV400',
    text: '100% de proteção contra os raios UVA e UVB nos modelos que trazem essa especificação.',
    icon: 'shield' as const,
  },
  {
    title: '5% de desconto no Pix',
    text: 'Desconto aplicado no atendimento. Não acumulável com outras promoções.',
    icon: 'pix' as const,
  },
  {
    title: 'Atendimento pelo WhatsApp',
    text: 'Você fala direto com a DZ Collection para tirar dúvidas e fechar o pedido.',
    icon: 'chat' as const,
  },
  {
    title: 'Seleção curada',
    text: 'Modelos cuidadosamente selecionados, unindo design, qualidade e proteção.',
    icon: 'sparkle' as const,
  },
];

/** Depoimentos publicados na loja atual — reproduzidos na íntegra. */
export const testimonials = [
  {
    author: 'Janaina Luchi',
    text: 'Chegou super rápido e muito bem embalado. O caimento no rosto ficou perfeito, exatamente como na foto do site. Uso em todo lugar e sempre me perguntam qual é a marca. Super recomendo!',
  },
  {
    author: 'Michelly',
    text: 'Comprei sem conhecer e me apaixonei à primeira vista! O óculos é super leve, não machuca o nariz e o acabamento é impecável.',
  },
];

/**
 * Categorias da loja atual (árvore Feminino > formato).
 * "Retangular" existe na loja mas está sem produtos hoje — por isso não é
 * exibida como vitrine, e sim como filtro desabilitado quando não há resultado.
 */
export const categories: Category[] = [
  {
    slug: 'redondo',
    name: 'Redondo',
    parent: 'Feminino',
    description: 'Armações redondas e ovais, do vintage ao urbano.',
    image: '/images/products/celeste/oculos-celeste-preto-02.webp',
  },
  {
    slug: 'gatinho',
    name: 'Gatinho',
    parent: 'Feminino',
    description: 'O cat-eye que define o olhar.',
    image: '/images/products/valentina/oculos-valentina-preto-dourado-02.webp',
  },
  {
    slug: 'quadrado',
    name: 'Quadrado',
    parent: 'Feminino',
    description: 'Linhas geométricas e presença.',
    image: '/images/products/vogue/oculos-vogue-preto-marrom-02.webp',
  },
  {
    slug: 'aviador',
    name: 'Aviador',
    parent: 'Feminino',
    description: 'O clássico que nunca sai de moda.',
    image: '/images/products/rancher/oculos-rancher-dourado-02.webp',
  },
  {
    slug: 'retangular',
    name: 'Retangular',
    parent: 'Feminino',
  },
];

export const priceBuckets: PriceBucket[] = [
  { id: 'ate-129', label: 'Até R$ 129,90', min: 0, max: 129.9 },
  { id: '130-149', label: 'R$ 130,00 a R$ 149,90', min: 129.91, max: 149.9 },
  { id: 'acima-150', label: 'Acima de R$ 149,90', min: 149.91, max: null },
];

/** Bandeiras aceitas, conforme exibido no rodapé da loja atual. */
export const paymentMethods = [
  'Pix',
  'Visa',
  'Mastercard',
  'Elo',
  'American Express',
  'Hipercard',
  'Diners',
  'Discover',
  'Aura',
  'Transferência bancária',
];
