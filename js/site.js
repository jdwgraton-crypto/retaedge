const CART_KEY = "retaedge-bag";
const GATE_KEY = "retaedge-gate";
const GATE_OK = "age-research";
const PAGE = document.body.dataset.page || "home";
const $ = (sel, root = document) => root.querySelector(sel);

function money(n) {
  return `$${n}`;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function productById(id) {
  return HOUSE.products.find((p) => p.id === id);
}
function readCart() {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((row) => row && productById(row.id) && row.qty > 0 && row.qty <= 9);
  } catch {
    return [];
  }
}
function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function addToCart(id, delta) {
  const cart = readCart();
  const row = cart.find((item) => item.id === id);
  if (delta > 0 && row && row.qty >= 9) {
    toast("That listing already has 9.");
    return false;
  }
  if (!row && delta > 0) cart.push({ id, qty: 1 });
  else if (row) row.qty += delta;
  writeCart(cart.filter((item) => item.qty > 0));
  updateCartUI();
  return true;
}
function toast(message) {
  const node = document.createElement("p");
  node.className = "toast";
  node.textContent = message;
  $("#toasts").appendChild(node);
  setTimeout(() => node.remove(), 2400);
}

function vialMarkup(product) {
  return `<div class="vial" data-mg="${product.mg}" aria-hidden="true">
    <img class="vial-photo" src="images/vial.png?v=5" alt="">
    <div class="vial-label">
      <img class="vial-logo" src="images/logo.png?v=2" alt="">
      <strong>Retatrutide</strong>
      <em>${esc(product.size)}</em>
      <small>Research use only</small>
    </div>
  </div>`;
}

function renderChrome() {
  const link = (id, href, label) => `<a href="${href}" ${PAGE === id ? 'aria-current="page"' : ""}>${label}</a>`;
  const nav = [
    link("home", "index.html", "Home"),
    link("shop", "shop.html", "Vials"),
    link("coa", "coa.html", "COA"),
    link("story", "index.html#story", "About"),
    link("compliance", "compliance.html", "Terms")
  ].join("");
  $("#chrome-top").innerHTML = `
    <div class="topbar"><p>Retatrutide only <span>·</span> 12 mg to 40 mg <span>·</span> For research purposes only. Not for human or animal use. Not FDA-approved.</p></div>
    <header class="bar">
      <a class="brand" href="index.html"><img src="images/logo.png?v=2" alt="RetaEdge"></a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="nav">${nav}</nav>
      <button class="bag" type="button" data-open-drawer>
        <span>Bag</span>
        <span class="count" data-cart-count hidden>0</span>
      </button>
    </header>
  `;
  $("#chrome-bottom").innerHTML = `
    <div class="drawer-back" data-close-drawer hidden></div>
    <aside class="drawer" id="drawer" hidden aria-label="Bag"></aside>
    <div id="toasts" class="toasts"></div>
    <dialog id="sheet"></dialog>
    <dialog id="ticket"></dialog>
    <dialog id="gate" aria-labelledby="gate-title"></dialog>
  `;
}

function showGate() {
  const gate = $("#gate");
  const row = HOUSE.products.map(vialMarkup).join("");
  gate.innerHTML = `
    <form class="gate" id="checkin">
      <div class="gate-visual" aria-hidden="true">
        <div>
          <img class="gate-brand" src="images/logo.png?v=2" alt="">
          <p class="gate-tag">Retatrutide only.</p>
        </div>
        <div class="gate-vials">${row}</div>
      </div>
      <div class="gate-copy">
        <p class="kicker">Before the shelf</p>
        <h2 id="gate-title">Age and research.</h2>
        <p class="lede">Retatrutide, lined up from 12 mg to 40 mg. Both boxes start empty.</p>
        <label class="check">
          <input type="checkbox" id="age" name="age">
          <span>I am 21 or older.</span>
        </label>
        <label class="check">
          <input type="checkbox" id="research" name="research">
          <span>I am here for research material only. These vials are not for human or animal use.</span>
        </label>
        <button class="btn gate-enter" type="submit" id="come-in" disabled>Enter the shelf</button>
        <p class="gate-note">The shelf stays closed until both are checked. Escape does not skip this.</p>
        <ul class="gate-points">
          <li>21 or older</li>
          <li>Research material only</li>
          <li>Nothing ships</li>
        </ul>
      </div>
    </form>
  `;
  const age = $("#age");
  const research = $("#research");
  const come = $("#come-in");
  const sync = () => { come.disabled = !(age.checked && research.checked); };
  age.addEventListener("change", sync);
  research.addEventListener("change", sync);
  $("#checkin").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(age.checked && research.checked)) return;
    localStorage.setItem(GATE_KEY, GATE_OK);
    gate.close();
  });
  if (!gate.open) gate.showModal();
  age.focus();
}

