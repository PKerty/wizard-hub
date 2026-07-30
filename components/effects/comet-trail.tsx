"use client";

import { useEffect, useSyncExternalStore } from "react";

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

const FADE_ALPHA = 0.09;
const LERP = 0.35;
const IDLE_FADE_MS = 600;
const IDLE_STOP_MS = 1050;

/**
 * Cyan comet trail for the LIGHT theme.
 *
 * The warm torchlight radial (TorchlightCursor → body::after) is near-invisible
 * on parchment, so in light mode it's hidden (CSS) and this canvas paints a
 * smooth glowing ribbon that follows the pointer and fades out behind it.
 *
 * Technique (persistent transparent overlay):
 *  1. Each frame erase a slice of the existing trail via 'destination-out'
 *     → old pixels fade toward transparency (a comet tail).
 *  2. Lerp the drawn head toward the real pointer and stroke a soft glowing
 *     segment from the last position, then a bright radial head — 'lighter'
 *     blending builds up brightness where the cursor lingers.
 *
 * Idle-aware: the loop runs while moving + ~600ms after (to let the tail
 * fade), then fully erases and stops until the next pointermove.
 *
 * Guards: light-theme-only, disabled under prefers-reduced-motion and
 * pointer:coarse.
 */
export function CometTrail() {
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

    let targetX = 0;
    let targetY = 0;
    let drawX = 0;
    let drawY = 0;
    let lastX = 0;
    let lastY = 0;
    let hasPointer = false;
    let lastMove = 0;
    let raf = 0;

    const loop = () => {
      const now = performance.now();
      const idle = now - lastMove;

      // 1. Fade existing trail toward transparent.
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${idle > IDLE_FADE_MS ? FADE_ALPHA * 2.5 : FADE_ALPHA})`;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      if (hasPointer && idle < IDLE_STOP_MS) {
        // 2. Lerp head toward the pointer and draw a glowing segment + head.
        drawX += (targetX - drawX) * LERP;
        drawY += (targetY - drawY) * LERP;

        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(95, 200, 215, 0.45)";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(95, 200, 215, 0.8)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(drawX, drawY);
        ctx.stroke();

        const head = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, 11);
        head.addColorStop(0, "rgba(205, 245, 250, 0.85)");
        head.addColorStop(1, "rgba(95, 200, 215, 0)");
        ctx.fillStyle = head;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 11, 0, Math.PI * 2);
        ctx.fill();

        lastX = drawX;
        lastY = drawY;
        raf = window.requestAnimationFrame(loop);
      } else if (idle < IDLE_STOP_MS) {
        // Still fading out after the pointer stopped — keep the loop alive.
        raf = window.requestAnimationFrame(loop);
      } else {
        // Fully erased and idle — stop until the next pointermove.
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        raf = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      lastMove = performance.now();
      if (!hasPointer) {
        drawX = lastX = targetX;
        drawY = lastY = targetY;
        hasPointer = true;
      }
      if (!raf) raf = window.requestAnimationFrame(loop);
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
