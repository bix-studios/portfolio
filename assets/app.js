const firebaseNode =
  "https://community-canvas-255fa-default-rtdb.firebaseio.com/hardik.json";

const fallbackUrl = "./assets/content.json";

const state = {
  content: null,
};

function resolveImagePath(fileName) {
  if (!fileName) return "";
  if (fileName.startsWith("http")) return fileName;
  return new URL(`images/${fileName}`, document.baseURI).toString();
}

function resolveVideoPath(fileName) {
  if (!fileName) return "";
  if (fileName.startsWith("http")) return fileName;
  return new URL(`videos/${fileName}`, document.baseURI).toString();
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

  return `
    <section class="section-card hero">
      <div>
        <div class="hero-eyebrow">${section.eyebrow || ""}</div>
        <h1 class="hero-title">${title}</h1>
        <p class="hero-body">${body || ""}</p>
        <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
          ${
            section.primaryCta
              ? `<a class="btn primary" href="${section.primaryCta.href}">${section.primaryCta.label}</a>`
              : ""
          }
          ${
            section.secondaryCta
              ? `<a class="btn secondary" href="${section.secondaryCta.href}">${section.secondaryCta.label}</a>`
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
        </div>
      </div>
    </section>
  `;
}

function renderContact(section, content) {
  const socials = content.social || [];
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
      <div class="contact-list">
        ${socials
          .map((item) => {
            const label = item.label || "Link";
            const href = item.href || "";
            return `
              <a class="contact-pill" href="${href}" target="_blank" rel="noreferrer">
                <span class="icon">${label[0] || "@"}</span>
                ${label}
              </a>
            `;
          })
          .join("")}
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

  main.innerHTML = sections;

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
}

loadContent().then((content) => {
  state.content = content;
  renderPage(content);
});
