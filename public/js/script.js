//<script>
// ════════════════════════════════════════════════════════
//  DATA LOADER — fetch từ API, render từng section
// ════════════════════════════════════════════════════════

//   Link CV
const cvUrl =
  "https://drive.google.com/drive/u/0/folders/18yxWNJEzdDU78OGevL6acWr8h2MY9nMj";
document.getElementById("nav-cv").href = cvUrl;

const SVG_GITHUB = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`;
const SVG_EXT = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
const SVG_DL = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

async function loadContent() {
  try {
    const res = await fetch("/api/content");
    const json = await res.json();
    const data = json.data;
    renderProfile(data.profile);
    renderTicker(data.skills);
    renderAbout(data.profile);
    renderSkills(data.skills);
    renderExperience(data.experience);
    renderProjects(data.projects);
    renderContact(data.profile);
    // Track page view
    fetch("/api/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: location.pathname,
        referrer: document.referrer,
      }),
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to load content:", e);
  }
}

// ── Profile ──────────────────────────────────────────────────────
function renderProfile(p) {
  if (!p) return;
  document.title = `${p.name} — ${p.title_en}`;
  document.getElementById("nav-logo").innerHTML =
    `${p.name_short || "ĐHTK"}<sup>portfolio</sup>`;
  document.getElementById("hero-tag-text").textContent =
    `${p.title_en} · ${p.title_vi}`;

  // Hero name: split on first space group
  const parts = p.name.split(" ");
  const last = parts.pop();
  document.getElementById("hero-name").innerHTML =
    `${parts.join(" ")}<br><span class="line-italic">${last}</span>`;

  document.getElementById("hero-tagline-en").textContent = p.tagline_en;
  document.getElementById("hero-tagline-vi").textContent = p.tagline_vi;
  document.getElementById("hero-loc").textContent = "📍 " + p.location;
  if (!p.available)
    document.getElementById("hero-available").style.display = "none";

  document.getElementById("footer-name").textContent = p.name;
}

// ── Ticker ───────────────────────────────────────────────────────
function renderTicker(skills) {
  if (!skills) return;
  const pills = skills.flatMap((s) => s.pills);
  const track = document.getElementById("ticker-track");
  const items = [...pills, ...pills]
    .map(
      (t) =>
        `<div class="ticker-item">${esc(t)} <span class="star">✦</span></div>`,
    )
    .join("");
  track.innerHTML = items;
}

// ── About ────────────────────────────────────────────────────────
function renderAbout(p) {
  if (!p) return;
  document.getElementById("about-bio-vi").innerHTML =
    `<strong>${p.name}</strong>, ${p.bio_vi}`;
  document.getElementById("about-bio-en").innerHTML = p.bio_en;
  document.getElementById("about-location-label").textContent = p.location;
  document.getElementById("about-links").innerHTML = `
    <a href="${esc(p.github)}" target="_blank" rel="noopener" class="soc-btn">${SVG_GITHUB} GitHub</a>
    <a href="${esc(p.linkedin)}" target="_blank" rel="noopener" class="soc-btn">${SVG_EXT} LinkedIn</a>
    <a href="${cvUrl}" class="soc-btn" download>${SVG_DL} Tải CV</a>
  `;
  document.getElementById("about-stats").innerHTML = `
    <div class="mini-stat"><div class="mini-n">${esc(p.years_exp)}</div><div class="mini-l">Năm KN</div></div>
    <div class="mini-stat"><div class="mini-n">${esc(p.projects_count)}</div><div class="mini-l">Dự án</div></div>
    <div class="mini-stat"><div class="mini-n">${esc(p.github_stars)}</div><div class="mini-l">⭐ GitHub</div></div>
    <div class="mini-stat"><div class="mini-n">∞</div><div class="mini-l">Cà phê ☕</div></div>
  `;
  if (p.github) document.getElementById("github-all-link").href = p.github;
}

// ── Skills ───────────────────────────────────────────────────────
function renderSkills(skills) {
  if (!skills) return;
  document.getElementById("skills-table").innerHTML = skills
    .map(
      (s, i) => `
    <div class="skill-cell reveal${i > 0 ? " d" + i : ""}">
      <div class="skill-cell-num">${esc(s.num)}</div>
      <div class="skill-cell-icon">${esc(s.icon)}</div>
      <div class="skill-cell-title">${esc(s.title)}</div>
      <div class="skill-cell-vi">${esc(s.title_vi)}</div>
      <div class="skill-pills">${s.pills.map((p) => `<span class="pill">${esc(p)}</span>`).join("")}</div>
    </div>
  `,
    )
    .join("");
  observeReveal();
  addSkillParallax();
}

// ── Experience ───────────────────────────────────────────────────
function renderExperience(exp) {
  if (!exp) return;
  document.getElementById("exp-entries").innerHTML = exp
    .map(
      (e, i) => `
    <div class="exp-entry reveal${i > 0 ? " d" + Math.min(i, 4) : ""}">
      <div class="exp-side">
        <div class="exp-dot-ring"></div>
        ${i < exp.length - 1 ? '<div class="exp-stem"></div>' : ""}
      </div>
      <div>
        <div class="exp-period">${esc(e.period)}</div>
        <div class="exp-role">${esc(e.role)}</div>
        <div class="exp-role-vi">${esc(e.role_vi)}</div>
        <div class="exp-company">${esc(e.company)}</div>
        <div class="exp-desc">
          ${esc(e.desc_vi)}<br><br>
          <em style="color:var(--ink4)">${esc(e.desc_en)}</em>
        </div>
        <div class="exp-chips">${e.chips.map((c) => `<span class="exp-chip">${esc(c)}</span>`).join("")}</div>
      </div>
    </div>
  `,
    )
    .join("");
  observeReveal();
}

// ── Projects ─────────────────────────────────────────────────────
function renderProjects(projects) {
  if (!projects) return;

  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  const all = [...featured, ...others];

  document.getElementById("projects-grid").innerHTML = all
    .map((p, i) => {
      //   const links = `
      //     ${
      //       p.github
      //         ? `
      //       <span class="proj-link" title="GitHub">
      //         ${SVG_GITHUB}
      //       </span>`
      //         : ""
      //     }

      //     ${
      //       p.live
      //         ? `
      //       <span class="proj-link" title="Live">
      //         ${SVG_EXT}
      //       </span>`
      //         : ""
      //     }
      //   `;
    const links = `
        ${
            p.github
            ? `
            <a href="${esc(p.github)}"
                target="_blank"
                rel="noopener"
                class="proj-link"
                title="GitHub"
                onclick="event.stopPropagation()">
                ${SVG_GITHUB}
            </a>
            `
            : ""
        }

        ${
            p.live
            ? `
            <a href="${esc(p.live)}"
                target="_blank"
                rel="noopener"
                class="proj-link"
                title="Live Demo"
                onclick="event.stopPropagation()">
                ${SVG_EXT}
            </a>
            `
            : ""
        }
    `;
      const stack = p.stack
        .map((s) => `<span class="stk">${esc(s)}</span>`)
        .join("");

      // FEATURED
      if (p.featured) {
        return `
        <div class="project-item feat reveal">
        <!--  <a href="${p.github || "#"}"
        target="_blank"
        rel="noopener"
        class="project-item feat reveal">-->

        <div class="proj-content">

            <div class="proj-header">
            <span class="proj-num">${esc(p.num)}</span>

            <div class="proj-links">
                ${links}
            </div>
            </div>

            <div class="proj-tag">
            ${esc(p.tag)}
            </div>

            <div class="proj-title">
            ${esc(p.title)}
            </div>

            <div class="proj-title-vi">
            ${esc(p.title_vi)}
            </div>

            <p class="proj-desc">
            ${esc(p.desc_vi)}
            <br><br>
            <em style="color:var(--ink4)">
                ${esc(p.desc_en)}
            </em>
            </p>

            <div class="proj-stack">
            ${stack}
            </div>

        </div>

        <div class="proj-visual">
            ${esc(p.icon)}
        </div>

        <!--<div class="proj-arrow">→</div>  -->
        </div>
        <!--</a>  -->
        
        `;
      }

      // NORMAL
      return `
      <div class="project-item reveal d${Math.min(i, 4)}">
    <!--  <a href="${p.github || "#"}"
    target="_blank"
    rel="noopener"
    class="project-item reveal d${Math.min(i, 4)}">-->

    <div class="proj-header">
        <span class="proj-num">${esc(p.num)}</span>

        <div class="proj-links">
        ${links}
        </div>
    </div>

    <div class="proj-visual-sm">
        ${esc(p.icon)}
    </div>

    <div class="proj-tag">
        ${esc(p.tag)}
    </div>

    <div class="proj-title">
        ${esc(p.title)}
    </div>

    <div class="proj-title-vi">
        ${esc(p.title_vi)}
    </div>

    <p class="proj-desc">
        ${esc(p.desc_vi)}
    </p>

    <div class="proj-stack">
        ${stack}
    </div>

    <!--<div class="proj-arrow">→</div>  -->

    <!--  </a>-->
    </div>
    `;
    })
    .join("");

  observeReveal();
}

