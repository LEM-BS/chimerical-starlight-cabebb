/* Loads any <div data-include="/path/to/file.html"> with the file’s HTML */
(function () {
  function inject(el, html) {
    el.outerHTML = html;
  }
  function load(el) {
    var url = el.getAttribute("data-include");
    if (!url) return;
    fetch(url, { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.text() : "";
      })
      .then(function (html) {
        if (html) inject(el, html);
      })
      .catch(function () {});
  }
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-include]").forEach(load);
  });
})();
