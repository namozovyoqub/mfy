/**
 * GEMINI FLASH AI TAHLILI MODULI
 * Foydalanuvchi keyinchalik Gemini Flash API kalitini taqdim etadi
 * Hozircha tayyor shablon va infratuzilma bilan bo'sh turadi
 */

let geminiApiKey = localStorage.getItem('surxondaryo_gemini_api_key') || '';

function initAiModule() {
  renderAiStatus();
}

function renderAiStatus() {
  const container = document.getElementById('ai-container-content');
  if (!container) return;

  if (!geminiApiKey) {
    container.innerHTML = `
      <div class="ai-empty-state">
        <div class="ai-icon-large">✦</div>
        <h3>Gemini Flash AI Tahlili Tizimi</h3>
        <p class="ai-desc-text">
          Ushbu modul Google Gemini Flash sun'iy intellekti orqali Surxondaryo viloyati bo'yicha to'ldirilgan so'rovnomalar 
          va ijtimoiy-iqtisodiy ko'rsatkichlarni chuqur tahlil qiladi hamda har bir mahalla kesimida manzilli tavsiyalar ishlab chiqadi.
        </p>
        <div class="ai-notice-box">
          <div class="notice-title">Status: API Kalit kutilmoqda</div>
          <div class="notice-text">
            Hozircha Gemini Flash API kaliti kiritilmagan. API kalit kiritilgandan so‘ng ushbu modul avtomatik tarzda to‘liq faollashadi.
          </div>
        </div>
        <div class="ai-actions-row">
          <button class="btn btn-primary" onclick="openApiKeyModal()">
            <span>✦ Gemini Flash API Kalitini Kiritish</span>
          </button>
          <button class="btn btn-outline" onclick="showSampleAiReport()">
            <span>Namunaviy Tahlilni Ko‘rish</span>
          </button>
        </div>
      </div>
      <div id="ai-report-output" class="ai-report-box" style="display:none;"></div>
    `;
  } else {
    container.innerHTML = `
      <div class="ai-active-state">
        <div class="ai-active-header">
          <div>
            <h3>Gemini Flash AI Tahlilchi (Faol)</h3>
            <span class="badge badge-active">API Kalit Ulangan</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="openApiKeyModal()">Kalitni o‘zgartirish</button>
        </div>
        <p class="text-muted">So‘rovnomalar va 15 ta tuman bo‘yicha tezkor chuqur tahlilni boshlash uchun quyidagi tugmani bosing:</p>
        <div class="ai-actions-row">
          <button class="btn btn-primary" id="btn-run-ai" onclick="runGeminiFlashAnalysis()">
            <span>✦ Hozir Tahlil Qilish (Gemini Flash)</span>
          </button>
        </div>
        <div id="ai-report-output" class="ai-report-box" style="margin-top:16px;"></div>
      </div>
    `;
  }
}

function openApiKeyModal() {
  const modal = document.getElementById('gemini-key-modal');
  if (!modal) return;
  const input = document.getElementById('gemini-api-key-input');
  if (input) input.value = geminiApiKey;
  modal.classList.add('open');
}

function closeApiKeyModal() {
  const modal = document.getElementById('gemini-key-modal');
  if (modal) modal.classList.remove('open');
}

function saveApiKey(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('gemini-api-key-input');
  if (!input) return;
  const key = input.value.trim();
  geminiApiKey = key;
  localStorage.setItem('surxondaryo_gemini_api_key', key);
  closeApiKeyModal();
  renderAiStatus();
}

