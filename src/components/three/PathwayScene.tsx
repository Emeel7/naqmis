"use client";
// 3D element: ten ascending steps = KNQF levels 1-10. Renders on demand (no continuous animation loop):
// it only redraws while the pointer nudges the rotation, then stops.
import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";

const SHADES = ["#98B0D4", "#8AA6CF", "#7B9BC8", "#6A8BBD", "#5A7DB3", "#4A6DA3", "#3D5E94", "#2D456F", "#1F3256", "#B7791F"];

function Steps() {
  const group = useRef<Group>(null);
  const target = useRef(-0.55);
  const { gl, invalidate } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.current = -0.55 + ((e.clientX - r.left) / r.width - 0.5) * 0.9;
      invalidate();
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [gl, invalidate]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += (target.current - g.rotation.y) * 0.1;
    if (Math.abs(target.current - g.rotation.y) > 0.002) state.invalidate();
  });

  return (
    <group ref={group} position={[0, -1.7, 0]} rotation={[0, -0.55, 0]}>
      {SHADES.map((c, i) => {
        const h = 0.45 + i * 0.36;
        return (
          <mesh key={c + i} position={[(i - 4.5) * 0.85, h / 2, 0]}>
            <boxGeometry args={[0.72, h, 1.4]} />
            <meshStandardMaterial color={c} roughness={0.55} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function PathwayScene() {
  return (
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [6.5, 3.5, 9], fov: 35 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} />
      <Steps />
    </Canvas>
  );
}