// ── Contact ──────────────────────────────────────────────────────
function renderContact(p) {
  if (!p) return;
  document.getElementById("contact-email-link").textContent = p.email;
  document.getElementById("contact-email-link").href = "mailto:" + p.email;
  document.getElementById("contact-right").innerHTML = `
    <div class="contact-row"><div class="cr-label">Email</div><a href="mailto:${esc(p.email)}" class="cr-link">${esc(p.email)}</a></div>
    <div class="contact-row"><div class="cr-label">GitHub</div><a href="${esc(p.github)}" target="_blank" rel="noopener" class="cr-link">${esc(p.github.replace("https://", ""))} ${SVG_EXT}</a></div>
    <div class="contact-row"><div class="cr-label">LinkedIn</div><a href="${esc(p.linkedin)}" target="_blank" rel="noopener" class="cr-link">${esc(p.linkedin.replace("https://", ""))} ${SVG_EXT}</a></div>
    <div class="contact-row"><div class="cr-label">Location</div><div class="cr-val">📍 ${esc(p.location)}</div></div>
    <div class="contact-row"><div class="cr-label">Status</div><div class="cr-val" style="display:flex;align-items:center;gap:8px">
      <span style="width:7px;height:7px;border-radius:50%;background:${p.available ? "#22c55e" : "#94a3b8"};display:inline-block"></span>
      ${p.available ? "Open to work · Đang tìm việc" : "Not available · Không nhận việc"}
    </div></div>
  `;
}

