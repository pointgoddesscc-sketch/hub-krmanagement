(function () {
  const btn = document.querySelector("[data-menu]");
  const links = document.querySelector("[data-nav]");
  if (btn && links) {
    btn.addEventListener("click", function () {
      const open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const type = form.getAttribute("data-form");
      const data = new FormData(form);
      const payload = {};
      data.forEach(function (value, key) {
        payload[key] = String(value).trim();
      });

      if (!payload.email || !payload.name && !payload.firstName) {
        return;
      }

      const subject = encodeURIComponent("KR Management inquiry — " + (payload.inquiryType || type || "general"));
      const body = encodeURIComponent(
        Object.keys(payload)
          .map(function (key) { return key + ": " + payload[key]; })
          .join("\n")
      );
      const mailbox = "krmanagementteamsent@gmail.com";
      window.location.href = "mailto:" + mailbox + "?subject=" + subject + "&body=" + body;

      const note = form.querySelector("[data-success]");
      if (note) {
        note.style.display = "block";
        note.textContent = "Your inquiry has been received. The KR Management Team will review the information and respond through the contact method provided.";
      }
      form.reset();
    });
  });
})();
