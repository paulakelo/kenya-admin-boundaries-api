import React from "react";
import { Link } from "react-router-dom";
import { FOOTER_CONTENT } from "../../data/portalContent";

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t border-border-strong bg-surface-base px-6 py-8 text-xs font-mono text-text-muted">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold">{FOOTER_CONTENT.brand}</span>
            <span className="text-border-strong" aria-hidden="true">//</span>
            <span>{FOOTER_CONTENT.type}</span>
          </div>
          <span className="hidden sm:inline text-border-strong" aria-hidden="true">•</span>
          <span className="text-text-muted/80">{FOOTER_CONTENT.sourcesCitation}</span>
        </div>

        <nav aria-label="Footer Navigation" className="flex items-center gap-6">
          {FOOTER_CONTENT.links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-heading transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm px-1 py-0.5"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.path || "/"}
                className="hover:text-text-heading transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm px-1 py-0.5"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </footer>
  );
};
