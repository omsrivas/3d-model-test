import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface FloorPlan3DProps {
  result: FloorPlanResult;
}

const WALL_H = 9;
const WALL_T = 0.35;
const FLOOR_H = 0.25;

function hexToNum(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

type RoomData = { name: string; x: number; y: number; width: number; length: number; floor: number; color?: string };

// Check if another room occupies the given edge of `room`
function hasNeighbor(rooms: RoomData[], room: RoomData, side: "front" | "back" | "left" | "right"): boolean {
  for (const o of rooms) {
    if (o === room || o.floor !== room.floor) continue;
    const xOverlap = o.x < room.x + room.width - 0.5 && o.x + o.width > room.x + 0.5;
    const yOverlap = o.y < room.y + room.length - 0.5 && o.y + o.length > room.y + 0.5;
    if (side === "front"  && Math.abs(o.y + o.length - room.y) < 0.6 && xOverlap) return true;
    if (side === "back"   && Math.abs(o.y - (room.y + room.length)) < 0.6 && xOverlap) return true;
    if (side === "left"   && Math.abs(o.x + o.width - room.x) < 0.6 && yOverlap) return true;
    if (side === "right"  && Math.abs(o.x - (room.x + room.width)) < 0.6 && yOverlap) return true;
  }
  return false;
}

function makeLabel(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(15,23,42,0.82)";
  ctx.beginPath(); ctx.roundRect(4, 4, 248, 88, 10); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const words = text.split(" ");
  if (words.length > 2) {
    ctx.font = "bold 26px Arial";
    ctx.fillText(words.slice(0, 2).join(" "), 128, 36);
    ctx.fillText(words.slice(2).join(" "), 128, 64);
  } else {
    ctx.font = "bold 30px Arial";
    ctx.fillText(text, 128, 48);
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(7, 2.6, 1);
  return s;
}

function addStaircaseSteps(scene: THREE.Scene, room: RoomData, floorY: number) {
  const stepCount = 12;
  const stepW = Math.min(room.width - 1, 5);
  const stepD = (room.length - 1) / stepCount;
  const stepH = WALL_H / stepCount;
  const mat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.7 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.5, metalness: 0.2 });

  for (let s = 0; s < stepCount; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, FLOOR_H + 0.05, stepD),
      mat
    );
    step.position.set(
      room.x + room.width / 2,
      floorY + FLOOR_H + s * stepH + stepH / 2,
      room.y + 0.5 + s * stepD + stepD / 2
    );
    step.castShadow = true;
    scene.add(step);
  }

  // Handrails
  const railH = WALL_H * 0.4;
  [room.x + room.width / 2 - stepW / 2 + 0.2, room.x + room.width / 2 + stepW / 2 - 0.2].forEach(rx => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, railH, room.length - 1), railMat);
    rail.position.set(rx, floorY + railH / 2 + WALL_H / 2, room.y + room.length / 2);
    scene.add(rail);
  });
}

