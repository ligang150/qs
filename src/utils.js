// Utils ported from app.py
export const ADMIN_EMPLOYEE_ID = "20150465";
export const BEIJING_TZ_OFFSET = 8;

export function getBeijingTimeStr() {
  const now = new Date();
  const beijing = new Date(now.getTime() + (BEIJING_TZ_OFFSET - now.getTimezoneOffset() / 60) * 3600000);
  const y = beijing.getFullYear();
  const m = String(beijing.getMonth() + 1).padStart(2, '0');
  const d = String(beijing.getDate()).padStart(2, '0');
  const h = String(beijing.getHours()).padStart(2, '0');
  const min = String(beijing.getMinutes()).padStart(2, '0');
  const s = String(beijing.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

export function parseCellValue(cellValue) {
  if (!cellValue) return "";
  if (cellValue.text !== undefined) {
    let text = cellValue.text;
    // Handle "6月26日" format
    const mmdd = text.match(/^(\d{1,2})月(\d{1,2})日$/);
    if (mmdd) {
      const year = new Date().getFullYear();
      return `${year}-${String(mmdd[1]).padStart(2, '0')}-${String(mmdd[2]).padStart(2, '0')}`;
    }
    // Handle "2026年6月26日" format
    const yyyymmdd = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (yyyymmdd) {
      return `${yyyymmdd[1]}-${String(yyyymmdd[2]).padStart(2, '0')}-${String(yyyymmdd[3]).padStart(2, '0')}`;
    }
    return text;
  }
  if (cellValue.number !== undefined) return String(cellValue.number);
  if (cellValue.time) {
    const t = cellValue.time;
    const result = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
    if (result === "1899-12-30") return "";
    return result;
  }
  if (cellValue.select) {
    const vals = cellValue.select.value || [];
    return vals[0] || "";
  }
  if (cellValue.link) return cellValue.link.text || cellValue.link.url || "";
  return "";
}

export function buildCellValue(value, isDate = false, isNumber = false, fontSize = 14) {
  let cell;
  if (!value || String(value).trim() === "") {
    cell = { cellValue: { text: "" } };
  } else if (isNumber) {
    const num = parseFloat(value);
    cell = { cellValue: isNaN(num) ? { text: String(value) } : { number: num } };
  } else if (isDate) {
    const parts = String(value).split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      cell = { cellValue: { time: { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) } } };
    } else {
      cell = { cellValue: { text: String(value) } };
    }
  } else {
    cell = { cellValue: { text: String(value) } };
  }
  if (fontSize) {
    const tf = { fontSize, font: "SimSun" };
    cell.cellFormat = { textFormat: tf };
    cell.textFormat = tf;
  }
  return cell;
}

export function normalizeUserKey(val) {
  return String(val || "").trim();
}

export function isDateString(value) {
  if (!value) return false;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return true;
  if (/^\d{4}年\d{1,2}月\d{1,2}日$/.test(text)) return true;
  if (/^\d{1,2}月\d{1,2}日$/.test(text)) return true;
  return false;
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
  });
}

export function htmlResponse(html) {
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

export function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s) return null;
  // Try YYYY-MM-DD
  const m1 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m1) {
    const d = new Date(parseInt(m1[1]), parseInt(m1[2]) - 1, parseInt(m1[3]));
    if (d.getDate() === parseInt(m1[3])) return d;
  }
  // Try YYYY年M月D日
  const m2 = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (m2) {
    const d = new Date(parseInt(m2[1]), parseInt(m2[2]) - 1, parseInt(m2[3]));
    if (d.getDate() === parseInt(m2[3])) return d;
  }
  // Try M月D日
  const m3 = s.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (m3) {
    const now = new Date();
    const d = new Date(now.getFullYear(), parseInt(m3[1]) - 1, parseInt(m3[2]));
    return d;
  }
  return null;
}

export function parseNumber(val) {
  const s = String(val || "").trim();
  if (!s) return null;
  const n = parseFloat(s);
  if (!isNaN(n)) return n;
  const m = s.match(/\d+(?:\.\d+)?/);
  if (m) return parseFloat(m[0]);
  return null;
}

export function formatDate(date) {
  if (!date) return "";
  const d = date.getDate ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
