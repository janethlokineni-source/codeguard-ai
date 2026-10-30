'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface LighthouseSceneProps {
  reducedMotion?: boolean;
}

export const LighthouseScene: React.FC<LighthouseSceneProps> = ({
  reducedMotion = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isReducedRef = useRef(reducedMotion);
  const [internalReduced, setInternalReduced] = useState(reducedMotion);

  useEffect(() => {
    isReducedRef.current = internalReduced;
  }, [internalReduced]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect user OS reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setInternalReduced(true);
      isReducedRef.current = true;
    }

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x190f24, 0.022);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    // Positioned to give a cinematic 3/4 perspective of the lighthouse and the sweeping beam
    camera.position.set(7, 5.5, 14);
    camera.lookAt(-1.5, 3.2, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Lighting: Sunset Mood (Coral horizon, dusk ambient, beacon glow)
    const ambientLight = new THREE.AmbientLight(0x3a2046, 1.2);
    scene.add(ambientLight);

    // Sunset directional fill from the horizon
    const sunsetDirLight = new THREE.DirectionalLight(0xf0a880, 2.2);
    sunsetDirLight.position.set(-15, 4, -10);
    scene.add(sunsetDirLight);

    // Subtle blue-violet rim light
    const rimLight = new THREE.DirectionalLight(0x8a63b5, 1.4);
    rimLight.position.set(10, 8, -5);
    scene.add(rimLight);

    // 5. Ocean Water Plane
    const oceanGeo = new THREE.PlaneGeometry(60, 60, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0c0714,
      roughness: 0.15,
      metalness: 0.85,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = -0.1;
    scene.add(oceanMesh);

    // Store original wave heights for animation
    const posAttr = oceanGeo.attributes.position;
    const initialY = new Float32Array(posAttr.count);
    for (let i = 0; i < posAttr.count; i++) {
      initialY[i] = posAttr.getY(i);
    }

    // 6. Rocky Cliff Foundation
    const rockGroup = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1d1326,
      roughness: 0.9,
      metalness: 0.1,
    });

    const baseRock = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.4, 2.2, 12),
      rockMat
    );
    baseRock.position.set(0, 0.9, 0);
    rockGroup.add(baseRock);

    // Small craggy side rocks
    const sideRock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), rockMat);
    sideRock1.position.set(2.4, 0.6, 1.2);
    sideRock1.scale.set(1.4, 0.7, 1.1);
    rockGroup.add(sideRock1);

    const sideRock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), rockMat);
    sideRock2.position.set(-2.2, 0.5, -1.0);
    sideRock2.scale.set(1.2, 0.8, 1.3);
    rockGroup.add(sideRock2);

    scene.add(rockGroup);

    // 7. Realistic Lighthouse Construction
    const lighthouseGroup = new THREE.Group();
    lighthouseGroup.position.set(0, 2.0, 0);

    // Tower Body (Masonry cylinder with dusk cream and deep plum bands)
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0xeee2dc,
      roughness: 0.45,
      metalness: 0.05,
    });
    const towerTrimMat = new THREE.MeshStandardMaterial({
      color: 0x54263e,
      roughness: 0.5,
      metalness: 0.1,
    });

    // Lower base ring
    const stoneBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.3, 0.8, 24),
      towerTrimMat
    );
    stoneBase.position.y = 0.4;
    lighthouseGroup.add(stoneBase);

    // Tapered tower shaft (Height: 5.6)
    const towerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 2.0, 5.6, 24),
      towerMat
    );
    towerShaft.position.y = 3.6;
    lighthouseGroup.add(towerShaft);

    // Crimson-plum decorative accent band
    const towerBand = new THREE.Mesh(
      new THREE.CylinderGeometry(1.68, 1.76, 0.7, 24),
      towerTrimMat
    );
    towerBand.position.y = 3.2;
    lighthouseGroup.add(towerBand);

    // Observation Gallery & Balcony
    const galleryPlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 1.4, 0.45, 24),
      towerTrimMat
    );
    galleryPlatform.position.y = 6.6;
    lighthouseGroup.add(galleryPlatform);

    // Balcony Railing
    const railing = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.04, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x30183b, metalness: 0.8, roughness: 0.2 })
    );
    railing.rotation.x = Math.PI / 2;
    railing.position.y = 7.1;
    lighthouseGroup.add(railing);

    // Glass Lantern Room (Transparent cylinder)
    const lanternGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffe6d0,
      transmission: 0.85,
      opacity: 0.6,
      transparent: true,
      roughness: 0.08,
      ior: 1.5,
    });
    const lanternRoom = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 1.4, 16),
      lanternGlassMat
    );
    lanternRoom.position.y = 7.5;
    lighthouseGroup.add(lanternRoom);

    // Lantern Struts (Metal frame)
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x22102c, metalness: 0.7 });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), strutMat);
      strut.position.set(Math.cos(angle) * 1.18, 7.5, Math.sin(angle) * 1.18);
      lighthouseGroup.add(strut);
    }

    // Lighthouse Dome / Roof
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x3b1c3e,
      roughness: 0.35,
      metalness: 0.6,
    });
    const dome = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.1, 24), domeMat);
    dome.position.y = 8.7;
    lighthouseGroup.add(dome);

    // Finial needle on dome top
    const finial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.08, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xf0c98a, metalness: 0.9, roughness: 0.1 })
    );
    finial.position.y = 9.5;
    lighthouseGroup.add(finial);

    // 8. Glowing Lantern Core Lamp & Point Light
    const lanternLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff6dc })
    );
    lanternLamp.position.y = 7.5;
    lighthouseGroup.add(lanternLamp);

    const beaconPointLight = new THREE.PointLight(0xffdfa0, 4.0, 35, 1.2);
    beaconPointLight.position.y = 7.5;
    lighthouseGroup.add(beaconPointLight);

    // 9. Sweeping Volumetric Beam
    // The beam is a cone of warm-golden atmospheric light rotated horizontally
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 7.5, 0);

    const beamLength = 32;
    const beamRadius = 5.2;
    const beamGeo = new THREE.ConeGeometry(beamRadius, beamLength, 32, 1, true);
    beamGeo.translate(0, -beamLength / 2, 0);
    beamGeo.rotateX(-Math.PI / 2);

    // Custom gradient opacity material via basic shader simulation or additive mesh
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffe8b8,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamGroup.add(beamMesh);

    // Secondary intense core beam
    const coreBeamGeo = new THREE.ConeGeometry(beamRadius * 0.45, beamLength * 1.1, 16, 1, true);
    coreBeamGeo.translate(0, (-beamLength * 1.1) / 2, 0);
    coreBeamGeo.rotateX(-Math.PI / 2);
    const coreBeamMesh = new THREE.Mesh(
      coreBeamGeo,
      new THREE.MeshBasicMaterial({
        color: 0xfffaed,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beamGroup.add(coreBeamMesh);

    lighthouseGroup.add(beamGroup);
    scene.add(lighthouseGroup);

    // 10. Background Starfield in upper sky
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 180;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 1] = Math.random() * 25 + 8;
      starPositions[i * 3 + 2] = -Math.random() * 35 - 5;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xf6e7dc,
      size: 0.15,
      transparent: true,
      opacity: 0.75,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 11. Horizon Glow Flare
    const flareMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 14),
      new THREE.MeshBasicMaterial({
        color: 0xc9777f,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    flareMesh.position.set(-8, 3.5, -25);
    scene.add(flareMesh);

    // 12. Animation Loop: Smooth beam sweep & gentle ocean wave reflections
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      if (!isReducedRef.current) {
        // Horizontal beam sweep from right to left smoothly
        // Standard lighthouse horizontal rotation:
        beamGroup.rotation.y = -elapsed * 0.75;

        // Gentle ocean waves undulating
        const pos = oceanGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const v = pos.getZ(i);
          const wave =
            Math.sin(u * 0.35 + elapsed * 1.2) * 0.08 +
            Math.cos(v * 0.4 + elapsed * 0.9) * 0.06;
          pos.setY(i, initialY[i] + wave);
        }
        pos.needsUpdate = true;

        // Subtle camera breathing
        camera.position.x = 7 + Math.sin(elapsed * 0.25) * 0.3;
        camera.position.y = 5.5 + Math.cos(elapsed * 0.3) * 0.15;
      } else {
        // Static cinematic beam position for reduced motion
        beamGroup.rotation.y = -Math.PI * 0.35;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 13. Handle Window / Container Resize
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 14. Cleanup and full disposal
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Atmospheric Horizon Dusk Gradient Overlay (Pure CSS blending) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 30% 60%, rgba(201, 119, 127, 0.12) 0%, rgba(138, 99, 181, 0.08) 45%, transparent 75%)',
        }}
      />

      {/* Soft Vignette Edge Shadow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(18, 11, 26, 0.4) 0%, transparent 40%, rgba(18, 11, 26, 0.85) 100%), linear-gradient(to top, rgba(18, 11, 26, 0.8) 0%, transparent 35%)',
        }}
      />

      {/* Atmospheric Brand Overlay on Left Scene */}
      <div className="absolute top-8 left-8 sm:top-10 sm:left-10 z-10 pointer-events-none">
        <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#f0c98a] block">
          A Clearer View Before The Merge
        </span>
        <h2 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f6e7dc] mt-1.5 leading-tight tracking-tight drop-shadow-md max-w-sm">
          See what&apos;s hiding in the dark.
        </h2>
      </div>

      {/* Bottom Scene Status & Reduced Motion Toggle */}
      <div className="absolute bottom-6 left-8 sm:bottom-8 sm:left-10 z-10 flex items-center gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#120b1a]/70 border border-[rgba(201,119,127,0.25)] backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f0c98a] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#f6e7dc]">
            Live Beacon Sweep
          </span>
        </div>

        <button
          type="button"
          onClick={() => setInternalReduced(!internalReduced)}
          className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#120b1a]/60 hover:bg-[#190f24] text-[#b8a5b8] hover:text-[#f6e7dc] border border-[rgba(201,119,127,0.2)] transition-colors cursor-pointer"
          title="Toggle sweeping animation"
        >
          {internalReduced ? 'Motion: Paused' : 'Motion: Smooth'}
        </button>
      </div>
    </div>
  );
};