function updateCartUI() {
  const cart = readCart();
  const count = cart.reduce((sum, row) => sum + row.qty, 0);
  const badge = $("[data-cart-count]");
  if (badge) {
    badge.hidden = count === 0;
    badge.textContent = String(count);
  }
  document.querySelectorAll("[data-add]").forEach((btn) => {
    const product = productById(btn.dataset.add);
    const row = cart.find((item) => item.id === btn.dataset.add);
    if (product) btn.textContent = row ? `In the bag (${row.qty})` : `Add · ${money(product.price)}`;
  });
  if ($("#drawer") && !$("#drawer").hidden) paintDrawer();
}

function paintDrawer() {
  const cart = readCart();
  const total = cart.reduce((sum, row) => sum + productById(row.id).price * row.qty, 0);
  const lines = cart.length
    ? cart.map((row) => {
        const p = productById(row.id);
        return `<li>
          <div class="line-name"><strong>Retatrutide</strong><span>${esc(p.size)}</span></div>
          <div class="stepper">
            <button type="button" data-dec="${p.id}" aria-label="Remove one ${esc(p.size)}">−</button>
            <span>${row.qty}</span>
            <button type="button" data-inc="${p.id}" aria-label="Add one ${esc(p.size)}">+</button>
          </div>
          <p>${money(p.price * row.qty)}</p>
          <button class="text-btn" type="button" data-drop="${p.id}">Remove</button>
        </li>`;
      }).join("")
    : `<div class="empty"><p>The bag is empty.</p><a class="btn" href="shop.html">See the vials</a></div>`;
  $("#drawer").innerHTML = `
    <div class="drawer-head">
      <h2>Bag</h2>
      <button class="text-btn" type="button" data-close-drawer>Close</button>
    </div>
    <ul class="bag-list">${lines}</ul>
    <div class="drawer-foot">
      <p class="total"><span>Total</span><strong>${money(total)}</strong></p>
      <p class="fine">A ticket stays on this screen. Nothing is charged and nothing ships.</p>
      <button class="btn" type="button" data-checkout ${cart.length ? "" : "disabled"}>Write a ticket</button>
    </div>
  `;
}

function cardHTML(p) {
  return `<article class="card" id="${p.cat}">
    <button class="card-photo" type="button" data-open="${p.id}" aria-label="Open ${esc(p.size)}">
      ${vialMarkup(p)}
    </button>
    <div class="card-copy">
      <p class="eyebrow">Retatrutide</p>
      <h2>${esc(p.size)}</h2>
      <p class="blurb">${esc(p.blurb)}</p>
      <p class="ruo">For research purposes only. Not for human or animal use. Not FDA-approved.</p>
      <div class="card-row">
        <p class="price">${money(p.price)} <small>list</small></p>
        <div class="card-actions">
          <a class="text-btn" href="coa.html#${p.id}">COA</a>
          <button class="btn" type="button" data-add="${p.id}">Add · ${money(p.price)}</button>
        </div>
      </div>
    </div>
  </article>`;
}

function openProduct(p) {
  if (!p) return;
  $("#sheet").innerHTML = `
    <p class="eyebrow">Retatrutide</p>
    <div class="sheet">
      ${vialMarkup(p)}
      <div>
        <h2>${esc(p.size)}</h2>
        <p>${esc(p.story)}</p>
        <p class="ruo">For research purposes only. Not for human or animal use. Not FDA-approved.</p>
        <p class="price">${money(p.price)} <small>list</small></p>
        <div class="actions">
          <button class="btn" type="button" data-add="${p.id}">Add · ${money(p.price)}</button>
          <a class="btn btn-ghost" href="coa.html#${p.id}">COA</a>
          <button class="btn btn-ghost" type="button" data-close-sheet>Close</button>
        </div>
      </div>
    </div>
  `;
  $("#sheet").showModal();
  updateCartUI();
}

