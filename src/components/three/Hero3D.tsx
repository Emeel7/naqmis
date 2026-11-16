"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

/** Static fallback: same "ascending levels" idea as the 3D scene, drawn in plain SVG. */
export function PathwayFallback() {
  const shades = ["#98B0D4", "#8AA6CF", "#7B9BC8", "#6A8BBD", "#5A7DB3", "#4A6DA3", "#3D5E94", "#2D456F", "#1F3256", "#B7791F"];
  return (
    <svg viewBox="0 0 400 220" className="h-full w-full" role="img" aria-label="Illustration: ten ascending steps representing KNQF levels 1 to 10">
      {shades.map((c, i) => {
        const h = 24 + i * 17;
        return <rect key={c + i} x={20 + i * 37} y={200 - h} width="30" height={h} rx="3" fill={c} />;
      })}
    </svg>
  );
}

const Scene = dynamic(() => import("./PathwayScene"), { ssr: false, loading: () => <PathwayFallback /> });

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Lazy-loaded 3D scene with fallbacks for: reduced motion, no WebGL, low-power devices, or runtime errors. */
export default function Hero3D() {
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = (navigator.hardwareConcurrency ?? 4) <= 2;
    let gl = false;
    try { const c = document.createElement("canvas"); gl = !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { /* no WebGL */ }
    setMode(reduce || lowPower || !gl ? "static" : "3d");
  }, []);
  if (mode === "3d") return <Boundary fallback={<PathwayFallback />}><Scene /></Boundary>;
  return <PathwayFallback />;
}
