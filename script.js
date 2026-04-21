const paletteSelect = document.querySelector("#palette-select");
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector("#site-menu");
const savedPalette = localStorage.getItem("digitalNexusPalette") || "warm";

document.body.dataset.theme = savedPalette;

if (paletteSelect) {
  paletteSelect.value = savedPalette;
  paletteSelect.addEventListener("change", () => {
    document.body.dataset.theme = paletteSelect.value;
    localStorage.setItem("digitalNexusPalette", paletteSelect.value);
  });
}

if (siteHeader && menuToggle && siteMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("is-menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader.classList.remove("is-menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -40px 0px",
  }
);

const addRevealBehavior = () => {
  const revealItems = document.querySelectorAll(
    ".service-card, .feature-card, .timeline article, .intro-band, .cta-card, .glass-card, .job-card"
  );

  revealItems.forEach((item) => {
    item.classList.add("reveal");
    observer.observe(item);
  });
};

const renderList = (items) =>
  items.map((item) => `<li>${item}</li>`).join("");

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const loadJobs = async () => {
  const inlineJobs = document.querySelector("#jobs-data");

  if (inlineJobs?.textContent.trim()) {
    return JSON.parse(inlineJobs.textContent);
  }

  const response = await fetch("jobs.json");

  if (!response.ok) {
    throw new Error("Unable to load jobs.");
  }

  return response.json();
};

const renderJobs = async () => {
  const jobsContainer = document.querySelector("#job-posting");

  if (!jobsContainer) {
    return;
  }

  try {
    const jobs = await loadJobs();
    const openJobs = jobs.filter((job) => job.open);

    if (!openJobs.length) {
      jobsContainer.innerHTML = `
        <article class="job-card">
          <h3>No current openings</h3>
          <p>We are not actively hiring at the moment, but we are always interested in meeting exceptional builders.</p>
        </article>
      `;
      addRevealBehavior();
      return;
    }

    jobsContainer.innerHTML = openJobs
      .map(
        (job, index) => `
          <article class="job-card">
            <div class="job-header">
              <div>
                <span class="job-badge">${escapeHtml(job.status)}</span>
                <h3>${escapeHtml(job.title)}</h3>
              </div>
              <div class="job-meta">
                <span>${escapeHtml(job.location)}</span>
                <span>${escapeHtml(job.type)}</span>
              </div>
            </div>

            <p>${escapeHtml(job.summary)}</p>

            <div class="job-columns">
              <div>
                <h4>What you'll do</h4>
                <ul>${renderList(job.responsibilities.map(escapeHtml))}</ul>
              </div>
              <div>
                <h4>What we're looking for</h4>
                <ul>${renderList(job.requirements.map(escapeHtml))}</ul>
              </div>
            </div>

            <div class="job-footer">
              <p>${escapeHtml(job.applyText)}</p>
              <div class="job-footer-actions">
                <button class="button button-primary apply-toggle" type="button">Apply Now</button>
              </div>
            </div>

            <form
              class="application-form"
              data-apply-email="${escapeHtml(job.applyEmail)}"
              data-job-title="${escapeHtml(job.title)}"
            >
              <div class="application-grid">
                <div class="form-field">
                  <label for="first-name-${index}">First Name</label>
                  <input id="first-name-${index}" name="firstName" type="text" required />
                </div>
                <div class="form-field">
                  <label for="last-name-${index}">Last Name</label>
                  <input id="last-name-${index}" name="lastName" type="text" required />
                </div>
                <div class="form-field form-field-full">
                  <label for="email-${index}">Email</label>
                  <input id="email-${index}" name="email" type="email" required />
                </div>
                <div class="form-field form-field-full">
                  <label for="resume-${index}">Resume</label>
                  <input id="resume-${index}" name="resume" type="file" accept=".pdf,.doc,.docx" required />
                  <p class="resume-note" aria-live="polite"></p>
                </div>
              </div>
              <p class="form-note">Submitting opens your email app with the entered details. Please attach the selected resume file before sending, because a static website cannot securely attach local files automatically.</p>
              <div class="job-footer-actions">
                <button class="button button-primary" type="submit">Send Application</button>
                <button class="button button-ghost apply-cancel" type="button">Cancel</button>
              </div>
            </form>
          </article>
        `
      )
      .join("");

    bindApplicationForms();
    addRevealBehavior();
  } catch (error) {
    jobsContainer.innerHTML = `
      <article class="job-card">
        <h3>Job postings unavailable</h3>
        <p>We could not load the current job listings right now. Please try again shortly.</p>
      </article>
    `;
    addRevealBehavior();
    console.error(error);
  }
};

const bindApplicationForms = () => {
  document.querySelectorAll(".job-card").forEach((card) => {
    const toggleButton = card.querySelector(".apply-toggle");
    const cancelButton = card.querySelector(".apply-cancel");
    const form = card.querySelector(".application-form");
    const resumeInput = card.querySelector('input[type="file"]');
    const resumeNote = card.querySelector(".resume-note");

    if (toggleButton && form) {
      toggleButton.addEventListener("click", () => {
        form.classList.add("is-open");
        toggleButton.style.display = "none";
      });
    }

    if (cancelButton && form && toggleButton) {
      cancelButton.addEventListener("click", () => {
        form.classList.remove("is-open");
        form.reset();
        if (resumeNote) {
          resumeNote.textContent = "";
        }
        toggleButton.style.display = "inline-flex";
      });
    }

    if (resumeInput && resumeNote) {
      resumeInput.addEventListener("change", () => {
        const fileName = resumeInput.files?.[0]?.name;
        resumeNote.textContent = fileName ? `Selected resume: ${fileName}` : "";
      });
    }

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const firstName = formData.get("firstName");
        const lastName = formData.get("lastName");
        const email = formData.get("email");
        const resumeName = resumeInput?.files?.[0]?.name || "Attach manually";
        const jobTitle = form.dataset.jobTitle || "Digital Nexus Role";
        const applyEmail = form.dataset.applyEmail || "careers@digitalnexus.com";
        const subject = encodeURIComponent(`Application for ${jobTitle} - ${firstName} ${lastName}`);
        const body = encodeURIComponent(
          [
            `First Name: ${firstName}`,
            `Last Name: ${lastName}`,
            `Email: ${email}`,
            `Position: ${jobTitle}`,
            `Resume File: ${resumeName}`,
            "",
            "Please see my attached resume.",
          ].join("\n")
        );

        window.location.href = `mailto:${applyEmail}?subject=${subject}&body=${body}`;
      });
    }
  });
};

addRevealBehavior();
renderJobs();
