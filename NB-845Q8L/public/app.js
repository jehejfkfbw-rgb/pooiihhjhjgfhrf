// NEBRAS AI — generated frontend behavior (vanilla JS)
(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () { nav.classList.toggle("open"); });
  }

  var status = document.getElementById("api-status");
  function setStatus(text, cls) {
    if (!status) return;
    status.textContent = text;
    status.className = "status" + (cls ? " " + cls : "");
  }

  fetch("/api/health")
    .then(function (r) { return r.json(); })
    .then(function (d) { setStatus("الخادم متصل ✓ (" + (d.status || "ok") + ")", "ok"); })
    .catch(function () { setStatus("تعذر الوصول للخادم", "err"); });

  var form = document.getElementById("echo-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.getElementById("echo-msg").value.trim();
      var out = document.getElementById("echo-out");
      if (!msg || !out) return;
      out.textContent = "جارٍ الإرسال...";
      fetch("/api/echo?msg=" + encodeURIComponent(msg))
        .then(function (r) { return r.json(); })
        .then(function (d) { out.textContent = "رد الخادم: " + (d.echo || d.error || "—"); })
        .catch(function () { out.textContent = "خطأ في الاتصال بالخادم."; });
    });
  }
})();
