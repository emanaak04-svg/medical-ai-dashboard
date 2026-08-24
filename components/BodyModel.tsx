"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

type Region = "brain" | "lungs" | null;

const positions: Record<Exclude<Region, null>, [number, number, number]> = {
  brain: [0, 1.6, 0],
  lungs: [0, 0.6, 0.1],
};

function Body({ region }: { region: Region }) {
  const dimColor = "#5B6B7A";
  const glowColor = "#F2AE40";

  return (
    <group>
      {/* Simplified translucent body */}
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.35, 1.2, 8, 16]} />
        <meshStandardMaterial
          color="#3fdcc7"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial
          color="#3fdcc7"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Brain */}
      <mesh position={positions.brain}>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial
          color={region === "brain" ? glowColor : dimColor}
          emissive={region === "brain" ? glowColor : "#000000"}
          emissiveIntensity={region === "brain" ? 1.5 : 0}
          transparent
          opacity={region === "brain" ? 1 : 0.5}
        />
      </mesh>

      {/* Lungs */}
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 0.6, 0.1]}>
          <capsuleGeometry args={[0.12, 0.35, 8, 16]} />
          <meshStandardMaterial
            color={region === "lungs" ? glowColor : dimColor}
            emissive={region === "lungs" ? glowColor : "#000000"}
            emissiveIntensity={region === "lungs" ? 1.5 : 0}
            transparent
            opacity={region === "lungs" ? 1 : 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({
  target,
  controlsRef,
}: {
  target: [number, number, number];
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  const desiredPosition = useRef(
    new THREE.Vector3(0, 1, 4)
  );

  const desiredTarget = useRef(
    new THREE.Vector3(0, 0.9, 0)
  );

  useEffect(() => {
    const isFocused = target[1] !== 0.9;

    const zoom = isFocused ? 1.9 : 4;

    desiredPosition.current.set(
      target[0],
      target[1],
      target[2] + zoom
    );

    desiredTarget.current.set(
      target[0],
      target[1],
      target[2]
    );
  }, [target]);

  useFrame(() => {
    camera.position.lerp(desiredPosition.current, 0.06);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(
        desiredTarget.current,
        0.06
      );

      controlsRef.current.update();
    }
  });

  return null;
}

export default function BodyModel({
  activeRegion,
}: {
  activeRegion: Region;
}) {
  const controlsRef = useRef<any>(null);

  const target: [number, number, number] = activeRegion
    ? positions[activeRegion]
    : [0, 0.9, 0];

  return (
    <div className="h-72 w-full rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
      <Canvas camera={{ position: [0, 1, 4], fov: 45 }}>
        <ambientLight intensity={0.6} />

        <directionalLight
          position={[2, 3, 2]}
          intensity={0.8}
        />

        <Body region={activeRegion} />

        <CameraRig
          target={target}
          controlsRef={controlsRef}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}