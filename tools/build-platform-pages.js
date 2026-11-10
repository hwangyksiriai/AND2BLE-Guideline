// ja.html / ko.html(간단 가이드 + 신청 페이지)을 바탕으로 플랫폼 전용 페이지를 만든다.
//   ja-tt.html, ja-ig.html, ko-tt.html, ko-ig.html
// ja.html / ko.html 을 고친 뒤에는 이 스크립트를 다시 실행하면 전용 페이지도 같이 맞춰진다.
//   node tools/build-platform-pages.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const L = {
  ja: {
    name: { tt: 'TikTok', ig: 'Instagram' },
    title: p => `AND2BLE Dance Challenge｜${p}`,
    ogTitle: p => `AND2BLE『French Kissing』ダンスチャレンジ｜${p}`,
    ogDesc: p => `参加ガイド・投稿期間 11/9〜11/18・${p}`,
    where: { tt: 'TikTok', ig: 'Instagram リール' },
    reward: '¥5,000 相当',
    rewardLead: p => `${p} に投稿すると、下のリワードを受け取れます。`,
    only: p => `<b>${p} に投稿する方向けのページです</b>`,
    guideTitle: p => `${p} 詳細ガイドラインを見る`,
    guideSmall: '撮影・投稿方法・チェックリスト・FAQ',
    soundTitle: 'TikTok 公式音源を開く',
    soundSmall: 'この音源を使って投稿してください'
  },
  ko: {
    name: { tt: 'TikTok', ig: 'Instagram' },
    title: p => `AND2BLE Dance Challenge | ${p}`,
    ogTitle: p => `AND2BLE『French Kissing』댄스 챌린지 | ${p}`,
    ogDesc: p => `참여 가이드 · 업로드 기간 11/9 ~ 11/18 · ${p}`,
    where: { tt: 'TikTok', ig: 'Instagram 릴스' },
    reward: '¥5,000 상당',
    rewardLead: p => `${p}에 업로드하면 아래 리워드를 받을 수 있어요.`,
    only: p => `<b>${p}에 올리는 분을 위한 페이지예요</b>`,
    guideTitle: p => `${p} 상세 가이드라인 보기`,
    guideSmall: '촬영 · 업로드 방법 · 체크리스트 · FAQ',
    soundTitle: 'TikTok 공식 음원 열기',
    soundSmall: '이 음원으로 업로드해 주세요'
  }
};

const VAL = { tt: 'tiktok', ig: 'instagram' };
const SOUND_TT = 'https://www.tiktok.com/music/French-Kissing-7694241938173904902';

