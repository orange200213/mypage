// JS: 导航切换、手风琴平滑展开、以及滚动显现动画
document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  // 汉堡菜单动画关闭处理
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
      navToggle.setAttribute('aria-expanded', !expanded);
      if (!expanded) {
        // 打开菜单
        mainNav.classList.remove('hiding');
        mainNav.classList.add('show');
        navToggle.classList.add('open');
      } else {
        // 关闭菜单，先加hiding动画
        mainNav.classList.remove('show');
        mainNav.classList.add('hiding');
        navToggle.classList.remove('open');
        setTimeout(() => {
          mainNav.classList.remove('hiding');
        }, 280); // 动画时长与CSS一致
      }
    });
  }

  // Accordion: 使用 max-height 动画
  document.querySelectorAll('.accordion-btn').forEach(btn => {
    const panel = btn.nextElementSibling;
    // 初始化展开项
    if (btn.getAttribute('aria-expanded') === 'true') {
      btn.parentElement.classList.add('open');
      if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
    }

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      const item = btn.parentElement;
      item.classList.toggle('open');
      if (panel) {
        if (!expanded) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
          panel.style.maxHeight = 0;
        }
      }
    });
  });

  // Scroll reveal for cards using IntersectionObserver
  const cards = document.querySelectorAll('.card');
  if ('IntersectionObserver' in window && cards.length) {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.18});

    cards.forEach(c => obs.observe(c));
  } else {
    // fallback: show all
    cards.forEach(c => c.classList.add('in-view'));
  }

  // Hero overlay entry
  const heroOverlay = document.querySelector('.hero-overlay');
  if (heroOverlay) heroOverlay.classList.add('animate');
  
  // Lightbox for gallery images
  const galleryImages = document.querySelectorAll('.gallery img');
  if (galleryImages.length) {
    // create lightbox element
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = '<div class="inner"><img src="" alt=""><div class="caption"></div></div>';
    document.body.appendChild(lightbox);
    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('.caption');

    galleryImages.forEach(img => {
      img.addEventListener('click', () => {
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lbCaption.textContent = img.nextElementSibling ? img.nextElementSibling.textContent : '';
        lightbox.classList.add('show');
      });
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === lbImg) {
        lightbox.classList.remove('show');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('show');
    });
  }

  // Locations block: buttons show panels
  const locationButtons = document.querySelectorAll('.location-btn');
  if (locationButtons.length) {
    locationButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (!target) return;
        // deactivate others
        locationButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // show target panel
        document.querySelectorAll('.loc-panel').forEach(panel => {
          if (panel.id === target) panel.style.display = 'block';
          else panel.style.display = 'none';
        });
      });
    });
    // set default active
    const first = locationButtons[0];
    if (first) first.click();
  }

  // 夜间模式切换
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.querySelector('.theme-icon');
  const htmlElement = document.documentElement;
  // 初始化夜间模式状态
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    htmlElement.classList.add('dark-mode');
    if (themeIcon) themeIcon.textContent = '☀️';
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      htmlElement.classList.toggle('dark-mode');
      const isNowDark = htmlElement.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isNowDark);
      if (themeIcon) themeIcon.textContent = isNowDark ? '☀️' : '🌙';
    });
  }

  // 移动端夜间模式按钮
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  if (themeToggleMobile) {
    themeToggleMobile.addEventListener('click', () => {
      htmlElement.classList.toggle('dark-mode');
      const isNowDark = htmlElement.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isNowDark);
      const icon = themeToggleMobile.querySelector('.theme-icon');
      if (icon) icon.textContent = isNowDark ? '☀️' : '🌙';
      if (themeIcon) themeIcon.textContent = isNowDark ? '☀️' : '🌙';
    });
    // 初始化移动端按钮图标
    if (isDarkMode) {
      const icon = themeToggleMobile.querySelector('.theme-icon');
      if (icon) icon.textContent = '☀️';
    }
  }
});