function openTicket() {
  const cart = readCart();
  if (!cart.length) return;
  const code = `EDGE-${Date.now().toString().slice(-6)}`;
  const lines = cart.map((row) => {
    const p = productById(row.id);
    return `<li><span>Retatrutide, ${esc(p.size)} × ${row.qty}</span><span>${money(p.price * row.qty)}</span></li>`;
  }).join("");
  const total = cart.reduce((sum, row) => sum + productById(row.id).price * row.qty, 0);
  $("#ticket").innerHTML = `
    <p class="eyebrow">Ticket</p>
    <h2>${code}</h2>
    <ul class="ticket-lines">${lines}</ul>
    <p class="total"><span>Total</span><strong>${money(total)}</strong></p>
    <p class="fine">Stays on this screen. Nothing is charged and nothing ships. Research material only. Not for human or animal use.</p>
    <div class="actions">
      <button class="btn" type="button" id="copy-ticket">Copy</button>
      <button class="btn btn-ghost" type="button" id="empty-bag">Clear</button>
      <button class="btn btn-ghost" type="button" data-close-ticket>Back</button>
    </div>
  `;
  $("#ticket").showModal();
  $("#copy-ticket").addEventListener("click", async () => {
    const plain = [
      "RetaEdge",
      code,
      ...cart.map((row) => {
        const p = productById(row.id);
        return `Retatrutide ${p.size} x ${row.qty} ${money(p.price * row.qty)}`;
      }),
      `Total ${money(total)}`,
      "Nothing charged. Nothing shipped. Research material only. Not for human or animal use."
    ].join("\n");
    try {
      await navigator.clipboard.writeText(plain);
      toast("Ticket copied.");
    } catch {
      toast("Copy is blocked. The ticket is still on screen.");
    }
  });
  $("#empty-bag").addEventListener("click", () => {
    writeCart([]);
    updateCartUI();
    $("#ticket").close();
    toast("Bag cleared.");
  });
}

function boot() {
  renderChrome();
  const grid = $("#grid");
  if (grid) grid.innerHTML = HOUSE.products.map(cardHTML).join("");
  updateCartUI();

  document.addEventListener("click", (event) => {
    const burger = event.target.closest(".burger");
    if (burger) {
      const nav = $("#site-nav");
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }
    if (event.target.closest("[data-open-drawer]")) {
      $("#drawer").hidden = false;
      $(".drawer-back").hidden = false;
      paintDrawer();
      return;
    }
    if (event.target.closest("[data-close-drawer]")) {
      $("#drawer").hidden = true;
      $(".drawer-back").hidden = true;
      return;
    }
    const add = event.target.closest("[data-add]");
    if (add) {
      if (addToCart(add.dataset.add, 1)) toast("Added.");
      return;
    }
    const inc = event.target.closest("[data-inc]");
    if (inc) return addToCart(inc.dataset.inc, 1);
    const dec = event.target.closest("[data-dec]");
    if (dec) return addToCart(dec.dataset.dec, -1);
    const drop = event.target.closest("[data-drop]");
    if (drop) {
      writeCart(readCart().filter((row) => row.id !== drop.dataset.drop));
      updateCartUI();
      return;
    }
    const open = event.target.closest("[data-open]");
    if (open) return openProduct(productById(open.dataset.open));
    const coaPick = event.target.closest("[data-coa]");
    if (coaPick && PAGE === "coa") {
      const next = "#" + coaPick.dataset.coa;
      if (location.hash === next) $("#coa-record").scrollIntoView({ behavior: "smooth", block: "start" });
      else location.hash = next;
      return;
    }
    if (event.target.closest("[data-checkout]")) {
      $("#drawer").hidden = true;
      $(".drawer-back").hidden = true;
      openTicket();
      return;
    }
    if (event.target.closest("[data-close-sheet]")) $("#sheet").close();
    if (event.target.closest("[data-close-ticket]")) $("#ticket").close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("dialog[open]") && $("#drawer") && !$("#drawer").hidden) {
      $("#drawer").hidden = true;
      $(".drawer-back").hidden = true;
    }
  });
  ["#sheet", "#ticket"].forEach((sel) => {
    const node = $(sel);
    if (!node) return;
    node.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    });
  });

  const again = $("#show-gate");
  if (again) {
    again.addEventListener("click", () => {
      localStorage.removeItem(GATE_KEY);
      showGate();
    });
  }
  $("#gate").addEventListener("cancel", (event) => {
    if (localStorage.getItem(GATE_KEY) !== GATE_OK) event.preventDefault();
  });
  if (localStorage.getItem(GATE_KEY) !== GATE_OK) showGate();
  if (PAGE === "coa") setupCoa();
}

