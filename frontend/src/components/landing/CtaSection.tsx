import React from "react";
import { Link } from "react-router-dom";

export const CtaSection: React.FC = () => {
  return (
    <section aria-labelledby="cta-heading" className="px-6 max-w-7xl mx-auto py-12 border-t border-border-subtle">
      <div className="rounded-xl bg-surface-raised border border-border-subtle p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 id="cta-heading" className="text-2xl md:text-3xl font-extrabold text-text-heading">
            Ready to Integrate Kenya Administrative Boundaries?
          </h2>
          <p className="text-sm text-text-muted mt-2 max-w-xl leading-relaxed">
            Test live query executions, inspect GeoJSON responses in real-time, and copy production code snippets across multiple languages.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/docs"
            className="px-5 py-2.5 rounded-md bg-accent text-black font-bold text-xs uppercase tracking-wider hover:bg-lime-300 active:scale-95 transition-all shadow-md shadow-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            Launch API Console
          </Link>
          <Link
            to="/map"
            className="px-5 py-2.5 rounded-md bg-surface-base hover:bg-surface-overlay text-text-heading font-bold text-xs uppercase tracking-wider border border-border-strong hover:border-accent/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            Open Map Explorer
          </Link>
        </div>
      </div>
    </section>
  );
};
