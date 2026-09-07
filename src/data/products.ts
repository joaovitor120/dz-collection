import type { Product } from '@/types';

/**
 * ---------------------------------------------------------------------------
 * FONTE DOS DADOS
 * ---------------------------------------------------------------------------
 * Todos os produtos, nomes, preços, promoções, descrições, especificações,
 * estoques e imagens abaixo foram extraídos da loja oficial da DZ Collection
 * em https://dzcollection.lojavirtualnuvem.com.br (auditoria de 07/09/2026).
 *
 * Nada aqui é inventado. Quando a loja não informa um dado (parcelamento real,
 * prazo de entrega, cobertura de frete, redes sociais), o campo simplesmente
 * não existe — em vez de ser preenchido com suposição.
 *
 * `id` é o identificador do produto na loja atual. Ele é crescente por ordem de
 * cadastro, e é por isso — e apenas por isso — que os quatro produtos mais
 * recentes estão marcados com `isNew`. Para mudar quais peças aparecem como
 * lançamento, basta alternar essa flag aqui.
 *
 * `featured` reproduz exatamente os três produtos que a loja atual destaca na
 * própria home. Não há dado público de vendas, portanto a seção do site se
 * chama "Destaques" — nunca "Mais vendidos".
 *
 * `pixPrice` só existe onde a loja realmente exibe o desconto de 5% no Pix.
 * Na loja atual esse desconto não é cumulativo com preço promocional, e por
 * isso os produtos em promoção não têm o campo.
 * ---------------------------------------------------------------------------
 */

