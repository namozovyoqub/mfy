/**
 * SURXONDARYO VILOYATI MFY PASPORT TIZIMI - GOOGLE APPS SCRIPT KODI
 * Script / Spreadsheet ID: 1IyoVMJ98zSeHEYeCVmLEN7slOoroZ7tKpuZccVKUvKQ
 * 
 * Ushbu kodni Google Sheets menyusidan:
 * Kengaytmalar (Extensions) -> Apps Script (Google Apps Script) ga o'tib,
 * mavjud kod o'rniga joylashtiring va "Deploy -> New deployment -> Web app"
 * (Kim kirishi mumkin: Anyone / Har kim) qilib nashr eting.
 */

const SHEET_NAME = "So'rovnomalar_100";
const STATS_SHEET = "Statistika_Xulosa";

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getSurveys';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'ping') {
      return jsonResponse({ status: 'ok', message: 'Tizim faol', timestamp: new Date().toISOString() });
    }
    
    if (action === 'getSurveys') {
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        sheet = initSheet(ss);
      }
      
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return jsonResponse({ status: 'success', count: 0, data: [] });
      }
      
      const headers = data[0];
      const rows = [];
      for (let i = 1; i < data.length; i++) {
        const rowObj = {};
        for (let j = 0; j < headers.length; j++) {
          rowObj[headers[j]] = data[i][j];
        }
        rows.push(rowObj);
      }
      
      return jsonResponse({ status: 'success', count: rows.length, data: rows });
    }
    
    if (action === 'getStats') {
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        return jsonResponse({ status: 'success', total: 0, stats: {} });
      }
      const data = sheet.getDataRange().getValues();
      const count = Math.max(0, data.length - 1);
      return jsonResponse({
        status: 'success',
        total_surveys: count,
        last_updated: new Date().toISOString()
      });
    }

    return jsonResponse({ status: 'error', message: 'Noma\'lum action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = initSheet(ss);
    }
    
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = [];
    
    // Auto-generate timestamp & ID if not provided
    payload['kiritilgan_vaqt'] = payload['kiritilgan_vaqt'] || new Date().toLocaleString('uz-UZ');
    payload['sorovnoma_id'] = payload['sorovnoma_id'] || 'SRV-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      const val = payload[key] !== undefined ? payload[key] : '';
      newRow.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }
    
    sheet.appendRow(newRow);
    
    return jsonResponse({
      status: 'success',
      message: 'So\'rovnoma muvaffaqiyatli saqlandi',
      id: payload['sorovnoma_id'],
      timestamp: payload['kiritilgan_vaqt']
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function initSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  const headers = [
    "sorovnoma_id", "kiritilgan_vaqt", "tuman", "mahalla", "kocha", "uy_raqami",
    "boshliq_fio", "boshliq_sana", "boshliq_jinsi", "boshliq_tel", "boshliq_malumoti",
    "jami_aholi", "erkaklar_soni", "ayollar_soni", "yosh_0_3", "yosh_4_7", "yosh_8_17", "yosh_18_30", "yosh_31_59", "yosh_60_plus",
    "vaqtincha_soni", "vaqtincha_sabab", "oila_tarkibi", "farzand_3_ortiq", "ijtimoiy_himoyaga_muhtoj",
    "ijtimoiy_reyestr", "nafaqa_moddiy_yordam", "mehnatga_layoqatli", "rasmiy_ishlaydigan", "norasmiy_ishlaydigan",
    "mavsumiy_ishlaydigan", "ozini_ozi_band", "tadbirkor", "xorijda_ishlaydigan", "boshqa_hududda_ishlaydigan", "ishsizlar",
    "ishlash_istagi_bor", "ishlash_istagi_yoq", "ishlash_istagi_yoq_sabab", "doimiy_ishlash_istagi", "malakasi_bor", "malakasi_yoq",
    "xohlagan_kasb", "asosiy_soha", "tayyor_hudud", "minimal_ish_haqi", "jami_daromad", "ortacha_xarajat",
    "daromad_qoplaydimi", "jon_boshiga_daromad", "amaldagi_kredit", "yangi_kredit_ehtiyoj", "kredit_miqdori", "kredit_maqsadi",
    "subsidiya_ehtiyoj", "subsidiya_maqsadi", "tadbirkorlik_bor", "tadbirkorlik_turi", "tadbirkorlik_daromad",
    "kengaytirish_istagi", "kengaytirish_mablag", "tadbirkorlik_ehtiyoj", "kasb_organish_istagi", "organmoqchi_kasb",
    "til_organish_istagi", "bogcha_yoshidagi", "maktab_yoshidagi", "maktabga_borayotgan", "maktabga_bormayotgan",
    "ozlashtirishi_past", "togarakka_qatnashadigan", "qoshimcha_talim_ehtiyoj", "bolalar_ehtiyojlari", "oliy_talim_olayotgan",
    "doimiy_davolanuvchi", "dori_darmon_ehtiyoj", "nogironligi_bor", "nogiron_bolalar", "tibbiy_korik_muhtoj",
    "mablag_yetishmovchiligi", "zarur_tibbiy_yordam", "uy_joy_maydoni", "xonalar_soni", "uy_joy_yetarlimi",
    "mulk_shakli", "uy_hujjatlari", "tamir_holati", "tamir_mablagi", "tabiiy_gaz", "elektr_energiyasi",
    "ichimlik_suvi", "kanalizatsiya", "isitish_tizimi", "quyosh_paneli", "internet",
    "tex_xolodilnik", "tex_tv", "tex_konditsioner", "tex_kiryuvish", "tex_ariston", "tex_kompyuter", "tex_smartfon", "tex_gazplita", "tex_avtomobil",
    "tomorqa_maydoni", "tomorqadan_foydalanish", "issiqxona", "sugorish_imkoniyati", "qoramol", "qoy_echki", "parranda",
    "chorva_kengaytirish", "chorva_kerakli_yordam", "sport_shugullanuvchilar", "sport_turi", "sport_inshooti_ehtiyoj", "yoshlar_ehtiyoji",
    "muammo_1", "muammo_2", "muammo_3", "ehtiyoj_1", "ehtiyoj_2", "ehtiyoj_3",
    "ijtimoiy_holat", "iqtisodiy_holat", "birinchi_navbat_masala",
    "masul_fio", "masul_lavozim", "masul_tel", "toldirilgan_sana"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#132C44").setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