function coaSelected() {
  const id = (location.hash || "").replace("#", "");
  return productById(id) || HOUSE.products[0];
}

function setupCoa() {
  const search = $("#coa-search");
  const draw = () => {
    const current = coaSelected();
    const term = (search.value || "").trim().toLowerCase();
    const blob = [
      "retatrutide",
      "ly3437943",
      "2381089-83-2",
      ...HOUSE.products.flatMap((item) => [item.size.toLowerCase(), String(item.mg)])
    ].join(" ");
    const hit = !term || blob.includes(term);
    const hash = (location.hash || "").replace("#", "");
    document.querySelectorAll("[data-coa-filter]").forEach((button) => {
      const value = button.dataset.coaFilter;
      button.classList.toggle("is-on", value === "all" ? !hash : value === hash);
    });
    $("#coa-empty").hidden = hit;
    $("#coa-list").hidden = !hit;
    $("#coa-list").innerHTML = hit ? coaListHTML(current) : "";
    $("#coa-record").innerHTML = coaRecordHTML(current);
  };
  search.addEventListener("input", draw);
  window.addEventListener("hashchange", draw);
  document.querySelectorAll("[data-coa-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.coaFilter;
      if (value === "all") {
        search.value = "";
        if (location.hash) history.replaceState(null, "", "coa.html");
      } else {
        search.value = "";
        location.hash = value;
        return;
      }
      draw();
    });
  });
  draw();
}

function coaPills(current) {
  return HOUSE.products.map((item) => {
    const on = item.id === current.id ? " is-on" : "";
    return `<button class="coa-pill${on}" type="button" data-coa="${item.id}">${esc(item.size)}</button>`;
  }).join("");
}

function coaListHTML(current) {
  return `
    <div class="coa-row">
      <div>
        <p class="eyebrow">Retatrutide</p>
        <h2>Retatrutide</h2>
        <p class="coa-meta">CAS 2381089-83-2 · LY3437943</p>
        <div class="coa-pills">${coaPills(current)}</div>
      </div>
      <button class="btn" type="button" data-coa="${current.id}">View record</button>
    </div>`;
}

function coaRecordHTML(current) {
  const history = HOUSE.products.map((item) => `
    <li>
      <span>${esc(item.size)}</span>
      <span>Listed mass</span>
      <button class="text-btn" type="button" data-coa="${item.id}">${item.id === current.id ? "Viewing" : "View"}</button>
    </li>`).join("");
  return `
    <p class="kicker">Certificate layout</p>
    <div class="coa-sheet-head">
      <div>
        <h2>Retatrutide</h2>
        <p>${esc(current.size)} · research listing</p>
      </div>
      <div class="coa-pills">${coaPills(current)}</div>
    </div>
    <p class="ruo">For research purposes only. Not for human or animal use. Not FDA-approved.</p>
    <div class="coa-cols">
      <section>
        <h3>Listed identity</h3>
        <dl class="coa-dl">
          <div><dt>Product</dt><dd>Retatrutide</dd></div>
          <div><dt>Listed mass</dt><dd>${esc(current.size)}</dd></div>
          <div><dt>Code</dt><dd>LY3437943</dd></div>
          <div><dt>CAS</dt><dd>2381089-83-2</dd></div>
          <div><dt>Form</dt><dd>Lyophilized solid, as listed</dd></div>
        </dl>
      </section>
      <section>
        <h3>Batch record</h3>
        <dl class="coa-dl">
          <div><dt>Lot</dt><dd>Not posted</dd></div>
          <div><dt>Accession</dt><dd>Not posted</dd></div>
          <div><dt>Purity figure</dt><dd>Not posted</dd></div>
          <div><dt>Endotoxin</dt><dd>Not posted</dd></div>
          <div><dt>Identity test</dt><dd>Not posted</dd></div>
        </dl>
      </section>
    </div>
    <section class="coa-history">
      <h3>Sizes on this shelf</h3>
      <ul>${history}</ul>
    </section>`;
}

boot();