export const products: Product[] = [
  {
    id: '361324388',
    slug: 'oculos-de-sol-atena-camuflado',
    name: 'Óculos de Sol Atena - Camuflado',
    category: 'redondo',
    colors: ['Camuflado'],
    price: 129.9,
    pixPrice: 123.41,
    isNew: true,
    stock: 1,
    available: true,
    updatedAt: '2026-08-15T22:00:31Z',
    description: [
      'A elegância clássica do animal print em uma armação que nunca sai de moda. O Óculos de Sol Atena apresenta lentes em degradê suave combinadas com uma estampa tartaruga rica em detalhes, trazendo um ar sofisticado, versátil e cheio de charme para o seu dia a dia.',
    ],
    specifications: [
      { label: 'Diâmetro', value: '4,7 cm' },
      { label: 'Ponte', value: '2,3 cm' },
      { label: 'Largura total', value: '14 cm' },
    ],
    images: [
      '/images/products/atena/oculos-atena-camuflado-01.webp',
      '/images/products/atena/oculos-atena-camuflado-02.webp',
      '/images/products/atena/oculos-atena-camuflado-03.webp',
      '/images/products/atena/oculos-atena-camuflado-04.webp',
    ],
    imageAlts: [
      'Modelo usando o Óculos de Sol Atena camuflado, com lentes em degradê, ao ar livre',
      'Óculos de Sol Atena camuflado apoiado sobre superfície clara, visto de frente',
      'Detalhe da armação camuflada e das hastes do Óculos de Sol Atena',
      'Óculos de Sol Atena camuflado em close, mostrando a estampa tartaruga',
    ],
  },
  {
    id: '361321338',
    slug: 'oculos-de-sol-celeste-preto',
    name: 'Óculos de Sol Celeste - Preto',
    category: 'redondo',
    colors: ['Preto'],
    price: 119.9,
    compareAtPrice: 149.9,
    isNew: true,
    stock: 1,
    available: true,
    updatedAt: '2026-08-15T21:34:52Z',
    description: [
      'Presença marcante e design cheio de personalidade! O Óculos de Sol Celeste aposta em lentes escuras e uma armação redonda encorpada com detalhes texturizados nas bordas, criando um visual moderno, urbano e autêntico.',
      'O acessório perfeito para quem quer transformar qualquer look básico em uma produção cheia de estilo e atitude.',
    ],
    specifications: [
      { label: 'Diâmetro', value: '4,6 cm' },
      { label: 'Ponte', value: '1,6 cm' },
      { label: 'Largura total', value: '13,5 cm' },
      { label: 'Material', value: 'Acetato Premium' },
      { label: 'Formato', value: 'Redondo' },
      { label: 'Lente', value: 'Preto, resistente a riscos' },
      { label: 'Proteção', value: 'UV400 (100% proteção contra raios UVA e UVB)' },
      { label: 'Formatos de rosto recomendados', value: 'Quadrado, retangular e oval' },
      { label: 'Cor da haste', value: 'Preto' },
    ],
    images: [
      '/images/products/celeste/oculos-celeste-preto-01.webp',
      '/images/products/celeste/oculos-celeste-preto-02.webp',
      '/images/products/celeste/oculos-celeste-preto-03.webp',
    ],
    imageAlts: [
      'Modelo usando o Óculos de Sol Celeste preto, de armação redonda encorpada',
      'Óculos de Sol Celeste preto segurado na mão, visto de frente',
      'Modelo de perfil usando o Óculos de Sol Celeste preto',
    ],
  },
  {
    id: '361319562',
    slug: 'oculos-de-sol-luna-preto-degrade',
    name: 'Óculos de Sol Luna - Preto Degradê',
    category: 'redondo',
    colors: ['Preto', 'Degradê'],
    price: 129.9,
    compareAtPrice: 159.9,
    isNew: true,
    featured: true,
    stock: 1,
    available: true,
    updatedAt: '2026-08-15T21:22:39Z',
    description: [
      'O charme atemporal do formato redondo com um acabamento impecável! O Óculos de Sol Luna combina lentes em degradê com uma armação delicada em tons escuros e dourados, trazendo um visual moderno, chique e cheio de personalidade.',
      'Um modelo versátil que transita perfeitamente entre um passeio ao ar livre e produções mais urbanas, garantindo elegância em qualquer ocasião.',
    ],
    specifications: [
      { label: 'Diâmetro', value: '5,0 cm' },
      { label: 'Ponte', value: '2,0 cm' },
      { label: 'Largura total', value: '14,2 cm' },
      { label: 'Material', value: 'Metal rose' },
      { label: 'Lente', value: 'Preto degradê, resistente a riscos, proteção UV400' },
    ],
    images: [
      '/images/products/luna/oculos-luna-preto-degrade-01.webp',
      '/images/products/luna/oculos-luna-preto-degrade-02.webp',
      '/images/products/luna/oculos-luna-preto-degrade-03.webp',
      '/images/products/luna/oculos-luna-preto-degrade-04.webp',
    ],
    imageAlts: [
      'Modelo usando o Óculos de Sol Luna preto degradê, de armação redonda',
      'Modelo de perfil usando o Óculos de Sol Luna preto degradê',
      'Óculos de Sol Luna preto degradê visto de frente, com detalhe da armação metálica',
      'Modelo usando o Óculos de Sol Luna preto degradê em ambiente externo',
    ],
  },
  {
    id: '361317129',
    slug: 'oculos-de-sol-valentina-preto-dourado',
    name: 'Óculos de Sol Valentina - Preto Dourado',
    category: 'gatinho',
    colors: ['Preto', 'Dourado'],
    price: 119.9,
    compareAtPrice: 149.9,
    isNew: true,
    stock: 1,
    available: true,
    updatedAt: '2026-08-15T21:13:57Z',
    description: [
      'O Óculos de Sol Valentina traz um design cat-eye super moderno e geométrico, com armação metálica dourada delicada e lentes escuras que garantem proteção e muito mistério.',
      'Perfeito para quem ama se destacar com elegância, personalidade e um toque de alta costura. Um modelo empoderado que eleva instantaneamente o visual.',
    ],
    specifications: [
      { label: 'Formato', value: 'Gatinho' },
      { label: 'Tamanho', value: 'Médio' },
      { label: 'Diâmetro', value: '3,8 cm' },
      { label: 'Ponte', value: '1,5 cm' },
      { label: 'Largura total', value: '13,5 cm' },
      { label: 'Material', value: 'Metal' },
      { label: 'Cor da lente', value: 'Preto' },
      { label: 'Cor da haste', value: 'Dourado' },
      { label: 'Tipo', value: 'Feminino' },
      { label: 'Proteção', value: 'UV400' },
      { label: 'Resistência', value: 'Lente resistente a risco' },
      {
        label: 'Formatos de rosto ideais',
        value:
          'Rosto redondo, quadrado e oval. O formato gatinho é especialmente flattering para rostos redondos, pois cria definição, e também funciona perfeitamente para rostos quadrados, suavizando as linhas.',
      },
    ],
    images: [
      '/images/products/valentina/oculos-valentina-preto-dourado-01.webp',
      '/images/products/valentina/oculos-valentina-preto-dourado-02.webp',
      '/images/products/valentina/oculos-valentina-preto-dourado-03.webp',
    ],
    imageAlts: [
      'Modelo usando o Óculos de Sol Valentina, cat-eye com armação dourada e lentes pretas',
      'Óculos de Sol Valentina preto e dourado apoiado sobre bandeja clara',
      'Modelo em close usando o Óculos de Sol Valentina preto e dourado',
    ],
  },
  {
    id: '361314022',
    slug: 'oculos-de-sol-vogue-preto-marrom',
    name: 'Óculos de sol Vogue - Preto Marrom',
    category: 'quadrado',
    colors: ['Preto', 'Marrom'],
    price: 159.9,
    pixPrice: 151.91,
    featured: true,
    stock: 2,
    available: true,
    updatedAt: '2026-08-15T20:36:36Z',
    description: [
      'O modelo Vogue traduz a essência da modernidade e da alta-costura em um único acessório. Com uma armação geométrica de acetato encorpado e lentes com proteção UV, este óculos une perfeitamente o estilo urbano com a elegância clássica.',
    ],
    highlights: [
      'Armação retangular em acetato premium',
      'Hastes de mola para maior conforto, flexibilidade e durabilidade',
      'Lentes de policarbonato resistentes a riscos',
      'Proteção UV400',
      'Tamanho médio',
      'Unissex',
    ],
    specifications: [
      { label: 'Lente', value: '50 mm' },
      { label: 'Ponte', value: '10 mm' },
      { label: 'Haste', value: '138 mm' },
    ],
    images: [
      '/images/products/vogue/oculos-vogue-preto-marrom-01.webp',
      '/images/products/vogue/oculos-vogue-preto-marrom-02.webp',
      '/images/products/vogue/oculos-vogue-preto-marrom-03.webp',
    ],
    imageAlts: [
      'Modelo usando o Óculos de sol Vogue, quadrado em acetato preto com lentes marrons',
      'Óculos de sol Vogue preto e marrom segurado ao lado de uma bolsa clara',
      'Modelo em close usando o Óculos de sol Vogue preto e marrom',
    ],
  },
  {
    id: '360998783',
    slug: 'oculos-de-sol-oval-mimie-tartaruga',
    name: 'Óculos de Sol Oval Mimié - Tartaruga',
    category: 'redondo',
    colors: ['Tartaruga'],
    price: 159.9,
    pixPrice: 151.91,
    featured: true,
    stock: 1,
    available: true,
    updatedAt: '2026-08-14T11:20:29Z',
    description: [
      'Uma fusão perfeita entre o charme vintage e a sofisticação moderna. O modelo Mimié traz um formato oval delicado com a clássica estampa tartaruga (havana), garantindo um visual elegante e atemporal para qualquer ocasião.',
      'O formato oval é especialmente flattering para rostos quadrados e retangulares, pois suaviza as linhas e cria uma expressão mais delicada e sofisticada. Para rostos redondos e ovais, o tamanho pequeno e refinado traz harmonia e elegância. É aquele óculos que valoriza qualquer rosto!',
    ],
    highlights: [
      'Design: armação oval clássica e versátil.',
      'Acabamento: estampa tartaruga em tons de marrom e âmbar com detalhes refinados.',
      'Conforto: estrutura leve em acetato de alta qualidade para uso prolongado.',
      'Proteção: lentes marrons com proteção UV.',
    ],
    specifications: [
      { label: 'Formato', value: 'Oval' },
      { label: 'Tamanho', value: 'Pequeno' },
      { label: 'Diâmetro', value: '3,8 cm' },
      { label: 'Ponte', value: '1,5 cm' },
      { label: 'Largura total', value: '12,7 cm' },
      { label: 'Material', value: 'Acetato Premium' },
      { label: 'Tipo', value: 'Feminino' },
      { label: 'Proteção', value: 'UV400' },
      { label: 'Resistência', value: 'Lente resistente a risco' },
    ],
    images: [
      '/images/products/mimie/oculos-mimie-tartaruga-01.webp',
      '/images/products/mimie/oculos-mimie-tartaruga-02.webp',
    ],
    imageAlts: [
      'Modelo usando o Óculos de Sol Oval Mimié com estampa tartaruga',
      'Óculos de Sol Oval Mimié tartaruga apoiado sobre superfície clara, visto de frente',
    ],
  },
  {
    id: '357756432',
    slug: 'oculos-de-sol-range-preto-dourado',
    // A loja atual não classificou este produto em nenhuma subcategoria —
    // ele aparece apenas em "Feminino". Mantido fiel ao dado real.
    category: null,
    name: 'Óculos de Sol Range Preto Dourado',
    colors: ['Preto', 'Dourado'],
    price: 149.9,
    pixPrice: 142.41,
    stock: 1,
    available: true,
    updatedAt: '2026-07-26T22:10:48Z',
    description: [
      'Sofisticação, personalidade e elegância em um único acessório. Este modelo hexagonal da DZ Collection combina linhas modernas com detalhes refinados, criando um visual marcante para mulheres que valorizam estilo em qualquer ocasião.',
      'A armação metálica dourada traz leveza e um acabamento premium, enquanto as hastes robustas em preto, com detalhe exclusivo, elevam o design e garantem um toque de luxo. As lentes escuras oferecem proteção UV400, protegendo seus olhos contra os raios UVA e UVB com muito estilo.',
      'Ideal para compor looks casuais, urbanos ou sofisticados, este modelo é perfeito para quem deseja um acessório versátil e atemporal.',
    ],
    highlights: [
      'Design hexagonal moderno e elegante.',
      'Armação metálica dourada de alta qualidade.',
      'Hastes premium com acabamento sofisticado.',
      'Lentes com proteção UV400.',
      'Leve, confortável e resistente para o uso diário.',
      'Combina com diversos formatos de rosto.',
    ],
    images: [
      '/images/products/range/oculos-range-preto-dourado-01.webp',
      '/images/products/range/oculos-range-preto-dourado-02.webp',
      '/images/products/range/oculos-range-preto-dourado-03.webp',
    ],
    imageAlts: [
      'Modelo usando o Óculos de Sol Range hexagonal, com armação dourada e hastes pretas',
      'Óculos de Sol Range preto e dourado segurado na mão',
      'Óculos de Sol Range preto e dourado apoiado sobre bandeja clara',
    ],
  },
  {
    id: '357689948',
    slug: 'oculos-de-sol-rancher-dourado',
    name: 'Óculos de Sol Rancher - Dourado',
    category: 'aviador',
    colors: ['Dourado'],
    price: 129.9,
    compareAtPrice: 159.9,
    stock: 1,
    available: true,
    updatedAt: '2026-08-15T21:14:42Z',
    description: [
      'Inspirado no estilo country de luxo, o Rancher combina personalidade, elegância e autenticidade em um único acessório. Seu design aviador com acabamento metálico dourado e lentes em degradê traz um visual sofisticado, enquanto as hastes exclusivas com detalhe inspirado em esporas adicionam um toque marcante e cheio de atitude.',
      'Ideal para quem busca um óculos versátil, o Rancher acompanha desde os dias no campo até produções urbanas, elevando qualquer look com charme e presença.',
      'Rancher by DZ Collection. Para quem carrega a liberdade no olhar e a elegância em cada detalhe.',
    ],
    highlights: [
      'Design aviador atemporal.',
      'Hastes com detalhe exclusivo inspirado no universo western.',
      'Armação metálica leve e resistente.',
      'Lentes com proteção UV400.',
      'Elegância e conforto para o uso diário.',
    ],
    images: [
      '/images/products/rancher/oculos-rancher-dourado-01.webp',
      '/images/products/rancher/oculos-rancher-dourado-02.webp',
      '/images/products/rancher/oculos-rancher-dourado-03.webp',
    ],
    imageAlts: [
      'Modelo de chapéu usando o Óculos de Sol Rancher dourado, modelo aviador',
      'Óculos de Sol Rancher dourado apoiado sobre um chapéu de palha',
      'Modelo usando o Óculos de Sol Rancher dourado ao ar livre',
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/** Lançamentos — produtos marcados como novos, do mais recente para o mais antigo. */
export function getNewArrivals(limit = 4): Product[] {
  return products
    .filter((p) => p.isNew)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, limit);
}

/** Destaques — exatamente os produtos que a loja atual destaca. */
export function getFeatured(): Product[] {
  return products.filter((p) => p.featured);
}

/** Relacionados: mesma categoria primeiro, completando com os mais recentes. */
export function getRelated(product: Product, limit = 4): Product[] {
  const sameCategory = products.filter(
    (p) => p.slug !== product.slug && p.category && p.category === product.category,
  );
  const rest = products
    .filter((p) => p.slug !== product.slug && !sameCategory.includes(p))
    .sort((a, b) => Number(b.id) - Number(a.id));
  return [...sameCategory, ...rest].slice(0, limit);
}
