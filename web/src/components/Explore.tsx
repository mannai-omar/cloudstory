import { useMemo, useState } from "react";
import { Cloud, Lightbulb } from "lucide-react";
import { useRemote, type InfraComponent } from "../api";
import { connections, fallbackComponents, layers } from "../content";
import { SourceBadge } from "./Reveal";

export function Explore() {
  const { value } = useRemote<InfraComponent[]>("/api/components");
  const live = value.state === "ok" && value.data.length > 0;
  const components = live ? value.data : fallbackComponents;

  const [selected, setSelected] = useState<string>("eks");
  const current = components.find((c) => c.slug === selected) ?? components[0];

  const neighbours = useMemo(() => {
    const set = new Set<string>();
    for (const [a, b] of connections) {
      if (a === current.slug) set.add(b);
      if (b === current.slug) set.add(a);
    }
    return set;
  }, [current.slug]);

  const byName = (slug: string) => components.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <section className="section section-white" id="explore">
      <div className="section-label">03 / EXPLORE THE CLOUD</div>
      <h2>Meet the cloud crew.</h2>
      <p className="section-description">
        Every component has one job. Pick one to see what it does, why I chose it, and who it talks to.
      </p>

      <div className="journey-toolbar">
        <SourceBadge live={live} />
      </div>

      <div className="explore-layout">
        <div className="infra-map">
          {layers.map((layer) => {
            const items = components.filter((c) => c.layer === layer.id);
            if (items.length === 0) return null;
            return (
              <div key={layer.id} className={`infra-layer layer-${layer.id}`}>
                <div className="layer-title">
                  <strong>{layer.title}</strong>
                  <small>{layer.hint}</small>
                </div>
                <div className="layer-nodes">
                  {items.map((item) => {
                    const state =
                      item.slug === current.slug ? "selected" : neighbours.has(item.slug) ? "linked" : "";
                    return (
                      <button
                        key={item.slug}
                        className={`infra-node ${state}`}
                        onClick={() => setSelected(item.slug)}
                        aria-pressed={item.slug === current.slug}
                      >
                        <span className="node-name">{item.name}</span>
                        <span className="node-tool">{item.tool}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="infra-detail" aria-live="polite">
          <span className="mini-icon icon-lavender">
            <Cloud size={19} />
          </span>
          <span className="detail-label">{layers.find((l) => l.id === current.layer)?.title.toUpperCase()}</span>
          <h3>{current.name}</h3>
          <span className="tool-tag">{current.tool}</span>
          <p>{current.description}</p>

          <div className="why-box">
            <Lightbulb size={16} />
            <p>
              <strong>Why this way? </strong>
              {current.why}
            </p>
          </div>

          {neighbours.size > 0 && (
            <>
              <span className="detail-label">TALKS TO</span>
              <div className="chip-row">
                {[...neighbours].map((slug) => (
                  <button key={slug} className="chip" onClick={() => setSelected(slug)}>
                    {byName(slug)}
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
