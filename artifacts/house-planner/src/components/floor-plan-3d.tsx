import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FloorPlanResult } from "@workspace/api-client-react";

interface FloorPlan3DProps {
  result: FloorPlanResult;
}

const ROOM_HEIGHT = 10;
const WALL_THICKNESS = 0.4;

function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function makeLabel(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(20,20,40,0.75)";
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 144, 16);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = text.split(" ");
  if (words.length > 2) {
    ctx.font = "bold 38px Arial";
    ctx.fillText(words.slice(0, 2).join(" "), 256, 58);
    ctx.fillText(words.slice(2).join(" "), 256, 104);
  } else {
    ctx.fillText(text, 256, 80);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(10, 3.2, 1);
  return sprite;
}

function addDoor(scene: THREE.Scene, x: number, y: number, z: number, facing: "x" | "z") {
  const doorW = 2.5;
  const doorH = 6;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.6 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xc49a3c, roughness: 0.4, metalness: 0.1 });

  // Frame
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(facing === "x" ? WALL_THICKNESS + 0.1 : doorW + 0.4, 0.4, facing === "z" ? WALL_THICKNESS + 0.1 : doorW + 0.4), frameMat);
  frameTop.position.set(x, y + doorH + 0.2, z);
  scene.add(frameTop);

  // Door panel
  const door = new THREE.Mesh(new THREE.BoxGeometry(facing === "x" ? 0.15 : doorW, doorH, facing === "z" ? 0.15 : doorW), doorMat);
  door.position.set(x, y + doorH / 2, z);
  scene.add(door);

  // Door knob
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 }));
  knob.position.set(x + (facing === "x" ? 0.2 : 0.8), y + doorH / 2, z + (facing === "z" ? 0.2 : 0));
  scene.add(knob);
}

function addWindow(scene: THREE.Scene, x: number, y: number, z: number, facing: "x" | "z") {
  const winW = 3;
  const winH = 3;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd4c5a9, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.4, roughness: 0.1 });

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(facing === "x" ? WALL_THICKNESS + 0.1 : winW + 0.4, winH + 0.4, facing === "z" ? WALL_THICKNESS + 0.1 : winW + 0.4),
    frameMat
  );
  frame.position.set(x, y, z);
  scene.add(frame);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(facing === "x" ? WALL_THICKNESS + 0.15 : winW, winH, facing === "z" ? WALL_THICKNESS + 0.15 : winW),
    glassMat
  );
  glass.position.set(x, y, z);
  scene.add(glass);

  // Cross divider
  const divH = new THREE.Mesh(new THREE.BoxGeometry(facing === "x" ? WALL_THICKNESS + 0.12 : winW, 0.15, facing === "z" ? WALL_THICKNESS + 0.12 : winW), frameMat);
  divH.position.set(x, y, z);
  scene.add(divH);
}

