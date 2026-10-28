/* RAIM shared interactions — responsive, accessible, and dependency-free. */
(() => {
  "use strict";

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  ready(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    // Keep footer years current without needing to edit HTML each year.
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    // Accessible mobile navigation, shared by both website pages.
    const header = document.querySelector("header.nav");
    const menuButton = header?.querySelector(".menu-btn");
    const navigation = header?.querySelector("nav");

    const closeNavigation = () => {
      if (!menuButton || !navigation) return;
      navigation.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open menu");
    };

    if (menuButton && navigation) {
      if (!navigation.id) navigation.id = "raim-navigation";
      menuButton.setAttribute("aria-controls", navigation.id);
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.addEventListener("click", () => {
        const isOpen = navigation.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      });

      navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeNavigation);
      });

      document.addEventListener("click", (event) => {
        if (!navigation.classList.contains("is-open")) return;
        if (!header.contains(event.target)) closeNavigation();
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 850) closeNavigation();
      }, { passive: true });
    }

    // Reveal sections as they enter view; make them visible immediately as a fallback.
    const revealTargets = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("visible"));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -35px 0px" });
      revealTargets.forEach((target) => revealObserver.observe(target));
    }

    // Contact-page reveal animations share the same reduced-motion/fallback behavior.
    const contactRevealTargets = document.querySelectorAll(
      ".contact-hero-copy, .contact-visual, .social-card, .email-panel, .contact-closing"
    );
    if (contactRevealTargets.length) {
      if (reduceMotion || !("IntersectionObserver" in window)) {
        contactRevealTargets.forEach((target) => target.classList.add("contact-reveal", "contact-visible"));
      } else {
        const contactObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("contact-visible");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        contactRevealTargets.forEach((target) => {
          target.classList.add("contact-reveal");
          contactObserver.observe(target);
        });
      }
    }

    // Subtle pointer glow only on devices with a precise pointer.
    const glow = document.querySelector(".cursor-glow");
    if (glow && finePointer && !reduceMotion) {
      let glowFrame = 0;
      let pointerX = 0;
      let pointerY = 0;
      window.addEventListener("pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (glowFrame) return;
        glowFrame = window.requestAnimationFrame(() => {
          glow.style.left = `${pointerX}px`;
          glow.style.top = `${pointerY}px`;
          glowFrame = 0;
        });
      }, { passive: true });
    }

    // Charter modal: keyboard close, backdrop close, and focus restoration.
    const modal = document.getElementById("modal");
    const charterButton = document.getElementById("charterBtn");
    const closeModalButton = document.getElementById("closeModal");
    const modalBackdrop = modal?.querySelector(".modal-backdrop");
    let modalOpener = null;

    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (modalOpener instanceof HTMLElement) modalOpener.focus();
    };

    if (modal && charterButton) {
      charterButton.addEventListener("click", () => {
        modalOpener = charterButton;
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        closeModalButton?.focus();
      });
      closeModalButton?.addEventListener("click", closeModal);
      modalBackdrop?.addEventListener("click", closeModal);
      modal.querySelector("#modalJoin")?.addEventListener("click", closeModal);
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
      });
    }

    // Join CTA gives the visitor a real next step instead of implying a backend submission.
    const joinButton = document.getElementById("joinBtn");
    const toast = document.getElementById("toast");
    if (joinButton && toast) {
      let toastTimer = 0;
      joinButton.addEventListener("click", () => {
        toast.innerHTML = '<span aria-hidden="true">●</span> Thanks for your interest in RAIM. Use Contact Us to get in touch.';
        toast.classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("show"), 5000);
      });
    }

    // Prepare an email in the visitor's email app; no server or storage is implied.
    const contactForm = document.getElementById("raim-contact-form");
    const formStatus = document.getElementById("form-status");
    const contactEmail = "YOUR_EMAIL_ADDRESS@EXAMPLE.COM"; // Replace with RAIM's official inbox before publishing.

    if (contactForm && formStatus) {
      contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        formStatus.classList.add("is-visible");

        if (contactEmail.includes("YOUR_EMAIL_ADDRESS")) {
          formStatus.textContent = "The contact form is ready. Before publishing, replace YOUR_EMAIL_ADDRESS@EXAMPLE.COM in script.js with RAIM’s official email address.";
          return;
        }

        const data = new FormData(contactForm);
        const name = String(data.get("name") || "").trim();
        const replyEmail = String(data.get("replyEmail") || "").trim();
        const subject = String(data.get("subject") || "Contact from the RAIM website").trim();
        const message = String(data.get("message") || "").trim();
        const body = `Name: ${name}\nReply email: ${replyEmail}\n\nMessage:\n${message}`;
        const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        formStatus.textContent = "Your email app should open with your message ready to send. If it does not, copy your message and email RAIM directly.";
        window.location.href = mailto;
      });
    }

    // Lightweight network animation for the home hero canvas.
    const canvas = document.getElementById("aiCanvas");
    const context = canvas?.getContext?.("2d");
    if (canvas && context) {
      let width = 0;
      let height = 0;
      let particles = [];
      let animationFrame = 0;
      let isVisible = true;
      let lastFrame = 0;

      const createParticles = () => {
        const amount = Math.max(12, Math.min(42, Math.round(width / 25)));
        particles = Array.from({ length: amount }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: 0.7 + Math.random() * 1.3,
          tint: Math.random() > 0.6 ? "violet" : "cyan"
        }));
      };

      const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        createParticles();
        draw(0, true);
      };

      const draw = (timestamp, staticFrame = false) => {
        context.clearRect(0, 0, width, height);
        const connectionDistance = width < 600 ? 82 : 115;
        particles.forEach((particle, index) => {
          if (!staticFrame && !reduceMotion) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            if (particle.x < 0 || particle.x > width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > height) particle.vy *= -1;
          }
          particle.x = Math.max(0, Math.min(width, particle.x));
          particle.y = Math.max(0, Math.min(height, particle.y));

          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fillStyle = particle.tint === "violet" ? "rgba(167,108,255,.55)" : "rgba(92,225,255,.62)";
          context.fill();

          for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
            const other = particles[otherIndex];
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.hypot(dx, dy);
            if (distance < connectionDistance) {
              const alpha = (1 - distance / connectionDistance) * 0.13;
              context.beginPath();
              context.moveTo(particle.x, particle.y);
              context.lineTo(other.x, other.y);
              context.strokeStyle = `rgba(92,225,255,${alpha})`;
              context.lineWidth = 0.7;
              context.stroke();
            }
          }
        });

        if (!staticFrame && !reduceMotion && isVisible && !document.hidden) {
          animationFrame = window.requestAnimationFrame((nextTime) => {
            // Slightly cap drawing frequency to reduce heat/battery use on phones.
            if (nextTime - lastFrame < 28) {
              animationFrame = window.requestAnimationFrame((queuedTime) => draw(queuedTime));
              return;
            }
            lastFrame = nextTime;
            draw(nextTime);
          });
        }
      };

      if ("ResizeObserver" in window) {
        const sizeObserver = new ResizeObserver(resizeCanvas);
        sizeObserver.observe(canvas);
      } else {
        window.addEventListener("resize", resizeCanvas, { passive: true });
      }

      if ("IntersectionObserver" in window) {
        const canvasObserver = new IntersectionObserver((entries) => {
          isVisible = entries.some((entry) => entry.isIntersecting);
          if (isVisible && !reduceMotion && !document.hidden && !animationFrame) {
            animationFrame = window.requestAnimationFrame((time) => draw(time));
          } else if (!isVisible && animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
          }
        });
        canvasObserver.observe(canvas);
      }

      document.addEventListener("visibilitychange", () => {
        if (document.hidden && animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        } else if (!document.hidden && isVisible && !reduceMotion && !animationFrame) {
          animationFrame = window.requestAnimationFrame((time) => draw(time));
        }
      });

      resizeCanvas();
    }
  });
})();
