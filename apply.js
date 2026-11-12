(function () {
  // Google Apps Script 웹앱 URL (google-apps-script.gs 를 배포한 뒤 발급되는 ".../exec" 링크)
  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTqppyZh_NuLk32pw5cOcv91kg2yIs7IPtyFHzWznhjDYTYBXPn5F-ICmA_A6OATIj/exec';

  // 모집 마감 스위치: true = 신청 폼을 회색으로 막고 마감 안내를 띄운다. 다시 열려면 false 로 바꾼다.
  var CLOSED = true;
  // 마감 중에도 신청을 받는 페이지 (폼의 data-source 값). main = 기본 모집(ja.html / ko.html), main2 = 2차 모집(ja-2.html / ko-2.html)
  var OPEN_SOURCES = [];

  var form = document.getElementById('applyForm');
  if (!form) return;
  var lang = document.documentElement.lang === 'ko' ? 'ko' : 'ja';
  var source = form.getAttribute('data-source') || 'main';

  if (CLOSED && OPEN_SOURCES.indexOf(source) === -1) {
    var sec = document.getElementById('apply');
    var C = {
      ja: { t: '募集は締め切りました', p: 'たくさんのお申し込みをありがとうございます。<br>予定人数に達したため、現在お申し込みの受付を一時停止しています。' },
      ko: { t: '모집이 마감되었어요', p: '많은 성원에 감사드립니다.<br>모집 인원이 다 차서 지금은 신청 접수를 잠시 멈췄어요.' }
    }[lang];
    sec.classList.add('is-closed');
    var note = document.createElement('div');
    note.className = 'closed-note';
    note.innerHTML = '<span class="closed-tag">CLOSED</span><b>' + C.t + '</b><p>' + C.p + '</p>';
    var stepper = sec.querySelector('.stepper');
    sec.insertBefore(note, stepper || form);
    form.querySelectorAll('input, button, select, textarea').forEach(function (el) { el.disabled = true; el.tabIndex = -1; });
    form.setAttribute('aria-disabled', 'true');
    form.addEventListener('submit', function (e) { e.preventDefault(); e.stopImmediatePropagation(); }, true);
    form.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); }, true);
    document.querySelectorAll('a.cta[href="#apply"]').forEach(function (a) { a.classList.add('is-closed'); });
    return;
  }

  var T = {
    ja: {
      name: 'お名前（活動名）を入力してください',
      emailEmpty: 'メールアドレスを入力してください',
      email: 'メールアドレスの形式が正しくありません（例：name@example.com）',
      contact: '電話番号または LINE ID を入力してください',
      platform: '参加方法を選んでください',
      ttEmpty: 'TikTok の ID を入力してください',
      tt: 'TikTok の ID を確認してください（英数字・「.」「_」のみ　例：@your_id）',
      igEmpty: 'Instagram の ID を入力してください',
      ig: 'Instagram の ID を確認してください（英数字・「.」「_」のみ　例：@your_id）',
      date: '投稿予定日を選んでください',
      gift: '受け取るギフトカードを選んでください',
      agree: '注意事項の確認・同意が必要です',
      willSave: 'このリンクで登録されます：',
      notReady: '現在、お申し込み受付の準備中です。しばらくしてからもう一度お試しください。',
      fail: '送信できませんでした。通信環境を確認して、もう一度お試しください。',
      sending: '送信中…',
      platforms: { tiktok: 'TikTok のみ', instagram: 'Instagram のみ', both: 'TikTok + Instagram（ミラーリング）' },
      rows: { name: 'お名前', email: 'メール', contact: '連絡先', platform: '参加方法', tiktok: 'TikTok', instagram: 'Instagram', date: '投稿予定日', gift: 'ギフトカード' },
      gifts: { 'Apple': 'Apple', 'Google Play': 'Google Play', 'Rakuten': '楽天' }
    },
    ko: {
      name: '이름(활동명)을 입력해 주세요',
      emailEmpty: '이메일 주소를 입력해 주세요',
      email: '이메일 주소 형식이 올바르지 않아요 (예: name@example.com)',
      contact: '전화번호 또는 LINE ID를 입력해 주세요',
      platform: '참여 방식을 선택해 주세요',
      ttEmpty: 'TikTok 아이디를 입력해 주세요',
      tt: 'TikTok 아이디를 확인해 주세요 (영문·숫자·「.」「_」만 가능, 예: @your_id)',
      igEmpty: 'Instagram 아이디를 입력해 주세요',
      ig: 'Instagram 아이디를 확인해 주세요 (영문·숫자·「.」「_」만 가능, 예: @your_id)',
      date: '업로드 예정일을 선택해 주세요',
      gift: '정산받을 기프트카드를 선택해 주세요',
      agree: '유의사항 확인 및 동의가 필요해요',
      willSave: '이 링크로 등록돼요: ',
      notReady: '현재 신청 접수를 준비 중이에요. 잠시 후 다시 시도해 주세요.',
      fail: '제출하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
      sending: '제출 중…',
      platforms: { tiktok: 'TikTok만 참여', instagram: 'Instagram만 참여', both: 'TikTok + Instagram 동시 참여 (미러링)' },
      rows: { name: '이름', email: '이메일', contact: '연락처', platform: '참여 방식', tiktok: 'TikTok', instagram: 'Instagram', date: '업로드 예정일', gift: '기프트카드' },
      gifts: { 'Apple': 'Apple', 'Google Play': 'Google Play', 'Rakuten': '라쿠텐' }
    }
  }[lang];

  var steps = form.querySelectorAll('.fstep');
  var dots = document.querySelectorAll('.stepper li');
  var cur = 0;

  /* ---------- helpers ---------- */
  function field(name) { return form.elements[name]; }
  function errEl(name) { return form.querySelector('[data-err="' + name + '"]'); }
  function setErr(name, msg) {
    var e = errEl(name);
    var wrap = e && e.closest('.field');
    if (e) e.textContent = msg || '';
    if (wrap) wrap.classList.toggle('bad', !!msg);
    return !msg;
  }

  var EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
  var IG_RESERVED = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv'];

  // 아이디(@id)만 넣어도 프로필 링크로 바꿔 준다. 형식이 틀리면 null.
  function normTikTok(raw) {
    var v = (raw || '').trim();
    if (!v) return '';
    var m = v.match(/^@?([A-Za-z0-9._]{2,24})$/);
    if (m) return 'https://www.tiktok.com/@' + m[1];
    m = v.replace(/^https?:\/\//i, '').match(/^(?:www\.|m\.)?tiktok\.com\/@([A-Za-z0-9._]{2,24})\/?(?:[?#].*)?$/i);
    return m ? 'https://www.tiktok.com/@' + m[1] : null;
  }
  function normInstagram(raw) {
    var v = (raw || '').trim();
    if (!v) return '';
    var id;
    var m = v.match(/^@?([A-Za-z0-9._]{1,30})$/);
    if (m) id = m[1];
    else {
      m = v.replace(/^https?:\/\//i, '').match(/^(?:www\.|m\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i);
      if (m) id = m[1];
    }
    if (!id || IG_RESERVED.indexOf(id.toLowerCase()) !== -1) return null;
    return 'https://www.instagram.com/' + id + '/';
  }

  function platform() { var r = form.querySelector('input[name=platform]:checked'); return r ? r.value : ''; }
  function needTT() { return platform() === 'tiktok' || platform() === 'both'; }
  function needIG() { return platform() === 'instagram' || platform() === 'both'; }

  /* ---------- validators ---------- */
  var V = {
    name: function () { return setErr('name', field('name').value.trim() ? '' : T.name); },
    email: function () {
      var v = field('email').value.trim();
      return setErr('email', !v ? T.emailEmpty : (EMAIL_RE.test(v) ? '' : T.email));
    },
    contact: function () { return setErr('contact', ''); }, // 선택 항목: 비워도 통과
    platform: function () { return setErr('platform', platform() ? '' : T.platform); },
    tiktok: function () {
      if (!needTT()) return setErr('tiktok', '');
      var raw = field('tiktok').value, n = normTikTok(raw);
      preview('tiktok', n);
      return setErr('tiktok', !raw.trim() ? T.ttEmpty : (n ? '' : T.tt));
    },
    instagram: function () {
      if (!needIG()) return setErr('instagram', '');
      var raw = field('instagram').value, n = normInstagram(raw);
      preview('instagram', n);
      return setErr('instagram', !raw.trim() ? T.igEmpty : (n ? '' : T.ig));
    },
    date: function () { return setErr('date', form.querySelector('input[name=date]:checked') ? '' : T.date); },
    gift: function () { return setErr('gift', form.querySelector('input[name=gift]:checked') ? '' : T.gift); },
    agree: function () { return setErr('agree', field('agree').checked ? '' : T.agree); }
  };
  var STEP_FIELDS = [['name', 'email', 'contact'], ['platform', 'tiktok', 'instagram'], ['date', 'gift', 'agree']];

  function preview(name, n) {
    var p = form.querySelector('[data-preview="' + name + '"]');
    if (!p) return;
    var raw = field(name).value.trim();
    p.textContent = n && n !== raw ? T.willSave + n : '';
  }

  function validateStep(i) {
    var ok = true, first = null;
    STEP_FIELDS[i].forEach(function (k) {
      if (!V[k]()) { ok = false; if (!first) first = k; }
    });
    if (first) {
      var el = field(first);
      if (el && el.length && !el.tagName) el = el[0];
      var wrap = errEl(first).closest('.field');
      (wrap || el).scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el && el.focus && el.type !== 'radio') el.focus({ preventScroll: true });
    }
    return ok;
  }

  // 한 번 에러가 난 칸은 입력할 때마다 다시 검사해서 바로 에러를 지운다.
  form.addEventListener('input', function (e) {
    var n = e.target.name;
    if (n === 'tiktok' || n === 'instagram') { V[n](); return; }
    if (V[n] && errEl(n) && errEl(n).textContent) V[n]();
  });
  form.addEventListener('change', function (e) {
    var n = e.target.name;
    if (n === 'platform') { syncPlatform(); V.platform(); }
    if (n === 'date') V.date();
    if (n === 'gift') V.gift();
    if (n === 'agree') V.agree();
  });
  form.addEventListener('focusout', function (e) {
    var n = e.target.name;
    if (['name', 'email', 'contact', 'tiktok', 'instagram'].indexOf(n) !== -1 && e.target.value.trim()) V[n]();
  });

  function syncPlatform() {
    form.querySelector('[data-acc="tiktok"]').hidden = !needTT();
    form.querySelector('[data-acc="instagram"]').hidden = !needIG();
    var bn = form.querySelector('[data-both-note]');
    if (bn) bn.hidden = platform() !== 'both';
    if (!needTT()) setErr('tiktok', '');
    if (!needIG()) setErr('instagram', '');
  }

  /* ---------- steps ---------- */
  function show(i) {
    cur = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); d.classList.toggle('done', k < i); });
    if (i === 2) fillSummary();
    document.getElementById('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) { if (validateStep(cur)) show(cur + 1); }
    if (e.target.closest('[data-prev]')) show(cur - 1);
  });

  function data() {
    var d = form.querySelector('input[name=date]:checked');
    return {
      lang: lang,
      // 어느 모집 페이지에서 왔는지: main(기본) / tt(TikTok 전용) / ig(Instagram 전용) → 시트 탭을 나눈다
      source: form.getAttribute('data-source') || 'main',
      name: field('name').value.trim(),
      email: field('email').value.trim(),
      contact: field('contact').value.trim(),
      platform: platform(),
      platformLabel: T.platforms[platform()] || '',
      tiktok: needTT() ? normTikTok(field('tiktok').value) : '',
      instagram: needIG() ? normInstagram(field('instagram').value) : '',
      postDate: d ? d.value : '',
      giftCard: (form.querySelector('input[name=gift]:checked') || {}).value || ''
    };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fillSummary() {
    var d = data(), r = T.rows;
    var rows = [[r.name, d.name], [r.email, d.email]];
    if (d.contact) rows.push([r.contact, d.contact]);
    rows.push([r.platform, d.platformLabel]);
    if (d.tiktok) rows.push([r.tiktok, d.tiktok]);
    if (d.instagram) rows.push([r.instagram, d.instagram]);
    form.querySelector('.confirm').innerHTML = rows.map(function (x) {
      return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>';
    }).join('');
  }

  /* ---------- submit ---------- */
  var sending = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    for (var i = 0; i < 3; i++) {
      if (!validateStep(i)) { if (i !== cur) show(i); return; }
    }
    var btn = form.querySelector('button[type=submit]');
    var label = btn.textContent;
    var box = form.querySelector('.form-error');
    box.hidden = true;
    if (!GOOGLE_SCRIPT_URL) { box.textContent = T.notReady; box.hidden = false; return; }

    sending = true; btn.disabled = true; btn.textContent = T.sending;
    var payload = data();
    payload.submittedAt = new Date().toISOString();
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function () {
      form.hidden = true;
      document.querySelector('.stepper').hidden = true;
      var done = document.querySelector('.apply-done');
      done.hidden = false;
      document.getElementById('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function () {
      box.textContent = T.fail; box.hidden = false;
      sending = false; btn.disabled = false; btn.textContent = label;
    });
  });

  syncPlatform();
})();