function addRoomProps(scene: THREE.Scene, room: { name: string; x: number; y: number; width: number; length: number; floor: number }) {
  const name = room.name.toLowerCase();
  const floorY = room.floor * ROOM_HEIGHT;
  const cx = room.x + room.width / 2;
  const cz = room.y + room.length / 2;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.8 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.3 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0x7986cb, roughness: 0.9 });
  const fabricBrown = new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.9 });

  if (name.includes("bedroom") || name.includes("master")) {
    // Bed base
    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.55, 6), 1.2, Math.min(room.length * 0.65, 8)), woodMat);
    bedBase.position.set(cx - room.width * 0.1, floorY + 0.6, cz);
    scene.add(bedBase);
    // Mattress
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.53, 5.8), 0.5, Math.min(room.length * 0.6, 7.5)), whiteMat);
    mattress.position.set(cx - room.width * 0.1, floorY + 1.45, cz);
    scene.add(mattress);
    // Pillow
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.2, 2.2), 0.4, Math.min(room.length * 0.12, 1.5)), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    pillow.position.set(cx - room.width * 0.1, floorY + 1.9, cz - Math.min(room.length * 0.22, 2.8));
    scene.add(pillow);
    // Side table
    const sideTable = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), woodMat);
    sideTable.position.set(cx + room.width * 0.2, floorY + 0.5, cz - room.length * 0.15);
    scene.add(sideTable);
  }

  else if (name.includes("living")) {
    // Sofa base
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.6, 7), 1.5, Math.min(room.length * 0.25, 3)), fabricMat);
    sofaBase.position.set(cx, floorY + 0.75, cz + room.length * 0.2);
    scene.add(sofaBase);
    // Sofa back
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.6, 7), 2.5, 0.6), fabricMat);
    sofaBack.position.set(cx, floorY + 1.75, cz + room.length * 0.3);
    scene.add(sofaBack);
    // Coffee table
    const table = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.3, 3.5), 0.25, Math.min(room.length * 0.2, 2.5)), woodMat);
    table.position.set(cx, floorY + 1.1, cz);
    scene.add(table);
    // Table legs
    [[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), woodMat);
      leg.position.set(cx + lx, floorY + 0.5, cz + lz);
      scene.add(leg);
    });
    // TV unit
    const tv = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.5, 5), 2.5, 0.3), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    tv.position.set(cx, floorY + 3.5, cz - room.length * 0.33);
    scene.add(tv);
  }

  else if (name.includes("kitchen")) {
    // Counter L-shape
    const counter1 = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.8, 7), 2, 1.5), new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.4 }));
    counter1.position.set(cx, floorY + 1, room.y + 1.5);
    scene.add(counter1);
    // Counter top
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.82, 7.2), 0.15, 1.7), new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.3, metalness: 0.3 }));
    counterTop.position.set(cx, floorY + 2.08, room.y + 1.5);
    scene.add(counterTop);
    // Sink
    const sink = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 1.0), new THREE.MeshStandardMaterial({ color: 0xbdbdbd, metalness: 0.6 }));
    sink.position.set(cx + 1, floorY + 2.1, room.y + 1.5);
    scene.add(sink);
    // Stove
    const stove = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.0), new THREE.MeshStandardMaterial({ color: 0x424242 }));
    stove.position.set(cx - 1.5, floorY + 2.1, room.y + 1.5);
    scene.add(stove);
    [[-1.8, 0.2], [-1.2, 0.2], [-1.8, -0.2], [-1.2, -0.2]].forEach(([bx, bz]) => {
      const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      burner.position.set(cx + bx, floorY + 2.18, room.y + 1.5 + bz);
      scene.add(burner);
    });
  }

  else if (name.includes("bathroom")) {
    // Shower tray
    const shower = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.4, 2.5), 0.2, Math.min(room.length * 0.4, 2.5)), new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.3 }));
    shower.position.set(cx + room.width * 0.15, floorY + 0.1, cz + room.length * 0.15);
    scene.add(shower);
    // Shower head pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 8), new THREE.MeshStandardMaterial({ color: 0xbdbdbd, metalness: 0.8 }));
    pole.position.set(cx + room.width * 0.28, floorY + 3, cz + room.length * 0.28);
    scene.add(pole);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15, 12), new THREE.MeshStandardMaterial({ color: 0xbdbdbd, metalness: 0.8 }));
    head.position.set(cx + room.width * 0.2, floorY + 6.1, cz + room.length * 0.28);
    scene.add(head);
    // Toilet
    const toilet = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.8), whiteMat);
    toilet.position.set(cx - room.width * 0.2, floorY + 0.5, cz - room.length * 0.2);
    scene.add(toilet);
    const cistern = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.5), whiteMat);
    cistern.position.set(cx - room.width * 0.2, floorY + 1.6, cz - room.length * 0.28);
    scene.add(cistern);
    // Sink
    const washbasin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.3, 12), whiteMat);
    washbasin.position.set(cx, floorY + 2.3, cz - room.length * 0.25);
    scene.add(washbasin);
    const basin_stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.0, 8), whiteMat);
    basin_stand.position.set(cx, floorY + 1.2, cz - room.length * 0.25);
    scene.add(basin_stand);
  }

  else if (name.includes("pooja")) {
    // Altar platform
    const altar = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.6, 2.5), 1.0, Math.min(room.length * 0.4, 1.5)), woodMat);
    altar.position.set(cx, floorY + 0.5, cz - room.length * 0.2);
    scene.add(altar);
    // Idol stand (small cylinder)
    const idolBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 10), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.5 }));
    idolBase.position.set(cx, floorY + 1.25, cz - room.length * 0.2);
    scene.add(idolBase);
    const idol = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.2, 10), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6 }));
    idol.position.set(cx, floorY + 2.1, cz - room.length * 0.2);
    scene.add(idol);
    // Diya (small light)
    const diya = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.8 }));
    diya.position.set(cx + 0.5, floorY + 1.25, cz - room.length * 0.2);
    scene.add(diya);
  }

  else if (name.includes("study")) {
    // Desk
    const desk = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.6, 4.5), 0.2, Math.min(room.length * 0.3, 2.2)), woodMat);
    desk.position.set(cx, floorY + 2.5, room.y + 1.5);
    scene.add(desk);
    [[-1.5, 0.8], [1.5, 0.8], [-1.5, -0.8], [1.5, -0.8]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 0.2), woodMat);
      leg.position.set(cx + lx, floorY + 1.25, room.y + 1.5 + lz);
      scene.add(leg);
    });
    // Monitor
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 0.15), new THREE.MeshStandardMaterial({ color: 0x212121 }));
    monitor.position.set(cx, floorY + 4.1, room.y + 1.3);
    scene.add(monitor);
    // Chair
    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 1.5), fabricBrown);
    chair.position.set(cx, floorY + 1.8, room.y + 3.2);
    scene.add(chair);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 0.2), fabricBrown);
    chairBack.position.set(cx, floorY + 2.8, room.y + 3.95);
    scene.add(chairBack);
  }

  else if (name.includes("parking")) {
    // Car silhouette
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.7, 4.5), 1.5, Math.min(room.length * 0.55, 2.2)), new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.4, roughness: 0.4 }));
    carBody.position.set(cx, floorY + 0.75, cz);
    scene.add(carBody);
    const carRoof = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.45, 2.8), 1.0, Math.min(room.length * 0.48, 1.9)), new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.4 }));
    carRoof.position.set(cx, floorY + 2.0, cz);
    scene.add(carRoof);
    // Wheels
    [[-1.5, -0.9], [1.5, -0.9], [-1.5, 0.9], [1.5, 0.9]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 14), new THREE.MeshStandardMaterial({ color: 0x212121 }));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(cx + wx, floorY + 0.45, cz + wz);
      scene.add(wheel);
    });
  }

  else if (name.includes("garden")) {
    const count = Math.floor(room.width * room.length / 30);
    for (let i = 0; i < Math.min(count, 6); i++) {
      const tx = room.x + 1.5 + Math.random() * (room.width - 3);
      const tz = room.y + 1.5 + Math.random() * (room.length - 3);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.5, 8), woodMat);
      trunk.position.set(tx, floorY + 1.25, tz);
      scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), greenMat);
      crown.position.set(tx, floorY + 3.8, tz);
      scene.add(crown);
    }
  }

  else if (name.includes("dining")) {
    // Dining table
    const dTable = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width * 0.55, 4.5), 0.2, Math.min(room.length * 0.4, 3.0)), woodMat);
    dTable.position.set(cx, floorY + 2.6, cz);
    scene.add(dTable);
    [[-1.5, -0.9], [1.5, -0.9], [-1.5, 0.9], [1.5, 0.9]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), woodMat);
      leg.position.set(cx + lx, floorY + 1.3, cz + lz);
      scene.add(leg);
      // Chairs
      const seatDir = lz > 0 ? 1 : -1;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), fabricBrown);
      seat.position.set(cx + lx, floorY + 2.0, cz + lz + seatDir * 1.0);
      scene.add(seat);
    });
  }
}

