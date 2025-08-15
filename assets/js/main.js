document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.menu-toggle');
  const navList = document.getElementById('nav-list');
  if (!toggle || !navList) return;
  toggle.addEventListener('click', function () {
    const open = navList.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
});
