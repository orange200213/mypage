// 共通 UI: ナビゲーション / アコーディオン / ライトボックス / 夜間モード
// ページの読み込み中表示と、スクロールに合わせた表示アニメーション
(function () {
  const docRoot = document.documentElement;
  const REVEAL_TARGETS = [
    'main > section:not(.hero):not(.showcase-hero):not(.showcase-group)',
    '.showcase-group > h2',
    '.showcase-group > .showcase-group-desc',
    '.cards > .card',
    '.stats .stat',
    '.message-teaser',
    '.showcase-teaser-card',
    '.gallery.showcase-list > figure',
    '.media-group',
    '.news-item',
    '.access-inner',
    '.contact-cta-inner'
  ].join(', ');

  // 画面に入った要素を下からふわっと表示する
  const startReveal = () => {
    const targets = Array.from(document.querySelectorAll(REVEAL_TARGETS));
    if (!targets.length) return;

    targets.forEach(el => {
      el.classList.add('reveal');
      const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
      const index = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--reveal-delay', Math.min(index, 5) * 90 + 'ms');
    });

    docRoot.classList.add('anim-ready');

    const revealAll = () => targets.forEach(el => el.classList.add('is-revealed'));

    if (!('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    // 非表示の初期状態を 1 フレーム描画してから監視を始める（アニメーションを効かせるため）
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        targets.forEach(el => observer.observe(el));
      });
    });
  };

  const startedAt = Date.now();
  let loaderClosed = false;

  const hideLoader = () => {
    if (loaderClosed) return;
    loaderClosed = true;
    // 表示が一瞬で消えるとちらつくので、最低限の表示時間を確保する
    const wait = Math.max(0, 380 - (Date.now() - startedAt));
    window.setTimeout(() => {
      docRoot.classList.add('is-loaded');
      const loader = document.getElementById('page-loader');
      if (loader) {
        loader.setAttribute('aria-hidden', 'true');
        window.setTimeout(() => { loader.style.display = 'none'; }, 900);
      }
      window.setTimeout(startReveal, 260);
    }, wait);
  };

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
    // 読み込みが長引いた場合の保険
    window.setTimeout(hideLoader, 6000);
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  // 現在のページをナビゲーションで強調
  const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.main-nav a').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href && href === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // ハンバーガーメニュー（開閉状態は .show クラスのみで管理）
  if (navToggle && mainNav) {
    const isMenuOpen = () => mainNav.classList.contains('show');

    const setMenu = open => {
      mainNav.classList.toggle('show', open);
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };

    navToggle.addEventListener('click', () => {
      setMenu(!isMenuOpen());
    });

    mainNav.addEventListener('click', e => {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('click', e => {
      if (!isMenuOpen()) return;
      if (mainNav.contains(e.target) || navToggle.contains(e.target)) return;
      setMenu(false);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isMenuOpen()) setMenu(false);
    });

    // 画面が広がったらメニュー状態をリセット（閉じたまま固定されるのを防ぐ）
    const desktopQuery = window.matchMedia('(min-width: 721px)');
    const resetOnDesktop = event => { if (event.matches) setMenu(false); };
    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', resetOnDesktop);
    }
  }

  // アコーディオン
  document.querySelectorAll('.accordion-btn').forEach(btn => {
    const panel = btn.nextElementSibling;
    const item = btn.parentElement;
    if (btn.getAttribute('aria-expanded') === 'true') {
      item.classList.add('open');
      if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
    }

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      item.classList.toggle('open');
      if (panel) panel.style.maxHeight = expanded ? 0 : panel.scrollHeight + 'px';
    });
  });

  // ギャラリーのライトボックス
  const galleryImages = document.querySelectorAll('.gallery img');
  if (galleryImages.length) {
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

    lightbox.addEventListener('click', e => {
      if (e.target === lightbox || e.target === lbImg) lightbox.classList.remove('show');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') lightbox.classList.remove('show');
    });
  }

  // 会社イメージの映像：カードの再生ボタンから拡大プレーヤー（モーダル）を開く
  const galleryVideos = Array.from(document.querySelectorAll('.gallery video'));
  if (galleryVideos.length) {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="video-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">' +
        '<div class="video-modal-head">' +
          '<p class="video-modal-title" id="video-modal-title"></p>' +
          '<button type="button" class="video-modal-close" aria-label="プレーヤーを閉じる">×</button>' +
        '</div>' +
        '<video class="video-modal-player" playsinline controls loop preload="auto"></video>' +
      '</div>';
    document.body.appendChild(modal);

    const player = modal.querySelector('.video-modal-player');
    const title = modal.querySelector('.video-modal-title');
    const closeButton = modal.querySelector('.video-modal-close');
    let lastFocused = null;

    const isOpen = () => modal.classList.contains('show');

    const closeModal = () => {
      if (!isOpen()) return;
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('video-modal-open');
      // 閉じたら再生を止め、読み込み中の音声・映像を解放する
      player.pause();
      player.removeAttribute('src');
      player.muted = false;
      player.load();
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };

    const openModal = video => {
      const figure = video.closest('figure');
      const caption = figure ? figure.querySelector('figcaption') : null;
      const label = caption ? caption.textContent.trim() : '';
      title.textContent = label;
      title.hidden = !label;

      lastFocused = document.activeElement;
      player.poster = video.getAttribute('poster') || '';
      player.src = video.getAttribute('src');
      player.muted = false;

      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('video-modal-open');
      closeButton.focus();

      // クリック操作から開くので音ありで自動再生。止められたらミュートで再挑戦する
      const played = player.play();
      if (played && typeof played.catch === 'function') {
        played.catch(() => {
          player.muted = true;
          const retried = player.play();
          if (retried && typeof retried.catch === 'function') retried.catch(() => {});
        });
      }
    };

    galleryVideos.forEach(video => {
      const figure = video.closest('figure');
      const playButton = figure ? figure.querySelector('.video-play') : null;
      // no-JS でも再生できるよう HTML 側の controls を残し、ここで隠す（カード内では再生しない）
      video.controls = false;
      video.muted = true;

      const open = event => {
        if (event) event.preventDefault();
        openModal(video);
      };

      if (playButton) {
        playButton.setAttribute('aria-haspopup', 'dialog');
        playButton.addEventListener('click', open);
      }
      video.addEventListener('click', open);
    });

    closeButton.addEventListener('click', closeModal);

    // 背景（プレーヤーの外側）クリックで閉じる
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isOpen()) closeModal();
    });

    // 開いている間は Tab 移動をモーダル内に留める
    modal.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !isOpen()) return;
      const focusables = Array.from(modal.querySelectorAll('button, video, [href]'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  // ヒーローのスライドショー（縦長スマホのみ）
  // main-vi.jpg の角度違いカット＋新しい商品写真を、ゆっくり切り替える
  const hero = document.querySelector('.hero');
  const heroMedia = document.querySelector('.hero-media');
  const heroSlides = heroMedia
    ? Array.from(heroMedia.querySelectorAll('.hero-slide:not(.hero-slide-wide)'))
    : [];
  const heroDotBox = document.querySelector('.hero-dots');
  const heroProgress = document.querySelector('.hero-progress');

  if (heroSlides.length > 1 && heroDotBox) {
    const portraitQuery = window.matchMedia('(max-width: 720px) and (orientation: portrait)');
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const INTERVAL = 6500;
    let current = 0;
    let timer = null;
    let heroInView = true;

    if (hero) hero.style.setProperty('--hero-interval', INTERVAL + 'ms');

    // 枚数に合わせて切り替えボタンを作る
    const heroDots = heroSlides.map((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hero-dot' + (index === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', (index + 1) + '枚目の画像を表示');
      dot.setAttribute('aria-current', String(index === 0));
      heroDotBox.appendChild(dot);
      return dot;
    });

    // 次に見せる画像だけ先に読み込み、表示した瞬間に空にならないようにする
    const loadSlide = index => {
      const slide = heroSlides[(index + heroSlides.length) % heroSlides.length];
      const url = slide ? slide.getAttribute('data-bg') : '';
      if (!slide || !url || slide.dataset.loaded === '1') return;
      slide.dataset.loaded = '1';
      slide.style.backgroundImage = 'url("' + url + '")';
    };

    // 残り時間バーのアニメーションを最初からやり直す
    const restartProgress = running => {
      if (!heroProgress) return;
      heroProgress.classList.remove('is-running');
      if (!running) return;
      void heroProgress.offsetWidth;
      heroProgress.classList.add('is-running');
    };

    const paintSlide = index => {
      current = (index + heroSlides.length) % heroSlides.length;
      loadSlide(current);
      loadSlide(current + 1);
      heroSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
      heroDots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === current);
        dot.setAttribute('aria-current', String(i === current));
      });
      restartProgress(timer !== null);
    };

    const stopSlides = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const startSlides = () => {
      stopSlides();
      if (!portraitQuery.matches || reduceMotionQuery.matches || document.hidden || !heroInView) {
        restartProgress(false);
        return;
      }
      timer = window.setInterval(() => paintSlide(current + 1), INTERVAL);
      restartProgress(true);
    };

    heroMedia.classList.add('slides-ready');
    paintSlide(0);

    heroDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        paintSlide(index);
        startSlides();
      });
    });

    const onSlideshowChange = () => startSlides();
    if (typeof portraitQuery.addEventListener === 'function') {
      portraitQuery.addEventListener('change', onSlideshowChange);
    }
    if (typeof reduceMotionQuery.addEventListener === 'function') {
      reduceMotionQuery.addEventListener('change', onSlideshowChange);
    }
    document.addEventListener('visibilitychange', onSlideshowChange);

    // 画面外に出たら止めて、戻ってきたら再開する
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        heroInView = entries[0].isIntersecting;
        startSlides();
      }, { threshold: 0.15 }).observe(heroMedia);
    }

    startSlides();
  }

  // 拠点切り替え（必要なページのみ）
  const locationButtons = document.querySelectorAll('.location-btn');
  if (locationButtons.length) {
    locationButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (!target) return;
        locationButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.loc-panel').forEach(panel => {
          panel.style.display = panel.id === target ? 'block' : 'none';
        });
      });
    });
    locationButtons[0].click();
  }

  // 誤タップ防止：発信・メール作成の前に確認ダイアログを表示
  const confirmDialog = document.getElementById('contact-dialog');
  if (confirmDialog && typeof confirmDialog.showModal === 'function') {
    const confirmText = confirmDialog.querySelector('.confirm-dialog-text');
    const okButton = confirmDialog.querySelector('.confirm-ok');
    const cancelButton = confirmDialog.querySelector('.confirm-cancel');
    let pendingHref = '';

    document.querySelectorAll('.contact-link[data-confirm]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        pendingHref = link.getAttribute('href') || '';
        confirmText.textContent = link.dataset.confirm || '';
        okButton.textContent = link.dataset.action === 'mail' ? 'メールを作成する' : '発信する';
        confirmDialog.showModal();
      });
    });

    okButton.addEventListener('click', () => {
      confirmDialog.close();
      if (pendingHref) window.location.href = pendingHref;
      pendingHref = '';
    });

    cancelButton.addEventListener('click', () => {
      pendingHref = '';
      confirmDialog.close();
    });
  }

  // 夜間モード（OS 設定に自動追従 ＋ 手動切り替え）
  const root = document.documentElement;
  const toggles = document.querySelectorAll('.theme-toggle');
  const icons = document.querySelectorAll('.theme-icon');
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');

  const paintTheme = isDark => {
    root.classList.toggle('dark-mode', isDark);
    icons.forEach(icon => { icon.textContent = isDark ? '☀️' : '🌙'; });
    toggles.forEach(toggle => toggle.setAttribute('aria-pressed', String(isDark)));
  };

  const hasManualChoice = () => {
    try { return localStorage.getItem('darkMode') !== null; } catch (e) { return false; }
  };

  paintTheme(root.classList.contains('dark-mode'));

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const next = !root.classList.contains('dark-mode');
      paintTheme(next);
      try { localStorage.setItem('darkMode', String(next)); } catch (e) {}
    });
  });

  const onSchemeChange = event => {
    if (hasManualChoice()) return;
    paintTheme(event.matches);
  };

  if (typeof colorScheme.addEventListener === 'function') {
    colorScheme.addEventListener('change', onSchemeChange);
  } else if (typeof colorScheme.addListener === 'function') {
    colorScheme.addListener(onSchemeChange);
  }
});
