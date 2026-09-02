"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useRef, useEffect, Suspense, useMemo } from "react";
import * as THREE from "three";

type Region = "brain" | "lungs" | null;

const positions: Record<Exclude<Region, null>, [number, number, number]> = {
  brain: [0, 1.75, 0],
  lungs: [0, 1.4, 0.05],
};

const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.55);

function applyClip(material: THREE.Material) {
  material.clippingPlanes = [clipPlane];
  material.clipShadows = true;
}

function BodyShell() {
  const meshRefTorso = useRef<THREE.Mesh>(null);
  const meshRefHead = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRefTorso.current) applyClip(meshRefTorso.current.material as THREE.Material);
    if (meshRefHead.current) applyClip(meshRefHead.current.material as THREE.Material);
  }, []);

  return (
    <group>
      <mesh ref={meshRefTorso} position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.32, 1.3, 8, 16]} />
        <meshStandardMaterial
          color="#3fdcc7"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={meshRefHead} position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial
          color="#3fdcc7"
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function BrainModel({ active }: { active: boolean }) {
  const { scene } = useGLTF("/models/brain.glb");

  const group = useMemo(() => {
    const cloned = scene.clone();
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const scale = 0.24 / maxSize;

    cloned.position.sub(center);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone();
        applyClip(child.material);
      }
    });

    const wrapper = new THREE.Group();
    wrapper.add(cloned);
    wrapper.scale.setScalar(scale);

    return wrapper;
  }, [scene]);

  useEffect(() => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.transparent = true;
        child.material.opacity = active ? 1 : 0.45;
        if (active) {
          child.material.emissive = new THREE.Color("#F2AE40");
          child.material.emissiveIntensity = 0.8;
        } else {
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [active, group]);

  return <primitive object={group} position={[0, 1.75, 0]} />;
}

useGLTF.preload("/models/brain.glb");

function LungsModel({ active }: { active: boolean }) {
  const { scene } = useGLTF("/models/lungs.glb");

  const group = useMemo(() => {
    const cloned = scene.clone();
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const scale = 0.32 / maxSize;

    cloned.position.sub(center);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone();
        applyClip(child.material);
      }
    });

    const wrapper = new THREE.Group();
    wrapper.add(cloned);
    wrapper.scale.setScalar(scale);

    return wrapper;
  }, [scene]);

  useEffect(() => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.transparent = true;
        child.material.opacity = active ? 1 : 0.45;
        if (active) {
          child.material.emissive = new THREE.Color("#F2AE40");
          child.material.emissiveIntensity = 0.8;
        } else {
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [active, group]);

  return <primitive object={group} position={[0, 1.4, 0.05]} />;
}

useGLTF.preload("/models/lungs.glb");

function SkeletonModel() {
  const { scene } = useGLTF("/models/Skeleton.glb");

  const group = useMemo(() => {
    const cloned = scene.clone();

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const scale = 2.2 / maxSize;

    cloned.position.sub(center);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.75;
        child.material.depthWrite = true;
        applyClip(child.material);
      }
    });

    const wrapper = new THREE.Group();
    wrapper.add(cloned);
    wrapper.scale.setScalar(scale);

    return wrapper;
  }, [scene]);

  return (
    <primitive
      object={group}
      position={[0, 0.85, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

useGLTF.preload("/models/Skeleton.glb");

function Body({ region }: { region: Region }) {
  return (
    <group>
      <BodyShell />
      <SkeletonModel />
      <Suspense fallback={null}>
        <BrainModel active={region === "brain"} />
      </Suspense>
      <Suspense fallback={null}>
        <LungsModel active={region === "lungs"} />
      </Suspense>
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

  const desiredPosition = useRef(new THREE.Vector3(0, 1.2, 3.2));
  const desiredTarget = useRef(new THREE.Vector3(0, 1.1, 0));


    useEffect(() => {
    const isFocused = target[0] !== 0 || target[1] !== 1.1 || target[2] !== 0;

    if (isFocused) {
      desiredPosition.current.set(target[0] + 0.5, target[1] + 0.15, target[2] + 0.9);
      desiredTarget.current.set(target[0], target[1], target[2]);
    } else {
      desiredPosition.current.set(0, 1.2, 3.2);
      desiredTarget.current.set(0, 1.1, 0);
    }
  }, [target]);

  useFrame(() => {
    camera.position.lerp(desiredPosition.current, 0.05);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget.current, 0.05);
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
    : [0, 1.1, 0];

  return (
    <div className="h-72 w-full rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
      <Canvas camera={{ position: [0, 1.2, 3.2], fov: 45 }} gl={{ localClippingEnabled: true }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 4]} intensity={1.1} />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />

        <Body region={activeRegion} />

        <CameraRig target={target} controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.8}
          maxDistance={5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}