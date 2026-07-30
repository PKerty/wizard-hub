"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Subscribe to `data-theme` on <html> (same pattern as ThemeToggle).
 * Re-runs the effect when the theme flips.
 */
function subscribeTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}
function getTheme(): string {
  return document.documentElement.dataset.theme ?? "dark";
}
function getThemeServer(): string {
  return "dark";
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const MAX_SPARKS = 45;

/**
 * Gold sparkle trail ("fairy dust" / rising embers) for the LIGHT theme.
 *
 * The warm torchlight radial (TorchlightCursor → body::after) is near-invisible
 * on parchment, so in light mode we hide it and paint a canvas trail of small
 * gold sparks that spawn at the pointer, drift up, and fade. 'lighter' blending
 * makes overlapping sparks glow brighter.
 *
 * Self-managing rAF loop: starts on first spawn, stops when the last spark dies
 * (no idle rendering). Guards: only active in light theme, disabled under
 * prefers-reduced-motion and pointer:coarse.
 */
export function SparkleTrail() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getThemeServer);

  useEffect(() => {
    if (theme !== "light") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;inset:0;z-index:30;pointer-events:none;";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Cached sparkle sprite (radial-gradient gold glow) — drawn, not recomputed.
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, "rgba(190, 240, 245, 0.8)");
      grad.addColorStop(0.35, "rgba(95, 200, 215, 0.45)");
      grad.addColorStop(1, "rgba(95, 200, 215, 0)");
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 32, 32);
    }

    const sparks: Spark[] = [];
    let raf = 0;
    let lastSpawn = 0;

    const spawn = (x: number, y: number) => {
      const count = 1 + (Math.random() < 0.2 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        if (sparks.length >= MAX_SPARKS) sparks.shift();
        const maxLife = 500 + Math.random() * 300;
        sparks.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.15 - Math.random() * 0.4,
          life: maxLife,
          maxLife,
          size: 0.7 + Math.random() * 1.3,
        });
      }
      if (!raf) raf = window.requestAnimationFrame(loop);
    };

    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        if (!s) continue;
        s.life -= 16;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * 0.96;
        s.y += s.vy * 0.96;
        const t = s.life / s.maxLife;
        const alpha = t * t * 0.65;
        const draw = s.size * (2.5 + t * 2.5);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, s.x - draw / 2, s.y - draw / 2, draw, draw);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (sparks.length > 0) {
        raf = window.requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastSpawn < 20) return;
      lastSpawn = now;
      spawn(event.clientX, event.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      if (raf) window.cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [theme]);

  return null;
}