for (const lang of ['ja', 'ko']) {
  const src = fs.readFileSync(path.join(root, `${lang}.html`), 'utf8').split('\r\n').join('\n');
  const t = L[lang];
  for (const plat of ['tt', 'ig']) {
    const p = t.name[plat];
    let s = src;
    const rep = (re, to, what) => {
      if (!re.test(s)) throw new Error(`${lang}-${plat}: not found: ${what}`);
      s = s.replace(re, to);
    };

    // head
    rep(/<title>[^<]*<\/title>/, `<title>${t.title(p)}</title>`, 'title');
    rep(/(<meta property="og:title" content=")[^"]*/, `$1${t.ogTitle(p)}`, 'og:title');
    rep(/(<meta property="og:description" content=")[^"]*/, `$1${t.ogDesc(p)}`, 'og:description');
    rep(/(<meta property="og:url" content="[^"]*\/)(ja|ko)\.html/, `$1$2-${plat}.html`, 'og:url');
    rep(/<link rel="stylesheet" href="guide\.css\?v=[^"]*">/, '<link rel="stylesheet" href="guide.css?v=20261109c">', 'guide.css');

    // 언어 전환은 같은 플랫폼 페이지로
    rep(/href="ja\.html" data-lang/, `href="ja-${plat}.html" data-lang`, 'lang ja');
    rep(/href="ko\.html" data-lang/, `href="ko-${plat}.html" data-lang`, 'lang ko');

    // 히어로 아래: 어떤 플랫폼용 페이지인지 표시
    rep(/(<\/header>\n)/, `$1\n    <p class="plat-only ${plat}">${t.only(p)}</p>\n`, 'hero end');

    // 요약: 플랫폼 / 리워드
    let row = 0;
    rep(/<div class="sum-row"><dt>([^<]*)<\/dt><dd>[\s\S]*?<\/dd><\/div>/g, (m, dt) => {
      row++;
      if (row === 2) return `<div class="sum-row"><dt>${dt}</dt><dd>${t.where[plat]}</dd></div>`;
      if (row === 3) return `<div class="sum-row"><dt>${dt}</dt><dd>${t.reward}</dd></div>`;
      return m;
    }, 'summary rows');


    // 상세 가이드 링크 → 같은 플랫폼 전용 상세 가이드
    // Instagram 은 별도 사이트(and2ble-instagram-guide)의 가이드를 쓴다.
    const guideHref = plat === 'ig'
      ? `https://and2ble-instagram-guide.vercel.app/?lang=${lang}`
      : `guide-${plat}-${lang}.html`;
    // 기본 페이지의 음원 링크 두 개(guide-links)를 이 플랫폼용 링크 하나로 바꾼다.
    rep(/    <div class="guide-links">\n[\s\S]*?\n    <\/div>\n/,
      `    <a class="guide-link" href="${guideHref}"${plat === 'ig' ? ' target="_blank" rel="noopener"' : ''}><span class="tx"><b>${t.guideTitle(p)}</b><small>${t.guideSmall}</small></span><span class="go">${plat === 'ig' ? '↗' : '→'}</span></a>\n`, 'guide link');

    // TikTok 전용: 안무 섹션에 공식 음원 링크
    if (plat === 'tt') {
      rep(/(<section class="card" id="dance">[\s\S]*?<p class="lead">[\s\S]*?<\/p>\n)/,
        `$1    <a class="guide-link" href="${SOUND_TT}" target="_blank" rel="noopener"><span class="tx"><b>${t.soundTitle}</b><small>${t.soundSmall}</small></span><span class="go">↗</span></a>\n`, 'tiktok sound');
    }

    // 리워드: 해당 플랫폼 한 줄만
    rep(/(<section class="card" id="reward">[\s\S]*?<p class="lead">)[^<]*(<\/p>)/, `$1${t.rewardLead(p)}$2`, 'reward lead');
    rep(/<div class="reward-list">[\s\S]*?<span class="red-note">[\s\S]*?<\/span>\n    <\/div>/, m => {
      const rows = m.match(/      <div class="reward[^"]*">[\s\S]*?\n      <\/div>/g);
      const keep = rows[plat === 'tt' ? 0 : 1].replace(/<span class="n">\d<\/span>/, '<span class="n">✓</span>');
      return `<div class="reward-list">\n${keep}\n    </div>`;
    }, 'reward list');

    // 미러링 안내 섹션은 전용 페이지에도 그대로 둔다

    // 신청 폼: 시트에서 TikTok / Instagram 탭으로 나눠 저장되도록 출처 표시
    rep(/<form id="applyForm"/, `<form id="applyForm" data-source="${plat}"`, 'form source');

    // 신청 폼: 참여 방식은 이 플랫폼 하나로 고정
    rep(/            <label class="choice"><input type="radio" name="platform" value="(tiktok|instagram|both)">[\s\S]*?<\/label>\n/g, (m, v) => {
      if (v !== VAL[plat]) return '';
      return m.replace(`value="${v}">`, `value="${v}" checked>`);
    }, 'platform choices');
    rep(/          <div class="both-note" data-both-note hidden>[\s\S]*?<\/div>\n/, '', 'both note');

    // 동의 항목: 해시태그는 공통, Instagram 음원 항목은 Instagram만, 미러링 항목은 삭제
    rep(/(<label class="agree">[\s\S]*?<ul>\n)([\s\S]*?)(            <\/ul>)/, (m, a, items, z) => {
      const li = items.match(/              <li>[\s\S]*?<\/li>\n/g);
      const keep = plat === 'tt' ? [li[0]] : [li[0], li[1]];
      return a + keep.join('') + z;
    }, 'agree items');

    // 전용 페이지에서는 '~만 참여 / ~のみ' 대신 '~ 참여 / ~で参加'
    rep(new RegExp(p + ' ?(만 참여|のみ参加|のみ)<', 'g'), lang === 'ko' ? `${p} 참여<` : `${p} で参加<`, 'only label');

    fs.writeFileSync(path.join(root, `${lang}-${plat}.html`), s);
    console.log('wrote', `${lang}-${plat}.html`);
  }
}
