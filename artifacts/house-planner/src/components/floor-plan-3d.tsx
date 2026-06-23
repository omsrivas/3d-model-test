import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface FloorPlan3DProps {
  result: FloorPlanResult;
}

const ROOM_HEIGHT = 9;

function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export function FloorPlan3D({ result }: FloorPlan3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f3f0);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    const dist = Math.max(result.plotWidth, result.plotLength) * 1.8;
    camera.position.set(dist, dist * 0.9, dist);
    camera.lookAt(result.plotWidth / 2, 0, result.plotLength / 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 150, 100);
    scene.add(dirLight);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(result.plotWidth, result.plotLength);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(result.plotWidth / 2, -0.1, result.plotLength / 2);
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(
      Math.max(result.plotWidth, result.plotLength) * 2,
      Math.max(result.plotWidth, result.plotLength) * 2 / 5,
      0xaaaaaa,
      0xdddddd
    );
    gridHelper.position.set(result.plotWidth / 2, 0, result.plotLength / 2);
    scene.add(gridHelper);

    // Rooms
    result.rooms.forEach((room) => {
      const roomColor = room.color ? hexToNumber(room.color) : 0xcccccc;
      const geo = new THREE.BoxGeometry(room.width - 0.4, ROOM_HEIGHT, room.length - 0.4);
      const mat = new THREE.MeshStandardMaterial({
        color: roomColor,
        transparent: true,
        opacity: 0.85,
        roughness: 0.7,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        room.x + room.width / 2,
        room.floor * ROOM_HEIGHT + ROOM_HEIGHT / 2,
        room.y + room.length / 2
      );
      scene.add(mesh);

      // Wireframe edges
      const edgesGeo = new THREE.EdgesGeometry(
        new THREE.BoxGeometry(room.width, ROOM_HEIGHT, room.length)
      );
      const edgesMat = new THREE.LineBasicMaterial({ color: 0x2d3748 });
      const edges = new THREE.LineSegments(edgesGeo, edgesMat);
      edges.position.copy(mesh.position);
      scene.add(edges);
    });

    // Orbit controls (manual)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let theta = Math.PI / 4;
    let phi = Math.PI / 3.5;
    let radius = dist * 1.5;
    const target = new THREE.Vector3(result.plotWidth / 2, 0, result.plotLength / 2);

    function updateCamera() {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    }
    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      theta -= dx * 0.005;
      phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, phi + dy * 0.005));
      prevMouse = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      radius = Math.max(10, Math.min(500, radius + e.deltaY * 0.2));
      updateCamera();
    };

    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    mount.addEventListener("wheel", onWheel, { passive: true });

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      mount.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      mount.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [result]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full bg-[#f5f3f0] cursor-grab active:cursor-grabbing"
      style={{ minHeight: 500 }}
      data-testid="floor-plan-3d"
    >
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded pointer-events-none">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
