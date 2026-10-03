import * as T from "three";
import { Game, islands, chaseIslands } from "./core";

const Y = new T.Vector3(0, 1, 0);
const material = (color: number, flat = true) =>
  new T.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0.22,
    flatShading: flat,
  });
const alloy = material(0xd5e0d6),
  dark = material(0x304650),
  orange = material(0xe99648),
  black = material(0x132c39),
  landTop = 0x7d967e;
const glow = new T.MeshBasicMaterial({ color: 0xffae55 });
function box(
  parent: T.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: T.Material,
) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function wedge(points: number[], mat: T.Material) {
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(points, 3));
  geo.computeVertexNormals();
  return new T.Mesh(geo, mat);
}
function wing(
  parent: T.Object3D,
  points: [number, number][],
  height: number,
  mat: T.Material,
  y = 0,
) {
  const s = new T.Shape();
  points.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: height, bevelEnabled: false });
  g.rotateX(Math.PI / 2);
  const m = new T.Mesh(g, mat);
  m.position.y = y;
  parent.add(m);
  return m;
}
const aircraftTemplates = new Map<string, T.Group>();
export function aircraft(kind = "player") {
  const cached = aircraftTemplates.get(kind);
  if (cached) return cached.clone(true);
  const group = new T.Group();
  const body =
    kind === "ace"
      ? material(0x394350)
      : kind === "scout"
        ? material(0xa3bcb4)
        : kind === "fighter"
          ? material(0x647c81)
          : kind === "drone"
            ? material(0xeac76c)
            : alloy;
  const accent =
    kind === "ace" || kind === "fighter" ? material(0xed6150) : orange;
  // Cross-section fuselage, pointed nose, shoulders, and twin engine tail.
  const positions: number[] = [],
    indices: number[] = [];
  const sections = [
    [-11, 2.1, 1.2],
    [-6, 2.5, 1.7],
    [3, 2.2, 1.8],
    [10, 1.3, 1.3],
    [17, 0.08, 0.08],
  ];
  sections.forEach(([z, w, h]) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      positions.push(Math.cos(a) * w, Math.sin(a) * h, z);
    }
  });
  for (let r = 0; r < sections.length - 1; r++)
    for (let i = 0; i < 8; i++) {
      const a = r * 8 + i,
        b = r * 8 + ((i + 1) % 8),
        c = a + 8,
        d = b + 8;
      indices.push(a, b, c, b, d, c);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  group.add(new T.Mesh(geo, body));
  wing(
    group,
    [
      [-1, 5],
      [-15, -5],
      [-16, -8],
      [-4, -7],
      [0, -3],
      [4, -7],
      [16, -8],
      [15, -5],
      [1, 5],
    ],
    0.55,
    body,
  );
  wing(
    group,
    [
      [-1, -4],
      [-9, -12],
      [-8, -14],
      [0, -10],
      [8, -14],
      [9, -12],
      [1, -4],
    ],
    0.35,
    body,
    1,
  );
  for (const sign of [-1, 1]) {
    wing(
      group,
      [
        [sign * 10, -3],
        [sign * 13, -4.5],
        [sign * 13.5, -7.7],
        [sign * 10.5, -7.4],
      ],
      0.05,
      accent,
      0.4,
    );
    const fin = wedge(
      [
        sign * 2,
        1,
        -10,
        sign * 3,
        8,
        -10,
        sign * 3,
        7,
        -5,
        sign * 2,
        1,
        -10,
        sign * 3,
        7,
        -5,
        sign * 2,
        1,
        -2,
      ],
      body,
    );
    (fin.material as T.MeshStandardMaterial).side = T.DoubleSide;
    group.add(fin);
    box(group, 1, 0.4, 5, sign * 9, -1.1, -3, black);
    const tip = box(group, 0.32, 0.32, 2.4, sign * 14, 0.1, -5.4, accent);
    const engine = new T.Mesh(new T.CylinderGeometry(1.25, 1.05, 7, 10), dark);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(sign * 1.8, -0.4, -9);
    group.add(engine);
    const flame = new T.Mesh(new T.ConeGeometry(0.92, 6, 12), glow);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(sign * 1.8, -0.4, -15);
    flame.name = "flame";
    group.add(flame);
    const light = new T.Mesh(
      new T.SphereGeometry(0.28, 6, 4),
      new T.MeshBasicMaterial({ color: sign === 1 ? 0xff6d59 : 0x77eacc }),
    );
    light.position.set(sign * 15.7, 0.3, -7);
    group.add(light);
    tip.userData.static = true;
  }
  const canopy = new T.Mesh(
    new T.SphereGeometry(1, 12, 8),
    new T.MeshPhysicalMaterial({
      color: 0x163b4c,
      metalness: 0.65,
      roughness: 0.13,
      clearcoat: 1,
    }),
  );
  canopy.scale.set(1.35, 1.4, 4.3);
  canopy.position.set(0, 1.5, 5);
  group.add(canopy);
  box(group, 0.55, 0.12, 5.7, 0, 2.87, 5, alloy);
  if (kind === "scout") {
    group.scale.set(1.5, 1.1, 1.25);
    const radome = new T.Mesh(new T.SphereGeometry(3, 12, 6), body);
    radome.scale.set(2, 0.4, 1);
    radome.position.set(0, 3.8, -3);
    group.add(radome);
  }
  if (kind === "drone") group.scale.setScalar(0.65);
  aircraftTemplates.set(kind, group.clone(true));
  return group;
}
function carrier() {
  const g = new T.Group();
  const hull = material(0x405e69),
    deck = material(0x617b81),
    mark = material(0xcbd3bb);
  wing(
    g,
    [
      [-35, -175],
      [-44, -120],
      [-44, 100],
      [-24, 170],
      [18, 177],
      [38, 123],
      [39, -166],
    ],
    22,
    hull,
    20,
  );
  wing(
    g,
    [
      [-43, -180],
      [-51, -50],
      [-49, 120],
      [-29, 180],
      [29, 180],
      [48, 100],
      [48, -180],
    ],
    4,
    deck,
    27,
  );
  box(g, 14, 35, 53, -29, 44, -30, hull);
  box(g, 17, 9, 40, -31, 63, -33, deck);
  box(g, 1.5, 38, 1.5, -31, 82, -35, black);
  box(g, 26, 1.7, 2, -31, 92, -35, hull);
  for (let z = -155; z < 135; z += 18) box(g, 0.7, 0.12, 10, 4, 27.2, z, mark);
  for (const x of [-14, 22]) box(g, 0.6, 0.15, 260, x, 27.3, 0, mark);
  for (let i = 0; i < 5; i++) {
    const plane = aircraft();
    plane.scale.setScalar(0.65);
    plane.position.set(32, 28, -118 + i * 29);
    plane.rotation.y = -0.35;
    g.add(plane);
  }
  for (let i = 0; i < 4; i++)
    box(g, 30, 0.12, 0.5, 4, 27.5, -90 + i * 14, orange);
  const wake = new T.Mesh(
    new T.PlaneGeometry(90, 1200),
    new T.MeshBasicMaterial({
      color: 0xd0efe0,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  wake.rotation.x = -Math.PI / 2;
  wake.position.set(0, 1, -720);
  g.add(wake);
  return g;
}
function islandMesh(i: (typeof islands)[number]) {
  const vertices: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  const n = 22;
  const profiles = [
    [1.07, 0],
    [1, 0.06],
    [0.86, 0.72],
    [0.7, 0.83],
    [0.3, 1],
  ];
  const sand = new T.Color(0xb3c0a1),
    rock = new T.Color(0x9ba9a0),
    top = new T.Color(landTop);
  profiles.forEach(([r, h], k) => {
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2;
      const noise =
        1 + 0.095 * Math.sin(j * 4.7 + i.seed) + 0.05 * Math.cos(j * 2.3);
      vertices.push(
        i.x + Math.cos(a) * i.rx * r * noise,
        i.h * h * (1 + 0.08 * Math.sin(j * 3 + i.seed)),
        i.z + Math.sin(a) * i.rz * r * noise,
      );
      const c = (k < 2 ? sand : k < 3 ? rock : top)
        .clone()
        .multiplyScalar(0.85 + 0.18 * Math.sin(j * 2.2 + i.seed));
      colors.push(c.r, c.g, c.b);
    }
  });
  vertices.push(i.x, i.h, i.z);
  colors.push(top.r, top.g, top.b);
  for (let k = 0; k < profiles.length - 1; k++)
    for (let j = 0; j < n; j++) {
      const a = k * n + j,
        b = k * n + ((j + 1) % n),
        c = a + n,
        d = b + n;
      idx.push(a, c, b, b, c, d);
    }
  for (let j = 0; j < n; j++) idx.push(4 * n + j, 5 * n, 4 * n + ((j + 1) % n));
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new T.Mesh(
    geo,
    new T.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 1,
      side: T.DoubleSide,
    }),
  );
}
export class World {
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(62, 1, 2, 80000);
  renderer: T.WebGLRenderer;
  player = aircraft();
  fleet = new T.Group();
  wingmen = [aircraft(), aircraft(), aircraft()];
  enemies = new Map<number, T.Group>();
  projectiles = new Map<number, T.Mesh>();
  effects = new Map<number, T.Group>();
  gate: T.Group;
  water: T.Mesh;
  sky: T.Mesh;
  clouds: T.Group;
  routeGroup = new T.Group();
  private routeOrigin: T.Vector3 | null = null;
  trailPositions = new Float32Array(1800 * 3);
  trailLife = new Float32Array(1800);
  trailHead = 0;
  trailTick = 0;
  trails: T.Points;
  time = 0;
  shake = 0;
  reducedMotion = false;
  lowQuality = false;
  private lastPhase = "";
  private initialized = false;
  private aim = new T.Vector3();
  private cam = new T.Vector3();
  private enemyArrow = new T.Vector3();
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.13;
    this.scene.background = new T.Color(0x9fc7ce);
    this.scene.fog = new T.FogExp2(0x9fc7ce, 0.000048);
    this.scene.add(new T.HemisphereLight(0xd1ebf0, 0x304b57, 2.5));
    const sun = new T.DirectionalLight(0xffe2a9, 3.2);
    sun.position.set(-8000, 10000, 12000);
    this.scene.add(sun);
    this.sky = new T.Mesh(
      new T.SphereGeometry(55000, 32, 16),
      new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        uniforms: {
          sun: { value: new T.Vector3(-0.5, 0.26, 0.82).normalize() },
        },
        vertexShader:
          "varying vec3 v; void main(){v=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec3 v;uniform vec3 sun;void main(){vec3 d=normalize(v);float h=max(d.y,0.);vec3 c=mix(vec3(.68,.79,.78),vec3(.24,.49,.64),pow(h,.55));float s=max(dot(d,sun),0.);c+=vec3(1.,.70,.31)*pow(s,200.)*.6;c=mix(c,vec3(1.,.87,.60),smoothstep(.9994,.9998,s));float storm=smoothstep(.6,1.,d.x)*pow(1.-h,8.);c=mix(c,vec3(.35,.45,.52),storm*.55);gl_FragColor=vec4(c,1.);}",
      }),
    );
    this.scene.add(this.sky);
    const waterMat = new T.ShaderMaterial({
      uniforms: { time: { value: 0 }, eye: { value: new T.Vector3() } },
      vertexShader:
        "varying vec3 w;void main(){w=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}",
      fragmentShader:
        "varying vec3 w;uniform float time;uniform vec3 eye;void main(){vec2 uv=w.xz;float a=sin(uv.x*.018+uv.y*.029+time*.7);float b=sin(uv.x*.046-uv.y*.031+time*.9);float c=sin(uv.x*.11+uv.y*.07-time*1.4);vec3 n=normalize(vec3((a+b)*.09,1.,(b+c)*.12));vec3 view=normalize(eye-w);vec3 light=normalize(vec3(-.5,.55,.8));float spec=pow(max(dot(reflect(-light,n),view),0.),95.);float fres=pow(1.-max(view.y,0.),3.);vec3 col=mix(vec3(.045,.245,.31),vec3(.30,.53,.57),fres*.7);col+=(a*b*.5+.5)*vec3(.016,.034,.031);col+=spec*vec3(.9,.77,.49)*.85;float foam=smoothstep(.982,1.,a*b)*.12;col+=foam*vec3(.39,.62,.59);float fog=1.-exp(-length(eye-w)*.00006);col=mix(col,vec3(.61,.76,.78),fog);gl_FragColor=vec4(col,1.);}",
    });
    this.water = new T.Mesh(new T.PlaneGeometry(180000, 180000), waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -2;
    this.scene.add(this.water);
    for (const i of islands) this.scene.add(islandMesh(i));
    this.buildBridge(this.scene, 12100);
    this.scene.add(this.routeGroup);
    const mainCarrier = carrier();
    this.fleet.add(mainCarrier);
    for (let i = 0; i < 4; i++) {
      const ship = carrier();
      ship.scale.set(0.4, 0.65, 0.52);
      ship.position.set((i % 2 ? 1 : -1) * (350 + i * 100), 0, -200 - i * 240);
      this.fleet.add(ship);
    }
    this.scene.add(this.fleet, this.player, ...this.wingmen);
    this.clouds = this.makeClouds();
    this.scene.add(this.clouds);
    this.gate = new T.Group();
    const ring = new T.Mesh(
      new T.TorusGeometry(270, 4.5, 6, 64),
      new T.MeshBasicMaterial({
        color: 0xffd49b,
        transparent: true,
        opacity: 0.88,
      }),
    );
    this.gate.add(ring);
    for (let i = 0; i < 4; i++) {
      const tick = new T.Mesh(
        new T.BoxGeometry(30, 7, 7),
        new T.MeshBasicMaterial({ color: 0xffe6b7 }),
      );
      const a = (i * Math.PI) / 2;
      tick.position.set(Math.cos(a) * 270, Math.sin(a) * 270, 0);
      tick.rotation.z = a;
      this.gate.add(tick);
    }
    this.scene.add(this.gate);
    const tg = new T.BufferGeometry();
    tg.setAttribute("position", new T.BufferAttribute(this.trailPositions, 3));
    this.trailPositions.fill(1000000);
    const smokeCanvas = document.createElement("canvas");
    smokeCanvas.width = 32;
    smokeCanvas.height = 32;
    const smoke = smokeCanvas.getContext("2d")!;
    const gradient = smoke.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,.8)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    smoke.fillStyle = gradient;
    smoke.fillRect(0, 0, 32, 32);
    this.trails = new T.Points(
      tg,
      new T.PointsMaterial({
        map: new T.CanvasTexture(smokeCanvas),
        color: 0xddebe0,
        size: 16,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    );
    this.trails.frustumCulled = false;
    this.scene.add(this.trails);
    this.resize();
  }
  private buildBridge(parent: T.Object3D, zPosition: number) {
    const g = new T.Group();
    const concrete = material(0x8caaa7),
      rail = material(0x465f68);
    box(g, 3100, 22, 45, 0, 315, 12100, concrete);
    for (const x of [-1200, -700, 700, 1200]) {
      box(g, 38, 330, 44, x, 150, 12100, concrete);
      box(g, 28, 260, 28, x, 450, 12100, rail);
    }
    for (const z of [12076, 12124]) box(g, 3100, 4, 3, 0, 334, z, rail);
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(-1400, 540, 12100),
      new T.Vector3(-700, 600, 12100),
      new T.Vector3(0, 350, 12100),
      new T.Vector3(700, 600, 12100),
      new T.Vector3(1400, 540, 12100),
    ]);
    g.add(new T.Mesh(new T.TubeGeometry(curve, 40, 2.7, 5, false), rail));
    g.position.z = zPosition - 12100;
    parent.add(g);
  }
  private makeClouds() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const c = canvas.getContext("2d")!;
    const gradient = c.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, "rgba(245,250,234,.55)");
    gradient.addColorStop(0.48, "rgba(238,246,233,.25)");
    gradient.addColorStop(1, "rgba(233,244,235,0)");
    c.fillStyle = gradient;
    c.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(canvas);
    const group = new T.Group();
    for (let i = 0; i < 65; i++) {
      const m = new T.Sprite(
        new T.SpriteMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          opacity: 0.45,
        }),
      );
      const angle = i * 2.399;
      const dist = 1700 + (i % 11) * 1650;
      m.position.set(
        Math.sin(angle) * dist,
        1300 + (i % 7) * 160,
        Math.cos(angle) * dist + 9000,
      );
      m.scale.set(2200 + (i % 3) * 800, 600 + (i % 4) * 150, 1);
      group.add(m);
    }
    for (let i = 0; i < 14; i++) {
      const m = new T.Sprite(
        new T.SpriteMaterial({
          map: tex,
          color: 0x536576,
          transparent: true,
          depthWrite: false,
          opacity: 0.75,
        }),
      );
      m.position.set(
        18000 + (i % 5) * 1800,
        1800 + (i % 3) * 550,
        7500 + Math.floor(i / 5) * 1800,
      );
      m.scale.set(7000, 2700, 1);
      group.add(m);
    }
    return group;
  }
  resize() {
    const c = this.renderer.domElement;
    const w = c.clientWidth,
      h = c.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  setQuality(low: boolean) {
    this.lowQuality = low;
    this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.5));
    this.clouds.visible = !low;
    this.resize();
  }
  private pose(
    model: T.Object3D,
    pos: T.Vector3,
    yaw: number,
    pitch: number,
    roll: number,
  ) {
    model.position.copy(pos);
    model.rotation.set(-pitch, yaw, roll, "YXZ");
  }
  update(game: Game, dt: number) {
    this.time += dt;
    if (
      game.chaseOrigin &&
      (!this.routeOrigin || !this.routeOrigin.equals(game.chaseOrigin))
    ) {
      this.routeGroup.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      this.routeGroup.clear();
      for (const i of chaseIslands) this.routeGroup.add(islandMesh(i));
      this.buildBridge(this.routeGroup, 6800);
      this.routeGroup.position.copy(game.chaseOrigin);
      this.routeGroup.rotation.y = game.chaseYaw;
      this.routeOrigin = game.chaseOrigin.clone();
    }
    this.routeGroup.visible = !!game.chaseOrigin;
    if (game.phase === "launch" && this.lastPhase !== "launch")
      this.trailLife.fill(0);
    const p = game.player,
      standby = game.phase === "standby";
    const clear = game.phase === "clear";
    const f = game.forward();
    const roll =
      p.roll + (p.rollTime > 0 ? (1 - p.rollTime / 0.85) * Math.PI * 2 : 0);
    this.pose(this.player, p.pos, p.yaw, p.pitch, roll);
    this.player.children.forEach((o) => {
      if (o.name === "flame") {
        o.scale.y = p.speed > 280 ? 2.0 : 0.6 + Math.sin(this.time * 39) * 0.08;
        o.scale.x = o.scale.z = p.speed > 280 ? 1.15 : 0.75;
      }
    });
    this.fleet.position.z = game.time * 17;
    this.gate.visible = !!game.gate;
    if (game.gate) {
      this.gate.position.copy(game.gate.pos);
      this.gate.quaternion.setFromUnitVectors(
        new T.Vector3(0, 0, 1),
        game.gate.normal,
      );
    }
    game.wingmen.forEach((pos, i) => {
      this.wingmen[i].visible = !standby;
      this.pose(
        this.wingmen[i],
        pos,
        game.wingHeadings[i],
        p.pitch * 0.25,
        p.roll * 0.4,
      );
    });
    for (const e of game.enemies) {
      if (e.dead) continue;
      let model = this.enemies.get(e.id);
      if (!model) {
        model = aircraft(e.kind);
        this.enemies.set(e.id, model);
        this.scene.add(model);
      }
      this.pose(model, e.pos, e.yaw, e.pitch, e.roll);
    }
    for (const [id, model] of this.enemies)
      if (!game.enemies.some((e) => e.id === id && !e.dead)) {
        this.scene.remove(model);
        this.enemies.delete(id);
      }
    for (const m of game.projectiles) {
      let model = this.projectiles.get(m.id);
      if (!model) {
        const bullet = m.type === "bullet";
        model = new T.Mesh(
          new T.CylinderGeometry(
            bullet ? 0.5 : 1.3,
            bullet ? 0.5 : 1.3,
            bullet ? 42 : 13,
            5,
          ),
          new T.MeshBasicMaterial({
            color: bullet
              ? 0xffed9d
              : m.type === "hostile"
                ? 0xff7050
                : 0xf8f7d8,
          }),
        );
        this.projectiles.set(m.id, model);
        this.scene.add(model);
      }
      model.position.copy(m.pos);
      model.quaternion.setFromUnitVectors(Y, m.vel.clone().normalize());
    }
    for (const [id, m] of this.projectiles)
      if (!game.projectiles.some((p) => p.id === id)) {
        this.scene.remove(m);
        m.geometry.dispose();
        (m.material as T.Material).dispose();
        this.projectiles.delete(id);
      }
    for (const fx of game.effects) {
      let group = this.effects.get(fx.id);
      if (!group) {
        group = new T.Group();
        const count =
          fx.type === "explosion" ? 16 : fx.type === "flare" ? 12 : 4;
        for (let i = 0; i < count; i++) {
          const m = new T.Mesh(
            new T.IcosahedronGeometry(1, 0),
            new T.MeshBasicMaterial({
              color: i % 3 ? 0xffb054 : 0xffe2a0,
              transparent: true,
            }),
          );
          m.userData.dir = new T.Vector3(
            Math.sin(i * 23),
            Math.cos(i * 17),
            Math.sin(i * 11),
          ).normalize();
          group.add(m);
        }
        group.position.copy(fx.pos);
        this.effects.set(fx.id, group);
        this.scene.add(group);
      }
      const t = fx.age / fx.life;
      group.children.forEach((o, i) => {
        const m = o as T.Mesh;
        m.position.copy(m.userData.dir).multiplyScalar(t * fx.size * 70);
        m.position.y -= t * t * 40;
        const size =
          fx.type === "explosion"
            ? (1 - t) * fx.size * (i % 3 ? 7 : 12)
            : fx.type === "flare"
              ? (1 - t) * 3
              : 2;
        m.scale.setScalar(Math.max(0.01, size));
        const mat = m.material as T.MeshBasicMaterial;
        mat.opacity = 1 - t;
        if (fx.type === "explosion" && t > 0.25)
          mat.color.lerp(new T.Color(0x465961), dt * 3);
      });
    }
    for (const [id, g] of this.effects)
      if (!game.effects.some((f) => f.id === id)) {
        this.scene.remove(g);
        g.children.forEach((o) => {
          const m = o as T.Mesh;
          m.geometry.dispose();
          (m.material as T.Material).dispose();
        });
        this.effects.delete(id);
      }
    if (standby) {
      // An aircraft on the catapult with the coast visibly ahead, ready to fly.
      this.player.position.set(4, 37, 90);
      this.player.rotation.set(0, 0, 0);
      this.cam.set(100 + Math.sin(this.time * 0.08) * 12, 80, 8);
      this.aim.set(-35, 42, 170);
      this.camera.position.copy(this.cam);
      this.camera.lookAt(this.aim);
      this.camera.fov = 57;
    } else if (clear && game.phaseTime > 8) {
      this.cam.copy(this.fleet.position).add(new T.Vector3(600, 450, -800));
      this.aim
        .copy(this.fleet.position)
        .add(
          new T.Vector3(
            game.phaseTime > 15 ? 14000 : -500,
            game.phaseTime > 15 ? 2200 : 0,
            game.phaseTime > 15 ? 10000 : 0,
          ),
        );
      this.camera.position.lerp(this.cam, 1 - Math.exp(-dt * 0.4));
      this.camera.lookAt(this.aim);
    } else {
      const portrait = this.camera.aspect < 0.8;
      const distance = portrait ? 155 : p.speed > 280 ? 108 : 91;
      this.cam
        .copy(p.pos)
        .addScaledVector(f, -distance)
        .add(new T.Vector3(0, portrait ? 35 : 29, 0));
      this.aim
        .copy(p.pos)
        .addScaledVector(f, portrait ? 85 : 170)
        .add(new T.Vector3(0, portrait ? 0 : 14, 0));
      if (!this.initialized || this.lastPhase === "standby") {
        this.camera.position.copy(this.cam);
        this.initialized = true;
      } else this.camera.position.lerp(this.cam, 1 - Math.exp(-dt * 8));
      this.camera.up.set(Math.sin(p.roll * 0.1), 1, 0);
      this.camera.lookAt(this.aim);
      this.shake = Math.max(0, this.shake - dt * 2.5);
      if (this.shake && !this.reducedMotion) {
        this.camera.position.x += Math.sin(this.time * 97) * this.shake * 2;
        this.camera.position.y += Math.cos(this.time * 113) * this.shake;
      }
      this.camera.fov = T.MathUtils.damp(
        this.camera.fov,
        p.speed > 280 && !this.reducedMotion ? 72 : 62,
        3,
        dt,
      );
    }
    this.trailTick += dt;
    if (this.trailTick > 0.04) {
      this.trailTick = 0;
      for (const m of game.projectiles) {
        if (m.type === "bullet") continue;
        const i = this.trailHead++ % 1800;
        this.trailPositions[i * 3] = m.pos.x;
        this.trailPositions[i * 3 + 1] = m.pos.y;
        this.trailPositions[i * 3 + 2] = m.pos.z;
        this.trailLife[i] = 2.5;
      }
    }
    for (let i = 0; i < 1800; i++) {
      if (this.trailLife[i] > 0) {
        this.trailLife[i] -= dt;
        this.trailPositions[i * 3 + 1] += dt * 4;
      } else this.trailPositions[i * 3 + 1] = 1000000;
    }
    (
      this.trails.geometry.getAttribute("position") as T.BufferAttribute
    ).needsUpdate = true;
    this.lastPhase = game.phase;
    this.camera.updateProjectionMatrix();
    this.sky.position.copy(this.camera.position);
    (this.water.material as T.ShaderMaterial).uniforms.time.value = this.time;
    (this.water.material as T.ShaderMaterial).uniforms.eye.value.copy(
      this.camera.position,
    );
    this.renderer.render(this.scene, this.camera);
  }
  screen(pos: T.Vector3) {
    const v = pos.clone().project(this.camera);
    const d = pos.clone().sub(this.camera.position);
    this.camera.getWorldDirection(this.enemyArrow);
    return {
      x: (v.x * 0.5 + 0.5) * this.renderer.domElement.clientWidth,
      y: (-v.y * 0.5 + 0.5) * this.renderer.domElement.clientHeight,
      visible:
        v.z < 1 && v.z > -1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.91,
      behind: d.dot(this.enemyArrow) < 0,
    };
  }
  get stats() {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    };
  }
}
