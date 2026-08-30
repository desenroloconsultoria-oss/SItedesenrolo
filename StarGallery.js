/* ============================================================
   GALERIA DE ESTRELAS — Desenrolo
   Componente 3D (Three.js). Monte com:
   <x-import component-from-global-scope="star-gallery" ...>

   >>> PARA EDITAR AS IMAGENS E TEXTOS, ALTERE O ARRAY ABAIXO <<<
   Cada item: { img: "url ou caminho", title: "texto" }
   ============================================================ */

if (!window.__starGalleryLoaded) {
  window.__starGalleryLoaded = true;

const IMGBASE = (window.DESENROLO_IMG_BASE || "img/");
const CARDS = [
  { img: IMGBASE + "galeria-01.jpg", title: "Post no Perfil da Sobral Marcenaria" },
  { img: IMGBASE + "galeria-02.jpg", title: "Post no Perfil da Óticas Carli" },
  { img: IMGBASE + "galeria-03.jpg", title: "Post no Perfil da Sobral Marcenaria" },
  { img: IMGBASE + "galeria-04.jpg", title: "Post no Perfil da Óticas Carli" },
  { img: IMGBASE + "galeria-05.jpg", title: "Post no Perfil Desenrolo" },
  { img: IMGBASE + "galeria-06.jpg", title: "Post no Perfil Desenrolo" },
  { img: IMGBASE + "galeria-07.jpg", title: "Post no Perfil da Sobral Marcenaria" },
  { img: IMGBASE + "galeria-08.jpg", title: "Post no Perfil da Óticas Carli" },
  { img: IMGBASE + "galeria-09.jpg", title: "Post no Perfil Desenrolo" },
  { img: IMGBASE + "galeria-10.jpg", title: "Post no Perfil Desenrolo" },
  { img: IMGBASE + "galeria-11.jpg", title: "Post no Perfil da Óticas Carli" },
  { img: IMGBASE + "galeria-12.jpg", title: "Post no Perfil da Óticas Carli" },
  { img: IMGBASE + "galeria-13.jpg", title: "Post no Perfil da Óticas Carli" },
  { img: IMGBASE + "galeria-14.jpg", title: "Post no Perfil Desenrolo" },
  { img: IMGBASE + "galeria-15.jpg", title: "Post no Perfil Desenrolo" },
  { img: IMGBASE + "galeria-16.jpg", title: "Post no Perfil da Sobral Marcenaria" },
  { img: IMGBASE + "galeria-17.jpg", title: "Capa da Revista SindiRefeições RJ" },
  { img: IMGBASE + "galeria-18.jpg", title: "Post no Perfil da SindiRefeições RJ" },
  { img: IMGBASE + "galeria-19.jpg", title: "Post no Perfil da SindiRefeições RJ" },
  { img: IMGBASE + "galeria-20.jpg", title: "Post no Perfil da Óticas Carli" },
];

const ACCENT = "#009C3B"; // verde bandeira

const LS_KEY = "desenrolo_star_gallery_overrides_v1";
function loadOverrides() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function saveOverride(index, patch) {
  try {
    const all = loadOverrides();
    all[index] = Object.assign({}, all[index], patch);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch (e) {}
}
(function applyOverrides() {
  const overrides = loadOverrides();
  Object.keys(overrides).forEach((i) => {
    if (CARDS[i]) Object.assign(CARDS[i], overrides[i]);
  });
})();

function waitForTHREE() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.THREE && window.THREE.OrbitControls) resolve(window.THREE);
      else setTimeout(check, 40);
    };
    check();
  });
}

class StarGallery extends HTMLElement {
  connectedCallback() {
    if (this._booted) return;
    this._booted = true;
    this.style.display = "block";
    this.style.position = "relative";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.background = "#05060a";
    this.style.overflow = "hidden";
    this._initWhenReady();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    if (this._renderer) this._renderer.dispose();
  }

  async _initWhenReady() {
    const THREE = await waitForTHREE();
    if (!this.isConnected) return;
    this._init(THREE);
  }

