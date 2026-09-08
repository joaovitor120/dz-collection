import { chromium } from 'playwright';

const BASE = 'http://localhost:3100';
const EXEC = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const PHONE = '5527996441300';

const slugs = [
  'oculos-de-sol-atena-camuflado',
  'oculos-de-sol-celeste-preto',
  'oculos-de-sol-luna-preto-degrade',
  'oculos-de-sol-valentina-preto-dourado',
  'oculos-de-sol-vogue-preto-marrom',
  'oculos-de-sol-oval-mimie-tartaruga',
  'oculos-de-sol-range-preto-dourado',
  'oculos-de-sol-rancher-dourado',
];

const fails = [];
const notes = [];
function check(cond, msg) {
  if (!cond) fails.push('FAIL ' + msg);
}

const browser = await chromium.launch({ executablePath: EXEC });
const consoleErrors = [];

async function newPage(width = 1440, height = 900, mobile = false) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message));
  return { ctx, page };
}

// ---------------------------------------------------------------- 1. WhatsApp
{
  const { ctx, page } = await newPage();
  const seen = new Map();
  for (const slug of slugs) {
    await page.goto(`${BASE}/produtos/${slug}`, { waitUntil: 'domcontentloaded' });
    const name = (await page.locator('h1').first().innerText()).trim();
    const href = await page
      .locator('[data-testid="whatsapp-buy"][data-product-slug="' + slug + '"]')
      .first()
      .getAttribute('href');
    check(href?.startsWith(`https://wa.me/${PHONE}?text=`), `${slug}: wa.me/${PHONE}`);
    const text = decodeURIComponent(href.split('?text=')[1]);
    check(text.includes(name), `${slug}: mensagem contém o nome exato "${name}"`);
    check(
      text.includes(`/produtos/${slug}`),
      `${slug}: mensagem contém a URL exata do produto`,
    );
    check(!/localhost|127\.0\.0\.1/.test(text), `${slug}: mensagem sem localhost`);
    check(/R\$/.test(text), `${slug}: mensagem contém preço`);
    seen.set(slug, text);
  }
  const uniqueNames = new Set([...seen.values()].map((t) => t.split('\n')[0]));
  const uniqueUrls = new Set(
    [...seen.values()].map((t) => t.split('\n').pop()),
  );
  check(uniqueNames.size === slugs.length, 'cada produto envia um nome diferente');
  check(uniqueUrls.size === slugs.length, 'cada produto envia uma URL diferente');
  notes.push(`mensagem de exemplo:\n${[...seen.values()][0]}`);
  await ctx.close();
}

// ------------------------------------------------- 2. Card → WhatsApp/produto
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/catalogo`, { waitUntil: 'networkidle' });
  const cards = page.locator('[data-testid="whatsapp-buy"]');
  const count = await cards.count();
  check(count === 8, `catálogo tem 8 botões Comprar (tem ${count})`);
  const hrefs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  check(new Set(hrefs).size === 8, 'os 8 botões do catálogo têm links distintos');

  // clique no nome leva à página do produto, não ao WhatsApp
  await page.locator('article h3 a').first().click();
  await page.waitForURL(/\/produtos\//, { timeout: 15000 }).catch(() => {});
  check(
    page.url().includes('/produtos/'),
    `clicar no nome abre a página do produto (${page.url()})`,
  );
  await ctx.close();
}

// -------------------------------------------------------- 3. Nada de carrinho
{
  const { ctx, page } = await newPage();
  for (const path of ['/', '/catalogo', '/produtos/' + slugs[0], '/contato', '/sobre']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const term of [
      'adicionar ao carrinho',
      'meu carrinho',
      'finalizar compra',
      'finalizar pedido',
      'checkout',
      'sacola',
      'lorem ipsum',
      'placeholder',
      'coming soon',
      'em breve',
    ]) {
      check(!body.includes(term), `${path}: sem "${term}"`);
    }
  }
  await ctx.close();
}

// ----------------------------------------------------------- 4. Busca overlay
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Buscar produtos' }).click();
  const input = page.getByRole('searchbox', { name: /Buscar por modelo/i });
  await input.fill('luna');
  await page.waitForTimeout(250);
  const results = page.locator('[role="dialog"] ul li a');
  check((await results.count()) >= 1, 'busca "luna" retorna resultado');
  await input.fill('zzzzzz');
  await page.waitForTimeout(250);
  check(
    (await page.locator('text=Nada encontrado').count()) === 1,
    'busca sem resultado mostra estado vazio',
  );
  await page.keyboard.press('Escape');
  check(
    (await page.locator('[role="dialog"]').count()) === 0,
    'Escape fecha o overlay de busca',
  );
  await ctx.close();
}

// ------------------------------------------------- 5. Filtros e ordenação
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/catalogo`, { waitUntil: 'networkidle' });

  await page.getByRole('checkbox', { name: /Redondo/ }).check({ force: true });
  await page.waitForTimeout(300);
  check(
    (await page.locator('article').count()) === 4,
    'filtro Redondo devolve 4 produtos',
  );
  check(page.url().includes('categoria=redondo'), 'filtro reflete na URL');

  await page.getByRole('button', { name: /Limpar tudo/ }).click();
  await page.waitForTimeout(300);
  check((await page.locator('article').count()) === 8, 'limpar filtros volta a 8');

  const retangular = page.getByRole('checkbox', { name: /Retangular/ });
  check(await retangular.isDisabled(), 'categoria vazia (Retangular) fica desabilitada');

  await page.getByRole('checkbox', { name: /Em promoção/ }).check({ force: true });
  await page.waitForTimeout(300);
  check(
    (await page.locator('article').count()) === 4,
    'filtro promoção devolve 4 produtos',
  );
  await page.getByRole('button', { name: /Limpar tudo/ }).click();
  await page.waitForTimeout(250);

  await page.getByRole('button', { name: /Ordenar/ }).click();
  await page.getByRole('option', { name: 'Menor preço' }).click();
  await page.waitForTimeout(300);
  const first = await page.locator('article h3').first().innerText();
  check(
    /Celeste|Valentina/.test(first),
    `ordenação menor preço traz produto de R$119,90 primeiro (veio "${first}")`,
  );
  check(page.url().includes('ordenar=menor-preco'), 'ordenação reflete na URL');
  await ctx.close();
}

