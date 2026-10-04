/**
 * 100 TA SAVOL SO'ROVNOMA YUBORISH VA BOSHQARISH MODULI
 * Aholining ijtimoiy-iqtisodiy holatini aniqlash bo'yicha xonadonbay xatlov so'rovnomasi
 */

let surveyCurrentSection = 0;
let surveyFormData = {};
let submittedSurveys = [];

function initSurveyModule() {
  loadSubmittedSurveys();
  loadSurveyDraft();
  renderSurveyNavigation();
  renderSurveySection(0);
  renderSubmittedSurveysTable();
  updateSurveyProgress();
}

function loadSubmittedSurveys() {
  try {
    const raw = localStorage.getItem('surxondaryo_submitted_surveys');
    submittedSurveys = raw ? JSON.parse(raw) : [];
  } catch (e) {
    submittedSurveys = [];
  }
}

function saveSubmittedSurveysToLocal() {
  localStorage.setItem('surxondaryo_submitted_surveys', JSON.stringify(submittedSurveys));
}

function loadSurveyDraft() {
  try {
    const raw = localStorage.getItem('surxondaryo_survey_draft');
    surveyFormData = raw ? JSON.parse(raw) : {};
  } catch (e) {
    surveyFormData = {};
  }
}

function saveSurveyDraft() {
  localStorage.setItem('surxondaryo_survey_draft', JSON.stringify(surveyFormData));
  updateSurveyProgress();
}

function clearSurveyDraft() {
  if (confirm("Haqiqatan ham kiritilgan so'rovnoma qoralamasini tozalashni xohlaysizmi?")) {
    surveyFormData = {};
    localStorage.removeItem('surxondaryo_survey_draft');
    renderSurveySection(surveyCurrentSection);
    updateSurveyProgress();
  }
}

function updateSurveyProgress() {
  let filledCount = 0;
  let totalCount = 100;

  // Count filled keys in surveyFormData
  Object.keys(surveyFormData).forEach(k => {
    const v = surveyFormData[k];
    if (v !== undefined && v !== null && String(v).trim() !== '' && v !== '0') {
      filledCount++;
    }
  });

  const pct = Math.min(100, Math.round((filledCount / totalCount) * 100));

  const barEl = document.getElementById('survey-progress-bar');
  const textEl = document.getElementById('survey-progress-text');
  const countEl = document.getElementById('survey-progress-count');

  if (barEl) barEl.style.width = `${pct}%`;
  if (textEl) textEl.textContent = `${pct}%`;
  if (countEl) countEl.textContent = `${filledCount} / 100 savol to‘ldirildi`;
}

function renderSurveyNavigation() {
  const container = document.getElementById('survey-sections-nav');
  if (!container) return;

  container.innerHTML = SURVEY_SCHEMA.map((sec, idx) => {
    return `
      <button type="button" class="survey-nav-btn ${idx === surveyCurrentSection ? 'active' : ''}" data-sec="${idx}" onclick="goToSurveySection(${idx})">
        <span class="sec-num">${idx + 1}</span>
        <span class="sec-title">${escapeHtml(sec.title.split('.')[1] || sec.title)}</span>
      </button>
    `;
  }).join('');
}

function goToSurveySection(idx) {
  if (idx < 0 || idx >= SURVEY_SCHEMA.length) return;
  surveyCurrentSection = idx;
  renderSurveyNavigation();
  renderSurveySection(idx);
  window.scrollTo({ top: document.getElementById('view-survey')?.offsetTop || 0, behavior: 'smooth' });
}

function nextSurveySection() {
  if (surveyCurrentSection < SURVEY_SCHEMA.length - 1) {
    goToSurveySection(surveyCurrentSection + 1);
  }
}

function prevSurveySection() {
  if (surveyCurrentSection > 0) {
    goToSurveySection(surveyCurrentSection - 1);
  }
}

