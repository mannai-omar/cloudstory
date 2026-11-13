import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades content in the first time it scrolls into view. */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? "visible" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function SourceBadge({ live }: { live: boolean }) {
  return (
    <span className={`source-badge ${live ? "live" : ""}`} title={live ? "Loaded from the CloudStory API" : "The API is offline, so this is the built-in copy"}>
      <span className="dot" />
      {live ? "Served by the API" : "Offline copy"}
    </span>
  );
}
