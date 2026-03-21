const firebaseNode =
  "https://community-canvas-255fa-default-rtdb.firebaseio.com/hardik.json";

const fallbackUrl = "./assets/content.json";

const state = {
  content: null,
};

function resolveImagePath(fileName) {
  if (!fileName) return "";
  if (fileName.startsWith("http")) return fileName;
  if (fileName.startsWith("/")) {
    return new URL(fileName.slice(1), document.baseURI).toString();
  }
  if (fileName.startsWith("assets/")) {
    return new URL(`../${fileName}`, document.baseURI).toString();
  }
  if (fileName.startsWith("images/")) {
    return new URL(`assets/${fileName}`, document.baseURI).toString();
  }
  return new URL(`assets/images/${fileName}`, document.baseURI).toString();
}

function resolveVideoPath(fileName) {
  if (!fileName) return "";
  if (fileName.startsWith("http")) return fileName;
  if (fileName.startsWith("/")) {
    return new URL(fileName.slice(1), document.baseURI).toString();
  }
  if (fileName.startsWith("assets/")) {
    return new URL(`../${fileName}`, document.baseURI).toString();
  }
  if (fileName.startsWith("videos/")) {
    return new URL(`assets/${fileName}`, document.baseURI).toString();
  }
  return new URL(`assets/videos/${fileName}`, document.baseURI).toString();
}

function toEmbedUrl(url) {
  if (!url) return "";
  if (url.includes("embed/")) return url;
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const idMatch = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
  if (idMatch) return `https://www.youtube.com/embed/${idMatch[1]}`;
  return url;
}

async function loadContent() {
  try {
    const res = await fetch(firebaseNode, { cache: "no-store" });
    if (!res.ok) throw new Error("firebase");
    const data = await res.json();
    if (!data || !data.site || !data.pages) throw new Error("empty");
    return data;
  } catch {
    const res = await fetch(fallbackUrl);
    return res.json();
  }
}

function setModalOpen(open) {
  document.body.classList.toggle("modal-open", open);
}