function renderSurveySection(secIdx) {
  const container = document.getElementById('survey-form-content');
  if (!container) return;

  const section = SURVEY_SCHEMA[secIdx];
  if (!section) return;

  let html = `
    <div class="survey-section-header">
      <div class="sec-badge">BO‘LIM ${secIdx + 1} / ${SURVEY_SCHEMA.length}</div>
      <h3 class="sec-title-main">${escapeHtml(section.title)}</h3>
      <div class="sec-desc">Aholining ijtimoiy-iqtisodiy xatlov ma'lumotlarini to'liq va aniq kiriting.</div>
    </div>
    <div class="survey-fields-grid">
  `;

  section.questions.forEach(q => {
    html += renderQuestionField(q);
  });

  html += `</div>`;
  container.innerHTML = html;

  // Attach event listeners to all inputs in this section
  container.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('change', handleFieldChange);
    input.addEventListener('input', handleFieldChange);
  });

  // Update navigation buttons status (prev/next)
  const prevBtn = document.getElementById('survey-prev-btn');
  const nextBtn = document.getElementById('survey-next-btn');
  if (prevBtn) prevBtn.disabled = secIdx === 0;
  if (nextBtn) {
    if (secIdx === SURVEY_SCHEMA.length - 1) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'inline-flex';
    }
  }
}

function renderQuestionField(q) {
  const val = surveyFormData[q.id] || '';

  if (q.type === 'subgroup') {
    let subHtml = `
      <div class="survey-group-card">
        <div class="group-card-header">
          <span class="q-num">${q.num}</span>
          <span class="group-title">${escapeHtml(q.label)}</span>
        </div>
        <div class="subfields-grid">
    `;
    (q.fields || []).forEach(f => {
      const fVal = surveyFormData[f.id] !== undefined ? surveyFormData[f.id] : (f.default !== undefined ? f.default : '');
      subHtml += renderSingleInput(f, fVal);
    });
    subHtml += `</div></div>`;
    return subHtml;
  }

  return `
    <div class="survey-field-card">
      <label class="q-label">
        <span class="q-num">${q.num}</span>
        <span class="q-text">${escapeHtml(q.label)}</span>
        ${q.required ? '<span class="req-star">*</span>' : ''}
      </label>
      <div class="q-control">
        ${renderInputControl(q, val)}
      </div>
    </div>
  `;
}

function renderSingleInput(f, val) {
  return `
    <div class="subfield-item">
      <label class="subfield-label">
        ${escapeHtml(f.label)}
        ${f.required ? '<span class="req-star">*</span>' : ''}
      </label>
      ${renderInputControl(f, val)}
    </div>
  `;
}

function renderInputControl(f, val) {
  const fid = f.id;
  const req = f.required ? 'required' : '';
  const ph = f.placeholder ? `placeholder="${escapeHtml(f.placeholder)}"` : '';

  if (f.type === 'select') {
    const opts = (f.options || []).map(opt => {
      const isSel = String(val) === String(opt) ? 'selected' : '';
      return `<option value="${escapeHtml(opt)}" ${isSel}>${escapeHtml(opt)}</option>`;
    }).join('');
    return `
      <select id="sf-${fid}" name="${fid}" class="form-select" ${req}>
        <option value="">— Tanlang —</option>
        ${opts}
      </select>
    `;
  }

  if (f.type === 'radio') {
    const opts = (f.options || []).map((opt, i) => {
      const isChecked = String(val) === String(opt) ? 'checked' : '';
      return `
        <label class="radio-option">
          <input type="radio" name="${fid}" value="${escapeHtml(opt)}" ${isChecked}>
          <span>${escapeHtml(opt)}</span>
        </label>
      `;
    }).join('');
    return `<div class="radio-group">${opts}</div>`;
  }

  if (f.type === 'number') {
    const min = f.min !== undefined ? `min="${f.min}"` : '';
    return `<input type="number" id="sf-${fid}" name="${fid}" class="form-input" value="${escapeHtml(String(val))}" ${min} ${ph} ${req}>`;
  }

  if (f.type === 'date') {
    return `<input type="date" id="sf-${fid}" name="${fid}" class="form-input" value="${escapeHtml(String(val))}" ${req}>`;
  }

  if (f.type === 'tel') {
    return `<input type="tel" id="sf-${fid}" name="${fid}" class="form-input" value="${escapeHtml(String(val))}" ${ph} ${req}>`;
  }

  return `<input type="text" id="sf-${fid}" name="${fid}" class="form-input" value="${escapeHtml(String(val))}" ${ph} ${req}>`;
}