export function FloorPlan3D({ result }: FloorPlan3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0ede8);
    scene.fog = new THREE.Fog(0xf0ede8, 200, 600);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    const dist = Math.max(result.plotWidth, result.plotLength) * 1.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.7));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
    sun.position.set(80, 120, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 600;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    scene.add(sun);
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.4);
    fillLight.position.set(-80, 60, -80);
    scene.add(fillLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(result.plotWidth + 20, result.plotLength + 20);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xd4c9a8, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(result.plotWidth / 2, -0.05, result.plotLength / 2);
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(
      Math.max(result.plotWidth, result.plotLength) * 2.5,
      Math.max(result.plotWidth, result.plotLength) * 2 / 5,
      0xb0a090, 0xd0c8b8
    );
    gridHelper.position.set(result.plotWidth / 2, 0.01, result.plotLength / 2);
    scene.add(gridHelper);

    // Plot boundary marker
    const boundaryMat = new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 });
    const boundaryPoints = [
      new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(result.plotWidth, 0.1, 0),
      new THREE.Vector3(result.plotWidth, 0.1, result.plotLength),
      new THREE.Vector3(0, 0.1, result.plotLength), new THREE.Vector3(0, 0.1, 0),
    ];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(boundaryPoints), boundaryMat));

    // Rooms
    result.rooms.forEach((room) => {
      const roomColor = room.color ? hexToNumber(room.color) : 0xcccccc;
      const floorY = room.floor * ROOM_HEIGHT;

      // Floor slab for room
      const floorSlab = new THREE.Mesh(
        new THREE.BoxGeometry(room.width, 0.2, room.length),
        new THREE.MeshStandardMaterial({ color: roomColor, roughness: 0.8 })
      );
      floorSlab.position.set(room.x + room.width / 2, floorY + 0.1, room.y + room.length / 2);
      floorSlab.receiveShadow = true;
      scene.add(floorSlab);

      // Walls (4 sides as thin boxes)
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xfaf5ee, roughness: 0.85, transparent: true, opacity: 0.92 });
      const walls = [
        { pos: [room.x + room.width / 2, floorY + ROOM_HEIGHT / 2, room.y], size: [room.width, ROOM_HEIGHT, WALL_THICKNESS] },
        { pos: [room.x + room.width / 2, floorY + ROOM_HEIGHT / 2, room.y + room.length], size: [room.width, ROOM_HEIGHT, WALL_THICKNESS] },
        { pos: [room.x, floorY + ROOM_HEIGHT / 2, room.y + room.length / 2], size: [WALL_THICKNESS, ROOM_HEIGHT, room.length] },
        { pos: [room.x + room.width, floorY + ROOM_HEIGHT / 2, room.y + room.length / 2], size: [WALL_THICKNESS, ROOM_HEIGHT, room.length] },
      ];
      walls.forEach(({ pos, size }) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(...(size as [number, number, number])), wallMat);
        wall.position.set(...(pos as [number, number, number]));
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
      });

      // Ceiling (semi-transparent)
      const ceilMat = new THREE.MeshStandardMaterial({ color: roomColor, roughness: 0.9, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
      const ceil = new THREE.Mesh(new THREE.BoxGeometry(room.width - WALL_THICKNESS, 0.1, room.length - WALL_THICKNESS), ceilMat);
      ceil.position.set(room.x + room.width / 2, floorY + ROOM_HEIGHT, room.y + room.length / 2);
      scene.add(ceil);

      // Door on front wall
      addDoor(scene, room.x + room.width / 2, floorY, room.y, "z");

      // Windows on side walls if room is wide enough
      if (room.width > 6) {
        addWindow(scene, room.x, floorY + ROOM_HEIGHT * 0.55, room.y + room.length / 2, "x");
        addWindow(scene, room.x + room.width, floorY + ROOM_HEIGHT * 0.55, room.y + room.length / 2, "x");
      }

      // Room-specific furniture/props
      addRoomProps(scene, room);

      // Label above room
      const label = makeLabel(room.name);
      label.position.set(room.x + room.width / 2, floorY + ROOM_HEIGHT + 3.5, room.y + room.length / 2);
      scene.add(label);
    });

    // Camera orbit
    let isDragging = false;
    let prevPos = { x: 0, y: 0 };
    let theta = Math.PI / 4;
    let phi = Math.PI / 3.5;
    let radius = dist * 1.5;
    const target = new THREE.Vector3(result.plotWidth / 2, ROOM_HEIGHT * 0.3, result.plotLength / 2);

    function updateCamera() {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    }
    updateCamera();

    // Mouse
    const onMouseDown = (e: MouseEvent) => { isDragging = true; prevPos = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      theta -= (e.clientX - prevPos.x) * 0.005;
      phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, phi + (e.clientY - prevPos.y) * 0.005));
      prevPos = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => { radius = Math.max(10, Math.min(500, radius + e.deltaY * 0.25)); updateCamera(); };

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { isDragging = true; prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDragging || e.touches.length !== 1) return;
      theta -= (e.touches[0].clientX - prevPos.x) * 0.005;
      phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, phi + (e.touches[0].clientY - prevPos.y) * 0.005));
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
    <div
      ref={mountRef}
      className="w-full h-full bg-[#f0ede8] cursor-grab active:cursor-grabbing relative"
      style={{ minHeight: 500 }}
      data-testid="floor-plan-3d"
    >
      <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full pointer-events-none shadow-sm">
        👆 Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
