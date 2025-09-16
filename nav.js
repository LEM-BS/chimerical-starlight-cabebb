(function(){
  function init(){
    var headerPromise = fetch('/header.html')
      .then(function(r){ return r.text(); })
      .then(function(html){
        var el = document.getElementById('header-include');
        if (el) el.innerHTML = html;
      })
      .catch(function(err){ console.error('Header load failed:', err); });

    var footerPromise = fetch('/footer.html')
      .then(function(r){ return r.text(); })
      .then(function(html){
        var el = document.getElementById('footer-include');
        if (el) el.innerHTML = html;
      })
      .catch(function(err){ console.error('Footer load failed:', err); });

    Promise.all([headerPromise, footerPromise]).then(function(){
      setupNav();
      loadTrustIndex();
    });
  }

  function loadTrustIndex(){
    if (document.querySelector('script[src^="https://cdn.trustindex.io/loader.js"]')) return;
    var s = document.createElement('script');
    s.src = 'https://cdn.trustindex.io/loader.js?f82e0f551228447e6c06f9b86c7';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  // Expose globally so other pages can trigger TrustIndex loading
  window.loadTrustIndex = loadTrustIndex;

  function setupNav(){
    var navToggle = document.querySelector('.nav-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', function(){
        var isOpen = navLinks.classList.toggle('nav-open');
        navToggle.classList.toggle('open', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen);
      });
    }

    var path = window.location.pathname;
    document.querySelectorAll('.main-nav a').forEach(function(link){
      var href = link.getAttribute('href');
      if (href === path || (path === '/' && href === '/index.html')) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
