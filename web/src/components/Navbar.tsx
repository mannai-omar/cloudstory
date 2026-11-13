import { useState } from "react";
import { Cloud, GitBranch, Menu, X } from "lucide-react";
import { GITHUB_URL } from "../content";

const links = [
  { id: "story", label: "The story" },
  { id: "journey", label: "The journey" },
  { id: "explore", label: "Explore" },
  { id: "operations", label: "Operations" },
  { id: "build", label: "Behind the build" },
];

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Brand() {
  return (
    <a className="brand" href="#top" aria-label="CloudStory home">
      <span className="brand-icon">
        <Cloud size={21} />
      </span>
      cloudstory<span className="brand-dot">.</span>
    </a>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  const go = (id: string) => {
    scrollToSection(id);
    setOpen(false);
  };

  return (
    <nav className="navbar">
      <Brand />

      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </button>

      <div className={`nav-links ${open ? "open" : ""}`}>
        {links.map((link) => (
          <button key={link.id} onClick={() => go(link.id)}>
            {link.label}
          </button>
        ))}
      </div>

      <a className="nav-github" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
        <GitBranch size={16} /> GitHub
      </a>
    </nav>
  );
}
