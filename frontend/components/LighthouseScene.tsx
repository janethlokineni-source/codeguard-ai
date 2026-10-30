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
    // Very gentle atmospheric fog so distant elements blend, without obscuring the lighthouse
    scene.fog = new THREE.FogExp2(0x150921, 0.007);

    // 2. Camera setup - Perfectly framed to show the FULL lighthouse from rocks to finial tip
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const aspect = width / height;

    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 140);

    // Center of lighthouse is around y = 5.2.
    // Base is at y = 0.5, Finial tip is at y = 10.8.
    // Distance 24.0 with FOV 38 allows full height plus ample breathing space above the spire.
    const updateCameraPosition = (w: number, h: number) => {
      const currentAspect = w / h;
      camera.aspect = currentAspect;
      // Adjust camera distance if the aspect ratio is narrow to prevent cutting off sides or top
      const baseDistance = 24.0;
      const dist = currentAspect < 1.0 ? baseDistance / Math.max(0.72, currentAspect) : baseDistance;
      camera.position.set(0.6, 5.4, dist);
      camera.lookAt(0, 5.2, 0);
      camera.updateProjectionMatrix();
    };

    updateCameraPosition(width, height);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 4. Vibrant Lighting (Bright, high-contrast, crystal clear)
    // Ambient light - warm plum/lavender fill so shadows are never pitch black
    const ambientLight = new THREE.AmbientLight(0x5a3869, 2.5);
    scene.add(ambientLight);

    // Front-Right Key Light - Crisp warm daylight/dusk illumination on the lighthouse tower face
    const frontKeyLight = new THREE.DirectionalLight(0xfff1e0, 3.8);
    frontKeyLight.position.set(12, 10, 16);
    scene.add(frontKeyLight);

    // Sunset Horizon Backlight - Warm amber/coral edge illumination from the horizon
    const sunsetBackLight = new THREE.DirectionalLight(0xf08a65, 3.2);
    sunsetBackLight.position.set(-16, 5, -8);
    scene.add(sunsetBackLight);

    // Top soft rim light
    const topRimLight = new THREE.DirectionalLight(0x9d72c3, 1.8);
    topRimLight.position.set(-6, 15, 6);
    scene.add(topRimLight);

    // 5. Ocean Water Plane with Specular Sheen
    const oceanGeo = new THREE.PlaneGeometry(70, 70, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0d0617,
      roughness: 0.12,
      metalness: 0.88,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = 0.0;
    scene.add(oceanMesh);

    // Store original wave heights for animation
    const posAttr = oceanGeo.attributes.position;
    const initialY = new Float32Array(posAttr.count);
    for (let i = 0; i < posAttr.count; i++) {
      initialY[i] = posAttr.getY(i);
    }

    // 6. Rocky Foundation Island
    const rockGroup = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x22142d,
      roughness: 0.85,
      metalness: 0.1,
    });

    // Main base rock plateau
    const baseRock = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.5, 2.0, 14),
      rockMat
    );
    baseRock.position.set(0, 0.8, 0);
    rockGroup.add(baseRock);

    // Surrounding craggy shore rocks
    const sideRock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), rockMat);
    sideRock1.position.set(2.8, 0.5, 1.4);
    sideRock1.scale.set(1.3, 0.7, 1.1);
    rockGroup.add(sideRock1);

    const sideRock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 1), rockMat);
    sideRock2.position.set(-2.5, 0.5, -0.8);
    sideRock2.scale.set(1.2, 0.8, 1.3);
    rockGroup.add(sideRock2);

    const sideRock3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), rockMat);
    sideRock3.position.set(0.6, 0.4, 2.6);
    sideRock3.scale.set(1.4, 0.6, 1.0);
    rockGroup.add(sideRock3);

    scene.add(rockGroup);

    // 7. Realistic High-Contrast Lighthouse Construction
    const lighthouseGroup = new THREE.Group();
    lighthouseGroup.position.set(0, 1.8, 0);

    // Bright White Masonry Tower Shaft (crisp, high-contrast like Image 2)
    const towerWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.02,
    });

    // Bold Crimson Accent Stripe (matching Image 2)
    const towerCrimsonMat = new THREE.MeshStandardMaterial({
      color: 0xd92d47,
      roughness: 0.22,
      metalness: 0.04,
    });

    // Foundation stone collar
    const foundationCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.3, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x361d42, roughness: 0.6 })
    );
    foundationCollar.position.y = 0.3;
    lighthouseGroup.add(foundationCollar);

    // Main Tapered Tower Shaft (Total height ~ 5.6 units)
    const towerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.95, 5.6, 24),
      towerWhiteMat
    );
    towerShaft.position.y = 3.3;
    lighthouseGroup.add(towerShaft);

    // Single Crisp Crimson Stripe (matching Image 2)
    const bandSingle = new THREE.Mesh(
      new THREE.CylinderGeometry(1.68, 1.76, 0.45, 24),
      towerCrimsonMat
    );
    bandSingle.position.y = 2.45;
    lighthouseGroup.add(bandSingle);

    // Small arched observation windows
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffea90 });
    for (const wy of [2.4, 3.4, 4.4]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.08), windowMat);
      win.position.set(0.1, wy, 1.6 - (wy - 2.0) * 0.12);
      lighthouseGroup.add(win);
    }

    // Observation Gallery & Balcony Platform
    const galleryPlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 1.35, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x2e163b, roughness: 0.4 })
    );
    galleryPlatform.position.y = 6.3;
    lighthouseGroup.add(galleryPlatform);

    // Balcony Railing (Distinct metallic railing)
    const railing = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.045, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x4a285a, metalness: 0.8, roughness: 0.2 })
    );
    railing.rotation.x = Math.PI / 2;
    railing.position.y = 6.75;
    lighthouseGroup.add(railing);

    // Glass Lantern Room (Transparent cylinder with internal glow)
    const lanternGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfffaea,
      transmission: 0.88,
      opacity: 0.7,
      transparent: true,
      roughness: 0.06,
      ior: 1.5,
    });
    const lanternRoom = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 1.18, 1.35, 16),
      lanternGlassMat
    );
    lanternRoom.position.y = 7.15;
    lighthouseGroup.add(lanternRoom);

    // Lantern Structural Frame Struts
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x23102d, metalness: 0.8 });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.35, 6), strutMat);
      strut.position.set(Math.cos(angle) * 1.16, 7.15, Math.sin(angle) * 1.16);
      lighthouseGroup.add(strut);
    }

    // Lighthouse Metal Dome Roof
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x3d1c44,
      roughness: 0.3,
      metalness: 0.6,
    });
    const dome = new THREE.Mesh(new THREE.ConeGeometry(1.32, 1.1, 24), domeMat);
    dome.position.y = 8.35;
    lighthouseGroup.add(dome);

    // Finial Needle & Ball on Dome Top
    const finialBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf0c98a, metalness: 0.9, roughness: 0.1 })
    );
    finialBall.position.y = 8.95;
    lighthouseGroup.add(finialBall);

    const finialSpire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.07, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xf0c98a, metalness: 0.9, roughness: 0.1 })
    );
    finialSpire.position.y = 9.35;
    lighthouseGroup.add(finialSpire);

    // 8. Glowing Lantern Core Lamp & Powerful Beacon Point Light
    const lanternLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    lanternLamp.position.y = 7.15;
    lighthouseGroup.add(lanternLamp);

    // Golden halo around lantern lamp
    const lanternHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffdf80,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    lanternHalo.position.y = 7.15;
    lighthouseGroup.add(lanternHalo);

    const beaconPointLight = new THREE.PointLight(0xffea9e, 6.0, 40, 1.0);
    beaconPointLight.position.y = 7.15;
    lighthouseGroup.add(beaconPointLight);

    // 9. Sweeping Volumetric Beam
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 7.15, 0);

    const beamLength = 36;
    const beamRadius = 5.6;
    const beamGeo = new THREE.ConeGeometry(beamRadius, beamLength, 32, 1, true);
    beamGeo.translate(0, -beamLength / 2, 0);
    beamGeo.rotateX(-Math.PI / 2);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffecb8,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamGroup.add(beamMesh);

    // Intense Core Laser Beam
    const coreBeamGeo = new THREE.ConeGeometry(beamRadius * 0.4, beamLength * 1.15, 16, 1, true);
    coreBeamGeo.translate(0, (-beamLength * 1.15) / 2, 0);
    coreBeamGeo.rotateX(-Math.PI / 2);
    const coreBeamMesh = new THREE.Mesh(
      coreBeamGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beamGroup.add(coreBeamMesh);

    lighthouseGroup.add(beamGroup);
    scene.add(lighthouseGroup);

    // 10. Background Starfield in upper sky
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 70;
      starPositions[i * 3 + 1] = Math.random() * 26 + 7;
      starPositions[i * 3 + 2] = -Math.random() * 35 - 5;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xfff3e3,
      size: 0.16,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 11. Animation Loop: Smooth beam sweep & gentle ocean wave reflections
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      const stopAngleAtRight = Math.PI * 0.38; // ~68.4° pointing toward the right side!

      if (!isReducedRef.current) {
        // Complete 1 smooth sweep and stop pointing toward the right side
        const sweepDuration = 2.4;
        if (elapsed < sweepDuration) {
          const progress = elapsed / sweepDuration;
          beamGroup.rotation.y = (stopAngleAtRight - Math.PI * 2) + progress * (Math.PI * 2);
        } else {
          // Stop securely at the right side
          beamGroup.rotation.y = stopAngleAtRight;
        }

        // Gentle ocean waves undulating
        const pos = oceanGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const v = pos.getZ(i);
          const wave =
            Math.sin(u * 0.35 + elapsed * 1.2) * 0.07 +
            Math.cos(v * 0.4 + elapsed * 0.9) * 0.05;
          pos.setY(i, initialY[i] + wave);
        }
        pos.needsUpdate = true;
      } else {
        // Static beam position pointing toward the right side
        beamGroup.rotation.y = stopAngleAtRight;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Handle Window / Container Resize with ResizeObserver for rock-solid stability
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          updateCameraPosition(w, h);
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 13. Cleanup and full disposal
    return () => {
      resizeObserver.disconnect();
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
      {/* 1. Atmospheric Sunset Sky Gradient (Rich, luminous, vibrant background) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, #100619 0%, #1a0a28 28%, #2e113b 48%, #4f1b46 64%, #7b2752 76%, #a83d5d 86%, #cf5d69 92%, #e58778 96%, #12081d 97%, #090310 100%)',
        }}
      />

      {/* 2. Horizon Setting Sun Golden Radial Flare */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '2%',
          left: '32%',
          transform: 'translateX(-50%)',
          width: '550px',
          height: '240px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 85%, rgba(255, 195, 130, 0.75) 0%, rgba(215, 95, 105, 0.4) 45%, transparent 75%)',
          filter: 'blur(18px)',
        }}
      />

      {/* 3. 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-1" />

      {/* 4. Left Column Title Overlay ("See what's hiding in the dark.") */}
      <div className="absolute top-8 left-8 sm:top-10 sm:left-10 z-10 pointer-events-none">
        <span className="text-[11px] uppercase tracking-[0.28em] font-bold text-[#f0c98a] block drop-shadow-sm">
          A Clearer View Before The Merge
        </span>
        <h2 className="font-serif-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f6e7dc] mt-2 leading-[1.15] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] max-w-md">
          See what&apos;s hiding in the dark.
        </h2>
      </div>

      {/* 5. Bottom Scene Controls: Live Sweep Chip & Reduced Motion Toggle */}
      <div className="absolute bottom-6 left-8 sm:bottom-8 sm:left-10 z-10 flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#120b1a]/80 border border-[rgba(201,119,127,0.35)] backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#f0c98a] animate-pulse shadow-[0_0_8px_#f0c98a]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#f6e7dc] font-semibold">
            Live Beacon Sweep
          </span>
        </div>

        <button
          type="button"
          onClick={() => setInternalReduced(!internalReduced)}
          className="text-[10px] font-mono tracking-wider uppercase px-3 py-1.5 rounded-full bg-[#120b1a]/70 hover:bg-[#1f112e] text-[#d8c8de] hover:text-[#ffffff] border border-[rgba(201,119,127,0.3)] transition-colors cursor-pointer shadow-md"
          title="Toggle sweeping animation"
        >
          {internalReduced ? 'Motion: Paused' : 'Motion: Smooth'}
        </button>
      </div>
    </div>
  );
};
