/* =========================================================
   MAISON GAMBETTA — Espace coiffeur
   Authentification et données gérées côté base (Supabase) :
   ce fichier ne contient aucun mot de passe.
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const api = window.SalonAPI;
  const TZ = "Africa/Algiers";
  const STATUS = { en_attente: "En attente", confirmee: "Confirmée", terminee: "Terminée", annulee: "Annulée" };

  /* ---------- Session ---------- */
  const store = {
    get() { try { return sessionStorage.getItem("mg-token"); } catch (_) { return memToken; } },
    set(t) { memToken = t; try { t ? sessionStorage.setItem("mg-token", t) : sessionStorage.removeItem("mg-token"); } catch (_) {} },
  };
  let memToken = null;
  let bookings = [];
  let range = "today";
  let timer = null;

  /* ---------- Utilitaires ---------- */
  function todayISO() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  }
  function addDays(iso, n) {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function fmtDate(iso, opts) {
    return new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });
  }
  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 2600);
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function handleAuthError(err) {
    if (err && err.message === "session_invalide") {
      store.set(null);
      showLogin("Session expirée, reconnectez-vous.");
      return true;
    }
    return false;
  }

  /* ---------- Vues ---------- */
  function showLogin(message) {
    clearInterval(timer);
    $("#dashView").hidden = true;
    $("#loginView").hidden = false;
    const m = $("#loginMsg");
    m.textContent = message || "";
    m.className = "form-msg" + (message ? " err" : "");
    $("#lgUser").focus();
  }
  async function showDash() {
    $("#loginView").hidden = true;
    $("#dashView").hidden = false;
    const h = Number(new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "numeric", hour12: false }).format(new Date()));
    $("#hello").textContent = (h < 18 ? "Bonjour" : "Bonsoir") + ", coiffeur";
    $("#todayLabel").textContent = fmtDate(todayISO(), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    await load();
    clearInterval(timer);
    timer = setInterval(load, 30000);
  }

  /* ---------- Connexion ---------- */
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = $("#lgUser").value.trim();
    const pass = $("#lgPass").value;
    const msg = $("#loginMsg");
    if (!user || !pass) {
      msg.textContent = "Entrez l'identifiant et le mot de passe.";
      msg.className = "form-msg err";
      return;
    }
    const btn = $("button[type=submit]", e.target);
    btn.disabled = true;
    msg.textContent = "Connexion…";
    msg.className = "form-msg";
    try {
      const token = await api.rpc("salon_login", { p_username: user, p_password: pass });
      store.set(token);
      $("#lgPass").value = "";
      msg.textContent = "";
      await showDash();
    } catch (err) {
      const errors = {
        identifiants_invalides: "Identifiant ou mot de passe incorrect.",
        trop_de_tentatives: "Trop de tentatives. Réessayez dans 15 minutes.",
      };
      msg.textContent = errors[err.message] || "Connexion impossible. Vérifiez votre connexion internet.";
      msg.className = "form-msg err";
      const card = $("#loginForm");
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
    } finally {
      btn.disabled = false;
    }
  });

  $$("[data-eye]").forEach((b) => b.addEventListener("click", () => {
    const input = document.getElementById(b.dataset.eye);
    input.type = input.type === "password" ? "text" : "password";
  }));

  $("#logoutBtn").addEventListener("click", async () => {
    const t = store.get();
    store.set(null);
    try { await api.rpc("salon_logout", { p_token: t }); } catch (_) {}
    showLogin("Vous êtes déconnecté.");
    $("#loginMsg").className = "form-msg ok";
  });

  /* ---------- Données ---------- */
  async function load() {
    try {
      bookings = await api.rpc("salon_list_bookings", { p_token: store.get() }) || [];
      render();
    } catch (err) {
      if (!handleAuthError(err)) toast("Impossible de charger les réservations.");
    }
  }
  $("#refreshBtn").addEventListener("click", async () => { await load(); toast("Liste à jour"); });

  function render() {
    const today = todayISO();
    const in7 = addDays(today, 7);
    const month = today.slice(0, 7);
    const active = bookings.filter((b) => b.status !== "annulee");
    $("#kToday").textContent = active.filter((b) => b.booking_date === today).length;
    $("#kUpcoming").textContent = active.filter((b) => b.booking_date > today && b.booking_date <= in7).length;
    $("#kPending").textContent = bookings.filter((b) => b.status === "en_attente" && b.booking_date >= today).length;
    $("#kMonth").textContent = active.filter((b) => b.booking_date.startsWith(month)).length;

    const q = $("#search").value.trim().toLowerCase();
    const st = $("#statusFilter").value;
    let rows = bookings.filter((b) => {
      if (range === "today" && b.booking_date !== today) return false;
      if (range === "upcoming" && b.booking_date < today) return false;
      if (range === "past" && b.booking_date >= today) return false;
      if (st && b.status !== st) return false;
      if (q && !`${b.name} ${b.phone} ${b.ref} ${b.service}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const asc = range === "today" || range === "upcoming";
    rows.sort((a, b) => {
      const ka = a.booking_date + a.booking_time, kb = b.booking_date + b.booking_time;
      return asc ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });

    const list = $("#list");
    list.replaceChildren();
    $("#empty").hidden = rows.length > 0;
    rows.forEach((b, i) => list.appendChild(rowEl(b, i)));
  }

  function rowEl(b, i) {
    const row = el("article", "row");
    row.style.animationDelay = Math.min(i, 10) * 0.04 + "s";

    const when = el("div", "when");
    when.append(el("b", null, b.booking_time.slice(0, 5)), el("small", null, fmtDate(b.booking_date, { weekday: "short", day: "numeric", month: "short" })));

    const who = el("div", "who");
    const tel = el("a", null, b.phone);
    tel.href = "tel:" + b.phone.replace(/\s+/g, "");
    who.append(el("strong", null, b.name), tel);

    const what = el("div", "what");
    what.append(el("span", "svc", b.service), el("span", "badge-st st-" + b.status, STATUS[b.status] || b.status), el("span", "ref", b.ref));

    const actions = el("div", "actions");
    const add = (label, cls, fn) => {
      const btn = el("button", "act " + (cls || ""), label);
      btn.type = "button";
      btn.addEventListener("click", fn);
      actions.appendChild(btn);
    };
    if (b.status === "en_attente") add("Confirmer", "primary", () => setStatus(b, "confirmee"));
    if (b.status === "confirmee") add("Terminé", "primary", () => setStatus(b, "terminee"));
    if (b.status !== "annulee" && b.status !== "terminee") add("Annuler", "", () => setStatus(b, "annulee"));
    if (b.status === "annulee") add("Rétablir", "", () => setStatus(b, "en_attente"));
    const wa = el("a", "act", "WhatsApp");
    const num = b.phone.replace(/[^0-9]/g, "").replace(/^0/, "213");
    const txt = `Bonjour ${b.name}, Maison Gambetta vous confirme votre rendez-vous (${b.service}) le ${fmtDate(b.booking_date, { weekday: "long", day: "numeric", month: "long" })} à ${b.booking_time.slice(0, 5)}. Réf. ${b.ref}`;
    wa.href = `https://wa.me/${num}?text=${encodeURIComponent(txt)}`;
    wa.target = "_blank";
    wa.rel = "noopener";
    actions.appendChild(wa);
    add("Supprimer", "danger", () => remove(b));

    row.append(when, who, what, actions);
    return row;
  }

  async function setStatus(b, status) {
    try {
      await api.rpc("salon_set_status", { p_token: store.get(), p_id: b.id, p_status: status });
      b.status = status;
      render();
      toast(`${b.name} : ${STATUS[status]}`);
    } catch (err) {
      if (!handleAuthError(err)) toast("Action impossible, réessayez.");
    }
  }
  async function remove(b) {
    if (!confirm(`Supprimer définitivement la réservation de ${b.name} (${b.ref}) ?`)) return;
    try {
      await api.rpc("salon_delete_booking", { p_token: store.get(), p_id: b.id });
      bookings = bookings.filter((x) => x.id !== b.id);
      render();
      toast("Réservation supprimée");
    } catch (err) {
      if (!handleAuthError(err)) toast("Suppression impossible, réessayez.");
    }
  }

  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
    range = t.dataset.range;
    render();
  }));
  $("#search").addEventListener("input", render);
  $("#statusFilter").addEventListener("change", render);

  /* ---------- Mot de passe ---------- */
  const pwdModal = $("#pwdModal");
  const pwdForm = $("#pwdForm");
  const pwdMsg = $("#pwdMsg");
  $("#pwdBtn").addEventListener("click", () => {
    pwdForm.reset();
    pwdMsg.textContent = "";
    pwdModal.hidden = false;
    $("#pwOld").focus();
  });
  const closePwd = () => (pwdModal.hidden = true);
  $("#pwdCancel").addEventListener("click", closePwd);
  pwdModal.addEventListener("click", (e) => { if (e.target === pwdModal) closePwd(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pwdModal.hidden) closePwd(); });

  pwdForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldP = $("#pwOld").value, newP = $("#pwNew").value, newP2 = $("#pwNew2").value;
    const fail = (t) => { pwdMsg.textContent = t; pwdMsg.className = "form-msg err"; };
    if (!oldP || !newP) return fail("Remplissez tous les champs.");
    if (newP.length < 8) return fail("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (newP !== newP2) return fail("Les deux nouveaux mots de passe ne correspondent pas.");
    if (newP === oldP) return fail("Le nouveau mot de passe doit être différent de l'actuel.");
    try {
      await api.rpc("salon_change_password", { p_token: store.get(), p_old: oldP, p_new: newP });
      closePwd();
      toast("Mot de passe modifié ✓");
    } catch (err) {
      if (handleAuthError(err)) return closePwd();
      const errors = {
        ancien_mot_de_passe_incorrect: "Le mot de passe actuel est incorrect.",
        mot_de_passe_trop_court: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      };
      fail(errors[err.message] || "Modification impossible, réessayez.");
    }
  });

  /* ---------- Tilt 3D des cartes ---------- */
  if (!window.matchMedia("(hover: none)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(700px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(6px)`;
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });
  }

  /* ---------- Démarrage ---------- */
  if (store.get()) showDash(); else showLogin();
})();
