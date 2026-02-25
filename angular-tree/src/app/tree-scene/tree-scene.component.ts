import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { BufferAttribute, Material, Mesh } from 'three';

type UploadedPhoto = {
  url: string;
  fileName: string;
};

@Component({
  selector: 'app-tree-scene',
  standalone: true,
  templateUrl: './tree-scene.component.html',
  styleUrl: './tree-scene.component.css',
})
export class TreeSceneComponent implements AfterViewInit {
  @ViewChild('host', { static: true })
  private readonly hostRef!: ElementRef<HTMLDivElement>;

  photos: UploadedPhoto[] = [];

  private readonly isBrowser: boolean;
  private animationHandle: number | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly destroyRef: DestroyRef,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    const host = this.hostRef.nativeElement;

    // Dynamic imports keep SSR safe.
    const THREE = await import('three');
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
    const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 3.2, 9.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    host.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.8, 0.15);
    composer.addPass(bloom);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 6.5;
    controls.maxDistance = 13;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.target.set(0, 2.2, 0);

    // Ambient background glow (subtle)
    scene.fog = new THREE.FogExp2(0x06111b, 0.055);

    // --- Tree particles (foliage) ---
    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    const HEIGHT = 6.8;
    const BASE_RADIUS = 3.2;

    function samplePoint(i: number, count: number) {
      const t = i / (count - 1);
      const y = t * HEIGHT;

      // Stronger taper near the top.
      const taper = Math.pow(1 - t, 1.65);
      const r = BASE_RADIUS * taper;

      const ang = Math.random() * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.35;
      const radius = Math.max(0.05, r + jitter);

      // Bias points towards the surface.
      const surface = Math.pow(Math.random(), 0.35);
      const x = Math.cos(ang) * radius * surface;
      const z = Math.sin(ang) * radius * surface;

      return { x, y, z, t };
    }

    const foliageCount = 12000;
    const foliageGeo = new THREE.BufferGeometry();
    const foliagePos = new Float32Array(foliageCount * 3);
    const foliageCol = new Float32Array(foliageCount * 3);

    for (let i = 0; i < foliageCount; i++) {
      const p = samplePoint(i, foliageCount);
      foliagePos[i * 3 + 0] = p.x;
      foliagePos[i * 3 + 1] = p.y;
      foliagePos[i * 3 + 2] = p.z;

      // Gradient greens + a touch of deep blue.
      const g = 0.35 + (1 - p.t) * 0.35;
      const r = 0.05 + (1 - p.t) * 0.05;
      const b = 0.12 + p.t * 0.10;
      foliageCol[i * 3 + 0] = r;
      foliageCol[i * 3 + 1] = g;
      foliageCol[i * 3 + 2] = b;
    }

    foliageGeo.setAttribute('position', new THREE.BufferAttribute(foliagePos, 3));
    foliageGeo.setAttribute('color', new THREE.BufferAttribute(foliageCol, 3));

    const foliageMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const foliage = new THREE.Points(foliageGeo, foliageMat);
    foliage.position.y = 0.35;
    treeGroup.add(foliage);

    // --- Lights (twinkling points) ---
    const lightCount = 520;
    const lightGeo = new THREE.BufferGeometry();
    const lightPos = new Float32Array(lightCount * 3);
    const lightCol = new Float32Array(lightCount * 3);
    const lightPhase = new Float32Array(lightCount);

    const palette = [
      new THREE.Color('#ff6b8a'),
      new THREE.Color('#7ee787'),
      new THREE.Color('#79c0ff'),
      new THREE.Color('#ffa657'),
      new THREE.Color('#d2a8ff'),
      new THREE.Color('#ffd36a'),
    ];

    for (let i = 0; i < lightCount; i++) {
      const t = Math.random();
      const y = t * HEIGHT;
      const radius = BASE_RADIUS * Math.pow(1 - t, 1.55) * 0.95;
      const ang = Math.random() * Math.PI * 2;
      const x = Math.cos(ang) * radius;
      const z = Math.sin(ang) * radius;

      lightPos[i * 3 + 0] = x;
      lightPos[i * 3 + 1] = y + 0.35;
      lightPos[i * 3 + 2] = z;

      const c = palette[i % palette.length].clone();
      c.offsetHSL((Math.random() - 0.5) * 0.03, 0, (Math.random() - 0.5) * 0.05);
      lightCol[i * 3 + 0] = c.r;
      lightCol[i * 3 + 1] = c.g;
      lightCol[i * 3 + 2] = c.b;

      lightPhase[i] = Math.random() * Math.PI * 2;
    }

    lightGeo.setAttribute('position', new THREE.BufferAttribute(lightPos, 3));
    lightGeo.setAttribute('color', new THREE.BufferAttribute(lightCol, 3));

    const lightMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const lights = new THREE.Points(lightGeo, lightMat);
    treeGroup.add(lights);

    // --- Star ---
    const starGeo = new THREE.IcosahedronGeometry(0.35, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffd36a });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, HEIGHT + 0.85, 0);
    treeGroup.add(star);

    // --- Trunk + base snow ---
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.34, 1.15, 12),
      new THREE.MeshStandardMaterial({ color: 0x6f3c1c, roughness: 1, metalness: 0 }),
    );
    trunk.position.set(0, 0.5, 0);
    treeGroup.add(trunk);

    const snowBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 0.14, 42),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        opacity: 0.22,
      }),
    );
    snowBase.position.set(0, 0.08, 0);
    treeGroup.add(snowBase);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(3, 9, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcfe7ff, 0.55);
    fillLight.position.set(-6, 6, -4);
    scene.add(fillLight);

    // --- Photo polaroids ---
    const photoGroup = new THREE.Group();
    scene.add(photoGroup);

    const textures: { dispose: () => void }[] = [];

    const makePolaroidTexture = async (url: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      await img.decode();

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      // Polaroid frame
      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Photo area with cover fit
      const pad = 38;
      const photoW = canvas.width - pad * 2;
      const photoH = canvas.height - pad * 2 - 90;

      const srcRatio = img.width / img.height;
      const dstRatio = photoW / photoH;

      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (srcRatio > dstRatio) {
        sw = Math.floor(img.height * dstRatio);
        sx = Math.floor((img.width - sw) / 2);
      } else {
        sh = Math.floor(img.width / dstRatio);
        sy = Math.floor((img.height - sh) / 2);
      }

      ctx.drawImage(img, sx, sy, sw, sh, pad, pad, photoW, photoH);

      // Soft inner shadow
      const g = ctx.createLinearGradient(0, pad, 0, pad + photoH);
      g.addColorStop(0, 'rgba(0,0,0,0.10)');
      g.addColorStop(0.2, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = g;
      ctx.fillRect(pad, pad, photoW, photoH);

      // Tiny caption line
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(pad + 20, pad + photoH + 42, photoW - 40, 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      textures.push(tex);
      return tex;
    };

    const photoMeshes: Mesh[] = [];

    const rebuildPhotos = async () => {
      // Clear old
      for (const m of photoMeshes) {
        photoGroup.remove(m);
        m.geometry.dispose();
        // materials are shared per mesh here; dispose below via textures
      }
      photoMeshes.length = 0;

      // Dispose textures
      for (const t of textures) t.dispose();
      textures.length = 0;

      const list = this.photos.slice(0, 60);
      if (!list.length) return;

      const planeGeo = new THREE.PlaneGeometry(1.2, 1.5);

      for (let i = 0; i < list.length; i++) {
        const tex = await makePolaroidTexture(list[i].url);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const mesh = new THREE.Mesh(planeGeo, mat);

        mesh.rotation.z = (Math.random() - 0.5) * 0.65;
        mesh.rotation.x = (Math.random() - 0.5) * 0.25;
        mesh.userData = {
          phase: Math.random() * Math.PI * 2,
          speed: 0.18 + Math.random() * 0.18,
          radius: 4.4 + Math.random() * 0.7,
          y: 1.2 + Math.random() * 5.2,
        };

        photoMeshes.push(mesh);
        photoGroup.add(mesh);
      }
    };

    this.destroyRef.onDestroy(() => {
      if (this.animationHandle != null) cancelAnimationFrame(this.animationHandle);
      controls.dispose();
      renderer.dispose();
      foliageGeo.dispose();
      foliageMat.dispose();
      lightGeo.dispose();
      lightMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      trunk.geometry.dispose();
      (trunk.material as Material).dispose();
      snowBase.geometry.dispose();
      (snowBase.material as Material).dispose();
      for (const t of textures) t.dispose();
      host.removeChild(renderer.domElement);
    });

    // Resize
    const resize = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloom.setSize(w, h);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);
    resize();

    // Animation loop
    const tmpCol = new THREE.Color();
    const lightColors = lightGeo.getAttribute('color') as BufferAttribute;
    const baseColors = new Float32Array(lightCol);

    const tick = (timeMs: number) => {
      const t = timeMs / 1000;

      controls.update();

      // Subtle global rotation
      treeGroup.rotation.y = t * 0.15;

      // Twinkle
      for (let i = 0; i < lightCount; i++) {
        const phase = lightPhase[i];
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (3.2 + (i % 7) * 0.18) + phase));
        tmpCol.setRGB(
          baseColors[i * 3 + 0],
          baseColors[i * 3 + 1],
          baseColors[i * 3 + 2],
        );
        tmpCol.multiplyScalar(0.55 + tw * 0.9);
        lightColors.setXYZ(i, tmpCol.r, tmpCol.g, tmpCol.b);
      }
      lightColors.needsUpdate = true;

      // Star sparkle
      star.rotation.y = t * 1.1;
      star.scale.setScalar(1 + 0.07 * Math.sin(t * 2.6));

      // Photos orbit
      for (const m of photoMeshes) {
        const d = m.userData as { phase: number; speed: number; radius: number; y: number };
        const a = d.phase + t * d.speed;
        const bob = 0.22 * Math.sin(t * 1.6 + d.phase);
        m.position.set(Math.cos(a) * d.radius, d.y + bob, Math.sin(a) * d.radius);
        m.lookAt(0, d.y, 0);
        m.rotateZ((Math.sin(t + d.phase) * 0.12));
      }

      composer.render();
      this.animationHandle = requestAnimationFrame(tick);
    };

    // Initial render + build photos if any.
    await rebuildPhotos();
    this.animationHandle = requestAnimationFrame(tick);

    // Store handler for upload callback
    this._rebuildPhotos = rebuildPhotos;
  }

  private _rebuildPhotos: (() => Promise<void>) | null = null;

  async onPhotosSelected(input: HTMLInputElement): Promise<void> {
    const list = Array.from(input.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;

    // Create object URLs (fast) and remember to revoke on reset.
    this.clearPhotos();
    this.photos = list.map((f) => ({ url: URL.createObjectURL(f), fileName: f.name }));

    if (this._rebuildPhotos) await this._rebuildPhotos();
  }

  clearPhotos(): void {
    for (const p of this.photos) URL.revokeObjectURL(p.url);
    this.photos = [];
  }
}
