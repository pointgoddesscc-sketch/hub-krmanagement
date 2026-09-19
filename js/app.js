(function () {
  const btn = document.querySelector("[data-menu]");
  const links = document.querySelector("[data-nav]");
  if (btn && links) {
    btn.addEventListener("click", function () {
      const open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setError(form, text) {
    let box = form.querySelector("[data-error]");
    if (!box) {
      box = document.createElement("p");
      box.className = "field-error";
      box.setAttribute("data-error", "");
      box.setAttribute("role", "alert");
      form.appendChild(box);
    }
    box.textContent = text || "";
  }

  document.querySelectorAll("[data-form]").forEach(function (form) {
    let locked = false;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (locked) return;
      const type = form.getAttribute("data-form") || "contact";
      const data = new FormData(form);
      const payload = { form: type };
      data.forEach(function (value, key) { payload[key] = String(value).trim(); });

      if (payload.website) return;
      const name = payload.name || payload.firstName || "";
      const email = payload.email || "";
      if (!name) return setError(form, "Please enter your name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(form, "Please enter a valid email address.");
      if (type !== "newsletter" && !(payload.message || "").trim()) return setError(form, "Please enter a message.");
      setError(form, "");

      locked = true;
      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().then(function (json) { return { res: res, json: json }; }); })
        .then(function (result) {
          if (!result.res.ok || !result.json.ok) {
            setError(form, (result.json && result.json.error) || "Your request could not be sent. Please try again.");
            return;
          }
          const note = form.querySelector("[data-success]");
          if (note) {
            note.classList.add("show");
            note.style.display = "block";
            note.innerHTML = "Thank you. Your request has been received.<br>Reference ID: <strong>" + result.json.reference + "</strong><br>Please keep this reference ID for your records.";
          }
          form.reset();
        })
        .catch(function () {
          setError(form, "Your request could not be sent. Please try again.");
        })
        .finally(function () {
          locked = false;
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  });
})();
