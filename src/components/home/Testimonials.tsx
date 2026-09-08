import { testimonials } from '@/data/site';

/** Depoimentos publicados na loja atual — sem carrossel, apenas tipografia. */
export function Testimonials() {
  return (
    <section
      className="border-t border-line bg-ink text-paper"
      aria-labelledby="depoimentos-title"
    >
      <div className="container py-14 md:py-20">
        <p className="eyebrow mb-3 text-paper/55">Quem já usa</p>
        <h2
          id="depoimentos-title"
          className="mb-10 font-display text-[1.65rem] leading-[1.15] md:mb-14 md:text-[2.1rem]"
        >
          Depoimentos
        </h2>

        <ul className="grid gap-10 md:grid-cols-2 md:gap-14">
          {testimonials.map((t) => (
            <li key={t.author} className="border-t border-paper/15 pt-6">
              <blockquote>
                <p className="font-display text-lg leading-snug text-paper md:text-[1.35rem]">
                  “{t.text}”
                </p>
                <footer className="mt-5 text-2xs uppercase tracking-widest2 text-gold-soft">
                  {t.author}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