function addFurniture(scene: THREE.Scene, room: RoomData, floorY: number) {
  const n = room.name.toLowerCase();
  const cx = room.x + room.width / 2;
  const cz = room.y + room.length / 2;
  const wood = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 });
  const fabric = new THREE.MeshStandardMaterial({ color: 0x7986cb, roughness: 0.9 });

  const box = (w: number, h: number, d: number, mat: THREE.Material, px: number, py: number, pz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(px, py, pz); m.castShadow = true; scene.add(m);
    return m;
  };

  if ((n.includes("bedroom") || n.includes("master")) && room.width > 5 && room.length > 5) {
    const bw = Math.min(room.width * 0.55, 5.5);
    const bd = Math.min(room.length * 0.6, 7);
    box(bw, 0.9, bd, wood, cx - room.width * 0.08, floorY + FLOOR_H + 0.45, cz);
    box(bw - 0.2, 0.35, bd - 0.3, white, cx - room.width * 0.08, floorY + FLOOR_H + 1.05, cz);
    box(Math.min(bw * 0.45, 2), 0.25, 1.2, white, cx - room.width * 0.08, floorY + FLOOR_H + 1.4, cz - bd * 0.38);
  }
  else if (n.includes("living") || n.includes("drawing") || n.includes("hall")) {
    if (room.width < 5 || room.length < 5) return;
    const sw = Math.min(room.width * 0.55, 6.5);
    const sd = Math.min(room.length * 0.22, 2.5);
    box(sw, 1.2, sd, fabric, cx, floorY + FLOOR_H + 0.6, cz + room.length * 0.2);
    box(sw, 1.8, 0.5, fabric, cx, floorY + FLOOR_H + 1.5, cz + room.length * 0.29);
    box(Math.min(sw * 0.55, 3.5), 0.18, Math.min(room.length * 0.18, 2.2), wood, cx, floorY + FLOOR_H + 1.05, cz - room.length * 0.04);
    box(Math.min(room.width * 0.45, 4.5), 2.2, 0.2, new THREE.MeshStandardMaterial({ color: 0x111111 }), cx, floorY + FLOOR_H + 3.5, cz - room.length * 0.32);
  }
  else if (n.includes("kitchen") && room.width > 4 && room.length > 4) {
    const cw = Math.min(room.width * 0.75, 6.5);
    box(cw, 1.8, 1.3, new THREE.MeshStandardMaterial({ color: 0xd7ccc8 }), cx, floorY + FLOOR_H + 0.9, room.y + 1.3);
    box(cw + 0.2, 0.12, 1.5, new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.3, metalness: 0.3 }), cx, floorY + FLOOR_H + 1.88, room.y + 1.3);
  }
  else if (n.includes("dining") && room.width > 4 && room.length > 4) {
    const tw = Math.min(room.width * 0.5, 4); const td = Math.min(room.length * 0.4, 3);
    box(tw, 0.15, td, wood, cx, floorY + FLOOR_H + 2.5, cz);
    [[-tw/2+0.2, -td/2+0.2],[tw/2-0.2, -td/2+0.2],[-tw/2+0.2, td/2-0.2],[tw/2-0.2, td/2-0.2]].forEach(([lx,lz]) => {
      box(0.15, 2.4, 0.15, wood, cx + (lx as number), floorY + FLOOR_H + 1.2, cz + (lz as number));
    });
  }
  else if (n.includes("pooja") || n.includes("mandir")) {
    if (room.width < 3 || room.length < 3) return;
    box(Math.min(room.width * 0.55, 2.2), 0.8, Math.min(room.length * 0.35, 1.3), wood, cx, floorY + FLOOR_H + 0.4, cz - room.length * 0.15);
    const diya = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.9 }));
    diya.position.set(cx, floorY + FLOOR_H + 1.1, cz - room.length * 0.15);
    scene.add(diya);
    const light = new THREE.PointLight(0xff8800, 0.8, 8);
    light.position.set(cx, floorY + FLOOR_H + 1.5, cz - room.length * 0.15);
    scene.add(light);
  }
  else if (n.includes("parking") || n.includes("garage")) {
    if (room.width < 4 || room.length < 4) return;
    const carMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.5, roughness: 0.4 });
    box(Math.min(room.width * 0.65, 4.2), 1.4, Math.min(room.length * 0.5, 2), carMat, cx, floorY + FLOOR_H + 0.7, cz);
    box(Math.min(room.width * 0.4, 2.5), 0.9, Math.min(room.length * 0.45, 1.7), carMat, cx, floorY + FLOOR_H + 1.85, cz);
  }
  else if ((n.includes("garden") || n.includes("lawn") || n.includes("courtyard")) && room.width > 4 && room.length > 4) {
    const cnt = Math.min(Math.floor((room.width * room.length) / 35), 5);
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.9 });
    for (let i = 0; i < cnt; i++) {
      const tx = room.x + 1.5 + (i % 3) * ((room.width - 3) / Math.max(2, cnt - 1));
      const tz = room.y + 1.5 + Math.floor(i / 3) * ((room.length - 3) / Math.max(1, Math.floor(cnt / 3)));
      box(0.3, 2.5, 0.3, new THREE.MeshStandardMaterial({ color: 0x6d4c41 }), tx, floorY + FLOOR_H + 1.25, tz);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), greenMat);
      crown.position.set(tx, floorY + FLOOR_H + 4, tz); crown.castShadow = true; scene.add(crown);
    }
  }
  else if (n.includes("study") || n.includes("office")) {
    if (room.width < 4 || room.length < 4) return;
    box(Math.min(room.width * 0.55, 4), 0.15, Math.min(room.length * 0.28, 2), wood, cx, floorY + FLOOR_H + 2.4, room.y + 1.4);
    box(Math.min(room.width * 0.55, 4) * 0.35, 1.6, 0.12, new THREE.MeshStandardMaterial({ color: 0x212121 }), cx, floorY + FLOOR_H + 4, room.y + 1.3);
  }
}

