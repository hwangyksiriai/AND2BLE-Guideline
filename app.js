(function () {
  var lang = document.documentElement.lang === 'ko' ? 'ko' : 'ja';

  var T = {
    ja: {
      copied: 'コピーしました！',
      copiedAll: 'ハッシュタグ3つをコピーしました！',
      copyFail: 'コピーできませんでした。長押しでコピーしてください',
      before: function (d) { return '投稿開始まであと ' + d + ' 日'; },
      startsToday: '本日から投稿スタート！',
      during: function (d) { return d === 0 ? '本日が投稿最終日です！' : '投稿期間中・締切まであと ' + d + ' 日'; },
      ended: '投稿期間は終了しました',
      okTitle: '認定例', ngTitle: '非認定例',
      open: '原本リンクを開く ↗',
      progress: function (a, b) { return a === b ? '準備OK！投稿しましょう 🎉' : a + ' / ' + b + ' 完了'; }
    },
    ko: {
      copied: '복사했어요!',
      copiedAll: '해시태그 3개를 복사했어요!',
      copyFail: '복사하지 못했어요. 길게 눌러서 복사해 주세요',
      before: function (d) { return '업로드 시작까지 ' + d + '일'; },
      startsToday: '오늘부터 업로드 시작!',
      during: function (d) { return d === 0 ? '오늘이 업로드 마지막 날이에요!' : '업로드 기간 · 마감까지 ' + d + '일'; },
      ended: '업로드 기간이 끝났어요',
      okTitle: '인정 예시', ngTitle: '미인정 예시',
      open: '원본 링크 열기 ↗',
      progress: function (a, b) { return a === b ? '준비 완료! 업로드해 주세요 🎉' : a + ' / ' + b + ' 완료'; }
    }
  }[lang];

  /* ---------- toast ---------- */
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  var toastTimer;
  function showToast(msg, bad) {
    toast.textContent = msg;
    toast.style.background = bad ? 'var(--ng)' : '';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }

  /* ---------- copy ---------- */
  function copyText(text, msg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      showToast(ok ? msg : T.copyFail, !ok);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { showToast(msg); }, fallback);
    } else { fallback(); }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-copy]');
    if (!el) return;
    copyText(el.getAttribute('data-copy'), el.hasAttribute('data-copy-all') ? T.copiedAll : T.copied);
  });

  /* ---------- status (JST) ---------- */
  var status = document.querySelector('.status');
  if (status) {
    var DAY = 86400000;
    var start = Date.UTC(2026, 10, 8, 15, 0, 0);   // 2026-11-09 00:00 JST
    var end = Date.UTC(2026, 10, 18, 15, 0, 0);    // 2026-11-19 00:00 JST
    var now = Date.now();
    var todayJst = Math.floor((now + 9 * 3600000) / DAY);
    var label, cls;
    if (now < start) {
      var d = Math.floor((start + 9 * 3600000) / DAY) - todayJst;
      label = d <= 0 ? T.startsToday : T.before(d); cls = 'before';
    } else if (now < end) {
      label = T.during(Math.floor((end + 9 * 3600000) / DAY) - 1 - todayJst); cls = 'during';
    } else { label = T.ended; cls = 'ended'; }
    status.classList.add(cls);
    status.querySelector('.txt').textContent = label;
  }

  /* ---------- tabs ---------- */
  document.querySelectorAll('.tabs').forEach(function (tabs) {
    var btns = tabs.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) {
          var on = x === b;
          x.setAttribute('aria-selected', on);
          document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
        });
      });
    });
  });

  /* ---------- checklist ---------- */
  var list = document.querySelector('.checklist');
  if (list) {
    var boxes = list.querySelectorAll('input[type=checkbox]');
    var prog = document.querySelector('.progress');
    // 화면에 보이는 항목만 센다 (플랫폼 선택으로 숨겨진 항목 제외)
    function upd() {
      var shown = [], n = 0;
      boxes.forEach(function (b) { if (b.closest('li').offsetParent !== null) shown.push(b); });
      shown.forEach(function (b) { if (b.checked) n++; });
      var total = shown.length || 1;
      prog.querySelector('.track i').style.width = (n / total * 100) + '%';
      prog.querySelector('.txt').textContent = T.progress(n, shown.length);
      prog.classList.toggle('done', shown.length > 0 && n === shown.length);
    }
    boxes.forEach(function (b) { b.addEventListener('change', upd); });
    document.addEventListener('platchange', upd);
    upd();
  }

  /* ---------- mirroring examples (accordion, lazy iframes) ---------- */
  var EX = {
    ok: [
      { who: '@rhythmyolo', tt: 'https://www.tiktok.com/@rhythmyolo/video/7585450544035056904', ig: 'DSc4W_YgSld' },
      { who: '@ryunosuke.000523', tt: 'https://www.tiktok.com/@ryunosuke.000523/video/7585368004892855559', ig: 'DSbP968j5NG' },
      { who: '@ssayah03', tt: 'https://www.tiktok.com/@ssayah03/video/7584784383089954055', ig: 'DSXMj9RkoBT' }
    ],
    ng: [
      { who: '@yki0308', tt: 'https://www.tiktok.com/@yki0308/video/7582954812061289749', ig: 'DSKfS_AgVuR' },
      { who: '@micchory__', tt: 'https://www.tiktok.com/@micchory__/video/7582896895983586568', ig: 'DSMK2LOk0P6' },
      { who: '@kazumi___', tt: 'https://www.tiktok.com/@kazumi___/video/7583683667055234322', ig: 'DSPiGHTk9gU' }
    ]
  };
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // 왼쪽 = 인정 예시, 오른쪽 = 미인정 예시 버튼. 누르면 아래 뷰어에 TikTok · Instagram 을 나란히 띄운다.
  document.querySelectorAll('[data-examples]').forEach(function (box) {
    var kind = box.getAttribute('data-examples');
    var title = kind === 'ok' ? T.okTitle : T.ngTitle;
    box.innerHTML = EX[kind].map(function (x, i) {
      return '<button type="button" class="ex-btn ' + kind + '" data-kind="' + kind + '" data-i="' + i + '" aria-pressed="false">' +
        '<span class="n">' + (i + 1) + '</span><span class="tx">' + title + ' ' + (i + 1) +
        '<small>' + esc(x.who) + '</small></span><span class="go">▶</span></button>';
    }).join('');
  });
  var viewer = document.querySelector('[data-viewer]');
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.ex-btn');
    if (!b || !viewer) return;
    var kind = b.getAttribute('data-kind'), i = +b.getAttribute('data-i'), x = EX[kind][i];
    var wasOn = b.getAttribute('aria-pressed') === 'true';
    document.querySelectorAll('.ex-btn').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
    if (wasOn) { viewer.hidden = true; viewer.innerHTML = ''; return; }
    b.setAttribute('aria-pressed', 'true');
    var id = x.tt.split('/video/')[1];
    var title = (kind === 'ok' ? T.okTitle : T.ngTitle) + ' ' + (i + 1);
    viewer.className = 'ex-viewer ' + kind;
    viewer.innerHTML =
      '<div class="ex-viewer-head"><span class="badge ' + kind + '">' + (kind === 'ok' ? '✓ OK' : '✕ NG') + '</span>' + title + ' <small>' + esc(x.who) + '</small></div>' +
      '<div class="ex-pair">' +
        '<div><div class="ex-plat">TikTok</div><div class="ex-frame tt"><iframe src="https://www.tiktok.com/player/v1/' + id + '?rel=0" title="TikTok ' + esc(x.who) + '" allow="fullscreen; encrypted-media" allowfullscreen></iframe></div>' +
        '<a class="ex-link" href="' + x.tt + '" target="_blank" rel="noopener">' + T.open + '</a></div>' +
        '<div><div class="ex-plat">Instagram</div><div class="ex-frame ig"><iframe src="https://www.instagram.com/reel/' + x.ig + '/embed" title="Instagram ' + esc(x.who) + '" allowfullscreen></iframe></div>' +
        '<a class="ex-link" href="https://www.instagram.com/reels/' + x.ig + '/" target="_blank" rel="noopener">' + T.open + '</a></div>' +
      '</div>';
    viewer.hidden = false;
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- language switch: keep the section the reader is on ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-lang]');
    if (!a || a.classList.contains('on')) return;
    var on = document.querySelector('.fnav a.on');
    var hash = on && window.scrollY > 300 ? on.getAttribute('href') : '';
    if (hash) { e.preventDefault(); location.href = a.getAttribute('href') + hash; }
  });

  /* ---------- floating nav: active section ---------- */
  var links = document.querySelectorAll('.fnav a');
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('on'); });
          var a = map[en.target.id]; if (a) a.classList.add('on');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }
})();
