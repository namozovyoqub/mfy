/**
 * MAHALLALAR MAS'ULLARI MODULI (OFFICIALS)
 * Surxondaryo viloyati bo'yicha 723 ta mahalla raislari va mas'ullari
 */

let officialsList = [];
let officialsCurrentView = 'table'; // 'table' or 'grid'

function initOfficialsModule() {
  // Load any local edits or additions
  const localSaved = localStorage.getItem('surxondaryo_officials_custom');
  if (localSaved) {
    try {
      officialsList = JSON.parse(localSaved);
    } catch (e) {
      officialsList = [...OFFICIALS_DATA];
    }
  } else {
    officialsList = [...OFFICIALS_DATA];
  }

  setupOfficialsUI();
  renderOfficials();
}

function setupOfficialsUI() {
  const tumanSelect = document.getElementById('officials-filter-tuman');
  if (tumanSelect) {
    tumanSelect.innerHTML = '<option value="">Barcha tumanlar (' + TUMANS_LIST.length + ' ta)</option>';
    TUMANS_LIST.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      tumanSelect.appendChild(opt);
    });

    tumanSelect.addEventListener('change', () => renderOfficials());
  }

  const searchInput = document.getElementById('officials-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderOfficials());
  }

  const statusSelect = document.getElementById('officials-filter-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', () => renderOfficials());
  }

  const btnExport = document.getElementById('officials-export-btn');
  if (btnExport) {
    btnExport.addEventListener('click', exportOfficialsToCSV);
  }

  const btnAdd = document.getElementById('officials-add-btn');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openOfficialModal());
  }
}

