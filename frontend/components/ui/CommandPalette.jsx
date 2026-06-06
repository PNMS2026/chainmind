"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Bot, ListTodo, Shield, Vote,
  Home, ArrowRight, Command, Zap
} from "lucide-react";

const PAGES = [
  { id: "home", label: "Home", path: "/", icon: Home, section: "Navigate" },
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, section: "Navigate" },
  { id: "agents", label: "Agents", path: "/agents", icon: Bot, section: "Navigate" },
  { id: "tasks", label: "Task Marketplace", path: "/tasks", icon: ListTodo, section: "Navigate" },
  { id: "proofs", label: "Proof Explorer", path: "/proofs", icon: Shield, section: "Navigate" },
  { id: "governance", label: "Governance", path: "/governance", icon: Vote, section: "Navigate" },
];

const AGENTS = [
  { id: "agent-1", label: "SentinelAI", path: "/agents/1", icon: Bot, section: "Agents", hint: "Sentiment Analysis" },
  { id: "agent-2", label: "AlphaTrader", path: "/agents/2", icon: Bot, section: "Agents", hint: "Price Prediction" },
  { id: "agent-3", label: "RiskGuard", path: "/agents/3", icon: Bot, section: "Agents", hint: "Risk Assessment" },
  { id: "agent-4", label: "OracleX", path: "/agents/4", icon: Bot, section: "Agents", hint: "Oracle" },
];

const ACTIONS = [
  { id: "new-task", label: "Create New Task", path: "/tasks", icon: Zap, section: "Actions", hint: "Open task form" },
];

const ALL_ITEMS = [...PAGES, ...AGENTS, ...ACTIONS];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter items
  const filtered = query.trim() === ""
    ? ALL_ITEMS
    : ALL_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          (item.hint && item.hint.toLowerCase().includes(query.toLowerCase())) ||
          item.section.toLowerCase().includes(query.toLowerCase())
      );

  // Group by section
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const flatFiltered = filtered;

  // Navigate to selected item
  const selectItem = useCallback(
    (item) => {
      setOpen(false);
      router.push(item.path);
    },
    [router]
  );

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && flatFiltered[activeIndex]) {
      e.preventDefault();
      selectItem(flatFiltered[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div className="cmd-backdrop" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="cmd-palette">
        {/* Search input */}
        <div className="cmd-input-wrap">
          <Search size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, agents, actions…"
            className="cmd-input"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        {/* Results */}
        <div className="cmd-list" ref={listRef}>
          {flatFiltered.length === 0 ? (
            <div className="cmd-empty">No results for "{query}"</div>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <div className="cmd-section-label">{section}</div>
                {items.map((item) => {
                  flatIndex++;
                  const idx = flatIndex;
                  const Icon = item.icon;
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={item.id}
                      data-index={idx}
                      className={`cmd-item ${isActive ? "cmd-item-active" : ""}`}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                        <Icon size={16} style={{ color: isActive ? "var(--text-primary)" : "var(--text-tertiary)", flexShrink: 0 }} />
                        <span style={{ fontWeight: "500" }}>{item.label}</span>
                        {item.hint && (
                          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{item.hint}</span>
                        )}
                      </div>
                      <ArrowRight size={14} style={{ color: "var(--text-tertiary)", opacity: isActive ? 1 : 0, transition: "opacity 100ms" }} />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </>
  );
}
