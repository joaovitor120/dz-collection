import { benefits } from '@/data/site';
import { ChatIcon, PixIcon, ShieldIcon, SparkleIcon } from '@/components/ui/Icon';

const icons = {
  shield: ShieldIcon,
  pix: PixIcon,
  chat: ChatIcon,
  sparkle: SparkleIcon,
};

export function Benefits() {
  return (
    <section className="container py-14 md:py-16" aria-label="Benefícios">
      <ul className="grid gap-x-6 gap-y-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => {
          const Icon = icons[b.icon];
          return (
            <li key={b.title} className="flex gap-3.5">
              <Icon className="h-6 w-6 shrink-0 text-gold" />
              <div>
                <h3 className="text-[0.82rem] font-medium">{b.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{b.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
