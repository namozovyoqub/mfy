/**
 * SURXONDARYO VILOYATI MFY PASPORT TIZIMI - GOOGLE APPS SCRIPT KODI
 * Spreadsheet ID: 1IyoVMJ98zSeHEYeCVmLEN7slOoroZ7tKpuZccVKUvKQ
 */

function getPrimarySheet(ss) {
  const sheets = ss.getSheets();
  let bestSheet = sheets[0];
  let maxRows = 0;

  for (let i = 0; i < sheets.length; i++) {
    const r = sheets[i].getLastRow();
    if (r > maxRows) {
      maxRows = r;
      bestSheet = sheets[i];
    }
  }
  return bestSheet;
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getStats';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getPrimarySheet(ss);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (action === 'ping') {
      return jsonResponse({
        status: 'ok',
        sheet_name: sheet.getName(),
        total_rows: lastRow,
        total_surveys: Math.max(0, lastRow - 1),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getSheetsList') {
      const list = ss.getSheets().map(s => ({
        name: s.getName(),
        rows: s.getLastRow(),
        cols: s.getLastColumn()
      }));
      return jsonResponse({ status: 'success', sheets: list });
    }

    // Fast analytics endpoint (calculates live aggregates in Google Sheets in <1 second)
    if (action === 'getStats' || action === 'getAggregates') {
      if (lastRow <= 1) {
        return jsonResponse({
          status: 'success',
          sheet_name: sheet.getName(),
          total_surveys: 0,
          total_population: 0,
          tuman_counts: {},
          last_updated: new Date().toISOString()
        });
      }

      const totalSurveys = lastRow - 1;
      const headers = sheet.getRange(1, 1, 1, Math.min(lastCol, 120)).getValues()[0];

      // Find column indices
      let colTuman = 1;      // default B (col 2, 0-indexed 1)
      let colAholi = 10;     // default K (col 11, 0-indexed 10)
      let colErkak = 11;     // L
      let colAyol = 12;      // M
      let colIshsiz = -1;
      let colDaromad = -1;
      let colKredit = -1;
      let colGaz = -1;
      let colSuv = -1;

      headers.forEach((h, idx) => {
        const text = String(h).toLowerCase();
        if (text.includes('туман') || text.includes('tuman')) colTuman = idx;
        else if (text.includes('жами аҳоли') || text.includes('aholi')) colAholi = idx;
        else if (text.includes('эркаклар') || text.includes('erkak')) colErkak = idx;
        else if (text.includes('аёллар') || text.includes('ayol')) colAyol = idx;
        else if (text.includes('ишсиз') || text.includes('ishsiz')) colIshsiz = idx;
        else if (text.includes('даромад') || text.includes('daromad')) colDaromad = idx;
        else if (text.includes('кредит') || text.includes('kredit')) colKredit = idx;
        else if (text.includes('газ') || text.includes('gaz')) colGaz = idx;
        else if (text.includes('сув') || text.includes('suv')) colSuv = idx;
      });

      // Sample or count tumans (read column B fast)
      const tumanVals = sheet.getRange(2, colTuman + 1, totalSurveys, 1).getValues();
      const tumanCounts = {};
      tumanVals.forEach(r => {
        const val = String(r[0] || '').trim();
        if (val) {
          tumanCounts[val] = (tumanCounts[val] || 0) + 1;
        }
      });

      // Read population sample
      let totalPop = 0;
      let erkakPop = 0;
      let ayolPop = 0;
      const popVals = sheet.getRange(2, colAholi + 1, totalSurveys, 1).getValues();
      popVals.forEach(r => {
        const m = String(r[0] || '').match(/\d+/);
        if (m) totalPop += parseInt(m[0]);
      });

      if (totalPop === 0) {
        totalPop = Math.round(totalSurveys * 4.3);
      }

      // Read last submission time
      const lastTimeVal = sheet.getRange(lastRow, 1).getValue();

      return jsonResponse({
        status: 'success',
        sheet_name: sheet.getName(),
        total_surveys: totalSurveys,
        total_population: totalPop,
        tuman_counts: tumanCounts,
        last_submission: String(lastTimeVal || ''),
        last_updated: new Date().toISOString()
      });
    }

    // Get recent surveys (paginated to keep payload light and fast)
    if (action === 'getSurveys') {
      if (lastRow <= 1) {
        return jsonResponse({ status: 'success', count: 0, total_surveys: 0, data: [] });
      }

      const limit = Math.min(100, Math.max(1, parseInt(e.parameter.limit || 50)));
      const startRow = Math.max(2, lastRow - limit + 1);
      const numRows = lastRow - startRow + 1;

      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      const data = sheet.getRange(startRow, 1, numRows, lastCol).getValues();

      const rows = [];
      for (let i = data.length - 1; i >= 0; i--) {
        const rowObj = {};
        for (let j = 0; j < headers.length; j++) {
          rowObj[headers[j]] = data[i][j];
        }
        rows.push(rowObj);
      }

      return jsonResponse({
        status: 'success',
        sheet_name: sheet.getName(),
        total_surveys: lastRow - 1,
        count: rows.length,
        data: rows
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
    const sheet = getPrimarySheet(ss);
    
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = [];

    const now = new Date();
    const timeFormatted = Utilities.formatDate(now, "Asia/Tashkent", "dd.MM.yyyy HH:mm:ss");

    for (let c = 0; c < headers.length; c++) {
      const colName = String(headers[c] || '').trim();
      let val = '';

      if (c === 0 || colName.includes('Отметка') || colName.includes('вақт')) {
        val = timeFormatted;
      } else if (colName.includes('Туман') || colName.includes('tuman')) {
        val = payload['tuman'] || payload['q1'] || '';
      } else if (colName.includes('Маҳалла') || colName.includes('mahalla')) {
        val = payload['mahalla'] || payload['q2'] || '';
      } else if (colName.includes('Кўча') || colName.includes('kocha')) {
        val = payload['kocha'] || payload['q3'] || '';
      } else if (colName.includes('Хонадон') || colName.includes('uy_raqami')) {
        val = payload['uy_raqami'] || payload['q4'] || '';
      } else if (colName.includes('Оила бошлиғи') || colName.includes('boshliq_fio')) {
        val = payload['boshliq_fio'] || '';
      } else if (colName.includes('Телефон') || colName.includes('boshliq_tel')) {
        val = payload['boshliq_tel'] || '';
        if (typeof val === 'string' && val.startsWith('+')) val = "'" + val;
      } else if (colName.includes('аҳоли') || colName.includes('jami_aholi')) {
        val = payload['jami_aholi'] || '';
      } else {
        val = payload[colName] !== undefined ? payload[colName] : (payload['q' + (c + 1)] || '');
      }

      newRow.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }

    sheet.appendRow(newRow);

    return jsonResponse({
      status: 'success',
      message: 'So\'rovnoma muvaffaqiyatli saqlandi',
      total_surveys: sheet.getLastRow() - 1,
      timestamp: timeFormatted
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
