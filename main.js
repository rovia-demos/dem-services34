(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // Hauteur d'écran mesurée une fois ; recalculée seulement si la largeur change (rotation)
  let VH = innerHeight, W = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === W) return;
    W = innerWidth; VH = innerHeight;
    root.style.setProperty("--vh", VH / 100 + "px");
    tetris();
  });

  // En-tête
  const top = $("#top");
  const onScroll = () => {
    top.classList.toggle("is-solid", scrollY > 40);
    steps();
  };
  addEventListener("scroll", onScroll, { passive: true });

  // Menu mobile
  const burger = $("#burger"), nav = $("#nav");
  const closeMenu = () => { nav.classList.remove("is-open"); top.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Ouvrir le menu"); };
  burger.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open); top.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  });
  $$("a", nav).forEach(a => a.addEventListener("click", closeMenu));
  addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  // Apparition au défilement
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  $$(".rv").forEach(el => io.observe(el));

  // Vidéo du hero : chargée après la page, jamais si « réduire les animations » ou économie de données
  const video = $("#heroVideo");
  const save = navigator.connection && navigator.connection.saveData;
  if (video && !reduce && !save) {
    addEventListener("load", () => {
      video.src = innerWidth < 900 ? video.dataset.srcSmall : video.dataset.src;
      video.addEventListener("playing", () => video.classList.add("is-on"), { once: true });
      video.play().catch(() => {});
    });
  }

  // Carte « Votre projet » du hero -> pré-remplit le formulaire
  $("#quick").addEventListener("submit", e => {
    e.preventDefault();
    const picked = $$("#quick input:checked").map(i => i.value);
    $$('#form input[name="travaux"]').forEach(i => { i.checked = picked.includes(i.value); });
    $("#devis").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  // Services : la photo change pendant le défilement
  const figs = $$(".svc__stage figure"), items = $$(".svc__item"), num = $("#svcN");
  const sio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = +e.target.dataset.i;
    figs.forEach((f, k) => f.classList.toggle("is-on", k === i));
    items.forEach((it, k) => it.classList.toggle("is-on", k === i));
    num.textContent = String(i + 1).padStart(2, "0");
  }), { rootMargin: "-45% 0px -45% 0px" });
  items.forEach(it => sio.observe(it));

  // Avant / après
  const view = $("#baView"), range = $("#baRange");
  const setPos = p => { p = Math.max(0, Math.min(100, p)); view.style.setProperty("--pos", p + "%"); range.value = Math.round(p); };
  let drag = false;
  const fromX = x => { const r = view.getBoundingClientRect(); setPos((x - r.left) / r.width * 100); };
  view.addEventListener("pointerdown", e => { drag = true; view.classList.add("is-used"); view.setPointerCapture(e.pointerId); fromX(e.clientX); });
  view.addEventListener("pointermove", e => { if (drag) fromX(e.clientX); });
  const stop = () => { drag = false; };
  view.addEventListener("pointerup", stop); view.addEventListener("pointercancel", stop);
  range.addEventListener("input", () => { view.classList.add("is-used"); setPos(+range.value); });
  $$(".ba__tab").forEach(t => t.addEventListener("click", () => {
    $$(".ba__tab").forEach(x => x.setAttribute("aria-selected", String(x === t)));
    const a = $("#baAfter"), b = $("#baBefore");
    a.src = `img/${t.dataset.a}-1600.webp`; a.alt = `Après : ${t.dataset.alt} refait`;
    b.src = `img/${t.dataset.b}-1600.webp`; b.alt = `Avant : ${t.dataset.alt} d'origine`;
    setPos(50);
  }));
  // Petit aller-retour du curseur la première fois qu'on voit la section, pour montrer qu'il bouge
  if (!reduce) {
    const hio = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      hio.disconnect();
      const t0 = performance.now();
      const tick = now => {
        if (view.classList.contains("is-used")) return;
        const t = (now - t0) / 1800;
        if (t >= 1) return setPos(50);
        setPos(50 + Math.sin(t * Math.PI * 2) * 18 * (1 - t));
        requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 400);
    }, { threshold: .6 });
    hio.observe(view);
  }

  // Coupe de maison : été / hiver, sans / avec isolation
  const house = $("#house");
  const texts = {
    "ete0": ["Été, sans isolation : l'étage devient une étuve", "#eb9b2c", "#6a4321"],
    "ete1": ["Été, bien isolée : la fraîcheur reste dedans", "#3e9b5b", "#1f4b63"],
    "hiver0": ["Hiver, sans isolation : la chaleur s'en va", "#5b9bd5", "#1c3550"],
    "hiver1": ["Hiver, bien isolée : la chaleur reste dedans", "#3e9b5b", "#4a3f2c"]
  };
  const info = {
    toit: { t: "Le toit et les combles",
      ete: "En plein soleil, les tuiles chauffent fort et cette chaleur descend dans les pièces. Une couche épaisse d'isolant dans les combles la freine avant qu'elle n'arrive chez vous.",
      hiver: "L'air chaud monte : sans isolation, il file droit vers le toit. Isoler les combles, c'est souvent le chantier par lequel on commence." },
    murs: { t: "Les murs",
      ete: "Les murs exposés au soleil emmagasinent la chaleur toute la journée et la rendent le soir. Un doublage isolé côté intérieur garde les pièces plus fraîches.",
      hiver: "Un mur froid donne une sensation d'inconfort, même quand le chauffage tourne. Une fois isolé, il reste tiède au toucher." },
    sol: { t: "Le sol, le garage",
      ete: "Au-dessus d'un garage ou d'un vide sanitaire, le plancher compte aussi dans le confort de la pièce.",
      hiver: "Une chambre au-dessus d'un garage non isolé, c'est un sol froid tout l'hiver. On l'isole par en dessous, sans toucher à votre sol." }
  };
  let season = "ete", ins = "0", zone = null;
  const paint = () => {
    house.classList.toggle("is-winter", season === "hiver");
    house.classList.toggle("is-insulated", ins === "1");
    const [txt, dot, room] = texts[season + ins];
    $("#stateTxt").textContent = txt; $("#stateDot").style.background = dot; $("#room").setAttribute("fill", room);
    if (zone) { $("#infoT").textContent = info[zone].t; $("#infoP").textContent = info[zone][season]; }
  };
  const seg = (sel, attr, set) => {
    const g = $$(sel), pill = g[0].parentElement.querySelector(".seg__pill");
    const move = b => { pill.style.width = b.offsetWidth + "px"; pill.style.transform = `translateX(${b.offsetLeft - 4}px)`; };
    g.forEach(b => b.addEventListener("click", () => { g.forEach(x => x.setAttribute("aria-pressed", String(x === b))); move(b); set(b.dataset[attr]); paint(); }));
    const place = () => move(g.find(b => b.getAttribute("aria-pressed") === "true"));
    place(); document.fonts && document.fonts.ready.then(place); addEventListener("resize", place);
  };
  seg("[data-season]", "season", v => season = v);
  seg("[data-ins]", "ins", v => ins = v);
  $$(".zone", house).forEach(z => {
    const pick = () => { zone = z.dataset.zone; $$(".zone", house).forEach(x => x.classList.toggle("is-sel", x === z)); paint(); };
    z.addEventListener("click", pick);
    z.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
  });
  paint();

  // Frise des étapes : la ligne se remplit au défilement (hauteur d'écran mesurée au chargement)
  const stepsEl = $("#steps"), stepLis = $$(".step", stepsEl);
  function steps() {
    const r = stepsEl.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (VH * .75 - r.top) / (r.height || 1)));
    stepsEl.style.setProperty("--p", reduce ? 1 : p);
    stepLis.forEach((li, k) => li.classList.toggle("is-on", reduce || p >= k / stepLis.length));
  }
  steps();

  // Réalisations : filtres, grille carrée sans trou, « voir tout »
  const grid = $("#grid"), tiles = $$(".tile", grid), more = $("#more");
  let filter = "all", expanded = false;
  const limit = () => (innerWidth < 720 ? 4 : 6);
  function tetris() {
    const cols = innerWidth < 720 ? 2 : 3;
    grid.style.setProperty("--cols", cols);
    const shown = tiles.filter(t => (filter === "all" || t.dataset.cat === filter));
    const vis = filter === "all" && !expanded ? shown.slice(0, limit()) : shown;
    tiles.forEach(t => { t.hidden = !vis.includes(t); t.classList.remove("is-wide", "is-solo"); t.style.gridColumn = ""; });
    const rest = vis.length % cols;
    if (rest) {
      const last = vis[vis.length - 1], span = cols - rest + 1;
      last.style.gridColumn = `span ${span}`;
      last.classList.add(rest === 1 ? "is-solo" : "is-wide");
      last.style.setProperty("--ar", span);
    }
    more.parentElement.hidden = !(filter === "all" && !expanded && shown.length > limit());
  }
  $$(".filter").forEach(b => b.addEventListener("click", () => {
    $$(".filter").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    filter = b.dataset.f; tetris();
  }));
  more.addEventListener("click", () => { expanded = true; tetris(); });
  tetris();

  // Visionneuse photo
  const lb = $("#lb"), lbImg = $("#lbImg");
  tiles.forEach(t => t.addEventListener("click", () => {
    lbImg.src = t.dataset.full; lbImg.alt = t.querySelector("img").alt;
    $("#lbCap").textContent = t.querySelector("span").textContent;
    lb.showModal();
  }));
  $("#lbX").addEventListener("click", () => lb.close());
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

  // Formulaire en 3 étapes (démo : aucun envoi, confirmation à l'écran)
  const form = $("#form"), fsteps = $$(".fstep", form), prog = $$(".prog li", form), err = $("#err");
  const prev = $("#prev"), next = $("#next"), send = $("#send");
  let cur = 0;
  const show = i => {
    cur = i;
    fsteps.forEach((f, k) => f.hidden = k !== i);
    prog.forEach((p, k) => { p.classList.toggle("is-on", k === i); p.classList.toggle("is-done", k < i); });
    prev.hidden = i === 0; next.hidden = i === fsteps.length - 1; send.hidden = i !== fsteps.length - 1;
    err.textContent = "";
  };
  const valid = i => {
    if (i === 0 && !$$('input[name="travaux"]:checked', form).length) { err.textContent = "Choisissez au moins un type de travaux."; return false; }
    if (i === 2) {
      const nom = $("#nom"), tel = $("#tel"), mail = $("#email");
      const telOk = tel.value.replace(/\D/g, "").length >= 10;
      const mailOk = !mail.value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value);
      nom.setAttribute("aria-invalid", String(!nom.value.trim()));
      tel.setAttribute("aria-invalid", String(!telOk));
      mail.setAttribute("aria-invalid", String(!mailOk));
      if (!nom.value.trim()) { err.textContent = "Indiquez votre nom."; nom.focus(); return false; }
      if (!telOk) { err.textContent = "Indiquez un numéro de téléphone valide."; tel.focus(); return false; }
      if (!mailOk) { err.textContent = "L'adresse e-mail ne semble pas valide."; mail.focus(); return false; }
    }
    return true;
  };
  next.addEventListener("click", () => { if (valid(cur)) { show(cur + 1); fsteps[cur].querySelector("legend").scrollIntoView({ block: "nearest" }); } });
  prev.addEventListener("click", () => show(cur - 1));
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (cur !== fsteps.length - 1) { next.click(); return; }
    if (!valid(2)) return;
    const prenom = $("#nom").value.trim().split(/\s+/)[0];
    form.innerHTML = `<div class="done" role="status"><span class="ico"><svg class="i" aria-hidden="true"><use href="#i-check"/></svg></span><h3>Merci ${prenom.replace(/[<>&"]/g, "")} !</h3><p>Votre demande est bien partie. Nous vous rappelons rapidement pour organiser la visite.</p></div>`;
  });
  const photos = $("#photos"), thumbs = $("#thumbs"), drop = $(".drop");
  photos.addEventListener("change", () => {
    thumbs.innerHTML = "";
    [...photos.files].slice(0, 8).forEach(f => { const im = new Image(); im.src = URL.createObjectURL(f); im.alt = f.name; thumbs.append(im); });
  });
  ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", e => { e.preventDefault(); photos.files = e.dataTransfer.files; photos.dispatchEvent(new Event("change")); });

  // Barre de contact mobile : visible une fois passés les boutons du hero
  const mbar = $("#mbar");
  new IntersectionObserver(([e]) => mbar.classList.toggle("is-on", !e.isIntersecting && e.boundingClientRect.top < 0)).observe($("#heroCta"));

  $("#year").textContent = new Date().getFullYear();
  onScroll();
})();
