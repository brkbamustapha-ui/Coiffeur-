/* =========================================================
   MAISON GAMBETTA — Interactions & scène 3D
   ========================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Loader ---------- */
  document.body.classList.add("loading");
  const hideLoader = () => {
    $("#loader").classList.add("hidden");
    document.body.classList.remove("loading");
    document.body.classList.add("ready");
  };
  window.addEventListener("load", () => setTimeout(hideLoader, reduceMotion ? 0 : 900));
  setTimeout(hideLoader, 4000); // sécurité

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Scène 3D Three.js (hero) ---------- */
  function initHero3D() {
    const canvas = $("#hero3d");
    if (!canvas || typeof THREE === "undefined") return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0a08, 0.045);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    // Lumières néon
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const lights = [
      [0xffe2a8, 3, [-6, 4, 6]],
      [0xffffff, 2.2, [6, -3, 5]],
      [0xc9a45c, 2.5, [2, 6, -2]],
      [0x8f6f35, 2, [-3, -5, 3]],
    ].map(([c, i, p]) => {
      const l = new THREE.PointLight(c, i, 30);
      l.position.set(...p);
      scene.add(l);
      return l;
    });

    const group = new THREE.Group();
    scene.add(group);

    // Enseigne de barbier 3D (texture rayée animée)
    const stripeCanvas = document.createElement("canvas");
    stripeCanvas.width = 256; stripeCanvas.height = 256;
    const sctx = stripeCanvas.getContext("2d");
    const colors = ["#c9a45c", "#f6f2ea", "#15130f", "#f6f2ea"];
    const band = 32;
    for (let i = -8; i < 16; i++) {
      sctx.fillStyle = colors[((i % 4) + 4) % 4];
      sctx.beginPath();
      sctx.moveTo(0, i * band);
      sctx.lineTo(256, i * band + 256 * 0.5);
      sctx.lineTo(256, i * band + 256 * 0.5 + band);
      sctx.lineTo(0, (i + 1) * band);
      sctx.fill();
    }
    const stripeTex = new THREE.CanvasTexture(stripeCanvas);
    stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping;
    stripeTex.repeat.set(1, 2);
    stripeTex.encoding = THREE.sRGBEncoding;

    const pole = new THREE.Group();
    const poleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 3.4, 48, 1, true),
      new THREE.MeshStandardMaterial({ map: stripeTex, emissive: 0x111111, emissiveMap: stripeTex, emissiveIntensity: 0.4, roughness: 0.25, metalness: 0.1 })
    );
    const glassShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 3.4, 48, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, roughness: 0, metalness: 0, clearcoat: 1 })
    );
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc93c, metalness: 1, roughness: 0.2, emissive: 0x3a2500 });
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
    capTop.position.y = 1.75;
    const ringTop = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.1, 16, 48), goldMat);
    ringTop.rotation.x = Math.PI / 2; ringTop.position.y = 1.72;
    const ringBot = ringTop.clone(); ringBot.position.y = -1.72;
    const capBot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.5, 0.5, 32), goldMat);
    capBot.position.y = -2.0;
    pole.add(poleBody, glassShell, capTop, ringTop, ringBot, capBot);
    pole.rotation.z = -0.25;
    group.add(pole);

    // Nœud torique néon
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.1, 0.32, 220, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x1a1712, metalness: 0.9, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 })
    );
    group.add(knot);

    // Anneau doré
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.06, 16, 120), new THREE.MeshStandardMaterial({ color: 0xffc93c, metalness: 1, roughness: 0.15, emissive: 0x553300 }));
    group.add(ring);

    // Icosaèdre filaire
    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9, 1),
      new THREE.MeshStandardMaterial({ color: 0xc9a45c, wireframe: true, emissive: 0xc9a45c, emissiveIntensity: 0.5 })
    );
    group.add(ico);

    // Sphères chromées flottantes
    const spheres = [];
    const sphereColors = [0xc9a45c, 0xf6f2ea, 0x1a1712, 0xecd9ad, 0xc9a45c];
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 + Math.random() * 0.28, 32, 32),
        new THREE.MeshStandardMaterial({ color: sphereColors[i % sphereColors.length], metalness: 0.8, roughness: 0.15, emissive: sphereColors[i % sphereColors.length], emissiveIntensity: 0.05 })
      );
      s.userData = { r: 2.2 + Math.random() * 1.8, a: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * 3.5, sp: 0.15 + Math.random() * 0.3 };
      group.add(s);
      spheres.push(s);
    }

    // Particules
    const pCount = 700;
    const pos = new Float32Array(pCount * 3);
    const col = new Float32Array(pCount * 3);
    const palette = [new THREE.Color(0xc9a45c), new THREE.Color(0xf6f2ea), new THREE.Color(0xecd9ad)];
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      const c = palette[i % palette.length];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(particles);

    // Disposition responsive
    function layout() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const mobile = w < 900;
      group.position.set(mobile ? 0.8 : 3.6, mobile ? 1.6 : 0, mobile ? -5 : 0);
      group.scale.setScalar(mobile ? 0.8 : 1);
      knot.position.set(mobile ? 0 : -0.4, mobile ? 0.6 : 1.2, -1);
      pole.position.set(1.4, -0.4, 0.8);
      ico.position.set(-1.6, -1.6, 0.6);
    }
    layout();
    window.addEventListener("resize", layout);

    // Parallaxe souris / gyroscope
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    window.addEventListener("pointermove", (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null) return;
      target.x = Math.max(-1, Math.min(1, e.gamma / 30));
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    });

    let visible = true;
    new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);

    const clock = new THREE.Clock();
    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      const t = clock.getElapsedTime();
      const speed = reduceMotion ? 0.15 : 1;

      cur.x += (target.x - cur.x) * 0.05;
      cur.y += (target.y - cur.y) * 0.05;
      group.rotation.y = cur.x * 0.45 + Math.sin(t * 0.2) * 0.15;
      group.rotation.x = cur.y * 0.3;

      stripeTex.offset.y = (t * 0.25 * speed) % 1;
      pole.rotation.y = t * 0.3 * speed;
      pole.position.y = -0.4 + Math.sin(t * 0.9) * 0.15;

      knot.rotation.x = t * 0.35 * speed;
      knot.rotation.y = t * 0.25 * speed;

      ring.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.4) * 0.2;
      ring.rotation.y = t * 0.2 * speed;

      ico.rotation.x = -t * 0.4 * speed;
      ico.rotation.y = t * 0.5 * speed;

      spheres.forEach((s) => {
        const d = s.userData;
        const a = d.a + t * d.sp * speed;
        s.position.set(Math.cos(a) * d.r, d.y + Math.sin(t + d.a) * 0.3, Math.sin(a) * d.r);
      });

      lights[0].position.x = Math.sin(t * 0.7) * 7;
      lights[1].position.y = Math.cos(t * 0.5) * 5;

      particles.rotation.y = t * 0.02;
      particles.rotation.x = cur.y * 0.05;

      camera.position.y = -window.scrollY * 0.003;
      renderer.render(scene, camera);
    }
    tick();
  }
  initHero3D();

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const burger = $("#burger");
  const navLinks = $("#navLinks");
  window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 40), { passive: true });
  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
  });
  $$("a", navLinks).forEach((a) => a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }));

  // Lien actif selon la section visible
  const sections = $$("main section[id]");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        $$("a", navLinks).forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal au scroll ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 0.1 + "s";
    revealObs.observe(el);
  });

  /* ---------- Compteurs ---------- */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = +el.dataset.count;
      const dur = 2000;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const v = Math.floor(end * (1 - Math.pow(1 - p, 3)));
        el.textContent = (v >= 1000 ? v.toLocaleString("fr-FR") : v) + (p === 1 ? "+" : "");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------- Tilt 3D + reflet ---------- */
  if (!isTouch && !reduceMotion) {
    $$(".tilt").forEach((el) => {
      const shine = document.createElement("span");
      shine.className = "shine-layer";
      el.appendChild(shine);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.transition = "transform .1s linear";
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 14}deg) rotateY(${(x - 0.5) * 14}deg) translateZ(10px) scale(1.02)`;
        el.style.setProperty("--mx", x * 100 + "%");
        el.style.setProperty("--my", y * 100 + "%");
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "";
        el.style.transform = "";
      });
    });
  }

  /* ---------- Halo curseur ---------- */
  const glow = $("#cursorGlow");
  if (glow && !isTouch) {
    let gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx - 210}px, ${gy - 210}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Carrousel 3D ---------- */
  const carousel = $("#carousel");
  const stage = $("#carouselStage");
  const items = $$(".c-item", carousel);
  const n = items.length;
  const angle = 360 / n;
  let rot = 0;
  function placeItems() {
    const w = carousel.offsetWidth;
    const radius = Math.round(w / 2 / Math.tan(Math.PI / n)) + 40;
    items.forEach((it, i) => (it.style.transform = `rotateY(${i * angle}deg) translateZ(${radius}px)`));
    carousel.dataset.radius = radius;
    applyRot();
  }
  function applyRot() {
    carousel.style.transform = `translateZ(-${carousel.dataset.radius}px) rotateY(${rot}deg)`;
  }
  placeItems();
  window.addEventListener("resize", placeItems);
  $("#prevBtn").addEventListener("click", () => { rot += angle; applyRot(); });
  $("#nextBtn").addEventListener("click", () => { rot -= angle; applyRot(); });

  let dragging = false, startX = 0, startRot = 0, lastInteract = 0;
  stage.addEventListener("pointerdown", (e) => {
    dragging = true; startX = e.clientX; startRot = rot;
    carousel.classList.add("dragging");
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    rot = startRot + (e.clientX - startX) * 0.35;
    applyRot();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    carousel.classList.remove("dragging");
    rot = Math.round(rot / angle) * angle;
    applyRot();
    lastInteract = Date.now();
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  $$("#prevBtn, #nextBtn").forEach((b) => b.addEventListener("click", () => (lastInteract = Date.now())));
  if (!reduceMotion) {
    setInterval(() => {
      if (!dragging && Date.now() - lastInteract > 5000) { rot -= angle; applyRot(); }
    }, 3500);
  }

  /* ---------- Cartes équipe (tactile) ---------- */
  $$(".flip").forEach((f) => f.addEventListener("click", () => isTouch && f.classList.toggle("flipped")));

  /* ---------- Horaires : ouvert / fermé (heure d'Oran) ---------- */
  function updateOpenStatus() {
    const el = $("#openStatus");
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Algiers" }));
    const day = now.getDay(); // 5 = vendredi
    const h = now.getHours() + now.getMinutes() / 60;
    const openH = day === 5 ? 14 : 9;
    const isOpen = h >= openH && h < 21;
    el.textContent = isOpen ? "● Ouvert maintenant" : "● Fermé actuellement — réservez pour plus tard";
    el.className = "open-status " + (isOpen ? "open" : "closed");
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60000);

  /* ---------- Réservation → WhatsApp ---------- */
  const WHATSAPP = "213550123456"; // numéro de TEST — remplacez par le vrai numéro du salon
  const form = $("#bookingForm");
  const msg = $("#formMsg");
  const dateInput = $("#date");
  dateInput.min = new Date().toISOString().split("T")[0];

  // Les boutons de tarifs pré-remplissent la prestation
  $$("[data-service]").forEach((b) => b.addEventListener("click", () => {
    $("#service").value = b.dataset.service;
  }));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$("input, select", form).forEach((f) => {
      const valid = f.checkValidity();
      f.closest(".field").classList.toggle("error", !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      msg.textContent = "Merci de compléter tous les champs correctement.";
      msg.className = "form-msg err";
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    const dateFr = new Date(d.date + "T00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const ref = "MG-" + Date.now().toString(36).toUpperCase().slice(-6);

    // Sauvegarde locale (mode test) pour garder une trace des réservations
    try {
      const list = JSON.parse(localStorage.getItem("mg-bookings") || "[]");
      list.push({ ref, ...d, created: new Date().toISOString() });
      localStorage.setItem("mg-bookings", JSON.stringify(list));
    } catch (_) {}

    const text =
      `Bonjour Maison Gambetta ✂️\n\nRéservation ${ref} :\n` +
      `• Prestation : ${d.service}\n• Date : ${dateFr}\n• Heure : ${d.time}\n\n` +
      `Nom : ${d.name}\nTéléphone : ${d.phone}`;

    $("#bookRef").textContent = ref;
    const recap = $("#bookRecap");
    recap.innerHTML = "";
    [["Nom", d.name], ["Prestation", d.service], ["Date", dateFr], ["Heure", d.time], ["Téléphone", d.phone]].forEach(([k, v]) => {
      const li = document.createElement("li");
      const a = document.createElement("span"); a.textContent = k;
      const b = document.createElement("strong"); b.textContent = v;
      li.append(a, b);
      recap.appendChild(li);
    });
    $("#bookWa").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
    openModal();

    msg.textContent = `Réservation ${ref} enregistrée.`;
    msg.className = "form-msg ok";
    form.reset();
  });

  const modal = $("#bookModal");
  function openModal() { modal.hidden = false; $("#bookClose").focus(); }
  function closeModal() { modal.hidden = true; }
  $("#bookClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
})();
