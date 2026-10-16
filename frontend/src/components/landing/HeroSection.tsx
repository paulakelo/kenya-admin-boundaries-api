import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Terminal, Code2, MapPin, ArrowRight, Copy, Check } from "lucide-react";
import { HERO_CONTENT } from "../../data/portalContent";

export const HeroSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(HERO_CONTENT.quickCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-16 pb-16 px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
      {/* Version Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-raised border border-border-subtle rounded-md text-text-muted font-mono text-xs mb-6">
        <Terminal className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        <span className="tracking-wide text-text-heading">{HERO_CONTENT.versionBadge}</span>
      </div>

      {/* Main Single Page H1 */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-heading leading-tight max-w-4xl">
        <span>{HERO_CONTENT.titlePrimary}</span>{" "}
        <span className="text-accent">{HERO_CONTENT.titleAccent}</span>
      </h1>

      {/* Descriptive Prose */}
      <p className="mt-6 text-base sm:text-lg text-text-body max-w-2xl leading-relaxed">
        {HERO_CONTENT.description}
      </p>

      {/* Call to Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to={HERO_CONTENT.primaryCta.path}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-accent-contrast font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        >
          <Code2 className="h-4 w-4" aria-hidden="true" />
          <span>{HERO_CONTENT.primaryCta.label}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        <Link
          to={HERO_CONTENT.secondaryCta.path}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-surface-raised border border-border-subtle text-text-heading font-semibold text-xs uppercase tracking-wider hover:border-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        >
          <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>{HERO_CONTENT.secondaryCta.label}</span>
        </Link>
      </div>

      {/* Quickstart Command Bar */}
      <div className="mt-8 w-full max-w-xl flex items-center justify-between p-2 rounded-lg bg-surface-raised border border-border-subtle font-mono text-xs">
        <div className="flex items-center gap-2 text-text-body truncate pl-2">
          <span className="text-accent select-none" aria-hidden="true">$</span>
          <span className="truncate">{HERO_CONTENT.quickCurl}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "cURL command copied to clipboard" : "Copy cURL command to clipboard"}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-overlay hover:bg-border-subtle rounded text-xs text-text-heading transition-colors shrink-0 ml-2 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span className="text-accent font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