// ── Contact Form ─────────────────────────────────────────────────
async function submitContact(e) {
  e.preventDefault();
  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.textContent = "Đang gửi...";
  ["name", "email", "message"].forEach((f) => {
    document.getElementById("e-" + f).textContent = "";
  });

  const body = {
    name: document.getElementById("f-name").value,
    email: document.getElementById("f-email").value,
    subject: document.getElementById("f-subject").value,
    message: document.getElementById("f-message").value,
  };

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      document.getElementById("form-success").classList.add("show");
      document.getElementById("contact-form").reset();
    } else if (json.errors) {
      Object.entries(json.errors).forEach(([k, v]) => {
        const el = document.getElementById("e-" + k);
        if (el) el.textContent = v;
      });
    }
  } catch {
    alert("Có lỗi xảy ra. Vui lòng thử lại.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Gửi tin nhắn →";
  }
}

// ════════════════════════════════════════════════════════
//  UTILS & INTERACTIONS
// ════════════════════════════════════════════════════════
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        obs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
);

function observeReveal() {
  document
    .querySelectorAll(".reveal:not(.in)")
    .forEach((el) => obs.observe(el));
}

function addSkillParallax() {
  document.querySelectorAll(".skill-cell").forEach((cell) => {
    cell.addEventListener("mousemove", (e) => {
      const r = cell.getBoundingClientRect();
      const x = ((e.clientX - r.left - r.width / 2) / r.width) * 6;
      const y = ((e.clientY - r.top - r.height / 2) / r.height) * 6;
      cell.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${-y}deg)`;
    });
    cell.addEventListener("mouseleave", () => {
      cell.style.transform = "";
    });
  });
}

// Progress bar
const bar = document.getElementById("progress-bar");
window.addEventListener(
  "scroll",
  () => {
    bar.style.width =
      (window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight)) *
        100 +
      "%";
  },
  { passive: true },
);

// Nav scroll
const navEl = document.getElementById("nav");
window.addEventListener(
  "scroll",
  () => {
    navEl.classList.toggle("scrolled", window.scrollY > 50);
  },
  { passive: true },
);

// Burger
const burger = document.getElementById("burger");
const mmenu = document.getElementById("mmenu");
burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  mmenu.classList.toggle("open");
  document.body.style.overflow = mmenu.classList.contains("open")
    ? "hidden"
    : "";
});
function closeM() {
  burger.classList.remove("open");
  mmenu.classList.remove("open");
  document.body.style.overflow = "";
}

// Boot
observeReveal();
loadContent();
//</script>