// -------------------------------------- 6. URL compartilhável reconstrói estado
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/catalogo?categoria=gatinho`, { waitUntil: 'networkidle' });
  check(
    (await page.locator('article').count()) === 1,
    'URL com ?categoria=gatinho já abre filtrada',
  );
  await page.goto(`${BASE}/catalogo?busca=dourado`, { waitUntil: 'networkidle' });
  check(
    (await page.locator('article').count()) >= 1,
    'URL com ?busca= já abre com a busca aplicada',
  );
  await ctx.close();
}

// ------------------------------------------------------------ 7. Teclado
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => document.activeElement?.textContent);
  check(
    /Ir para o conteúdo/.test(firstFocus ?? ''),
    `primeiro Tab foca o skip link (foi "${firstFocus}")`,
  );
  let reachedBuy = false;
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const t = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') ?? '',
    );
    if (t === 'whatsapp-buy') {
      reachedBuy = true;
      break;
    }
  }
  check(reachedBuy, 'CTA de compra é alcançável só com o teclado');
  await ctx.close();
}

// -------------------------------------------------------- 8. Mobile / sticky
{
  const { ctx, page } = await newPage(390, 780, true);
  await page.goto(`${BASE}/produtos/${slugs[0]}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(700);
  const stickyVisible = await page.evaluate(() => {
    const bar = document.querySelector('[data-testid="sticky-buy-bar"]');
    if (!bar) return false;
    const style = getComputedStyle(bar);
    const box = bar.getBoundingClientRect();
    return (
      style.visibility === 'visible' &&
      box.bottom <= window.innerHeight + 2 &&
      box.top > window.innerHeight / 2
    );
  });
  check(stickyVisible, 'CTA fixo aparece no mobile após rolar');

  // menu mobile
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.waitForTimeout(300);
  check(
    (await page.getByRole('dialog', { name: 'Menu' }).count()) === 1,
    'menu mobile abre',
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  check(
    (await page.getByRole('dialog', { name: 'Menu' }).count()) === 0,
    'Escape fecha o menu mobile',
  );
  await ctx.close();
}

// ----------------------------------------------- 9. Sem scroll horizontal
{
  for (const w of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440]) {
    const { ctx, page } = await newPage(w, 900, w < 768);
    for (const path of ['/', '/catalogo', '/produtos/' + slugs[2], '/contato']) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      check(overflow <= 1, `${w}px ${path}: sem scroll horizontal (sobra ${overflow}px)`);
    }
    await ctx.close();
  }
}

// ----------------------------------------------------- 10. SEO / structured data
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/produtos/${slugs[2]}`, { waitUntil: 'domcontentloaded' });
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = ld.map((t) => JSON.parse(t)['@type']);
  check(types.includes('Product'), 'JSON-LD Product presente');
  check(types.includes('BreadcrumbList'), 'JSON-LD BreadcrumbList presente');
  check(types.includes('Organization'), 'JSON-LD Organization presente');
  const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
  check(canonical?.includes(slugs[2]), 'canonical aponta para o produto');
  const imgsWithoutAlt = await page.evaluate(
    () => [...document.querySelectorAll('img')].filter((i) => i.alt === null).length,
  );
  check(imgsWithoutAlt === 0, 'todas as imagens têm atributo alt');
  await ctx.close();
}

// ------------------------------------------------------------- 11. 404
{
  const { ctx, page } = await newPage();
  const res = await page.goto(`${BASE}/produtos/nao-existe`, {
    waitUntil: 'domcontentloaded',
  });
  check(res.status() === 404, 'produto inexistente devolve 404');
  check(
    (await page.locator('text=Não encontramos esta página').count()) >= 1,
    'página 404 personalizada',
  );
  check(
    (await page.locator('header').count()) === 1,
    '404 renderiza dentro do layout do site',
  );
  await ctx.close();
}

await browser.close();

console.log('--- console errors ---');
console.log(consoleErrors.length ? consoleErrors.join('\n') : '(nenhum)');
console.log('--- notas ---');
console.log(notes.join('\n'));
console.log('--- resultado ---');
console.log(fails.length ? fails.join('\n') : 'TODOS OS TESTES PASSARAM');
process.exit(fails.length ? 1 : 0);
