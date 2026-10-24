// 共通 UI: ナビゲーション / アコーディオン / ライトボックス / 夜間モード
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

      // 準備中など、再生させないカードはモーダルも開かない
      if (figure && figure.classList.contains('is-unavailable')) return;

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