function showSampleAiReport() {
  const out = document.getElementById('ai-report-output');
  if (!out) return;
  out.style.display = 'block';
  out.innerHTML = `
    <div class="card">
      <div class="ai-badge">✦ NAMUNAVYY AI TAHLIL HISOBOTI</div>
      <h3>Surxondaryo Viloyati Xatlov Natijalari Bo‘yicha Boshlang‘ich Tahlil</h3>
      <div class="card-sub">Ushbu tahlil namunaviy shablon bo‘lib, Gemini Flash API ulanganda real vaqtda to‘liq hisoblanadi.</div>
      
      <div class="ai-block">
        <h4>1. Asosiy Xatarlar va E'tibor Qaratilishi Kerak Bo'lgan Sohalar</h4>
        <ul>
          <li><strong>Bandlik:</strong> Mehnatga layoqatli aholi orasida norasmiy va mavsumiy ishlaydiganlar ulushi yuqori. Ayniqsa chekka tumanlarda (Bandixon, Qiziriq, Oltinsoy) doimiy ish o'rinlari talab etiladi.</li>
          <li><strong>Infratuzilma:</strong> Ichimlik suvi ta'minoti va tabiiy gaz bosimi ayrim mahallalarda birinchi navbatda hal qilinishi kerak bo'lgan asosiy ehtiyoj sifatida qayd etilgan.</li>
          <li><strong>Kredit va Tadbirkorlik:</strong> So'rovnomada xonadonlarning 30% dan ortig'i ixcham issiqxona va chorvachilik uchun imtiyozli kredit paketlariga yuqori ehtiyoj bildirgan.</li>
        </ul>
      </div>

      <div class="ai-block">
        <h4>2. Tavsiya Etiladigan Manzilli Chora-Tadbirlar</h4>
        <ul>
          <li>«Hokim yordamchisi» orqali ishsiz fuqarolarga monomarkazlarda bepul kasb-hunar o'rgatish va asbob-uskuna subsidiyalari ajratish.</li>
          <li>«Inson» ijtimoiy markazlari bilan birgalikda og'ir toifadagi oilalarni dori-darmon va sanatoriya yo'llanmalari bilan ta'minlash.</li>
        </ul>
      </div>
    </div>
  `;
}

async function runGeminiFlashAnalysis() {
  if (!geminiApiKey) {
    openApiKeyModal();
    return;
  }

  const btn = document.getElementById('btn-run-ai');
  const out = document.getElementById('ai-report-output');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Tahlil qilinmoqda (Gemini Flash)...</span>';
  }
  if (out) {
    out.style.display = 'block';
    out.innerHTML = '<div class="text-center" style="padding:24px;">Sun\'iy intellekt ma\'lumotlarni tahlil qilmoqda, iltimos kuting...</div>';
  }

  try {
    const stats = calculateAggregatedData();
    const prompt = `Sen O'zbekiston, Surxondaryo viloyati bo'yicha yuqori malakali ijtimoiy-iqtisodiy tahlilchi va davlat maslahatchisisan.
Quyida Surxondaryo viloyati MFY pasport tizimi va 100 ta savollik xatlov so'rovnomalari statistikasi keltirilgan:
- Jami xonadonlar: ${stats.totalFamilies}
- Jami aholi: ${stats.totalPopulation}
- Ishsizlar soni: ${stats.ishsizlar}
- Rasmiy bandlar: ${stats.rasmiy}, Norasmiy bandlar: ${stats.norasmiy}
- Ijtimoiy reyestrdagi oilalar: ${stats.ijtimoiyReyestr}
- Yangi kreditga ehtiyoj bildirganlar: ${stats.kreditEhtiyoj}
- Kommunal ta'minot: Gaz ${stats.gazPct}%, Elektr ${stats.elektrPct}%, Suv ${stats.suvPct}%

Iltimos, ushbu ma'lumotlar asosida:
1. Ijtimoiy-iqtisodiy holat bo'yicha asosiy xulosalar;
2. Qaysi yo'nalishlarga zudlik bilan mablag' va e'tibor qaratish kerakligi;
3. Mahalla mas'ullari (MFY raisi, hokim yordamchisi, yoshlar yetakchisi) uchun 3 ta aniq amaliy tavsiya taqdim et.
Javobni o'zbek tilida, professional davlat tahliliy tili va formatida tuz.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!res.ok) {
      throw new Error(`API javob bermadi (status: ${res.status})`);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "Tahlil natijasi bo'sh.";

    out.innerHTML = `
      <div class="card">
        <div class="ai-badge">✦ GEMINI FLASH JONLI TAHLILI</div>
        <h3>Surxondaryo Viloyati Bo'yicha Sun'iy Intellekt Tahlil Xulosasi</h3>
        <div class="ai-content-markdown" style="line-height:1.7;white-space:pre-wrap;margin-top:12px;">${escapeHtml(text)}</div>
      </div>
    `;
  } catch (err) {
    out.innerHTML = `
      <div class="alert alert-danger" style="padding:16px;background:var(--danger-soft);color:var(--danger);border-radius:4px;">
        <strong>Xatolik yuz berdi:</strong> ${escapeHtml(err.message)}.<br>
        Iltimos, API kalit to'g'riligini tekshiring yoki keyinroq urinib ko'ring.
      </div>
    `;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>✦ Hozir Tahlil Qilish (Gemini Flash)</span>';
    }
  }
}
