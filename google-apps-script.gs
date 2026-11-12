/**
 * AND2BLE French Kissing 신청 폼 → Google 시트 저장용 Apps Script
 *
 * 저장 위치: 아래 SPREADSHEET_ID 시트의 '응답이 들어오는 것을 보는 탭' (gid=1002)
 *   - 기본 모집 페이지(ja.html / ko.html)와 TikTok / Instagram 모집 페이지(ja-tt, ko-tt, ja-ig, ko-ig)
 *     신청이 모두 이 한 탭에 들어온다.
 *   - A~J열: 신청 내용 (기존과 같음). K열 '선정여부' 등 직접 쓰는 칸은 건드리지 않는다.
 *   - 어느 페이지에서 신청했는지는 '신청 페이지' 제목이 붙은 칸에 기본 / 2차 모집 / TikTok / Instagram 으로 남긴다.
 *     (2차 모집 = ja-2.html / ko-2.html)
 *     그 칸이 없으면 제목 줄의 맨 오른쪽 빈 칸에 '신청 페이지' 제목을 만들어 쓴다.
 * (https://docs.google.com/spreadsheets/d/1T1i3U-lNK0yE0dv0L_adKKv5OOw5NY-BT8PGSDDyWYU/edit?gid=1002)
 *
 * 기존 Apps Script 를 그대로 쓰는 경우 (웹 앱 주소가 바뀌지 않음)
 * 1. 기존 Apps Script 편집기에서 내용을 이 코드로 통째로 바꾸고 저장한다.
 * 2. [배포] → [배포 관리] → 연필(수정) → 버전: [새 버전] → [배포]
 */

var SPREADSHEET_ID = '1T1i3U-lNK0yE0dv0L_adKKv5OOw5NY-BT8PGSDDyWYU';
var SHEET_GID = 1002; // 모든 신청이 들어올 탭 (주소의 gid 값)
var HEADERS = ['제출 시각', '언어', '이름', '이메일', '연락처', '참여 방식', 'TikTok', 'Instagram', '업로드 예정일', '기프트카드'];
var SOURCE_HEADER = '신청 페이지';
var SOURCE_LABEL = { main: '기본', main2: '2차 모집', tt: 'TikTok', ig: 'Instagram' };

// 탭은 gid 로 찾으므로 탭 이름을 바꿔도 된다.
function getTargetSheet_() {
  var sheets = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === SHEET_GID) return sheets[i];
  }
  throw new Error('gid ' + SHEET_GID + ' 탭을 찾을 수 없습니다.');
}

// '신청 페이지' 칸의 열 번호. 없으면 제목 줄 맨 오른쪽 다음 칸에 만든다.
function sourceColumn_(sh) {
  var lastCol = Math.max(sh.getLastColumn(), HEADERS.length);
  var head = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < head.length; i++) {
    if (String(head[i]).trim() === SOURCE_HEADER) return i + 1;
  }
  var col = lastCol + 1;
  sh.getRange(1, col).setValue(SOURCE_HEADER);
  return col;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = getTargetSheet_();
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sh.setFrozenRows(1);
    }
    var srcCol = sourceColumn_(sh);
    var row = sh.getLastRow() + 1;
    // A~J열만 채운다. (선정여부 등 다른 칸은 그대로 둔다)
    sh.getRange(row, 1, 1, HEADERS.length).setValues([[
      // 스크립트 시간대 설정과 상관없이 항상 한국 시간으로 기록한다.
      Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
      safe(d.lang),
      safe(d.name),
      safe(d.email),
      "'" + String(d.contact || ''), // 전화번호 앞자리 0 이 사라지지 않게 텍스트로 저장
      safe(d.platformLabel || d.platform),
      safe(d.tiktok),
      safe(d.instagram),
      safe(d.postDate),
      safe(d.giftCard)
    ]]);
    // '신청 페이지' 칸에 드롭다운이 걸려 있으면 목록에 없는 값은 거부될 수 있다.
    // 그래도 신청 내용(A~J열)은 이미 저장됐으니, 여기서 실패해도 신청은 성공으로 처리한다.
    try {
      sh.getRange(row, srcCol).setValue(SOURCE_LABEL[d.source] || '기본');
    } catch (labelErr) {
      console.warn('신청 페이지 칸 기록 실패: ' + labelErr);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 편집기에서 한 번 실행해 보면 권한 허용 + 탭 연결을 미리 확인할 수 있다.
function testTarget() {
  var sh = getTargetSheet_();
  Logger.log('모든 신청이 들어갈 탭: ' + sh.getName() + ' / 신청 페이지 칸: ' + sourceColumn_(sh) + '열');
}

// 수식으로 해석될 수 있는 값(=, +, -, @ 로 시작)은 텍스트로 저장한다.
function safe(v) {
  v = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
