'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CinematicLighthouseCanvasProps {
  stage: 'logo_reveal' | 'blackout' | 'lighthouse_drop' | 'beacon_sweep' | 'login_popup';
  onLighthouseLanded?: () => void;
  onBeamLockedAtRight?: () => void;
  reducedMotion?: boolean;
}

export const CinematicLighthouseCanvas: React.FC<CinematicLighthouseCanvasProps> = ({
  stage,
  onLighthouseLanded,
  onBeamLockedAtRight,
  reducedMotion = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(stage);
  const landedRef = useRef(false);
  const beamLockedRef = useRef(false);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x13081e, 0.007);

    // 2. Camera Setup (Positioned for cinematic laptop framing with full lighthouse visibility)
    const width = container.clientWidth || window.innerWidth || 1280;
    const height = container.clientHeight || window.innerHeight || 720;
    const aspect = width / height;

    // FOV 38 with distance 24.5 ensures the full lighthouse (rock to golden finial) has ~2+ units headroom
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 140);

    const updateCamera = (w: number, h: number) => {
      const curAspect = w / h;
      camera.aspect = curAspect;
      // If screen is narrower, adjust distance so lighthouse on left & popup on right fit cleanly
      const baseDist = 24.5;
      const dist = curAspect < 1.2 ? baseDist / Math.max(0.72, curAspect) : baseDist;
      camera.position.set(0.6, 5.4, dist);
      camera.lookAt(-0.6, 5.2, 0);
      camera.updateProjectionMatrix();
    };

    updateCamera(width, height);

    // 3. Renderer Setup
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

    // 4. Lighting: Sunset Mood (Warm, high-contrast, crystal clear)
    const ambientLight = new THREE.AmbientLight(0x5c3c6e, 2.6);
    scene.add(ambientLight);

    // 6. Rocky Island Base (Fixed on the Left Side: x = -4.4)
    const islandX = -4.4;
    const islandZ = 0.5;

    // 7. Realistic High-Contrast 3D Lighthouse Construction
    const lighthouseGroup = new THREE.Group();
    // Starts high up in the sky for the drop animation:
    const initialDropY = reducedMotion ? 1.8 : 24.0;
    const targetLandedY = 1.8;
    lighthouseGroup.position.set(islandX, initialDropY, islandZ);

    // Front-Right Key Light targeting the lighthouse directly
    const frontKeyLight = new THREE.DirectionalLight(0xfff5ea, 4.2);
    frontKeyLight.position.set(islandX + 8, 12, 14);
    frontKeyLight.target = lighthouseGroup;
    scene.add(frontKeyLight);

    // Front-Left Fill Light on lighthouse tower face
    const towerFillLight = new THREE.DirectionalLight(0xffdfd0, 2.2);
    towerFillLight.position.set(islandX - 7, 8, 10);
    towerFillLight.target = lighthouseGroup;
    scene.add(towerFillLight);

    // Sunset Horizon Backlight (Amber/coral rim)
    const sunsetBackLight = new THREE.DirectionalLight(0xf08a65, 3.6);
    sunsetBackLight.position.set(-16, 5, -8);
    scene.add(sunsetBackLight);

    // Top subtle rim light
    const topRimLight = new THREE.DirectionalLight(0xa575cc, 2.0);
    topRimLight.position.set(-6, 16, 6);
    scene.add(topRimLight);

    // 5. Ocean Water Plane with Wave Undulation & Specular Sheen
    const oceanGeo = new THREE.PlaneGeometry(80, 80, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0c0515,
      roughness: 0.12,
      metalness: 0.88,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.set(0, 0, 0);
    scene.add(oceanMesh);

    const posAttr = oceanGeo.attributes.position;
    const initialY = new Float32Array(posAttr.count);
    for (let i = 0; i < posAttr.count; i++) {
      initialY[i] = posAttr.getY(i);
    }

    const rockGroup = new THREE.Group();
    rockGroup.position.set(islandX, 0, islandZ);

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x22132e,
      roughness: 0.85,
      metalness: 0.1,
    });

    const baseRock = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.6, 2.2, 14),
      rockMat
    );
    baseRock.position.set(0, 0.9, 0);
    rockGroup.add(baseRock);

    // Craggy side rocks
    const sideRock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), rockMat);
    sideRock1.position.set(2.6, 0.6, 1.2);
    sideRock1.scale.set(1.3, 0.7, 1.1);
    rockGroup.add(sideRock1);

    const sideRock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 1), rockMat);
    sideRock2.position.set(-2.4, 0.5, -0.9);
    sideRock2.scale.set(1.2, 0.8, 1.3);
    rockGroup.add(sideRock2);

    const sideRock3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 1), rockMat);
    sideRock3.position.set(0.5, 0.4, 2.5);
    sideRock3.scale.set(1.4, 0.6, 1.0);
    rockGroup.add(sideRock3);

    scene.add(rockGroup);

    // Brilliant White Masonry Tower Material (crisp, high-contrast like Image 2)
    const towerWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.02,
    });

    // Crimson Accent Stripe Material (bold, vibrant red like Image 2)
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

    // Main Tapered White Tower Shaft
    const towerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.95, 5.6, 24),
      towerWhiteMat
    );
    towerShaft.position.y = 3.3;
    lighthouseGroup.add(towerShaft);

    // Single Bold Crimson Stripe around the lower-mid tower (matching Image 2)
    const redStripe = new THREE.Mesh(
      new THREE.CylinderGeometry(1.68, 1.76, 0.45, 24),
      towerCrimsonMat
    );
    redStripe.position.y = 2.45;
    lighthouseGroup.add(redStripe);

    // Observation Windows (Warm amber glow)
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

    // Lantern Structural Struts
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x23102d, metalness: 0.8 });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.35, 6), strutMat);
      strut.position.set(Math.cos(angle) * 1.16, 7.15, Math.sin(angle) * 1.16);
      lighthouseGroup.add(strut);
    }

    // Dome Roof
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x3d1c44,
      roughness: 0.3,
      metalness: 0.6,
    });
    const dome = new THREE.Mesh(new THREE.ConeGeometry(1.32, 1.1, 24), domeMat);
    dome.position.y = 8.35;
    lighthouseGroup.add(dome);

    // Finial Needle & Ball (Golden spire at the top tip)
    const finialBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 })
    );
    finialBall.position.y = 8.95;
    lighthouseGroup.add(finialBall);

    const finialSpire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.07, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 })
    );
    finialSpire.position.y = 9.35;
    lighthouseGroup.add(finialSpire);

    // 8. Beacon Bulb & Halo
    const lanternLampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lanternLamp = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), lanternLampMat);
    lanternLamp.position.y = 7.15;
    lighthouseGroup.add(lanternLamp);

    const lanternHaloMat = new THREE.MeshBasicMaterial({
      color: 0xffdf80,
      transparent: true,
      opacity: 0.0, // starts off until drop lands
      blending: THREE.AdditiveBlending,
    });
    const lanternHalo = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), lanternHaloMat);
    lanternHalo.position.y = 7.15;
    lighthouseGroup.add(lanternHalo);

    const beaconPointLight = new THREE.PointLight(0xffea9e, 0, 50, 1.0);
    beaconPointLight.position.y = 7.15;
    lighthouseGroup.add(beaconPointLight);

    // 9. Volumetric Light Beam (Rotating 360 degrees & Stopping firmly at the Right Side)
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 7.15, 0);

    const beamLength = 48;
    const beamRadius = 6.4;
    const beamGeo = new THREE.ConeGeometry(beamRadius, beamLength, 32, 1, true);
    beamGeo.translate(0, -beamLength / 2, 0);
    beamGeo.rotateX(-Math.PI / 2);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff4db,
      transparent: true,
      opacity: 0.0, // starts off until beacon ignites
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamGroup.add(beamMesh);

    // Core Laser Beam
    const coreBeamGeo = new THREE.ConeGeometry(beamRadius * 0.38, beamLength * 1.15, 16, 1, true);
    coreBeamGeo.translate(0, (-beamLength * 1.15) / 2, 0);
    coreBeamGeo.rotateX(-Math.PI / 2);
    const coreBeamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreBeamMesh = new THREE.Mesh(coreBeamGeo, coreBeamMat);
    beamGroup.add(coreBeamMesh);

    lighthouseGroup.add(beamGroup);
    scene.add(lighthouseGroup);

    // 10. Starfield in Upper Sky
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 75;
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

    // 11. Drop Physics & Beam Rotation State Machine
    let dropStartTime = 0;
    let sweepStartTime = 0;
    let sweepTotalAngle = 0;
    // Exactly pointing toward the right-side login area (positive angle across +Z toward +X):
    const stopAngleAtRight = Math.PI * 0.40; // ~72° pointing directly toward the right-side login pop-up!

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = clock.getElapsedTime();
      const currentStage = stageRef.current;

      // Animate ocean waves
      const pos = oceanGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        const wave =
          Math.sin(u * 0.35 + now * 1.2) * 0.07 +
          Math.cos(v * 0.4 + now * 0.9) * 0.05;
        pos.setY(i, initialY[i] + wave);
      }
      pos.needsUpdate = true;

      // STAGE LOGIC:
      if (currentStage === 'logo_reveal' || currentStage === 'blackout') {
        // Keep lighthouse hidden at top or invisible
        lighthouseGroup.position.y = 24.0;
        beamMat.opacity = 0;
        coreBeamMat.opacity = 0;
        lanternHaloMat.opacity = 0;
        beaconPointLight.intensity = 0;
      } else if (currentStage === 'lighthouse_drop') {
        if (dropStartTime === 0) dropStartTime = now;
        const dropElapsed = now - dropStartTime;
        const duration = 1.2;

        if (dropElapsed < duration) {
          // Smooth bounce / cubic drop easing
          const t = dropElapsed / duration;
          // easeOutCubic: 1 - pow(1 - t, 3)
          const ease = 1 - Math.pow(1 - t, 3);
          lighthouseGroup.position.y = THREE.MathUtils.lerp(24.0, targetLandedY, ease);
        } else {
          lighthouseGroup.position.y = targetLandedY;
          if (!landedRef.current) {
            landedRef.current = true;
            if (onLighthouseLanded) onLighthouseLanded();
          }
        }
      } else if (currentStage === 'beacon_sweep') {
        lighthouseGroup.position.y = targetLandedY;

        // Turn on beacon light with radiant sunset intensity
        lanternHaloMat.opacity = Math.min(0.9, lanternHaloMat.opacity + 0.05);
        beamMat.opacity = Math.min(0.55, beamMat.opacity + 0.04);
        coreBeamMat.opacity = Math.min(0.75, coreBeamMat.opacity + 0.05);
        beaconPointLight.intensity = Math.min(8.0, beaconPointLight.intensity + 0.4);

        if (sweepStartTime === 0) sweepStartTime = now;
        const sweepElapsed = now - sweepStartTime;

        // Rotate 360 degrees in ~2.0 seconds, smoothly stopping directly at the right side
        const rotationDuration = 2.0;

        if (sweepElapsed < rotationDuration) {
          const progress = sweepElapsed / rotationDuration;
          // Sweeps 360 degrees and arrives precisely at stopAngleAtRight:
          const angle = (stopAngleAtRight - Math.PI * 2) + progress * (Math.PI * 2);
          beamGroup.rotation.y = angle;
        } else {
          // Stop securely at the right side!
          beamGroup.rotation.y = stopAngleAtRight;
          if (!beamLockedRef.current) {
            beamLockedRef.current = true;
            if (onBeamLockedAtRight) onBeamLockedAtRight();
          }
        }
      } else if (currentStage === 'login_popup') {
        // Locked spotlight firmly stopped at the right side, illuminating the login popup!
        lighthouseGroup.position.y = targetLandedY;
        beamGroup.rotation.y = stopAngleAtRight;

        // Keep beacon bright and gently pulsing with ambient life
        lanternHaloMat.opacity = 0.9 + Math.sin(now * 3) * 0.08;
        beamMat.opacity = 0.52 + Math.sin(now * 2) * 0.04;
        coreBeamMat.opacity = 0.75 + Math.sin(now * 3) * 0.04;
        beaconPointLight.intensity = 8.0 + Math.sin(now * 2) * 0.6;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Responsive Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          updateCamera(w, h);
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

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
      {/* Sunset Dusk Atmospheric Sky Gradient */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: stage === 'logo_reveal' || stage === 'blackout' ? 0 : 1,
          background:
            'linear-gradient(to bottom, #100619 0%, #1a0a28 28%, #2e113b 48%, #4f1b46 64%, #7b2752 76%, #a83d5d 86%, #cf5d69 92%, #e58778 96%, #12081d 97%, #090310 100%)',
        }}
      />

      {/* Horizon Sun Flare */}
      <div
        className="absolute pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: stage === 'logo_reveal' || stage === 'blackout' ? 0 : 1,
          bottom: '4%',
          left: '25%',
          transform: 'translateX(-50%)',
          width: '520px',
          height: '220px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 85%, rgba(255, 195, 130, 0.75) 0%, rgba(215, 95, 105, 0.4) 45%, transparent 75%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Three.js 3D Canvas */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full transition-opacity duration-700"
        style={{
          opacity: stage === 'logo_reveal' || stage === 'blackout' ? 0 : 1,
        }}
      />
    </div>
  );
};

