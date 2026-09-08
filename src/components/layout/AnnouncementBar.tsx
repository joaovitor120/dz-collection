/**
 * Barra de anúncio com informação real da loja: o conceito da marca e o
 * desconto de 5% no Pix, ambos publicados na loja atual.
 */
export function AnnouncementBar() {
  return (
    <div className="border-b border-ink/10 bg-ink text-paper">
      <div className="container flex h-[var(--dz-announce-h)] items-center justify-center gap-2 text-center">
        <p className="truncate text-[0.62rem] uppercase tracking-widest2 md:text-2xs">
          Seu estilo começa pelo olhar
          <span aria-hidden="true" className="mx-2 text-gold-soft">
            ·
          </span>
          <span className="text-paper/85">5% de desconto no Pix</span>
        </p>
      </div>
    </div>
  );
}
