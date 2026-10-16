import React from "react";
import { TELEMETRY_STATS } from "../../data/portalContent";

export const TelemetrySection: React.FC = () => {
  return (
    <section aria-labelledby="telemetry-heading" className="px-6 max-w-7xl mx-auto pb-16">
      <h2 id="telemetry-heading" className="sr-only">
        Administrative and Spatial Engine Scale Telemetry
      </h2>
      <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {TELEMETRY_STATS.map((stat) => (
          <div
            key={stat.id}
            className="p-4 rounded-lg bg-surface-raised border border-border-subtle flex flex-col justify-between"
          >
            <dt className="font-mono text-xs uppercase tracking-wider text-text-muted">
              {stat.label}
            </dt>
            <dd className="my-2 text-2xl font-bold font-mono tracking-tight text-text-heading">
              {stat.value}
            </dd>
            <dd className="text-xs text-text-muted truncate" title={stat.description}>
              {stat.unit}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
