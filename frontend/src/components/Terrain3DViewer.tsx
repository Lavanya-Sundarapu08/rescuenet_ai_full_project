import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Zone, Shelter, EvacuationRouteOption } from '../types';
import { Eye, Waves, Layers, Focus, RotateCcw, Compass, MapPin, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Terrain3DViewerProps {
  zones: Zone[];
  shelters: Shelter[];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
  activeRoutes?: EvacuationRouteOption[];
  simulatedFloodLevel?: number; // In meters or delta
}

export const Terrain3DViewer: React.FC<Terrain3DViewerProps> = ({
  zones,
  shelters,
  selectedZone,
  onSelectZone,
  activeRoutes = [],
  simulatedFloodLevel = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Dynamic elements refs for animation & updates
  const riverMeshRef = useRef<THREE.Mesh | null>(null);
  const beaconGroupRef = useRef<THREE.Group | null>(null);
  const routesGroupRef = useRef<THREE.Group | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // HUD State
  const [wireframeMode, setWireframeMode] = useState(false);
  const [floodSimulationActive, setFloodSimulationActive] = useState(false);
  const [cameraView, setCameraView] = useState<'perspective' | 'canyon' | 'top'>('perspective');

  // Convert GPS (lat, lng) to 3D Local Terrain Coordinates (X, Z)
  // Kaveri-Wayanad Basin bounds approx: Lat [11.45, 11.85], Lng [75.95, 76.28]
  const gpsTo3D = (lat: number, lng: number, elevationM = 750): [number, number, number] => {
    const minLat = 11.45, maxLat = 11.85;
    const minLng = 75.95, maxLng = 76.28;
    const x = ((lng - minLng) / (maxLng - minLng) - 0.5) * 800;
    const z = ((lat - minLat) / (maxLat - minLat) - 0.5) * -700; // Invert Z for north-up
    // Map real elevation (680m to 1200m) to 3D Y (-10 to 90)
    const y = ((elevationM - 680) / (1200 - 680)) * 95 - 5;
    return [x, y, z];
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.0016);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
    camera.position.set(0, 360, 480);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent flipping under ground
    controls.minDistance = 60;
    controls.maxDistance = 1400;
    controls.target.set(0, 10, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x273449, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3d6, 2.2);
    sunLight.position.set(300, 500, 200);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 1600;
    const d = 500;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    scene.add(hemiLight);

    // 6. BUILD 3D PROCEDURAL MOUNTAIN TERRAIN (Digital Elevation Model)
    const gridW = 180;
    const gridH = 150;
    const terrainGeo = new THREE.PlaneGeometry(950, 800, gridW, gridH);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    // Height formula shaping the Kaveri-Wayanad River Basin
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Distance from center river canyon axis (a curved path cutting through X)
      const riverPathZ = Math.sin(x * 0.007) * 90 + Math.cos(x * 0.015) * 35;
      const distToRiver = Math.abs(z - riverPathZ);

      // Mountain flanks rise sharply away from the central river gorge
      const valleyTrough = Math.min(1.0, distToRiver / 160);
      const mountainNoise1 = Math.sin(x * 0.012) * Math.cos(z * 0.014) * 55;
      const mountainNoise2 = Math.sin(x * 0.025 + 1.2) * Math.sin(z * 0.022) * 28;
      const steepRidge = Math.pow(valleyTrough, 1.8) * 110;

      // Base elevation
      let y = steepRidge + mountainNoise1 + mountainNoise2;

      // Ensure river bed itself dips into the lowest elevation
      if (distToRiver < 45) {
        y = Math.min(y, (distToRiver / 45) * 12 - 4);
      }

      posAttr.setY(i, y);

      // Vertex color gradient based on altitude & slope
      // Low valley: Dark alluvial soil / moisture (#1e293b to #164e63)
      // Mid mountain: Dense evergreen forest (#064e3b to #047857)
      // High rocky peaks: Dark granite cliff (#475569 to #94a3b8)
      let r = 0.08, g = 0.18, b = 0.22;
      if (y < 8) {
        // River valley floor
        r = 0.07; g = 0.14; b = 0.22;
      } else if (y < 45) {
        // Forest slope
        const t = (y - 8) / 37;
        r = 0.04 + t * 0.02;
        g = 0.28 + t * 0.18;
        b = 0.18 + t * 0.08;
      } else {
        // High mountain peak
        const t = Math.min(1.0, (y - 45) / 65);
        r = 0.25 + t * 0.32;
        g = 0.32 + t * 0.28;
        b = 0.38 + t * 0.28;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 7. BUILD 3D RIVER MESH (With Specular Water Shader & Flood Rise capability)
    const riverCurvePoints: THREE.Vector3[] = [];
    for (let rx = -470; rx <= 470; rx += 25) {
      const rz = Math.sin(rx * 0.007) * 90 + Math.cos(rx * 0.015) * 35;
      riverCurvePoints.push(new THREE.Vector3(rx, 1.2, rz));
    }
    const riverCurve = new THREE.CatmullRomCurve3(riverCurvePoints);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 90, 26, 12, false);
    riverGeo.scale(1, 0.12, 1); // Flatten into surface ribbon

    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant cyan-blue river
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.y = 0.5;
    scene.add(riverMesh);
    riverMeshRef.current = riverMesh;

    // 8. 3D PINS & VILLAGE FOOTPRINTS (Matching Reference Image 4)
    const pinsGroup = new THREE.Group();
    scene.add(pinsGroup);

    zones.forEach((zone) => {
      const [px, py, pz] = gpsTo3D(zone.centroid_lat, zone.centroid_lng, zone.hazard_factors.elevation_m);

      let pinColor = 0x22c55e; // Safe Green
      if (zone.risk_score.risk_level === 'CRITICAL') pinColor = 0xef4444; // Red
      else if (zone.risk_score.risk_level === 'HIGH_RISK') pinColor = 0xf97316; // Orange
      else if (zone.risk_score.risk_level === 'WATCH') pinColor = 0xeab308; // Yellow

      // A. Ground Footprint Glow Disk
      const diskGeo = new THREE.RingGeometry(12, 20, 24);
      diskGeo.rotateX(-Math.PI / 2);
      const diskMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.position.set(px, py + 0.8, pz);
      pinsGroup.add(disk);

      // B. Vertical 3D Needle / Pin Post (Matching Reference Image 4)
      const needleGeo = new THREE.CylinderGeometry(0.8, 0.4, 28, 8);
      const needleMat = new THREE.MeshStandardMaterial({ color: pinColor, metalness: 0.5, roughness: 0.2 });
      const needle = new THREE.Mesh(needleGeo, needleMat);
      needle.position.set(px, py + 14, pz);
      needle.castShadow = true;
      pinsGroup.add(needle);

      // C. Pin Sphere Head
      const sphereGeo = new THREE.SphereGeometry(3.5, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: pinColor,
        emissive: pinColor,
        emissiveIntensity: 0.45,
        roughness: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(px, py + 28, pz);
      sphere.userData = { zoneId: zone.id, zone };
      pinsGroup.add(sphere);

      // D. Floating 3D Sprite Label
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.roundRect(0, 0, 256, 64, 12);
        ctx.fill();
        ctx.strokeStyle = pinColor === 0xef4444 ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(zone.name.split(' ')[0], 16, 32);

        ctx.fillStyle = pinColor === 0xef4444 ? '#f87171' : '#cbd5e1';
        ctx.font = '16px monospace';
        ctx.fillText(`Risk: ${zone.risk_score.normalized_score.toFixed(0)}/100`, 16, 52);
      }
      const labelTexture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(px, py + 38, pz);
      sprite.scale.set(40, 10, 1);
      pinsGroup.add(sprite);
    });

    // 9. 3D RELIEF SHELTERS (Placed on elevated safe terrain with carrying capacity pillars)
    const sheltersGroup = new THREE.Group();
    scene.add(sheltersGroup);

    shelters.forEach((shelter) => {
      const [sx, sy, sz] = gpsTo3D(shelter.lat, shelter.lng, 820);

      let sColor = 0x22c55e; // Green
      if (shelter.status === 'UNSAFE') sColor = 0x1f2937; // Black
      else if (shelter.status === 'OVER_CAPACITY') sColor = 0xef4444; // Red
      else if (shelter.status === 'NEAR_CAPACITY') sColor = 0xeab308; // Yellow

      // Shelter Structure Domes
      const domeGeo = new THREE.CylinderGeometry(6, 9, 7, 8);
      const domeMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.3 });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(sx, sy + 3.5, sz);
      dome.castShadow = true;
      sheltersGroup.add(dome);

      // Carrying Capacity Pillar Height represents available headroom
      const pillarHeight = Math.max(8, (shelter.available_capacity / 2500) * 35);
      const pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, pillarHeight, 12);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: sColor,
        emissive: sColor,
        emissiveIntensity: 0.4,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(sx, sy + 7 + pillarHeight / 2, sz);
      sheltersGroup.add(pillar);

      // Pulsing Halo atop pillar
      const haloGeo = new THREE.TorusGeometry(3, 0.4, 8, 24);
      haloGeo.rotateX(Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({ color: sColor });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(sx, sy + 7 + pillarHeight + 1, sz);
      sheltersGroup.add(halo);
    });

    // 10. Selected Zone Sky Hologram Beacon Group
    const beaconGroup = new THREE.Group();
    scene.add(beaconGroup);
    beaconGroupRef.current = beaconGroup;

    // 11. 3D Evacuation Routes Group
    const routesGroup = new THREE.Group();
    scene.add(routesGroup);
    routesGroupRef.current = routesGroup;

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle water undulation
      if (riverMeshRef.current) {
        riverMeshRef.current.position.y = (floodSimulationActive ? 6.5 : 0.8) + Math.sin(elapsedTime * 2.0) * 0.4;
      }

      // Rotate holographic beacon
      if (beaconGroupRef.current) {
        beaconGroupRef.current.rotation.y = elapsedTime * 0.8;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Update Wireframe Mode
  useEffect(() => {
    if (!terrainMeshRef.current) return;
    (terrainMeshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframeMode;
  }, [wireframeMode]);

  // Update Holographic Sky Beacon for Selected Zone
  useEffect(() => {
    if (!beaconGroupRef.current || !selectedZone) return;
    const group = beaconGroupRef.current;
    group.clear();

    const [bx, by, bz] = gpsTo3D(selectedZone.centroid_lat, selectedZone.centroid_lng, selectedZone.hazard_factors.elevation_m);

    // Sky Beam (Translucent Cylinder extending 300 units up)
    const beamGeo = new THREE.CylinderGeometry(14, 2, 260, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: selectedZone.risk_score.risk_level === 'CRITICAL' ? 0xef4444 : 0x38bdf8,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(bx, by + 130, bz);
    group.add(beam);

    // Expanding Pulse Rings
    for (let r = 1; r <= 3; r++) {
      const ringGeo = new THREE.RingGeometry(r * 12, r * 12 + 2, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7 - r * 0.18,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(bx, by + r * 15, bz);
      group.add(ring);
    }
  }, [selectedZone]);

  // Update 3D Routes Ribbon (Showing Optimal elevated bypass vs Submerged Route A)
  useEffect(() => {
    if (!routesGroupRef.current) return;
    const group = routesGroupRef.current;
    group.clear();

    activeRoutes.forEach((route) => {
      if (route.waypoints.length < 2) return;

      const curvePoints: THREE.Vector3[] = [];
      route.waypoints.forEach(([lat, lng], idx) => {
        let elev = 750;
        // In Route A (Rejected), waypoints drop directly into low-lying submerged valley (680m)
        if (route.type === 'REJECTED') {
          elev = idx === 2 ? 675 : 710; // Lowest point at Bridge 2
        } else if (route.type === 'OPTIMAL') {
          elev = 830; // Elevated western ridge bypass!
        } else {
          elev = 780; // Secondary corridor
        }
        const [rx, ry, rz] = gpsTo3D(lat, lng, elev);
        curvePoints.push(new THREE.Vector3(rx, ry + 2.5, rz));
      });

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 40, route.type === 'OPTIMAL' ? 3.2 : 2.2, 8, false);

      let rColor = 0x22c55e; // Green
      if (route.type === 'REJECTED') rColor = 0xef4444; // Red
      else if (route.type === 'SECONDARY') rColor = 0xeab308; // Yellow

      const tubeMat = new THREE.MeshStandardMaterial({
        color: rColor,
        emissive: rColor,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.castShadow = true;
      group.add(tubeMesh);

      // If Rejected, add 3D submerged hazard warning sign over Bridge 2
      if (route.type === 'REJECTED' && curvePoints.length > 2) {
        const midPt = curvePoints[2];
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 70;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
          ctx.roundRect(0, 0, 300, 70, 10);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Inter, sans-serif';
          ctx.fillText('BRIDGE 2 SUBMERGED (1.2m)', 12, 30);
          ctx.font = '14px monospace';
          ctx.fillText('ROUTE REJECTED — DROWNING RISK', 12, 54);
        }
        const badgeTex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: badgeTex });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(midPt.x, midPt.y + 22, midPt.z);
        sprite.scale.set(45, 12, 1);
        group.add(sprite);
      }
    });
  }, [activeRoutes]);

  // Camera Presets
  const setCameraPreset = (preset: 'perspective' | 'canyon' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (preset === 'perspective') {
      cam.position.set(0, 360, 480);
      ctrl.target.set(0, 10, 0);
    } else if (preset === 'canyon') {
      cam.position.set(-280, 80, 120);
      ctrl.target.set(0, 15, 20);
    } else if (preset === 'top') {
      cam.position.set(0, 680, 10);
      ctrl.target.set(0, 0, 0);
    }
    setCameraView(preset);
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Tactical Controls HUD */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 bg-gray-950/85 backdrop-blur-md border border-gray-800 p-2.5 rounded-xl shadow-2xl text-xs">
        <div className="flex items-center space-x-2 text-gray-400 font-mono text-[10px] pb-1 border-b border-gray-800">
          <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span>RESCUENET 3D TERRAIN DEM</span>
        </div>

        {/* Camera Views */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCameraPreset('perspective')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
              cameraView === 'perspective' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-300 hover:text-white'
            }`}
          >
            🏔️ 3D Perspective
          </button>
          <button
            onClick={() => setCameraPreset('canyon')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
              cameraView === 'canyon' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-300 hover:text-white'
            }`}
          >
            🌊 River Canyon
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
              cameraView === 'top' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-300 hover:text-white'
            }`}
          >
            📐 Top-Down
          </button>
        </div>

        {/* Dynamic Toggles */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => setFloodSimulationActive(!floodSimulationActive)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold border transition ${
              floodSimulationActive
                ? 'bg-red-950/90 text-red-300 border-red-700 animate-pulse'
                : 'bg-gray-900 text-gray-300 border-gray-700 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>{floodSimulationActive ? 'Water Surge: +1.8m (BREACH)' : 'Simulate River Surge'}</span>
          </button>

          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
              wireframeMode
                ? 'bg-emerald-900 text-emerald-200 border-emerald-600'
                : 'bg-gray-900 text-gray-300 border-gray-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Contour Grid</span>
          </button>
        </div>
      </div>

      {/* Interactive 3D Legend (Direct Reference to Image 2 & 4) */}
      <div className="absolute bottom-4 left-4 z-10 bg-gray-950/90 backdrop-blur-md border border-gray-800 p-3 rounded-xl shadow-2xl text-[11px] space-y-1.5 hidden sm:block">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
          3D Topographic Legend
        </span>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-gray-200">Critical Red Zone Pin (P1 Immediate Relocation)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-gray-200">High Risk Zone Pin (P2 Urgent Relocation)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded bg-blue-500"></span>
          <span className="text-gray-200">Relief Shelter with Safe Capacity Pillar</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-6 h-1.5 bg-emerald-500 rounded"></span>
          <span className="text-emerald-400 font-bold">Route B: Optimal Elevated Ridge Safe Route</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-6 h-1.5 bg-red-600 rounded"></span>
          <span className="text-red-400 font-bold">Route A: Shortest Submerged Route (REJECTED)</span>
        </div>
      </div>

      {/* Right Guide Overlay */}
      <div className="absolute top-4 right-4 z-10 bg-gray-950/80 backdrop-blur-md border border-gray-800 px-3 py-1.5 rounded-lg text-[10px] text-gray-400 font-mono hidden md:block">
        🖱️ Left Drag: Orbit 3D • Right Drag: Pan • Scroll: Zoom
      </div>
    </div>
  );
};
