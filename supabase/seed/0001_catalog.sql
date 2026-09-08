-- =============================================================================
-- SEED DO CATÁLOGO — gerado por scripts/generate-seed.mts
-- =============================================================================
-- Os 8 produtos reais auditados na loja Nuvemshop em 07/09/2026.
-- Preços em CENTAVOS. Slugs preservados exatamente como já estão publicados,
-- para que nenhum link enviado por WhatsApp quebre.
--
-- Idempotente: ON CONFLICT em todas as inserções. Pode reaplicar à vontade.
-- =============================================================================

begin;

-- ---------------------------------------------------------------- categorias
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('redondo', 'Redondo', 'Armações redondas e ovais, do vintage ao urbano.', 'Feminino', 0, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('gatinho', 'Gatinho', 'O cat-eye que define o olhar.', 'Feminino', 1, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('quadrado', 'Quadrado', 'Linhas geométricas e presença.', 'Feminino', 2, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('aviador', 'Aviador', 'O clássico que nunca sai de moda.', 'Feminino', 3, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('retangular', 'Retangular', null, 'Feminino', 4, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;

-- ------------------------------------------------------------------ produtos

-- Óculos de Sol Atena - Camuflado
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Atena - Camuflado', 'oculos-de-sol-atena-camuflado',
  'A elegância clássica do animal print em uma armação que nunca sai de moda. O Óculos de Sol Atena apresenta lentes em degradê suave combinadas com uma estampa tartaruga rica em detalhes, trazendo um ar sofisticado, versátil e cheio de charme para o seu dia a dia.',
  (select id from public.categories where slug = 'redondo'),
  12990, null,
  1, true, true, false, 0,
  'Óculos de Sol Atena - Camuflado', 'A elegância clássica do animal print em uma armação que nunca sai de moda. O Óculos de Sol Atena apresenta lentes em degradê suave combinadas com uma estampa tartaruga rica em detalhes, trazendo um ar sofisticado, versátil e cheio de charme para o seu dia a dia.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'atena/oculos-atena-camuflado-01.webp', 'Modelo usando o Óculos de Sol Atena camuflado, com lentes em degradê, ao ar livre', 0, true
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'atena/oculos-atena-camuflado-02.webp', 'Óculos de Sol Atena camuflado apoiado sobre superfície clara, visto de frente', 1, false
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'atena/oculos-atena-camuflado-03.webp', 'Detalhe da armação camuflada e das hastes do Óculos de Sol Atena', 2, false
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'atena/oculos-atena-camuflado-04.webp', 'Óculos de Sol Atena camuflado em close, mostrando a estampa tartaruga', 3, false
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '4,7 cm', 0
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '2,3 cm', 1
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '14 cm', 2
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;

-- Óculos de Sol Celeste - Preto
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Celeste - Preto', 'oculos-de-sol-celeste-preto',
  'Presença marcante e design cheio de personalidade! O Óculos de Sol Celeste aposta em lentes escuras e uma armação redonda encorpada com detalhes texturizados nas bordas, criando um visual moderno, urbano e autêntico.

O acessório perfeito para quem quer transformar qualquer look básico em uma produção cheia de estilo e atitude.',
  (select id from public.categories where slug = 'redondo'),
  11990, 14990,
  1, true, true, false, 1,
  'Óculos de Sol Celeste - Preto', 'Presença marcante e design cheio de personalidade! O Óculos de Sol Celeste aposta em lentes escuras e uma armação redonda encorpada com detalhes texturizados nas bordas, criando um visual moderno, urbano e autêntico.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'celeste/oculos-celeste-preto-01.webp', 'Modelo usando o Óculos de Sol Celeste preto, de armação redonda encorpada', 0, true
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'celeste/oculos-celeste-preto-02.webp', 'Óculos de Sol Celeste preto segurado na mão, visto de frente', 1, false
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'celeste/oculos-celeste-preto-03.webp', 'Modelo de perfil usando o Óculos de Sol Celeste preto', 2, false
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '4,6 cm', 0
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '1,6 cm', 1
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '13,5 cm', 2
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Material', 'Acetato Premium', 3
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formato', 'Redondo', 4
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Lente', 'Preto, resistente a riscos', 5
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Proteção', 'UV400 (100% proteção contra raios UVA e UVB)', 6
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formatos de rosto recomendados', 'Quadrado, retangular e oval', 7
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Cor da haste', 'Preto', 8
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;

-- Óculos de Sol Luna - Preto Degradê
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Luna - Preto Degradê', 'oculos-de-sol-luna-preto-degrade',
  'O charme atemporal do formato redondo com um acabamento impecável! O Óculos de Sol Luna combina lentes em degradê com uma armação delicada em tons escuros e dourados, trazendo um visual moderno, chique e cheio de personalidade.

Um modelo versátil que transita perfeitamente entre um passeio ao ar livre e produções mais urbanas, garantindo elegância em qualquer ocasião.',
  (select id from public.categories where slug = 'redondo'),
  12990, 15990,
  1, true, true, true, 2,
  'Óculos de Sol Luna - Preto Degradê', 'O charme atemporal do formato redondo com um acabamento impecável! O Óculos de Sol Luna combina lentes em degradê com uma armação delicada em tons escuros e dourados, trazendo um visual moderno, chique e cheio de personalidade.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'luna/oculos-luna-preto-degrade-01.webp', 'Modelo usando o Óculos de Sol Luna preto degradê, de armação redonda', 0, true
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'luna/oculos-luna-preto-degrade-02.webp', 'Modelo de perfil usando o Óculos de Sol Luna preto degradê', 1, false
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'luna/oculos-luna-preto-degrade-03.webp', 'Óculos de Sol Luna preto degradê visto de frente, com detalhe da armação metálica', 2, false
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'luna/oculos-luna-preto-degrade-04.webp', 'Modelo usando o Óculos de Sol Luna preto degradê em ambiente externo', 3, false
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '5,0 cm', 0
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '2,0 cm', 1
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '14,2 cm', 2
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Material', 'Metal rose', 3
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Lente', 'Preto degradê, resistente a riscos, proteção UV400', 4
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;

-- Óculos de Sol Valentina - Preto Dourado
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Valentina - Preto Dourado', 'oculos-de-sol-valentina-preto-dourado',
  'O Óculos de Sol Valentina traz um design cat-eye super moderno e geométrico, com armação metálica dourada delicada e lentes escuras que garantem proteção e muito mistério.

Perfeito para quem ama se destacar com elegância, personalidade e um toque de alta costura. Um modelo empoderado que eleva instantaneamente o visual.',
  (select id from public.categories where slug = 'gatinho'),
  11990, 14990,
  1, true, true, false, 3,
  'Óculos de Sol Valentina - Preto Dourado', 'O Óculos de Sol Valentina traz um design cat-eye super moderno e geométrico, com armação metálica dourada delicada e lentes escuras que garantem proteção e muito mistério.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'valentina/oculos-valentina-preto-dourado-01.webp', 'Modelo usando o Óculos de Sol Valentina, cat-eye com armação dourada e lentes pretas', 0, true
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'valentina/oculos-valentina-preto-dourado-02.webp', 'Óculos de Sol Valentina preto e dourado apoiado sobre bandeja clara', 1, false
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'valentina/oculos-valentina-preto-dourado-03.webp', 'Modelo em close usando o Óculos de Sol Valentina preto e dourado', 2, false
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formato', 'Gatinho', 0
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Tamanho', 'Médio', 1
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '3,8 cm', 2
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '1,5 cm', 3
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '13,5 cm', 4
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Material', 'Metal', 5
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Cor da lente', 'Preto', 6
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Cor da haste', 'Dourado', 7
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Tipo', 'Feminino', 8
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Proteção', 'UV400', 9
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Resistência', 'Lente resistente a risco', 10
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formatos de rosto ideais', 'Rosto redondo, quadrado e oval. O formato gatinho é especialmente flattering para rostos redondos, pois cria definição, e também funciona perfeitamente para rostos quadrados, suavizando as linhas.', 11
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;

-- Óculos de sol Vogue - Preto Marrom
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de sol Vogue - Preto Marrom', 'oculos-de-sol-vogue-preto-marrom',
  'O modelo Vogue traduz a essência da modernidade e da alta-costura em um único acessório. Com uma armação geométrica de acetato encorpado e lentes com proteção UV, este óculos une perfeitamente o estilo urbano com a elegância clássica.',
  (select id from public.categories where slug = 'quadrado'),
  15990, null,
  2, true, false, true, 4,
  'Óculos de sol Vogue - Preto Marrom', 'O modelo Vogue traduz a essência da modernidade e da alta-costura em um único acessório. Com uma armação geométrica de acetato encorpado e lentes com proteção UV, este óculos une perfeitamente o estilo urbano com a elegância clássica.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'vogue/oculos-vogue-preto-marrom-01.webp', 'Modelo usando o Óculos de sol Vogue, quadrado em acetato preto com lentes marrons', 0, true
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'vogue/oculos-vogue-preto-marrom-02.webp', 'Óculos de sol Vogue preto e marrom segurado ao lado de uma bolsa clara', 1, false
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'vogue/oculos-vogue-preto-marrom-03.webp', 'Modelo em close usando o Óculos de sol Vogue preto e marrom', 2, false
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Lente', '50 mm', 0
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '10 mm', 1
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Haste', '138 mm', 2
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
delete from public.product_highlights
where product_id = (select id from public.products where slug = 'oculos-de-sol-vogue-preto-marrom');
insert into public.product_highlights (product_id, text, display_order)
select id, 'Armação retangular em acetato premium', 0 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Hastes de mola para maior conforto, flexibilidade e durabilidade', 1 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Lentes de policarbonato resistentes a riscos', 2 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Proteção UV400', 3 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Tamanho médio', 4 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Unissex', 5 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';

-- Óculos de Sol Oval Mimié - Tartaruga
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Oval Mimié - Tartaruga', 'oculos-de-sol-oval-mimie-tartaruga',
  'Uma fusão perfeita entre o charme vintage e a sofisticação moderna. O modelo Mimié traz um formato oval delicado com a clássica estampa tartaruga (havana), garantindo um visual elegante e atemporal para qualquer ocasião.

O formato oval é especialmente flattering para rostos quadrados e retangulares, pois suaviza as linhas e cria uma expressão mais delicada e sofisticada. Para rostos redondos e ovais, o tamanho pequeno e refinado traz harmonia e elegância. É aquele óculos que valoriza qualquer rosto!',
  (select id from public.categories where slug = 'redondo'),
  15990, null,
  1, true, false, true, 5,
  'Óculos de Sol Oval Mimié - Tartaruga', 'Uma fusão perfeita entre o charme vintage e a sofisticação moderna. O modelo Mimié traz um formato oval delicado com a clássica estampa tartaruga (havana), garantindo um visual elegante e atemporal para qualquer ocasião.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'mimie/oculos-mimie-tartaruga-01.webp', 'Modelo usando o Óculos de Sol Oval Mimié com estampa tartaruga', 0, true
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'mimie/oculos-mimie-tartaruga-02.webp', 'Óculos de Sol Oval Mimié tartaruga apoiado sobre superfície clara, visto de frente', 1, false
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formato', 'Oval', 0
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Tamanho', 'Pequeno', 1
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '3,8 cm', 2
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '1,5 cm', 3
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '12,7 cm', 4
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Material', 'Acetato Premium', 5
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Tipo', 'Feminino', 6
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Proteção', 'UV400', 7
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Resistência', 'Lente resistente a risco', 8
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
delete from public.product_highlights
where product_id = (select id from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga');
insert into public.product_highlights (product_id, text, display_order)
select id, 'Design: armação oval clássica e versátil.', 0 from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Acabamento: estampa tartaruga em tons de marrom e âmbar com detalhes refinados.', 1 from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Conforto: estrutura leve em acetato de alta qualidade para uso prolongado.', 2 from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Proteção: lentes marrons com proteção UV.', 3 from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga';

-- Óculos de Sol Range Preto Dourado
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Range Preto Dourado', 'oculos-de-sol-range-preto-dourado',
  'Sofisticação, personalidade e elegância em um único acessório. Este modelo hexagonal da DZ Collection combina linhas modernas com detalhes refinados, criando um visual marcante para mulheres que valorizam estilo em qualquer ocasião.

A armação metálica dourada traz leveza e um acabamento premium, enquanto as hastes robustas em preto, com detalhe exclusivo, elevam o design e garantem um toque de luxo. As lentes escuras oferecem proteção UV400, protegendo seus olhos contra os raios UVA e UVB com muito estilo.

Ideal para compor looks casuais, urbanos ou sofisticados, este modelo é perfeito para quem deseja um acessório versátil e atemporal.',
  null,
  14990, null,
  1, true, false, false, 6,
  'Óculos de Sol Range Preto Dourado', 'Sofisticação, personalidade e elegância em um único acessório. Este modelo hexagonal da DZ Collection combina linhas modernas com detalhes refinados, criando um visual marcante para mulheres que valorizam estilo em qualquer ocasião.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'range/oculos-range-preto-dourado-01.webp', 'Modelo usando o Óculos de Sol Range hexagonal, com armação dourada e hastes pretas', 0, true
from public.products where slug = 'oculos-de-sol-range-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'range/oculos-range-preto-dourado-02.webp', 'Óculos de Sol Range preto e dourado segurado na mão', 1, false
from public.products where slug = 'oculos-de-sol-range-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'range/oculos-range-preto-dourado-03.webp', 'Óculos de Sol Range preto e dourado apoiado sobre bandeja clara', 2, false
from public.products where slug = 'oculos-de-sol-range-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
delete from public.product_highlights
where product_id = (select id from public.products where slug = 'oculos-de-sol-range-preto-dourado');
insert into public.product_highlights (product_id, text, display_order)
select id, 'Design hexagonal moderno e elegante.', 0 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Armação metálica dourada de alta qualidade.', 1 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Hastes premium com acabamento sofisticado.', 2 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Lentes com proteção UV400.', 3 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Leve, confortável e resistente para o uso diário.', 4 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Combina com diversos formatos de rosto.', 5 from public.products where slug = 'oculos-de-sol-range-preto-dourado';

-- Óculos de Sol Rancher - Dourado
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Rancher - Dourado', 'oculos-de-sol-rancher-dourado',
  'Inspirado no estilo country de luxo, o Rancher combina personalidade, elegância e autenticidade em um único acessório. Seu design aviador com acabamento metálico dourado e lentes em degradê traz um visual sofisticado, enquanto as hastes exclusivas com detalhe inspirado em esporas adicionam um toque marcante e cheio de atitude.

Ideal para quem busca um óculos versátil, o Rancher acompanha desde os dias no campo até produções urbanas, elevando qualquer look com charme e presença.

Rancher by DZ Collection. Para quem carrega a liberdade no olhar e a elegância em cada detalhe.',
  (select id from public.categories where slug = 'aviador'),
  12990, 15990,
  1, true, false, false, 7,
  'Óculos de Sol Rancher - Dourado', 'Inspirado no estilo country de luxo, o Rancher combina personalidade, elegância e autenticidade em um único acessório. Seu design aviador com acabamento metálico dourado e lentes em degradê traz um visual sofisticado, enquanto as hastes exclusivas com detalhe inspirado em esporas adicionam um toque '
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'rancher/oculos-rancher-dourado-01.webp', 'Modelo de chapéu usando o Óculos de Sol Rancher dourado, modelo aviador', 0, true
from public.products where slug = 'oculos-de-sol-rancher-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'rancher/oculos-rancher-dourado-02.webp', 'Óculos de Sol Rancher dourado apoiado sobre um chapéu de palha', 1, false
from public.products where slug = 'oculos-de-sol-rancher-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'rancher/oculos-rancher-dourado-03.webp', 'Modelo usando o Óculos de Sol Rancher dourado ao ar livre', 2, false
from public.products where slug = 'oculos-de-sol-rancher-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
delete from public.product_highlights
where product_id = (select id from public.products where slug = 'oculos-de-sol-rancher-dourado');
insert into public.product_highlights (product_id, text, display_order)
select id, 'Design aviador atemporal.', 0 from public.products where slug = 'oculos-de-sol-rancher-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Hastes com detalhe exclusivo inspirado no universo western.', 1 from public.products where slug = 'oculos-de-sol-rancher-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Armação metálica leve e resistente.', 2 from public.products where slug = 'oculos-de-sol-rancher-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Lentes com proteção UV400.', 3 from public.products where slug = 'oculos-de-sol-rancher-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Elegância e conforto para o uso diário.', 4 from public.products where slug = 'oculos-de-sol-rancher-dourado';

-- --------------------------------------------------------------- configurações
insert into public.site_settings (key, value, is_public) values
  ('pix_discount_percent', '5'::jsonb, true),
  ('whatsapp_number', '"5527996441300"'::jsonb, true),
  ('announcement', '{"texto":"Seu estilo começa pelo olhar","complemento":"5% de desconto no Pix"}'::jsonb, true)
on conflict (key) do nothing;

commit;

