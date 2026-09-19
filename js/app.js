(function () {
  const year = new Date().getFullYear();
  const btn = document.querySelector("[data-menu]");
  const links = document.querySelector("[data-nav]");
  if (btn && links) {
    btn.addEventListener("click", function () {
      const open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  const keep = document.querySelector(".site-footer[data-keep]");
  const footer = document.querySelector(".site-footer .wrap") || document.querySelector(".site-footer");
  if (footer && !keep) {
    footer.innerHTML =
      '<div class="foot-modern">' +
      '<div><h3>KR Management</h3><p>Official management and fan-relations desk supporting Kid Rock.</p><p class="tagline">Music. Loyalty. Freedom. Legacy.</p></div>' +
      '<div><h4>Connect</h4><a href="https://kidrockmanagement.godaddysites.com" rel="noopener">Contact</a><a href="https://linktr.ee/krmanagementt" rel="noopener">LinkMe</a><a href="meet-greet.html">Meet & Greet</a><a href="shop.html">Shop</a><a href="channels.html">Channels</a></div>' +
      '<div><h4>Legal</h4><a href="legal.html">Legal</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="refund.html">Refund</a><a href="disclaimer.html">Disclaimer</a></div>' +
      '</div>' +
      '<p class="legal">&copy; ' + year + ' KR Management Team. All rights reserved.</p>';
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
      const original = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = type === "meet-greet" ? "Submitting request..." : "Sending request...";
      }
      fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().then(function (json) { return { res: res, json: json }; }); })
        .then(function (result) {
          if (!result.res.ok || !result.json.ok) {
            setError(form, (result.json && result.json.error) || "We couldn't complete your request right now. Please try again.");
            return;
          }
          const note = form.querySelector("[data-success]");
          if (note) {
            note.classList.add("show");
            note.style.display = "block";
            note.innerHTML = "Request received<br>Reference ID: <strong>" + result.json.reference + "</strong><br>Please keep this reference ID for your records.";
          }
          form.reset();
        })
        .catch(function () {
          setError(form, "We couldn't complete your request right now. Please try again.");
        })
        .finally(function () {
          locked = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = original;
          }
        });
    });
  });
})();
