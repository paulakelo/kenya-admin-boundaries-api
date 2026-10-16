import React from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopButtonProps {
  visible: boolean;
  onClick: () => void;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({ visible, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scroll back to top of page"
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 rounded-md bg-surface-raised border border-border-subtle text-text-body hover:border-accent hover:text-text-heading transition-all duration-200 cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base focus-visible:outline-none ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-4 w-4 text-accent transition-transform duration-150 group-hover:-translate-y-0.5" aria-hidden="true" />
      <span className="text-xs font-mono font-medium tracking-wider">TOP</span>
    </button>
  );
};