function renderNavbar(content) {
  const nav = document.getElementById("navbar");
  nav.innerHTML = `
    <div class="navbar" id="navbarWrap">
      <div class="nav-inner">
        <div class="nav-top">
          <div class="logo" id="homeLogo">${content.site.logoText}</div>
          <div class="nav-center">
            <p>${content.site.ownerName}</p>
            <p class="tagline">${content.site.tagline}</p>
          </div>
          <div></div>
        </div>
        <div class="nav-pills">
          ${content.navbar
            .map((item) => {
              const href = item.href || "#";
              const anchor = href.startsWith("/#")
                ? href.replace("/#", "#")
                : href.startsWith("/")
                ? `#${href.replace("/", "")}`
                : href;
              return `<a class="nav-link" href="${anchor}">${item.label}</a>`;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;

  const navbarWrap = document.getElementById("navbarWrap");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 8) navbarWrap.classList.add("scrolled");
    else navbarWrap.classList.remove("scrolled");
  });
  document.getElementById("homeLogo").addEventListener("click", () => {
    window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function renderHero(section, content) {
  const title = section.title || `${content.site.ownerName} - ${content.site.tagline}`;
  const body = section.body || content.site.bio;
  const image = resolveImagePath(
    section.image || content.site.profileImage || "",
  );
  const projectCount = content.projects.length;
  const stats = section.stats
    ? section.stats.replace("{projectCount}", projectCount)
    : "";

  const primaryHref = section.primaryCta?.href || "";
  const secondaryHref = section.secondaryCta?.href || "";
  const primaryAnchor = primaryHref.startsWith("/#")
    ? primaryHref.replace("/#", "#")
    : primaryHref.startsWith("/")
    ? `#${primaryHref.replace("/", "")}`
    : primaryHref;
  const secondaryAnchor = secondaryHref.startsWith("/#")
    ? secondaryHref.replace("/#", "#")
    : secondaryHref.startsWith("/")
    ? `#${secondaryHref.replace("/", "")}`
    : secondaryHref;

  return `
    <section class="section-card hero">
      <div>
        <div class="hero-eyebrow">${section.eyebrow || ""}</div>
        <h1 class="hero-title">${title}</h1>
        <p class="hero-body">${body || ""}</p>
        <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
          ${
            section.primaryCta
              ? `<a class="btn primary" href="${primaryAnchor}">${section.primaryCta.label}</a>`
              : ""
          }
          ${
            section.secondaryCta
              ? `<a class="btn secondary" href="${secondaryAnchor}">${section.secondaryCta.label}</a>`
              : ""
          }
        </div>
      </div>
      <div>
        <div class="section-card" style="padding:20px;">
          <div class="modal-media">
            ${image ? `<img src="${image}" alt="${title}" />` : ""}
          </div>
          ${stats ? `<p style="margin:0; color:rgba(203,213,240,.8);">${stats}</p>` : ""}
        </div>
      </div>
    </section>
  `;
}

function renderCards(section, items, openHandlerName) {
  return `
    <section class="section-card" id="${section.id || ""}">
      <div class="section-title">
        <h2>${section.heading || ""}</h2>
        <div class="underline"></div>
        ${
          section.subheading
            ? `<div class="section-sub">${section.subheading}</div>`
            : ""
        }
      </div>
      <div class="card-grid">
        ${items
          .map(
            (item) => `
          <div class="tile">
            <h3>${item.title}</h3>
            ${item.body ? `<p>${item.body}</p>` : ""}
            <button class="open" data-open="${openHandlerName}" data-slug="${item.slug}">
              OPEN >
            </button>
          </div>
        `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderAbout(section, content) {
  return `
    <section class="section-card" id="${section.id || ""}">
      <div class="about-grid">
        <div>
          <h2>${section.heading || "About"}</h2>
          <p style="margin-top:12px; color:rgba(203,213,240,.9);">${content.site.bio || ""}</p>
          ${
            content.site.replyNote
              ? `<p style="margin-top:10px; color:rgba(203,213,240,.7); font-size:14px;">${content.site.replyNote}</p>`
              : ""
          }
          <div class="pill-list" style="margin-top:16px;">
            ${content.skills
              .map((skill) => `<span class="pill">${skill.name}</span>`)
              .join("")}
          </div>
        </div>
        <div class="section-card" style="padding:20px;">
          <p class="section-sub">Timezone</p>
          <p style="margin-top:8px; font-weight:600;">${content.site.timezoneValue}</p>
          <div style="margin-top:16px; border-radius:18px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); padding:14px 16px; display:grid; gap:8px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; text-transform:uppercase; letter-spacing:0.3em; color:rgba(203,213,240,0.7);">
              <span>${content.site.timezoneLabel || "My Time"}</span>
              <span id="ownerTime">--:--:--</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; text-transform:uppercase; letter-spacing:0.3em; color:rgba(203,213,240,0.7);">
              <span>Your Local Time</span>
              <span id="viewerTime">--:--:--</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderContact(section, content) {
  const socials = content.social || [];
  const email = socials.find(
    (item) => (item.label || "").toLowerCase() === "email",
  );
  const otherSocials = socials.filter(
    (item) => (item.label || "").toLowerCase() !== "email",
  );
  const getSocialIcon = (label) => {
    const key = (label || "").toLowerCase();
    if (key.includes("youtube")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.6 4.6 12 4.6 12 4.6s-7.6 0-9.4.5A3 3 0 0 0 .5 7.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-4.8ZM9.6 15.6V8.4L15.9 12l-6.3 3.6Z"/>
        </svg>`;
    }
    if (key.includes("discord")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M20.3 4.5a19.7 19.7 0 0 0-4.9-1.5c-.2.4-.4.9-.6 1.3a18 18 0 0 0-5.6 0c-.2-.4-.4-.9-.6-1.3-1.7.3-3.3.8-4.9 1.5A20 20 0 0 0 1 17.8a20 20 0 0 0 6.1 3.1c.5-.7.9-1.4 1.3-2.1a11.8 11.8 0 0 1-2.1-1c.2-.2.3-.4.4-.6a13.6 13.6 0 0 0 10.6 0c.1.2.3.4.4.6-.7.4-1.4.7-2.1 1 .4.7.8 1.4 1.3 2.1a20 20 0 0 0 6.1-3.1 20 20 0 0 0-2.7-13.3ZM8.6 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.9 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/>
        </svg>`;
    }
    if (key.includes("instagram")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5Zm7-1.8a1.1 1.1 0 1 0 1.1 1.1A1.1 1.1 0 0 0 19 5.7ZM12 9.3A2.7 2.7 0 1 1 9.3 12 2.7 2.7 0 0 1 12 9.3Z"/>
        </svg>`;
    }
    if (key.includes("twitch")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M4 3h16v11.3L15.7 19H12l-2.5 2.5H6.2V19H3V6.2L4 3Zm2 2v12h2.2v2.2L10.4 17H15l3-3V5H6Zm5 3h1.5v4H11V8Zm4 0h1.5v4H15V8Z"/>
        </svg>`;
    }
    return `<span>${(label || "@")[0]}</span>`;
  };
  return `
    <section class="section-card" id="${section.id || ""}">
      <div class="section-title">
        <h2>${section.heading || "Contact"}</h2>
        <div class="underline"></div>
        ${
          section.subheading
            ? `<div class="section-sub">${section.subheading}</div>`
            : ""
        }
      </div>
      <div class="contact-grid">
        <div class="section-card contact-card">
          <p class="contact-label">Email</p>
          <a class="contact-email" href="${email?.href || `mailto:${email?.value || ""}`}">
            ${email?.value || email?.href?.replace("mailto:", "") || ""}
          </a>
        </div>
        <div class="section-card contact-card">
          <p class="contact-label">Social</p>
          <div class="contact-list">
            ${otherSocials
              .map((item) => {
                const label = item.label || "Link";
                const href = item.href || "";
                return `
                  <a class="contact-pill" href="${href}" target="_blank" rel="noreferrer">
                    <span class="icon">${getSocialIcon(label)}</span>
                    ${label}
                  </a>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderModal(type, data) {
  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <header>
          <div>
            <h3>${data.title}</h3>
            ${
              data.tags && data.tags.length
                ? `<div class="tags">${data.tags
                    .map((tag) => `<span>${tag}</span>`)
                    .join("")}</div>`
                : ""
            }
          </div>
          <button class="close-btn" id="closeModal">x</button>
        </header>
        <div class="modal-body">
          ${
            data.youtubeUrl || data.localVideo
              ? `<div class="modal-media" style="aspect-ratio:16/9;">
                  ${
                    data.youtubeUrl
                      ? `<iframe src="${toEmbedUrl(
                          data.youtubeUrl,
                        )}" title="${data.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
                      : `<video src="${resolveVideoPath(
                          data.localVideo,
                        )}" controls></video>`
                  }
                </div>`
              : ""
          }
          ${
            data.image
              ? `<div class="modal-media"><img src="${resolveImagePath(
                  data.image,
                )}" alt="${data.title}" /></div>`
              : ""
          }
          ${
            data.whatICanDo
              ? `<div class="modal-section"><h4>What I Can Do</h4><p>${data.whatICanDo}</p></div>`
              : ""
          }
          ${
            data.description
              ? `<div class="modal-section"><h4>Description</h4><p>${data.description}</p></div>`
              : ""
          }
          ${
            data.contribution
              ? `<div class="modal-section"><h4>How I Helped</h4><p>${data.contribution}</p></div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  setModalOpen(true);

  const close = () => {
    modalRoot.innerHTML = "";
    setModalOpen(false);
  };
  document.getElementById("closeModal").addEventListener("click", close);
  document.getElementById("modalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") close();
  });
}

function renderPage(content) {
  renderNavbar(content);
  const main = document.getElementById("main");
  const home = content.pages.find((page) => page.slug === "home");
  if (!home) {
    main.innerHTML = "<p>Missing home page.</p>";
    return;
  }

  const sections = home.sections
    .map((section) => {
      if (section.type === "hero") return renderHero(section, content);
      if (section.type === "cards" && section.dataSource === "skills") {
        const items = content.skills.map((skill) => ({
          title: skill.name,
          body: skill.description,
          slug: skill.slug,
        }));
        return renderCards(section, items, "skill");
      }
      if (section.type === "cards" && section.dataSource === "projects") {
        const items = content.projects
          .filter((project) => {
            if (!section.filterCategory) return true;
            return (
              (project.category || "current").toLowerCase() ===
              section.filterCategory.toLowerCase()
            );
          })
          .map((project) => ({
            title: project.title,
            body: project.summary,
            slug: project.slug,
          }));
        return renderCards(section, items, "project");
      }
      if (section.type === "text") return renderAbout(section, content);
      if (section.type === "cta") return renderContact(section, content);
      return "";
    })
    .join("");

  main.innerHTML = `
    ${sections}
    <footer class="site-footer">© 2026 ${content.site.ownerName}. All rights reserved.</footer>
  `;

  main.querySelectorAll("button[data-open='skill']").forEach((button) => {
    button.addEventListener("click", (event) => {
      const slug = event.currentTarget.getAttribute("data-slug");
      const skill = content.skills.find((s) => s.slug === slug);
      if (!skill) return;
      renderModal("skill", {
        title: skill.name,
        description: skill.description,
        whatICanDo: skill.whatICanDo,
        youtubeUrl: skill.youtubeUrl,
        localVideo: skill.localVideo,
        image: (skill.images || [])[0],
      });
    });
  });

  main.querySelectorAll("button[data-open='project']").forEach((button) => {
    button.addEventListener("click", (event) => {
      const slug = event.currentTarget.getAttribute("data-slug");
      const project = content.projects.find((p) => p.slug === slug);
      if (!project) return;
      renderModal("project", {
        title: project.title,
        description: project.description || project.summary,
        contribution: project.contribution,
        youtubeUrl: project.youtubeUrl,
        localVideo: project.localVideo,
        image: project.image,
        tags: project.tags || [],
      });
    });
  });

  const ownerTimeEl = document.getElementById("ownerTime");
  const viewerTimeEl = document.getElementById("viewerTime");
  if (ownerTimeEl && viewerTimeEl) {
    const ownerZone = content.site.timezoneIana || "UTC";
    const updateTimes = () => {
      const now = new Date();
      ownerTimeEl.textContent = now.toLocaleTimeString([], {
        timeZone: ownerZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      viewerTimeEl.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };
    updateTimes();
    if (window.__timeInterval) clearInterval(window.__timeInterval);
    window.__timeInterval = setInterval(updateTimes, 1000);
  }
}

loadContent().then((content) => {
  state.content = content;
  renderPage(content);
});