  _init(THREE) {
    const host = this;
    const w = host.clientWidth || 800;
    const h = host.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05060a, 1);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    this._renderer = renderer;

    // ---- Starfield ----
    const starGeo = new THREE.BufferGeometry();
    const starCount = 6000;
    const sp = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 1600;
      sp[i * 3 + 1] = (Math.random() - 0.5) * 1600;
      sp[i * 3 + 2] = (Math.random() - 0.5) * 1600;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true })
    );
    scene.add(stars);

    // ---- Lights (subtle, materials are basic-ish) ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    // ---- Cards on a fibonacci sphere ----
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const meshes = [];
    const n = CARDS.length;
    const golden = (1 + Math.sqrt(5)) / 2;
    const CW = 4.2, CH = 5.0;          // photo size
    const FW = CW + 0.7, FH = CH + 1.9; // white polaroid frame (thick bottom lip)
    const imgOffsetY = (FH - CH) / 2 - 0.35; // shift photo up so the lip sits at the bottom

    CARDS.forEach((card, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = (2 * Math.PI * i) / golden;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      const layer = 13 + (i % 3) * 3.5;

      const tex = loader.load(card.img);
      tex.colorSpace = THREE.SRGBColorSpace || tex.colorSpace;

      // white polaroid frame = the card body
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(FW, FH),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      frame.position.set(x * layer, y * layer, z * layer);

      // photo, offset up so the white bottom lip shows (polaroid look)
      const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(CW, CH),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      photo.position.set(0, imgOffsetY, 0.02);
      frame.add(photo);

      frame.userData = { card, index: i };
      cardGroup.add(frame);
      meshes.push(frame);
    });

    // ---- Controls ----
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 8;
    controls.maxDistance = 48;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.9;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.target.set(0, 0, 0);

    // ---- Raycaster (hover + click) ----
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = null;

    const setPointer = (e) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    renderer.domElement.addEventListener("pointermove", (e) => {
      setPointer(e);
      this._moved = true;
    });
    renderer.domElement.addEventListener("pointerdown", () => { this._moved = false; });
    renderer.domElement.addEventListener("pointerup", (e) => {
      if (this._moved) return; // was a drag
      setPointer(e);
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(meshes, false);
      if (hits.length) this._openModal(hits[0].object.userData.card, hits[0].object, hits[0].object.userData.index);
    });

    // ---- Modal ----
    this._THREE = THREE;
    this._loader = loader;
    this._buildModal();

    // ---- Resize ----
    const ro = new ResizeObserver(() => {
      const ww = host.clientWidth, hh = host.clientHeight;
      if (!ww || !hh) return;
      camera.aspect = ww / hh;
      camera.updateProjectionMatrix();
      renderer.setSize(ww, hh);
    });
    ro.observe(host);
    this._ro = ro;

    // ---- Animate ----
    const animate = () => {
      this._raf = requestAnimationFrame(animate);
      stars.rotation.y += 0.0002;

      // billboard + hover scale
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(meshes, false);
      const top = hits.length ? hits[0].object : null;
      if (top !== hovered) {
        hovered = top;
        host.style.cursor = top ? "pointer" : "grab";
      }
      meshes.forEach((m) => {
        m.lookAt(camera.position);
        const target = m === hovered ? 1.18 : 1;
        m.scale.x += (target - m.scale.x) * 0.18;
        m.scale.y = m.scale.x;
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  }

  _buildModal() {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;" +
      "background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:24px;";
    overlay.addEventListener("click", (e) => { if (e.target === overlay) this._closeModal(); });

    const box = document.createElement("div");
    box.style.cssText =
      "position:relative;max-width:380px;width:100%;background:#1F2121;border-radius:16px;padding:16px;" +
      "box-shadow:0 40px 80px rgba(0,0,0,0.5);transform:perspective(1000px);transition:transform .4s ease;";

    const imgWrap = document.createElement("div");
    imgWrap.style.cssText = "position:relative;width:100%;aspect-ratio:3/4;border-radius:12px;overflow:hidden;background:#000;";

    const img = document.createElement("img");
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => this._applyNewPhoto(reader.result);
      reader.readAsDataURL(file);
    });

    const changeBtn = document.createElement("button");
    changeBtn.type = "button";
    changeBtn.textContent = "⤢ Trocar foto";
    changeBtn.style.cssText =
      "position:absolute;right:10px;bottom:10px;display:inline-flex;align-items:center;gap:6px;" +
      "padding:8px 14px;border:none;border-radius:999px;background:rgba(0,0,0,0.65);color:#fff;" +
      "font:600 12.5px/1 -apple-system,system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(4px);";
    changeBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });

    imgWrap.appendChild(img);
    imgWrap.appendChild(changeBtn);

    const title = document.createElement("h3");
    title.contentEditable = "true";
    title.spellcheck = false;
    title.style.cssText =
      "color:#fff;font:600 18px/1.3 -apple-system,system-ui,sans-serif;text-align:center;margin:16px 0 4px;" +
      "outline:none;border-radius:8px;padding:4px 8px;cursor:text;";
    title.addEventListener("focus", () => { title.style.background = "rgba(255,255,255,0.08)"; });
    title.addEventListener("blur", () => {
      title.style.background = "transparent";
      if (this._modalCard) {
        this._modalCard.title = title.textContent.trim() || this._modalCard.title;
        if (this._modalIndex != null) saveOverride(this._modalIndex, { title: this._modalCard.title });
      }
    });
    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); title.blur(); }
    });

    const hint = document.createElement("p");
    hint.textContent = "Toque na legenda para editar";
    hint.style.cssText = "color:rgba(255,255,255,0.4);font:500 11px/1 -apple-system,system-ui,sans-serif;text-align:center;margin:0 0 4px;";

    const close = document.createElement("button");
    close.textContent = "✕";
    close.style.cssText =
      "position:absolute;top:-44px;right:0;background:none;border:none;color:#fff;font-size:26px;cursor:pointer;line-height:1;";
    close.addEventListener("click", () => this._closeModal());

    // tilt on mousemove
    box.addEventListener("mousemove", (e) => {
      const r = box.getBoundingClientRect();
      const rx = (e.clientY - r.top - r.height / 2) / 18;
      const ry = (r.width / 2 - (e.clientX - r.left)) / 18;
      box.style.transition = "transform 0s";
      box.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    box.addEventListener("mouseleave", () => {
      box.style.transition = "transform .4s ease";
      box.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
    });

    box.appendChild(close);
    box.appendChild(imgWrap);
    box.appendChild(title);
    box.appendChild(hint);
    box.appendChild(fileInput);
    overlay.appendChild(box);
    this.appendChild(overlay);
    this._modal = { overlay, img, title, fileInput };
  }

  _openModal(card, mesh, index) {
    if (!this._modal) return;
    this._modalCard = card;
    this._modalMesh = mesh;
    this._modalIndex = index;
    this._modal.img.src = card.img;
    this._modal.title.textContent = card.title;
    this._modal.overlay.style.display = "flex";
  }
  _closeModal() {
    if (this._modal) this._modal.overlay.style.display = "none";
  }

  _applyNewPhoto(dataUrl) {
    if (!this._modalCard) return;
    this._modalCard.img = dataUrl;
    if (this._modalIndex != null) saveOverride(this._modalIndex, { img: dataUrl });
    if (this._modal) this._modal.img.src = dataUrl;
    if (this._modalMesh && this._THREE) {
      const photo = this._modalMesh.children[0];
      if (photo && photo.material) {
        const tex = this._loader.load(dataUrl);
        tex.colorSpace = this._THREE.SRGBColorSpace || tex.colorSpace;
        if (photo.material.map) photo.material.map.dispose();
        photo.material.map = tex;
        photo.material.needsUpdate = true;
      }
    }
  }
}

if (!customElements.get("star-gallery")) {
  customElements.define("star-gallery", StarGallery);
}

}
