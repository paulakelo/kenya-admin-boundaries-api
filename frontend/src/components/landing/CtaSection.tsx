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
            className="px-5 py-2.5 rounded-md bg-accent text-accent-contrast font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            Launch API Console
          </Link>
          <Link
            to="/map"
            className="px-5 py-2.5 rounded-md bg-surface-base hover:bg-surface-overlay text-text-heading font-semibold text-xs uppercase tracking-wider border border-border-subtle hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            Open Map Explorer
          </Link>
        </div>
      </div>
    </section>
  );
};