export function FloorPlan3D({ result }: FloorPlan3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 600;
    const H = mount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xedf2f7);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.75));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.1);
    sun.position.set(80, 130, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 500;
    sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.35);
    fill.position.set(-60, 50, -60); scene.add(fill);

    const cx = result.plotWidth / 2;
    const cz = result.plotLength / 2;

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(result.plotWidth + 30, result.plotLength + 30),
      new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cx, 0, cz);
    ground.receiveShadow = true;
    scene.add(ground);

    // Plot base slab
    const baseSlab = new THREE.Mesh(
      new THREE.BoxGeometry(result.plotWidth, FLOOR_H, result.plotLength),
      new THREE.MeshStandardMaterial({ color: 0xe8e0d4, roughness: 0.9 })
    );
    baseSlab.position.set(cx, FLOOR_H / 2, cz);
    baseSlab.receiveShadow = true;
    scene.add(baseSlab);

    // Grid
    const gridHelper = new THREE.GridHelper(
      Math.max(result.plotWidth, result.plotLength) * 2,
      Math.max(result.plotWidth, result.plotLength) * 2 / 5,
      0xb0a090, 0xcdc5b8
    );
    gridHelper.position.set(cx, 0.02, cz);
    scene.add(gridHelper);

    const allRooms = result.rooms as RoomData[];

    // Wall material (shared)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfaf6ef, roughness: 0.85 });
    const outerWallMat = new THREE.MeshStandardMaterial({ color: 0xece7de, roughness: 0.8 });

    allRooms.forEach((room) => {
      const floorY = room.floor * (WALL_H + FLOOR_H);
      const roomColor = room.color ? hexToNum(room.color) : 0xcccccc;
      const lower = room.name.toLowerCase();
      const isStair = lower.includes("stair");

      // Colored floor slab for this room
      const floorSlab = new THREE.Mesh(
        new THREE.BoxGeometry(room.width - WALL_T, FLOOR_H, room.length - WALL_T),
        new THREE.MeshStandardMaterial({ color: roomColor, roughness: 0.85, metalness: 0.02 })
      );
      floorSlab.position.set(room.x + room.width / 2, floorY + FLOOR_H / 2, room.y + room.length / 2);
      floorSlab.receiveShadow = true;
      scene.add(floorSlab);

      if (isStair) {
        addStaircaseSteps(scene, room, floorY);
      } else {
        // Draw walls only on EXTERIOR or non-shared sides
        // front = -z side (y = room.y), back = +z side, left = -x, right = +x

        const noFront = hasNeighbor(allRooms, room, "front");
        const noBack  = hasNeighbor(allRooms, room, "back");
        const noLeft  = hasNeighbor(allRooms, room, "left");
        const noRight = hasNeighbor(allRooms, room, "right");

        const wallDefs = [
          { skip: noFront, pos: [room.x + room.width/2, floorY + FLOOR_H + WALL_H/2, room.y],              size: [room.width, WALL_H, WALL_T], outer: !noFront },
          { skip: noBack,  pos: [room.x + room.width/2, floorY + FLOOR_H + WALL_H/2, room.y + room.length], size: [room.width, WALL_H, WALL_T], outer: !noBack  },
          { skip: noLeft,  pos: [room.x,               floorY + FLOOR_H + WALL_H/2, room.y + room.length/2], size: [WALL_T, WALL_H, room.length], outer: !noLeft  },
          { skip: noRight, pos: [room.x + room.width,  floorY + FLOOR_H + WALL_H/2, room.y + room.length/2], size: [WALL_T, WALL_H, room.length], outer: !noRight },
          // Interior dividers (thin, half height) where a neighbor exists
          { skip: !noFront, pos: [room.x + room.width/2, floorY + FLOOR_H + WALL_H*0.22, room.y],               size: [room.width, WALL_H*0.45, WALL_T * 0.6], outer: false },
          { skip: !noBack,  pos: [room.x + room.width/2, floorY + FLOOR_H + WALL_H*0.22, room.y + room.length],  size: [room.width, WALL_H*0.45, WALL_T * 0.6], outer: false },
          { skip: !noLeft,  pos: [room.x,                floorY + FLOOR_H + WALL_H*0.22, room.y + room.length/2], size: [WALL_T*0.6, WALL_H*0.45, room.length],  outer: false },
          { skip: !noRight, pos: [room.x + room.width,   floorY + FLOOR_H + WALL_H*0.22, room.y + room.length/2], size: [WALL_T*0.6, WALL_H*0.45, room.length],  outer: false },
        ];

        wallDefs.forEach(({ skip, pos, size, outer }) => {
          if (skip) return;
          const wall = new THREE.Mesh(
            new THREE.BoxGeometry(...(size as [number, number, number])),
            outer ? outerWallMat : wallMat
          );
          wall.position.set(...(pos as [number, number, number]));
          wall.castShadow = true; wall.receiveShadow = true;
          scene.add(wall);
        });

        // Window on exterior walls (only if room big enough)
        if (!noFront && room.width > 7) {
          const winGeo = new THREE.BoxGeometry(Math.min(room.width * 0.35, 3), 2.2, 0.4);
          const winMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.45, roughness: 0.05 });
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(room.x + room.width / 2, floorY + FLOOR_H + WALL_H * 0.62, room.y);
          scene.add(win);
          // Frame
          const frame = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.35, 3) + 0.3, 2.5, WALL_T + 0.08),
            new THREE.MeshStandardMaterial({ color: 0xd9cfc4, roughness: 0.5 }));
          frame.position.copy(win.position); scene.add(frame);
        }

        // Door on front wall (exterior only)
        if (!noFront) {
          const doorMat = new THREE.MeshStandardMaterial({ color: 0xb5845a, roughness: 0.5 });
          const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6, 0.18), doorMat);
          door.position.set(room.x + room.width / 2, floorY + FLOOR_H + 3, room.y);
          door.castShadow = true; scene.add(door);
          const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85 }));
          knob.position.set(room.x + room.width / 2 + 0.7, floorY + FLOOR_H + 3, room.y + 0.12);
          scene.add(knob);
        }

        // Furniture
        addFurniture(scene, room, floorY);
      }

      // Ceiling slab (per floor, opaque thin slab)
      if (room.floor < (Math.max(...allRooms.map(r => r.floor)))) {
        const ceil = new THREE.Mesh(
          new THREE.BoxGeometry(room.width, FLOOR_H, room.length),
          new THREE.MeshStandardMaterial({ color: 0xf0ece5, roughness: 0.9 })
        );
        ceil.position.set(room.x + room.width / 2, floorY + FLOOR_H + WALL_H + FLOOR_H / 2, room.y + room.length / 2);
        scene.add(ceil);
      }

      // Label
      const label = makeLabel(room.name);
      label.position.set(room.x + room.width / 2, floorY + FLOOR_H + WALL_H + 2.5, room.y + room.length / 2);
      scene.add(label);
    });

    // Camera orbit setup
    const dist = Math.max(result.plotWidth, result.plotLength) * 2.2;
    let isDragging = false;
    let prevPos = { x: 0, y: 0 };
    let theta = Math.PI / 4;
    let phi = Math.PI / 3.2;
    let radius = dist;
    const target = new THREE.Vector3(cx, WALL_H * 0.35, cz);

    function updateCamera() {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    }
    updateCamera();

    const onMouseDown = (e: MouseEvent) => { isDragging = true; prevPos = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      theta -= (e.clientX - prevPos.x) * 0.005;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi + (e.clientY - prevPos.y) * 0.005));
      prevPos = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => { radius = Math.max(15, Math.min(600, radius + e.deltaY * 0.3)); updateCamera(); };

    let lastPinch = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { isDragging = true; prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
      else if (e.touches.length === 2) { isDragging = false; lastPinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        theta -= (e.touches[0].clientX - prevPos.x) * 0.005;
        phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi + (e.touches[0].clientY - prevPos.y) * 0.005));
        prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateCamera();
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        radius = Math.max(15, Math.min(600, radius + (lastPinch - d) * 0.5));
        lastPinch = d; updateCamera();
      }
    };
    const onTouchEnd = () => { isDragging = false; lastPinch = 0; };

    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    mount.addEventListener("wheel", onWheel, { passive: true });
    mount.addEventListener("touchstart", onTouchStart, { passive: true });
    mount.addEventListener("touchmove", onTouchMove, { passive: false });
    mount.addEventListener("touchend", onTouchEnd);

    let animId: number;
    const animate = () => { animId = requestAnimationFrame(animate); renderer.render(scene, camera); };
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
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [result]);

  return (
    <div ref={mountRef} className="w-full h-full bg-[#edf2f7] cursor-grab active:cursor-grabbing relative" style={{ minHeight: 480 }}>
      <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white/85 px-3 py-1.5 rounded-full pointer-events-none shadow-sm">
        👆 Drag to rotate · Scroll/Pinch to zoom
      </div>
    </div>
  );
}
