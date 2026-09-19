(function () {
  const INBOX = "c998591065h392a6cc27eac5m2189047530@mail.conversations.godaddy.com";
  const COPY = "krmanagementteamsent@gmail.com";
  const ENDPOINT = "https://formsubmit.co/ajax/" + encodeURIComponent(INBOX);

  const btn = document.querySelector("[data-menu]");
  const links = document.querySelector("[data-nav]");
  if (btn && links) {
    btn.addEventListener("click", function () {
      const open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function refId() {
    return "KRM-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function showNote(form, text) {
    const note = form.querySelector("[data-success]");
    if (!note) return;
    note.style.display = "block";
    note.textContent = text;
  }

  document.querySelectorAll("[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const type = form.getAttribute("data-form") || "general";
      const data = new FormData(form);
      const payload = {};
      data.forEach(function (value, key) {
        payload[key] = String(value).trim();
      });

      if (!payload.email || (!payload.name && !payload.firstName)) {
        return;
      }

      const reference = refId();
      const body = {
        _subject: "KR Management inquiry — " + (payload.inquiryType || type) + " [" + reference + "]",
        _template: "table",
        _captcha: "false",
        _cc: COPY,
        source: "KR Management Hub",
        reference: reference,
        form: type,
        name: payload.name || payload.firstName || "",
        firstName: payload.firstName || "",
        email: payload.email,
        phone: payload.phone || "",
        country: payload.country || "",
        inquiryType: payload.inquiryType || type,
        preferredDate: payload.preferredDate || "",
        guests: payload.guests || "",
        message: payload.message || "",
        consent: payload.consent || payload.marketing || "",
        submittedAt: new Date().toISOString()
      };

      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(body)
      })
        .then(function () {
          showNote(
            form,
            "Your inquiry has been received (" + reference + "). The KR Management Team will review the information and respond through the contact method provided."
          );
          form.reset();
        })
        .catch(function () {
          const subject = encodeURIComponent("KR Management inquiry — " + (payload.inquiryType || type) + " [" + reference + "]");
          const lines = Object.keys(body)
            .filter(function (key) { return key.charAt(0) !== "_"; })
            .map(function (key) { return key + ": " + body[key]; })
            .join("\n");
          window.location.href = "mailto:" + INBOX + "?cc=" + encodeURIComponent(COPY) + "&subject=" + subject + "&body=" + encodeURIComponent(lines);
          showNote(
            form,
            "Your inquiry has been received (" + reference + "). The KR Management Team will review the information and respond through the contact method provided."
          );
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  });
})();