function handleFieldChange(e) {
  const target = e.target;
  const name = target.name;
  if (!name) return;

  if (target.type === 'radio') {
    if (target.checked) surveyFormData[name] = target.value;
  } else {
    surveyFormData[name] = target.value;
  }

  // Auto calculate demographics if applicable
  if (name === 'erkaklar_soni' || name === 'ayollar_soni') {
    const erkak = parseInt(surveyFormData['erkaklar_soni'] || 0);
    const ayol = parseInt(surveyFormData['ayollar_soni'] || 0);
    if (erkak + ayol > 0 && !surveyFormData['jami_aholi']) {
      surveyFormData['jami_aholi'] = erkak + ayol;
      const jamiInput = document.getElementById('sf-jami_aholi');
      if (jamiInput) jamiInput.value = erkak + ayol;
    }
  }

  saveSurveyDraft();
}

async function submitSurveyForm(e) {
  if (e) e.preventDefault();

  // Basic validation for essential fields
  if (!surveyFormData['tuman'] && !surveyFormData['q1']) {
    alert("Iltimos, 1-bo'limda tuman nomini tanlang!");
    goToSurveySection(0);
    return;
  }
  if (!surveyFormData['mahalla'] && !surveyFormData['q2']) {
    alert("Iltimos, 1-bo'limda mahalla nomini kiriting!");
    goToSurveySection(0);
    return;
  }
  if (!surveyFormData['boshliq_fio']) {
    alert("Iltimos, oila boshlig'i F.I.Sh. ma'lumotlarini kiriting!");
    goToSurveySection(0);
    return;
  }

  const submitBtn = document.getElementById('survey-submit-btn');
  const originalText = submitBtn ? submitBtn.innerHTML : 'Yuborish';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Saqlanmoqda...</span>`;
  }

  // Format record
  const surveyId = 'SRV-' + Date.now().toString().slice(-6);
  const now = new Date();
  const createdDate = now.toLocaleDateString('uz-UZ') + ' ' + now.toLocaleTimeString('uz-UZ').slice(0, 5);

  const fullRecord = {
    ...surveyFormData,
    sorovnoma_id: surveyId,
    kiritilgan_vaqt: createdDate,
    tuman: surveyFormData['tuman'] || surveyFormData['q1'] || 'Termiz tumani',
    mahalla: surveyFormData['mahalla'] || surveyFormData['q2'] || 'Noma\'lum mahalla',
    kocha: surveyFormData['kocha'] || surveyFormData['q3'] || '',
    uy_raqami: surveyFormData['uy_raqami'] || surveyFormData['q4'] || '',
    boshliq_fio: surveyFormData['boshliq_fio'] || '',
    jami_aholi: parseInt(surveyFormData['jami_aholi'] || 4),
    ijtimoiy_holat: surveyFormData['ijtimoiy_holat'] || "O'rtacha",
    iqtisodiy_holat: surveyFormData['iqtisodiy_holat'] || "O'rtacha daromadli"
  };

  // 1. Save to Local Storage
  submittedSurveys.unshift(fullRecord);
  saveSubmittedSurveysToLocal();

  // 2. Send to Google Sheets via Apps Script Web App
  try {
    if (typeof GoogleSync !== 'undefined' && GoogleSync.submitSurvey) {
      await GoogleSync.submitSurvey(fullRecord);
    }
  } catch (err) {
    console.warn("Google sync post warning:", err);
  }

  // 3. Update global analytics dynamically!
  if (typeof updateStatsWithNewSurvey === 'function') {
    updateStatsWithNewSurvey(fullRecord);
  }

  // 4. Clear Draft and reset
  surveyFormData = {};
  localStorage.removeItem('surxondaryo_survey_draft');
  updateSurveyProgress();
  renderSurveySection(0);
  renderSubmittedSurveysTable();

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }

  // Show success modal
  showSurveySuccessModal(surveyId, fullRecord);
}

function showSurveySuccessModal(id, rec) {
  const modal = document.getElementById('survey-success-modal');
  if (!modal) {
    alert(`So'rovnoma muvaffaqiyatli saqlandi!\nID: ${id}\nOila boshlig'i: ${rec.boshliq_fio}`);
    return;
  }

  document.getElementById('modal-survey-id').textContent = id;
  document.getElementById('modal-survey-fio').textContent = rec.boshliq_fio;
  document.getElementById('modal-survey-addr').textContent = `${rec.tuman}, ${rec.mahalla}, ${rec.kocha} ${rec.uy_raqami}`;
  modal.classList.add('open');
}

function closeSurveySuccessModal() {
  const modal = document.getElementById('survey-success-modal');
  if (modal) modal.classList.remove('open');
}

function renderSubmittedSurveysTable() {
  const tbody = document.getElementById('submitted-surveys-tbody');
  const countBadge = document.getElementById('submitted-count-badge');
  if (!tbody) return;

  if (countBadge) countBadge.textContent = `${submittedSurveys.length} ta`;

  if (submittedSurveys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hozircha tizimda kiritilgan yangi so‘rovnomalar mavjud emas. Yuqoridagi formani to‘ldirib yangi so‘rovnoma yuborishingiz mumkin.</td></tr>`;
    return;
  }

  tbody.innerHTML = submittedSurveys.map((s, idx) => {
    return `
      <tr>
        <td><strong>${idx + 1}</strong></td>
        <td><span class="badge-role">${escapeHtml(s.sorovnoma_id || 'SRV')}</span></td>
        <td>${escapeHtml(s.kiritilgan_vaqt || '—')}</td>
        <td>
          <strong>${escapeHtml(s.boshliq_fio)}</strong>
          <div class="row-sub">${escapeHtml(s.boshliq_tel || '')}</div>
        </td>
        <td>${escapeHtml(s.tuman)}, ${escapeHtml(s.mahalla)}</td>
        <td><span class="badge badge-active">${escapeHtml(s.ijtimoiy_holat || "O'rtacha")}</span></td>
        <td>
          <button class="btn-sm btn-outline" onclick="viewSurveyDetail('${s.sorovnoma_id}')">Ko‘rish</button>
        </td>
      </tr>
    `;
  }).join('');
}