function getFilteredOfficials() {
  const tuman = (document.getElementById('officials-filter-tuman')?.value || '').trim();
  const search = (document.getElementById('officials-search')?.value || '').toLowerCase().trim();
  const status = (document.getElementById('officials-filter-status')?.value || '').trim();

  return officialsList.filter(o => {
    if (tuman && o.tuman !== tuman) return false;
    if (status && o.status !== status) return false;
    if (search) {
      const text = `${o.mahalla} ${o.mahalla_cyrl || ''} ${o.fio} ${o.fio_lat || ''} ${o.telefon} ${o.tuman}`.toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  });
}

function renderOfficials() {
  const filtered = getFilteredOfficials();
  const tbody = document.getElementById('officials-table-body');
  const countEl = document.getElementById('officials-count-badge');
  const kpiTotal = document.getElementById('officials-kpi-total');
  const kpiActive = document.getElementById('officials-kpi-active');
  const kpiVacant = document.getElementById('officials-kpi-vacant');
  const kpiPhone = document.getElementById('officials-kpi-phone');

  // Update KPIs
  if (countEl) countEl.textContent = `${filtered.length} ta mahalla`;
  if (kpiTotal) kpiTotal.textContent = officialsList.length;
  
  const activeCount = officialsList.filter(o => o.status === 'Faol').length;
  const vacantCount = officialsList.filter(o => o.status === 'Vakant').length;
  const phoneCount = officialsList.filter(o => o.telefon && o.telefon.trim().length > 5).length;
  const phonePct = Math.round((phoneCount / officialsList.length) * 100);

  if (kpiActive) kpiActive.textContent = activeCount;
  if (kpiVacant) kpiVacant.textContent = vacantCount;
  if (kpiPhone) kpiPhone.textContent = `${phonePct}%`;

  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Ma'lumot topilmadi. Qidiruv parametrlarini o'zgartirib ko'ring.</td></tr>`;
    return;
  }

  // Render first 100 or paginated for super smooth speed
  const displayRows = filtered.slice(0, 150);

  tbody.innerHTML = displayRows.map((o, idx) => {
    const isVacant = o.status === 'Vakant';
    const statusBadge = isVacant
      ? `<span class="badge badge-vacant">Vakant</span>`
      : `<span class="badge badge-active">Faol</span>`;

    const phoneLink = o.telefon && !isVacant
      ? `<a href="tel:${o.telefon_raw || o.telefon}" class="tel-link" title="Qo'ng'iroq qilish">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
           ${o.telefon}
         </a>`
      : `<span class="text-muted">—</span>`;

    return `
      <tr>
        <td><strong>${idx + 1}</strong></td>
        <td>
          <div class="row-tuman">${escapeHtml(o.tuman)}</div>
          <div class="row-sub">${escapeHtml(o.hudud || 'Surxondaryo')}</div>
        </td>
        <td>
          <div class="row-mahalla"><strong>${escapeHtml(o.mahalla)}</strong></div>
          <div class="row-sub">${escapeHtml(o.mahalla_cyrl || '')}</div>
        </td>
        <td><span class="badge-role">${escapeHtml(o.lavozim || 'MFY raisi')}</span></td>
        <td>
          <div class="row-fio ${isVacant ? 'text-vacant' : ''}">${escapeHtml(o.fio)}</div>
          ${o.fio_lat && o.fio_lat !== o.fio ? `<div class="row-sub">${escapeHtml(o.fio_lat)}</div>` : ''}
        </td>
        <td>${phoneLink}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');

  if (filtered.length > 150) {
    const noteRow = document.createElement('tr');
    noteRow.innerHTML = `<td colspan="7" class="text-center text-muted" style="padding:12px;background:var(--slate-100)">
      Jami ${filtered.length} ta natijadan dastlabki 150 tasi ko‘rsatilmoqda. Aniqroq qidirish uchun tuman yoki mahalla filtridan foydalaning.
    </td>`;
    tbody.appendChild(noteRow);
  }
}

function exportOfficialsToCSV() {
  const filtered = getFilteredOfficials();
  if (!filtered.length) {
    alert("Eksport qilish uchun ma'lumot yo'q!");
    return;
  }

  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "T/r,Tuman,Mahalla (Lotin),Mahalla (Kirill),Lavozim,F.I.Sh,Telefon,Holat\n";

  filtered.forEach((o, i) => {
    const row = [
      i + 1,
      `"${(o.tuman || '').replace(/"/g, '""')}"`,
      `"${(o.mahalla || '').replace(/"/g, '""')}"`,
      `"${(o.mahalla_cyrl || '').replace(/"/g, '""')}"`,
      `"${(o.lavozim || '').replace(/"/g, '""')}"`,
      `"${(o.fio || '').replace(/"/g, '""')}"`,
      `"${(o.telefon || '').replace(/"/g, '""')}"`,
      `"${(o.status || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Surxondaryo_MFY_Masullari_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openOfficialModal(official = null) {
  const modal = document.getElementById('official-edit-modal');
  if (!modal) return;

  const titleEl = document.getElementById('official-modal-title');
  const form = document.getElementById('official-form');
  if (!form) return;

  if (official) {
    if (titleEl) titleEl.textContent = "Mas'ul ma'lumotlarini tahrirlash";
    form.dataset.id = official.id;
    document.getElementById('m-official-tuman').value = official.tuman;
    document.getElementById('m-official-mahalla').value = official.mahalla;
    document.getElementById('m-official-lavozim').value = official.lavozim;
    document.getElementById('m-official-fio').value = official.fio;
    document.getElementById('m-official-tel').value = official.telefon;
    document.getElementById('m-official-status').value = official.status;
  } else {
    if (titleEl) titleEl.textContent = "Yangi mahalla mas'ulini qo'shish";
    form.removeAttribute('data-id');
    form.reset();
  }

  modal.classList.add('open');
}

function closeOfficialModal() {
  const modal = document.getElementById('official-edit-modal');
  if (modal) modal.classList.remove('open');
}

function saveOfficialForm(e) {
  if (e) e.preventDefault();
  const form = document.getElementById('official-form');
  if (!form) return;

  const id = form.dataset.id ? parseInt(form.dataset.id) : null;
  const tuman = document.getElementById('m-official-tuman').value.trim();
  const mahalla = document.getElementById('m-official-mahalla').value.trim();
  const lavozim = document.getElementById('m-official-lavozim').value.trim();
  const fio = document.getElementById('m-official-fio').value.trim();
  const tel = document.getElementById('m-official-tel').value.trim();
  const status = document.getElementById('m-official-status').value;

  if (!tuman || !mahalla) {
    alert("Iltimos, tuman va mahalla nomini kiriting!");
    return;
  }

  if (id) {
    const idx = officialsList.findIndex(o => o.id === id);
    if (idx !== -1) {
      officialsList[idx] = {
        ...officialsList[idx],
        tuman, mahalla, lavozim, fio, telefon: tel, status
      };
    }
  } else {
    const newOfficial = {
      id: Date.now(),
      hudud: "Surxondaryo viloyati",
      tuman, mahalla, lavozim,
      fio: fio || (status === 'Vakant' ? 'Vakant' : '—'),
      telefon: tel,
      status
    };
    officialsList.unshift(newOfficial);
  }

  localStorage.setItem('surxondaryo_officials_custom', JSON.stringify(officialsList));
  closeOfficialModal();
  renderOfficials();
}
