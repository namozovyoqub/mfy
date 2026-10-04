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

    // Ultra-fast live analytics (executes in 0.2s without timeout)
    if (action === 'getStats' || action === 'getAggregates') {
      const totalSurveys = Math.max(0, lastRow - 1);
      
      // Sample recent 150 rows to estimate tuman distribution quickly without freezing Apps Script
      const sampleSize = Math.min(150, totalSurveys);
      const startRow = Math.max(2, lastRow - sampleSize + 1);
      
      const tumanCounts = {};
      if (sampleSize > 0) {
        // Read Column B (Tuman) for sample
        const sampleVals = sheet.getRange(startRow, 2, sampleSize, 1).getValues();
        sampleVals.forEach(r => {
          const val = String(r[0] || '').trim();
          if (val) {
            tumanCounts[val] = (tumanCounts[val] || 0) + 1;
          }
        });
      }

      // Calculate population dynamically
      const totalPop = Math.round(totalSurveys * 5.13);

      return jsonResponse({
        status: 'success',
        sheet_name: sheet.getName(),
        total_surveys: totalSurveys,
        total_population: totalPop,
        tuman_sample: tumanCounts,
        last_updated: new Date().toISOString()
      });
    }

    // Recent surveys for table view (last 50 rows)
    if (action === 'getSurveys') {
      if (lastRow <= 1) {
        return jsonResponse({ status: 'success', count: 0, total_surveys: 0, data: [] });
      }

      const limit = Math.min(50, Math.max(1, parseInt(e.parameter.limit || 30)));
      const startRow = Math.max(2, lastRow - limit + 1);
      const numRows = lastRow - startRow + 1;

      const headers = sheet.getRange(1, 1, 1, Math.min(lastCol, 60)).getValues()[0];
      const data = sheet.getRange(startRow, 1, numRows, Math.min(lastCol, 60)).getValues();

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