function viewSurveyDetail(id) {
  const rec = submittedSurveys.find(s => s.sorovnoma_id === id);
  if (!rec) return;

  const modal = document.getElementById('survey-detail-modal');
  if (!modal) return;

  document.getElementById('detail-modal-title').textContent = `So'rovnoma Pasporti — ${rec.sorovnoma_id}`;
  
  let detailsHtml = `
    <div class="passport-grid">
      <div class="passport-card">
        <h4>Xonadon va Oila Boshlig'i</h4>
        <p><strong>F.I.Sh:</strong> ${escapeHtml(rec.boshliq_fio)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(rec.boshliq_tel || '—')}</p>
        <p><strong>Manzil:</strong> ${escapeHtml(rec.tuman)}, ${escapeHtml(rec.mahalla)}, ${escapeHtml(rec.kocha)} ${escapeHtml(rec.uy_raqami)}</p>
        <p><strong>Jami aholi:</strong> ${escapeHtml(String(rec.jami_aholi || '—'))} nafar</p>
      </div>
      <div class="passport-card">
        <h4>Ijtimoiy-iqtisodiy Ko'rsatkichlar</h4>
        <p><strong>Oila daromadi:</strong> ${escapeHtml(String(rec.jami_daromad || '—'))} so'm</p>
        <p><strong>Kreditga ehtiyoj:</strong> ${escapeHtml(String(rec.yangi_kredit_ehtiyoj || '—'))}</p>
        <p><strong>Ijtimoiy holati:</strong> ${escapeHtml(rec.ijtimoiy_holat || "O'rtacha")}</p>
        <p><strong>Iqtisodiy holati:</strong> ${escapeHtml(rec.iqtisodiy_holat || "O'rtacha")}</p>
      </div>
      <div class="passport-card full-width">
        <h4>Asosiy Muammo va Takliflar</h4>
        <p><strong>1-muammo:</strong> ${escapeHtml(rec.muammo_1 || rec.q93 || '—')}</p>
        <p><strong>1-ehtiyoj:</strong> ${escapeHtml(rec.ehtiyoj_1 || rec.q96 || '—')}</p>
        <p><strong>Xulosa:</strong> ${escapeHtml(rec.birinchi_navbat_masala || '—')}</p>
      </div>
    </div>
  `;

  document.getElementById('detail-modal-body').innerHTML = detailsHtml;
  modal.classList.add('open');
}

function closeSurveyDetailModal() {
  const modal = document.getElementById('survey-detail-modal');
  if (modal) modal.classList.remove('open');
}
