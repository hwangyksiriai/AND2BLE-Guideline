// ja.html / ko.html(기본 모집 페이지)을 그대로 복제해 2차 모집 페이지를 만든다.
//   ja-2.html, ko-2.html
// 내용은 기본 페이지와 같고, 신청 폼만 data-source="main2" 로 표시한다.
// apply.js 의 OPEN_SOURCES 에 'main2' 가 있으면 모집 마감 상태여도 이 페이지만 신청을 받는다.
// ja.html / ko.html 을 고친 뒤에는 이 스크립트를 다시 실행하면 2차 모집 페이지도 같이 맞춰진다.
//   node tools/build-round2-pages.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

for (const lang of ['ja', 'ko']) {
  let s = fs.readFileSync(path.join(root, `${lang}.html`), 'utf8');
  const rep = (re, to, what) => {
    if (!re.test(s)) throw new Error(`${lang}-2: not found: ${what}`);
    s = s.replace(re, to);
  };
  rep(/(<meta property="og:url" content="[^"]*\/)(ja|ko)\.html/, '$1$2-2.html', 'og:url');
  rep(/href="ja\.html" data-lang/, 'href="ja-2.html" data-lang', 'lang ja');
  rep(/href="ko\.html" data-lang/, 'href="ko-2.html" data-lang', 'lang ko');
  rep(/<form id="applyForm"/, '<form id="applyForm" data-source="main2"', 'form source');
  fs.writeFileSync(path.join(root, `${lang}-2.html`), s);
  console.log('wrote', `${lang}-2.html`);
}
