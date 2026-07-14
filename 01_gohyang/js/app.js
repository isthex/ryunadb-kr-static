// 고향사랑기부제 세액공제 계산기 (2026 기준)
// 세액공제 3구간: 10만↓ 100% · 10만~20만 44% · 20만 초과 16.5%(일반)/33%(특별재난)
// 답례품: 기부액의 30%
const GIFT_RATE = 0.30;
const fmt = n => new Intl.NumberFormat('ko-KR').format(Math.round(n));

let hiRate = 16.5, regionLabel = '일반 지자체';

function taxCredit(amount, hi) {
  const t1 = Math.min(amount, 100000) * 1.0;
  const t2 = Math.min(Math.max(amount - 100000, 0), 100000) * 0.44;
  const t3 = Math.max(amount - 200000, 0) * (hi / 100);
  return { t1, t2, t3, total: t1 + t2 + t3 };
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initSidebar === 'function') initSidebar({ relatedTools: ['eitc-grant', 'jongso-tax', '20_year-end-tax-preview'] });
  buildStdTable();
  document.getElementById('calc-form').addEventListener('submit', calc);
  document.getElementById('btn-share').addEventListener('click', handleShare);

  document.querySelectorAll('#region-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      hiRate = Number(chip.dataset.hi);
      regionLabel = chip.dataset.label;
      document.querySelectorAll('#region-chips .chip').forEach(c => c.classList.toggle('active', c === chip));
    });
  });

  const amount = document.getElementById('amount');
  amount.addEventListener('input', () => {
    const raw = amount.value.replace(/[^0-9]/g, '');
    amount.value = raw ? Number(raw).toLocaleString('ko-KR') : '';
  });
});

function buildStdTable() {
  const rows = [100000, 200000, 500000, 1000000];
  const tbody = document.getElementById('std-table-body');
  tbody.innerHTML = rows.map(a => {
    const tc = taxCredit(a, 16.5).total;
    const gift = a * GIFT_RATE;
    const benefit = tc + gift;
    const burden = a - benefit;
    const burdenTxt = burden <= 0 ? `<span style="color:#15803d">+${fmt(-burden)} 이득</span>` : `${fmt(burden)}`;
    return `<tr><td>${fmt(a)}</td><td>${fmt(tc)}</td><td>${fmt(gift)}</td><td>${fmt(benefit)}</td><td>${burdenTxt}</td></tr>`;
  }).join('');
}

function calc(e) {
  e.preventDefault();
  const result = document.getElementById('calc-result');
  const a = Number(document.getElementById('amount').value.replace(/[^0-9]/g, ''));

  if (!a) {
    result.className = 'check-result warn';
    result.innerHTML = '<h3>기부 금액을 입력해 주세요</h3><p>10만원이 세액공제 효율이 가장 높은 금액이에요.</p>';
    result.hidden = false;
    return;
  }
  if (a > 20000000) {
    result.className = 'check-result warn';
    result.innerHTML = '<h3>연간 한도는 2,000만원이에요</h3><p>고향사랑기부제 연간 기부 한도(2,000만원)를 넘었어요. 한도 내 금액으로 다시 입력해 주세요.</p>';
    result.hidden = false;
    return;
  }

  const tc = taxCredit(a, hiRate);
  const gift = Math.round(a * GIFT_RATE);
  const benefit = tc.total + gift;
  const burden = a - benefit;

  let creditRows = `<tr><td>10만원 이하</td><td>${fmt(Math.min(a, 100000))} × 100% = <strong>${fmt(tc.t1)}원</strong></td></tr>`;
  if (a > 100000) creditRows += `<tr><td>10만~20만원</td><td>${fmt(Math.min(a - 100000, 100000))} × 44% = <strong>${fmt(tc.t2)}원</strong></td></tr>`;
  if (a > 200000) creditRows += `<tr><td>20만원 초과</td><td>${fmt(a - 200000)} × ${hiRate}% = <strong>${fmt(tc.t3)}원</strong></td></tr>`;

  const burdenRow = burden <= 0
    ? `<tr class="total-row"><td>실질 결과</td><td><span style="color:#15803d">오히려 ${fmt(-burden)}원 이득 🎉</span></td></tr>`
    : `<tr class="total-row"><td>실부담금</td><td>${fmt(a)} − ${fmt(benefit)} = <strong>${fmt(burden)}원</strong></td></tr>`;

  result.className = 'check-result';
  result.innerHTML = `<h3>${regionLabel} · ${fmt(a)}원 기부 기준</h3>
    <div class="table-wrap"><table class="result-table">
      <thead><tr><th>항목</th><th>계산</th></tr></thead>
      <tbody>
        ${creditRows}
        <tr><td>세액공제 합계</td><td><strong>${fmt(tc.total)}원</strong></td></tr>
        <tr class="bonus-row"><td>답례품 (30%)</td><td>${fmt(a)} × 30% = <strong>${fmt(gift)}원</strong></td></tr>
        <tr><td>총 혜택</td><td>${fmt(tc.total)} + ${fmt(gift)} = <strong>${fmt(benefit)}원</strong></td></tr>
        ${burdenRow}
      </tbody>
    </table></div>
    <p class="calc-note">세액공제는 지방소득세 포함 기준이에요. 답례품은 지자체·품목에 따라 실제 가치가 다를 수 있어요.</p>
    <a class="result-link" href="https://ilovegohyang.go.kr/" target="_blank" rel="noopener">고향사랑e음에서 기부하고 답례품 고르기 →</a>`;
  result.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function handleShare() {
  const data = {
    title: '고향사랑기부제 세액공제 계산기 2026',
    text: '고향사랑기부제, 세액공제 + 답례품 30%로 얼마나 돌려받는지 바로 계산해 보세요.',
    url: 'https://gohyang.ryunadb.kr/',
  };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(data.url); showToast('링크가 복사되었습니다.'); }
  } catch (e) { if (e.name !== 'AbortError') showToast('주소창의 링크를 복사해 주세요.'); }
}

function showToast(msg) {
  const old = document.querySelector('.share-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'share-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 2200);
}
