import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SocialPageHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const SocialPageHero = ({ eyebrow, title, subtitle, action, footer, className }: SocialPageHeroProps) => {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-black/60 px-5 py-6 shadow-[0_28px_90px_-52px_rgba(0,0,0,1)] backdrop-blur-2xl md:px-7 md:py-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(153,238,0,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,116,57,0.14),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_32%)]" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
              {eyebrow}
            </span>
            <h1 className="mt-4 font-headline text-3xl font-extrabold leading-[0.95] tracking-tighter text-white md:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 md:text-base">{subtitle}</p>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </section>
  );
};

export default SocialPageHero;
