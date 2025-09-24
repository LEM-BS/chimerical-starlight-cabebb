// Emits Product + AggregateRating JSON-LD only when first-party reviews exist on the page
(function () {
  var emitted = false;

  function hasFirstPartyReview() {
    return document.querySelector(
      ".first-party-reviews [itemprop='reviewBody'], .first-party-reviews [data-review]"
    );
  }

  function emit() {
    if (emitted) return;

    try {
      var root = document.querySelector("[data-product-key]");
      if (!root) return;

      var key = root.getAttribute("data-product-key");
      if (!key) return;

      // Require first-party reviews (not third-party widgets)
      if (!hasFirstPartyReview()) return;

      emitted = true;

      var jsonUrl = "/data/reviews.json?v=" + (window.REV || "REV-25.09.17");

      fetch(jsonUrl, { credentials: "same-origin" })
        .then(function (r) {
          return r.ok ? r.json() : Promise.reject(r.status);
        })
        .then(function (data) {
          var item = data[key];
          if (!item || !item.reviewCount || !item.ratingValue) return;

          var payload = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: item.name,
            description: item.description,
            brand: { "@type": "Organization", name: "LEM Building Surveying Ltd" },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: String(item.ratingValue),
              reviewCount: String(item.reviewCount),
              bestRating: "5",
              worstRating: "1",
            },
          };

          var s = document.createElement("script");
          s.type = "application/ld+json";
          s.text = JSON.stringify(payload);
          document.head.appendChild(s);
        })
        .catch(function () {});
    } catch (e) {}
  }

  function onReady() {
    if (hasFirstPartyReview()) {
      emit();
      return;
    }

    var observer = new MutationObserver(function (_, obs) {
      if (hasFirstPartyReview()) {
        obs.disconnect();
        emit();
      }
    });

    try {
      observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
      });
    } catch (e) {
      emit();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
