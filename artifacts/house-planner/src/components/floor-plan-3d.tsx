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

function makeTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.roundRect(4, 4, 248, 120, 10);
  ctx.fill();

  ctx.fillStyle = "#1a1a2e";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = text.split(" ");
  if (words.length > 2) {
    ctx.fillText(words.slice(0, 2).join(" "), 128, 50);
    ctx.fillText(words.slice(2).join(" "), 128, 82);
  } else {
    ctx.fillText(text, 128, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(8, 4, 1);
  return sprite;
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

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 150, 100);
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-100, 100, -100);
    scene.add(dirLight2);

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

    // Rooms + Labels
    result.rooms.forEach((room) => {
      const roomColor = room.color ? hexToNumber(room.color) : 0xcccccc;
      const geo = new THREE.BoxGeometry(room.width - 0.4, ROOM_HEIGHT, room.length - 0.4);
      const mat = new THREE.MeshStandardMaterial({
        color: roomColor,
        transparent: true,
        opacity: 0.88,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const posX = room.x + room.width / 2;
      const posY = room.floor * ROOM_HEIGHT + ROOM_HEIGHT / 2;
      const posZ = room.y + room.length / 2;
      mesh.position.set(posX, posY, posZ);
      scene.add(mesh);

      // Wireframe edges
      const edgesGeo = new THREE.EdgesGeometry(
        new THREE.BoxGeometry(room.width, ROOM_HEIGHT, room.length)
      );
      const edgesMat = new THREE.LineBasicMaterial({ color: 0x2d3748, linewidth: 1 });
      const edges = new THREE.LineSegments(edgesGeo, edgesMat);
      edges.position.copy(mesh.position);
      scene.add(edges);

      // Label sprite on top of room
      const sprite = makeTextSprite(room.name);
      sprite.position.set(posX, room.floor * ROOM_HEIGHT + ROOM_HEIGHT + 2.5, posZ);
      scene.add(sprite);
    });

    // Orbit controls — mouse + touch
    let isDragging = false;
    let prevPos = { x: 0, y: 0 };
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

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevPos = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevPos.x;
      const dy = e.clientY - prevPos.y;
      theta -= dx * 0.005;
      phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, phi + dy * 0.005));
      prevPos = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      radius = Math.max(10, Math.min(500, radius + e.deltaY * 0.2));
      updateCamera();
    };

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevPos.x;
      const dy = e.touches[0].clientY - prevPos.y;
      theta -= dx * 0.005;
      phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, phi + dy * 0.005));
      prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCamera();
    };
    const onTouchEnd = () => { isDragging = false; };

    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    mount.addEventListener("wheel", onWheel, { passive: true });
    mount.addEventListener("touchstart", onTouchStart, { passive: true });
    mount.addEventListener("touchmove", onTouchMove, { passive: false });
    mount.addEventListener("touchend", onTouchEnd);

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
      mount.removeEventListener("touchstart", onTouchStart);
      mount.removeEventListener("touchmove", onTouchMove);
      mount.removeEventListener("touchend", onTouchEnd);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [result]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full bg-[#f5f3f0] cursor-grab active:cursor-grabbing relative"
      style={{ minHeight: 500 }}
      data-testid="floor-plan-3d"
    >
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded pointer-events-none">
        Drag to rotate · Scroll/pinch to zoom
      </div>
    </div>
  );
}
