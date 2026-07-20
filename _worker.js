var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/utils.js
function getBeijingTimeStr() {
  const now = /* @__PURE__ */ new Date();
  const beijing = new Date(now.getTime() + (BEIJING_TZ_OFFSET - now.getTimezoneOffset() / 60) * 36e5);
  const y = beijing.getFullYear();
  const m = String(beijing.getMonth() + 1).padStart(2, "0");
  const d = String(beijing.getDate()).padStart(2, "0");
  const h = String(beijing.getHours()).padStart(2, "0");
  const min = String(beijing.getMinutes()).padStart(2, "0");
  const s = String(beijing.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}
function parseCellValue(cellValue) {
  if (!cellValue) return "";
  if (cellValue.text !== void 0) {
    let text = cellValue.text;
    const mmdd = text.match(/^(\d{1,2})月(\d{1,2})日$/);
    if (mmdd) {
      const year = (/* @__PURE__ */ new Date()).getFullYear();
      return `${year}-${String(mmdd[1]).padStart(2, "0")}-${String(mmdd[2]).padStart(2, "0")}`;
    }
    const yyyymmdd = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (yyyymmdd) {
      return `${yyyymmdd[1]}-${String(yyyymmdd[2]).padStart(2, "0")}-${String(yyyymmdd[3]).padStart(2, "0")}`;
    }
    return text;
  }
  if (cellValue.number !== void 0) return String(cellValue.number);
  if (cellValue.time) {
    const t = cellValue.time;
    const result = `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
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
function buildCellValue(value, isDate = false, isNumber = false, fontSize = 14) {
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
function normalizeUserKey(val) {
  return String(val || "").trim();
}
function isDateString(value) {
  if (!value) return false;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return true;
  if (/^\d{4}年\d{1,2}月\d{1,2}日$/.test(text)) return true;
  if (/^\d{1,2}月\d{1,2}日$/.test(text)) return true;
  return false;
}
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
  });
}
function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s) return null;
  const m1 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m1) {
    const d = new Date(parseInt(m1[1]), parseInt(m1[2]) - 1, parseInt(m1[3]));
    if (d.getDate() === parseInt(m1[3])) return d;
  }
  const m2 = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (m2) {
    const d = new Date(parseInt(m2[1]), parseInt(m2[2]) - 1, parseInt(m2[3]));
    if (d.getDate() === parseInt(m2[3])) return d;
  }
  const m3 = s.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (m3) {
    const now = /* @__PURE__ */ new Date();
    const d = new Date(now.getFullYear(), parseInt(m3[1]) - 1, parseInt(m3[2]));
    return d;
  }
  return null;
}
function parseNumber(val) {
  const s = String(val || "").trim();
  if (!s) return null;
  const n = parseFloat(s);
  if (!isNaN(n)) return n;
  const m = s.match(/\d+(?:\.\d+)?/);
  if (m) return parseFloat(m[0]);
  return null;
}
function formatDate(date) {
  if (!date) return "";
  const d = date.getDate ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
var ADMIN_EMPLOYEE_ID, BEIJING_TZ_OFFSET;
var init_utils = __esm({
  "src/utils.js"() {
    ADMIN_EMPLOYEE_ID = "20150465";
    BEIJING_TZ_OFFSET = 8;
  }
});

// src/tencent-api.js
var tencent_api_exports = {};
__export(tencent_api_exports, {
  CONFIG_FILE_ID: () => CONFIG_FILE_ID,
  FILE_ID: () => FILE_ID,
  MODEL_FILE_ID: () => MODEL_FILE_ID,
  MODEL_SHEET_ID: () => MODEL_SHEET_ID,
  SHEET_ID: () => SHEET_ID,
  USER_FILE_ID: () => USER_FILE_ID,
  USER_SHEET_ID: () => USER_SHEET_ID,
  batchUpdate: () => batchUpdate,
  clearTempRow: () => clearTempRow,
  deleteRow: () => deleteRow,
  ensureSheetRows: () => ensureSheetRows,
  getAccessToken: () => getAccessToken,
  getDefaultAccessToken: () => getDefaultAccessToken,
  getFileInfo: () => getFileInfo,
  readModelConfigsFromSheet: () => readModelConfigsFromSheet,
  readModels: () => readModels,
  readSheetRange: () => readSheetRange,
  readSingleCell: () => readSingleCell,
  readUsers: () => readUsers,
  saveAccessToken: () => saveAccessToken,
  setTokenStore: () => setTokenStore,
  updateOrderRow: () => updateOrderRow,
  updateTokens: () => updateTokens,
  writeOrderRow: () => writeOrderRow,
  writeTempRow: () => writeTempRow
});
function setTokenStore(kv) {
  _tokenStore = kv;
}
async function getAccessToken() {
  if (_tokenStore) {
    try {
      const stored = await _tokenStore.get("TENCENT_ACCESS_TOKEN");
      if (stored) {
        _cachedToken = stored;
        return stored;
      }
    } catch (e) {
    }
  }
  return _cachedToken || DEFAULT_ACCESS_TOKEN;
}
async function saveAccessToken(token) {
  _cachedToken = token;
  if (_tokenStore) {
    try {
      await _tokenStore.put("TENCENT_ACCESS_TOKEN", token);
    } catch (e) {
      console.error("[KV] save token error:", e.message);
    }
  }
}
function getDefaultAccessToken() {
  return DEFAULT_ACCESS_TOKEN;
}
function updateTokens(clientId, accessToken, openId) {
  if (clientId) CLIENT_ID = clientId;
  if (accessToken) _cachedToken = accessToken;
  if (openId) OPEN_ID = openId;
}
async function getHeaders() {
  const token = await getAccessToken();
  return {
    "Content-Type": "application/json",
    "Access-Token": token,
    "Open-Id": OPEN_ID,
    "Client-Id": CLIENT_ID
  };
}
async function apiGet(path) {
  const url = `${BASE_URL}${path}`;
  const headers = await getHeaders();
  const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8e3) });
  if (!resp.ok) {
    console.log(`[TencentAPI] HTTP ${resp.status}: ${path}`);
    return null;
  }
  const data = await resp.json();
  if (data.code && data.code !== 0) {
    console.log(`[TencentAPI] Error code=${data.code}: ${data.message || ""} for ${path}`);
    return null;
  }
  return data;
}
async function apiPost(path, body) {
  const url = `${BASE_URL}${path}`;
  const headers = await getHeaders();
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8e3)
  });
  return resp;
}
async function readSheetRange(sheetId, rangeStr, fileId = null) {
  const fid = fileId || FILE_ID;
  const data = await apiGet(`/files/${fid}/${sheetId}/${rangeStr}`);
  return data ? data.gridData || {} : {};
}
async function readSingleCell(sheetId, cell, fileId = null) {
  const gridData = await readSheetRange(sheetId, `${cell}:${cell}`, fileId);
  const rows = gridData.rows || [];
  if (rows.length > 0) {
    for (const v of rows[0].values || []) {
      if (v.cellValue) return parseCellValue(v.cellValue);
    }
  }
  return "";
}
async function batchUpdate(body) {
  const resp = await apiPost(`/files/${FILE_ID}/batchUpdate`, body);
  if (!resp.ok) {
    console.log(`[TencentAPI] batchUpdate failed HTTP ${resp.status}`);
    return { ok: false, status: resp.status };
  }
  const data = await resp.json();
  return { ok: true, data };
}
async function getFileInfo() {
  return await apiGet(`/files/${FILE_ID}`);
}
async function readUsers() {
  const data = await apiGet(`/files/${USER_FILE_ID}/${USER_SHEET_ID}/A2:F200`);
  const users = [];
  if (!data) {
    users.push({
      name: "\u674E\u521A",
      employee_id: "20150465",
      password: "queue2025",
      is_admin: true,
      is_manager: false,
      role: "\u7BA1\u7406\u5458",
      department: "",
      access_level: "admin",
      permission: "\u80FD\u64CD\u4F5C\u6240\u6709\u6570\u636E"
    });
    return users;
  }
  const rows = data.gridData?.rows || [];
  for (const row of rows) {
    const values = row.values || [];
    const rowData = values.map((v) => parseCellValue(v.cellValue));
    if (rowData.length >= 3 && rowData[0] && rowData[1]) {
      const role = (rowData[3] || "").trim();
      const department = (rowData[4] || "").trim();
      const permissionText = (rowData[5] || "").trim();
      const isAdmin = role === "\u7BA1\u7406\u5458" || permissionText === "\u80FD\u64CD\u4F5C\u6240\u6709\u6570\u636E";
      const isManager = role === "\u7ECF\u7406" || permissionText === "\u80FD\u64CD\u4F5C\u672C\u90E8\u95E8\u6240\u6709\u6570\u636E";
      const accessLevel = isAdmin ? "admin" : isManager ? "department" : "self";
      users.push({
        name: rowData[0],
        employee_id: rowData[1],
        password: rowData[2],
        is_admin: isAdmin,
        is_manager: isManager,
        role,
        department,
        access_level: accessLevel,
        permission: permissionText
      });
    }
  }
  if (users.length === 0) {
    users.push({
      name: "\u674E\u521A",
      employee_id: "20150465",
      password: "queue2025",
      is_admin: true,
      is_manager: false,
      role: "\u7BA1\u7406\u5458",
      department: "",
      access_level: "admin",
      permission: "\u80FD\u64CD\u4F5C\u6240\u6709\u6570\u636E"
    });
  }
  return users;
}
async function readModelConfigsFromSheet() {
  const configSheetId = "dc53jt";
  const data = await apiGet(`/files/${CONFIG_FILE_ID}/${configSheetId}/A2:F200`);
  if (!data) return {};
  const rows = data.gridData?.rows || [];
  const configs = {};
  for (const row of rows) {
    const values = row.values || [];
    if (values.length < 6) continue;
    const cells = values.slice(0, 6).map((v) => parseCellValue(v.cellValue));
    const modelName = (cells[0] || "").trim();
    if (!modelName) continue;
    try {
      let sheetId = (cells[1] || "").trim();
      if (/^\d+$/.test(sheetId) && sheetId.length < 6) sheetId = sheetId.padStart(6, "0");
      const startRow = parseInt(cells[2]);
      const capacityCol = (cells[3] || "").trim();
      const limitCell = (cells[4] || "").trim();
      const rowCount = parseInt(cells[5]);
      configs[modelName] = [sheetId, startRow, capacityCol, limitCell, rowCount];
    } catch (e) {
    }
  }
  return configs;
}
async function readModels() {
  const gridData = await readSheetRange(MODEL_SHEET_ID, "A1:A100", MODEL_FILE_ID);
  const rows = gridData.rows || [];
  const models = [];
  for (const row of rows) {
    for (const v of row.values || []) {
      if (v.cellValue) {
        const text = parseCellValue(v.cellValue);
        if (text) models.push(text);
      }
    }
  }
  return models;
}
async function ensureSheetRows(minRowCount) {
  const data = await getFileInfo();
  if (!data || !data.data) return false;
  const sheets = data.data.sheets || [];
  let currentRowCount = 0;
  for (const s of sheets) {
    if (s.sheetID === SHEET_ID) {
      currentRowCount = s.rowCount || s.gridProperties?.rowCount || 0;
      break;
    }
  }
  if (currentRowCount >= minRowCount) return true;
  const rowsToAdd = Math.max(500, minRowCount - currentRowCount);
  const body = {
    requests: [{
      insertDimension: {
        range: { sheetID: SHEET_ID, dimension: "ROWS", startIndex: currentRowCount, endIndex: currentRowCount + rowsToAdd }
      }
    }]
  };
  const result = await batchUpdate(body);
  return result.ok;
}
async function writeOrderRow(rowIndex0based, model, tonnage, customer, expectedDate, calculatedDate, queueDate, submitter, remark, serialNo, submitterId, submitTime) {
  const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v).trim());
  const requests = [
    {
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: rowIndex0based,
          startColumn: 0,
          rows: [{
            values: [
              buildCellValue(model),
              buildCellValue(tonnage, false, true),
              buildCellValue(customer),
              buildCellValue(expectedDate, true)
            ]
          }]
        }
      }
    },
    {
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: rowIndex0based,
          startColumn: 5,
          rows: [{
            values: [
              buildCellValue(queueDate, isDate(queueDate)),
              buildCellValue(submitter),
              buildCellValue(remark),
              buildCellValue(serialNo),
              buildCellValue(""),
              buildCellValue(submitterId),
              buildCellValue(submitTime)
            ]
          }]
        }
      }
    }
  ];
  return await batchUpdate({ requests });
}
async function deleteRow(rowIndex1based) {
  const idx = rowIndex1based - 1;
  const requests = [
    { updateRangeRequest: { sheetId: SHEET_ID, gridData: { startRow: idx, startColumn: 1, rows: [{ values: [buildCellValue("")] }] } } },
    { updateRangeRequest: { sheetId: SHEET_ID, gridData: { startRow: idx, startColumn: 7, rows: [{ values: [buildCellValue("")] }] } } },
    { updateRangeRequest: { sheetId: SHEET_ID, gridData: { startRow: idx, startColumn: 9, rows: [{ values: [buildCellValue("DELETED")] }] } } }
  ];
  return await batchUpdate({ requests });
}
async function updateOrderRow(rowIndex1based, model, tonnage, customer, expectedDate, calculatedDate, queueDate, submitter, serialNo) {
  const idx = rowIndex1based - 1;
  const requests = [
    {
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: idx,
          startColumn: 0,
          rows: [{
            values: [
              buildCellValue(model),
              buildCellValue(tonnage, false, true),
              buildCellValue(customer),
              buildCellValue(expectedDate, true)
            ]
          }]
        }
      }
    },
    {
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: idx,
          startColumn: 5,
          rows: [{
            values: [
              buildCellValue(queueDate, /^\d{4}-\d{2}-\d{2}$/.test(String(queueDate).trim())),
              buildCellValue(submitter),
              buildCellValue("")
              // H column (remark) - keep empty
            ]
          }]
        }
      }
    }
  ];
  return await batchUpdate({ requests });
}
async function clearTempRow(rowIndex1based) {
  if (rowIndex1based < 2) return null;
  const kVal = await readSingleCell(SHEET_ID, `K${rowIndex1based}`);
  if (kVal && kVal.trim()) return null;
  const idx = rowIndex1based - 1;
  const body = {
    requests: [{
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: idx,
          startColumn: 0,
          rows: [{ values: [buildCellValue(""), buildCellValue(""), buildCellValue(""), buildCellValue("")] }]
        }
      }
    }]
  };
  return await batchUpdate(body);
}
async function writeTempRow(rowIndex0based, model, tonnage, expectedDate) {
  const body = {
    requests: [{
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: rowIndex0based,
          startColumn: 0,
          rows: [{
            values: [
              buildCellValue(model),
              buildCellValue(tonnage, false, true),
              buildCellValue(""),
              buildCellValue(expectedDate, true)
            ]
          }]
        }
      }
    }]
  };
  return await batchUpdate(body);
}
var BASE_URL, FILE_ID, SHEET_ID, MODEL_FILE_ID, MODEL_SHEET_ID, USER_FILE_ID, USER_SHEET_ID, CONFIG_FILE_ID, DEFAULT_ACCESS_TOKEN, CLIENT_ID, OPEN_ID, _tokenStore, _cachedToken;
var init_tencent_api = __esm({
  "src/tencent-api.js"() {
    init_utils();
    BASE_URL = "https://docs.qq.com/openapi/spreadsheet/v3";
    FILE_ID = "DRnhDemRIS25mdnFF";
    SHEET_ID = "000007";
    MODEL_FILE_ID = "DRmxUY0RBQVJXRXpC";
    MODEL_SHEET_ID = "fkayvi";
    USER_FILE_ID = "DRmxUY0RBQVJXRXpC";
    USER_SHEET_ID = "s9osf8";
    CONFIG_FILE_ID = "DRnhDemRIS25mdnFF";
    DEFAULT_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHQiOiJkYTgxNWQxMjI3Mjk0NDU3YjQzNDEzYmRjMTZlM2U5MCIsInR5cCI6MSwiZXhwIjoxNzgyMDk0NTcyLjEwODc1MywiaWF0IjoxNzc5NTAyNTcyLjEwODc1Mywic3ViIjoiOWJjMTcyZTUzMzgxNDdkOGEzNWMxNDM4ZWE4ZDE1NzcifQ.rm3BIdD1V7FrCwdToT2arErs06xWF7hTqAh0KsCKsdw";
    CLIENT_ID = "da815d1227294457b43413bdc16e3e90";
    OPEN_ID = "9bc172e5338147d8a35c1438ea8d1577";
    _tokenStore = null;
    _cachedToken = null;
  }
});

// src/index.js
init_tencent_api();

// src/handlers/auth.js
init_tencent_api();
init_utils();
var ACCESS_PASSWORD = "queue2025";
async function handleAuthCheck(request) {
  const password = request.headers.get("X-Access-Password") || "";
  if (password === ACCESS_PASSWORD) return jsonResponse({ authorized: true });
  return jsonResponse({ authorized: false });
}
async function handleAuthLogin(request) {
  try {
    const data = await request.json();
    const employeeId = normalizeUserKey(data.employee_id || "");
    const password = data.password || "";
    const users = await readUsers();
    for (const user of users) {
      if (normalizeUserKey(user.employee_id) === employeeId) {
        if (user.password === password) {
          return jsonResponse({
            success: true,
            user: {
              name: user.name,
              employee_id: user.employee_id,
              access_level: user.access_level || "self",
              department: user.department || ""
            },
            access_password: ACCESS_PASSWORD
          });
        }
        return jsonResponse({ success: false, error: "\u5BC6\u7801\u9519\u8BEF" });
      }
    }
    return jsonResponse({ success: false, error: "\u5458\u5DE5\u53F7\u4E0D\u5B58\u5728" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleAuthUsers(request) {
  try {
    const users = await readUsers();
    return jsonResponse({
      success: true,
      users: users.map((u) => ({ name: u.name, employee_id: normalizeUserKey(u.employee_id) }))
    });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

// src/handlers/models.js
init_tencent_api();
init_utils();
var cachedModels = null;
var modelsCacheTime = 0;
var MODELS_CACHE_TTL = 3e5;
var MODEL_CONFIG_KEYS = [
  "F5631",
  "F3500",
  "C210",
  "C220",
  "C230",
  "C240A",
  "C3050A",
  "C280",
  "330N",
  "F3600",
  "C204",
  "C307",
  "C305",
  "C310",
  "4110B",
  "5118G",
  "R4110",
  "6001C",
  "R403",
  "R6207",
  "R6205",
  "R6048",
  "304\u94C1\u6876",
  "304\u5428\u6876",
  "350T",
  "8001A",
  "INOVOL R8315"
];
async function handleModels(request) {
  try {
    const now = Date.now();
    if (cachedModels && now - modelsCacheTime < MODELS_CACHE_TTL) {
      return jsonResponse({ success: true, models: cachedModels, version: "cf-v1.0" });
    }
    let models = await readModels();
    if (models.length === 0) {
      models = [...MODEL_CONFIG_KEYS];
    } else {
      const set = new Set(models);
      MODEL_CONFIG_KEYS.forEach((m) => set.add(m));
      models = [...set];
    }
    cachedModels = models;
    modelsCacheTime = now;
    return jsonResponse({ success: true, models, version: "cf-v1.0" });
  } catch (e) {
    return jsonResponse({ success: true, models: [...MODEL_CONFIG_KEYS], version: "cf-v1.0-fallback" });
  }
}

// src/handlers/orders.js
init_tencent_api();

// src/calc-engine.js
init_tencent_api();
init_utils();
var MODEL_CONFIG = {
  "F5631": ["000005", 6, "J", "M1", 179],
  "F3500": ["000005", 6, "K", "N1", 179],
  "C210": ["000003", 4, "AC", "E1", 180],
  "C220": ["000003", 4, "AD", "F1", 180],
  "C230": ["000003", 4, "AE", "G1", 180],
  "C240A": ["000003", 4, "AF", "H1", 180],
  "C3050A": ["000003", 4, "AG", "I1", 180],
  "C280": ["000003", 4, "AH", "J1", 180],
  "330N": ["00000a", 3, "H", "I1", 216],
  "F3600": ["00000a", 3, "M", "O1", 216],
  "C204": ["000006", 4, "AA", "F2", 225],
  "C307": ["000006", 4, "AB", "G2", 225],
  "C305": ["000006", 4, "AC", "H2", 225],
  "C310": ["000006", 4, "AD", "I2", 225],
  "4110B": ["000001", 4, "AB", "I2", 185],
  "5118G": ["000001", 4, "AD", "L2", 185],
  "R4110": ["000001", 4, "AE", "K2", 185],
  "6001C": ["000001", 4, "AF", "M2", 185],
  "R403": ["000001", 4, "AJ", "AK1", 185],
  "R6207": ["000004", 3, "O", "I1", 201],
  "R6205": ["000004", 3, "S", "J1", 201],
  "R6048": ["000004", 3, "W", "K1", 201],
  "304\u94C1\u6876": ["00000c", 3, "I", "L1", 186],
  "304\u5428\u6876": ["00000c", 3, "J", "M1", 186],
  "350T": ["000009", 3, "N", "K1", 241],
  "8001A": ["000009", 3, "Q", "O1", 241],
  "INOVOL R8315": ["000004", 3, "AB", "AP1", 180]
};
var cache = /* @__PURE__ */ new Map();
var CACHE_TTL = 3e5;
function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}
async function readLimitDate(sheetId, limitCell) {
  const cacheKey = `limit:${sheetId}:${limitCell}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;
  const val = await readSingleCell(sheetId, limitCell);
  const date = parseDate(val);
  setCache(cacheKey, date);
  return date;
}
async function getSheetData(sheetId, startRow, capacityCol, limitCell, rowCount) {
  const cacheKey = `sheet:${sheetId}:${startRow}:${capacityCol}:${limitCell}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const endRow = startRow + rowCount - 1;
  const [dateGrid, capGrid] = await Promise.all([
    readSheetRange(sheetId, `A${startRow}:A${endRow}`),
    readSheetRange(sheetId, `${capacityCol}${startRow}:${capacityCol}${endRow}`)
  ]);
  const dateRows = dateGrid.rows || [];
  const capRows = capGrid.rows || [];
  const limitDate = await readLimitDate(sheetId, limitCell);
  const dateCapacityMap = {};
  const maxRows = Math.max(dateRows.length, capRows.length);
  for (let i = 0; i < maxRows; i++) {
    let d = null;
    if (i < dateRows.length) {
      const values = dateRows[i].values || [];
      if (values.length > 0 && values[0].cellValue) {
        d = parseDate(parseCellValue(values[0].cellValue));
      }
    }
    if (d && i < capRows.length) {
      const values = capRows[i].values || [];
      if (values.length > 0 && values[0].cellValue) {
        const capVal = parseNumber(parseCellValue(values[0].cellValue));
        if (capVal !== null) dateCapacityMap[d.getTime()] = { date: d, capacity: capVal };
      }
    }
  }
  const result = { dateCapacityMap, limitDate };
  if (Object.keys(dateCapacityMap).length > 0) {
    result.sortedDates = Object.values(dateCapacityMap).sort((a, b) => a.date - b.date).map((e) => e.date);
    result.capacities = result.sortedDates.map((d) => dateCapacityMap[d.getTime()].capacity);
  }
  setCache(cacheKey, result);
  return result;
}
async function getModelConfig(model) {
  if (MODEL_CONFIG[model]) return MODEL_CONFIG[model];
  const sheetConfigs = await readModelConfigsFromSheet();
  return sheetConfigs[model] || null;
}
async function calculateDeliveryDate(model, tonnageStr, expectedDateStr, originalQueueDateStr = null, originalTonnageStr = null) {
  const cacheKey = `calc:${model}:${tonnageStr}:${expectedDateStr}:${originalQueueDateStr || ""}:${originalTonnageStr || ""}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const config = await getModelConfig(model);
  if (!config) return ["\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301", `\u578B\u53F7 ${model} \u6682\u65E0\u6392\u4EA7\u6570\u636E\uFF0C\u8BF7\u68C0\u67E5\u578B\u53F7\u662F\u5426\u6B63\u786E`];
  const tonnage = parseNumber(tonnageStr);
  if (tonnage === null || tonnage <= 0) return ["", "\u5428\u4F4D\u4E0D\u80FD\u4E3A\u7A7A\u6216\u65E0\u6548"];
  const expectedDate = parseDate(expectedDateStr);
  if (!expectedDate) return ["", `\u671F\u671B\u53D1\u8D27\u65E5\u671F\u683C\u5F0F\u65E0\u6548: ${expectedDateStr}`];
  const [sheetId, startRow, capacityCol, limitCell, rowCount] = config;
  const sheetData = await getSheetData(sheetId, startRow, capacityCol, limitCell, rowCount);
  const { dateCapacityMap, limitDate, sortedDates, capacities: origCapacities } = sheetData;
  if (!sortedDates || sortedDates.length === 0) {
    return ["\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301", "\u6392\u4EA7\u6570\u636E\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u8054\u7CFB\u7BA1\u7406\u5458\u68C0\u67E5Token"];
  }
  let capacities = origCapacities;
  const originalQueueDate = originalQueueDateStr ? parseDate(originalQueueDateStr) : null;
  const originalTonnage = originalTonnageStr ? parseNumber(originalTonnageStr) : null;
  if (originalQueueDate && originalTonnage && originalTonnage > 0) {
    capacities = [...origCapacities];
    const effectiveLimitDate2 = limitDate || sortedDates[sortedDates.length - 1];
    let origIdx = 0;
    for (; origIdx < sortedDates.length; origIdx++) {
      if (sortedDates[origIdx] >= originalQueueDate) break;
    }
    let limitIdx = sortedDates.length - 1;
    for (let k = sortedDates.length - 1; k >= 0; k--) {
      if (sortedDates[k] <= effectiveLimitDate2) {
        limitIdx = k;
        break;
      }
    }
    for (let k = origIdx; k <= Math.min(limitIdx, capacities.length - 1); k++) {
      capacities[k] += originalTonnage;
    }
  }
  const effectiveLimitDate = limitDate || sortedDates[sortedDates.length - 1];
  let i = 0;
  for (; i < sortedDates.length; i++) {
    if (sortedDates[i] >= expectedDate) break;
  }
  if (i >= sortedDates.length) return ["\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301", "\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301"];
  let j = sortedDates.length - 1;
  for (let k = sortedDates.length - 1; k >= 0; k--) {
    if (sortedDates[k] <= effectiveLimitDate) {
      j = k;
      break;
    }
  }
  if (j < i) return ["\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301", "\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301"];
  let suffixMin = capacities[j];
  let resultIdx = -1;
  for (let k = j; k >= i; k--) {
    suffixMin = Math.min(suffixMin, capacities[k]);
    if (suffixMin >= tonnage) {
      resultIdx = k;
    } else {
      break;
    }
  }
  if (resultIdx < 0) return ["\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301", "\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301"];
  const resultDate = sortedDates[resultIdx];
  const resultStr = formatDate(resultDate);
  const result = resultDate.getTime() === expectedDate.getTime() ? [expectedDateStr, ""] : [resultStr, ""];
  setCache(cacheKey, result);
  return result;
}
function clearCache() {
  cache.clear();
}
async function preloadAllModels() {
  const promises = Object.entries(MODEL_CONFIG).map(async ([model, config]) => {
    try {
      const [sheetId, startRow, capacityCol, limitCell, rowCount] = config;
      await getSheetData(sheetId, startRow, capacityCol, limitCell, rowCount);
      return { model, ok: true };
    } catch (e) {
      return { model, ok: false, error: e.message };
    }
  });
  const results = await Promise.all(promises);
  const ok = results.filter((r) => r.ok).length;
  console.log(`[preload] ${ok}/${results.length} models preloaded`);
  return { success: ok, total: results.length };
}

// src/handlers/orders.js
init_tencent_api();
init_utils();
var PER_PAGE = 20;
function parseOrderRow(rowData) {
  return {
    model: rowData[0] || "",
    tonnage: rowData[1] || "",
    customer: rowData[2] || "",
    expected_date: rowData[3] || "",
    calculated_date: rowData[4] || "",
    queue_date: rowData[5] || "",
    submitter: rowData[6] || "",
    remark: rowData[7] || "",
    serial_no: rowData[8] || "",
    last_entry: rowData[9] || "",
    submitter_id: rowData[10] || "",
    submit_time: rowData[11] || ""
  };
}
var ordersCache = null;
var ordersCacheTime = 0;
var ORDERS_CACHE_TTL = 6e4;
async function readAllOrders(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && ordersCache && now - ordersCacheTime < ORDERS_CACHE_TTL) {
    return ordersCache;
  }
  const orders = [];
  const batchSize = 200;
  for (let offset = 0; offset < 4e3; offset += batchSize) {
    const start = offset + 1;
    const end = offset + batchSize;
    const gridData = await readSheetRange(SHEET_ID, `A${start}:L${end}`);
    const rows = gridData.rows || [];
    if (rows.length === 0) break;
    for (let i = 0; i < rows.length; i++) {
      const actualRow = start + i;
      if (actualRow < 2) continue;
      const values = rows[i].values || [];
      const rowData = values.map((v) => parseCellValue(v.cellValue));
      const aVal = rowData[0] || "";
      const jVal = rowData[9] || "";
      if (!aVal) continue;
      if (jVal === "DELETED") continue;
      const order = parseOrderRow(rowData);
      order.row_index = actualRow;
      orders.push(order);
    }
    if (rows.length < batchSize) break;
  }
  ordersCache = orders;
  ordersCacheTime = now;
  return orders;
}
var ACCESS_PASSWORD2 = "queue2025";
function requireAuth(request) {
  const password = request.headers.get("X-Access-Password") || "";
  return password === ACCESS_PASSWORD2;
}
async function getUserById(employeeId) {
  const currentId = normalizeUserKey(employeeId);
  if (!currentId) return null;
  const users = await readUsers();
  for (const u of users) {
    if (normalizeUserKey(u.employee_id) === currentId) return u;
  }
  return null;
}
async function getUserByName(name) {
  const n = String(name || "").trim();
  if (!n) return null;
  const users = await readUsers();
  for (const u of users) {
    if (String(u.name || "").trim() === n) return u;
  }
  return null;
}
async function getOrderSubmitterUser(order) {
  return await getUserById(order.submitter_id) || await getUserByName(order.submitter);
}
function isSameSubmitter(order, submitterId, submitterName) {
  const sid = normalizeUserKey(submitterId);
  const sn = String(submitterName || "").trim();
  if (sid && normalizeUserKey(order.submitter_id) === sid) return true;
  if (sn && String(order.submitter || "").trim() === sn) return true;
  return false;
}
async function canOperateOrder(order, currentUser, submitterId, submitterName, viewMode = "mine") {
  const accessLevel = (currentUser || {}).access_level || "self";
  if (viewMode === "mine") return isSameSubmitter(order, submitterId, submitterName);
  if (accessLevel === "admin") return true;
  if (accessLevel === "department" || accessLevel === "self") {
    const currentDept = String((currentUser || {}).department || "").trim();
    if (!currentDept) return true;
    const orderUser = await getOrderSubmitterUser(order);
    const orderDept = String((orderUser || {}).department || "").trim();
    return !!(currentDept && orderDept && currentDept === orderDept);
  }
  return isSameSubmitter(order, submitterId, submitterName);
}
function orderMatchesExpected(order, expected) {
  if (!expected) return true;
  const keys = ["model", "customer", "submitter_id", "submit_time"];
  for (const key of keys) {
    const expectedVal = String(expected[key] || "").trim();
    if (expectedVal && String(order[key] || "").trim() !== expectedVal) return false;
  }
  return true;
}
async function getNextEmptyRow(startFrom = 2, maxBatches = 50) {
  const batchSize = 200;
  for (let offset = 0; offset < maxBatches * batchSize; offset += batchSize) {
    const start = offset + 1;
    const end = offset + batchSize;
    if (start < startFrom) continue;
    const actualStart = Math.max(start, startFrom);
    const gridData = await readSheetRange(SHEET_ID, `A${actualStart}:A${end}`);
    const rows = gridData.rows || [];
    if (rows.length === 0) return actualStart;
    for (let i = 0; i < rows.length; i++) {
      const actualRow = actualStart + i;
      if (actualRow < 2) continue;
      const values = rows[i].values || [];
      const aVal = values.length > 0 && values[0].cellValue ? parseCellValue(values[0].cellValue) : "";
      if (!aVal) return actualRow;
    }
    if (rows.length < batchSize) {
      const nextRow = actualStart + rows.length;
      const verify = await readSingleCell(SHEET_ID, `A${nextRow}`);
      if (verify && verify.trim()) continue;
      return nextRow;
    }
  }
  return 0;
}
async function handleGetOrders(request) {
  if (!requireAuth(request)) {
    return jsonResponse({ success: false, error: "\u672A\u6388\u6743", need_auth: true }, 401);
  }
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const filterModel = url.searchParams.get("model") || "";
    const filterCustomer = url.searchParams.get("customer") || "";
    const sortBy = url.searchParams.get("sort") || "";
    const submitterId = normalizeUserKey(request.headers.get("X-Employee-Id") || "");
    const submitterName = request.headers.get("X-Employee-Name") || "";
    const viewAll = url.searchParams.get("all") === "1";
    const allOrders = await readAllOrders();
    const currentUser = await getUserById(submitterId);
    let visibleOrders;
    if (viewAll && submitterId === ADMIN_EMPLOYEE_ID) {
      visibleOrders = allOrders;
    } else {
      const accessLevel = (currentUser || {}).access_level || "self";
      if (accessLevel === "admin") {
        visibleOrders = allOrders;
      } else if (accessLevel === "department") {
        const currentDept = String((currentUser || {}).department || "").trim();
        if (!currentDept) {
          visibleOrders = allOrders;
        } else {
          const results = [];
          for (const o of allOrders) {
            if (isSameSubmitter(o, submitterId, submitterName)) {
              results.push(o);
              continue;
            }
            const orderUser = await getOrderSubmitterUser(o);
            const orderDept = String((orderUser || {}).department || "").trim();
            if (currentDept === orderDept) results.push(o);
          }
          visibleOrders = results;
        }
      } else {
        visibleOrders = allOrders.filter((o) => isSameSubmitter(o, submitterId, submitterName));
      }
    }
    if (filterModel) visibleOrders = visibleOrders.filter((o) => o.model === filterModel);
    if (filterCustomer) visibleOrders = visibleOrders.filter((o) => o.customer && o.customer.includes(filterCustomer));
    if (sortBy === "model") visibleOrders.sort((a, b) => (a.model || "").localeCompare(b.model || ""));
    else if (sortBy === "queueDate") visibleOrders.sort((a, b) => (b.queue_date || "").localeCompare(a.queue_date || ""));
    else if (sortBy === "tonnage") visibleOrders.sort((a, b) => (parseFloat(b.tonnage) || 0) - (parseFloat(a.tonnage) || 0));
    const total = visibleOrders.length;
    const totalPages = Math.ceil(total / PER_PAGE) || 1;
    const p = Math.max(1, Math.min(page, totalPages));
    const offset = (p - 1) * PER_PAGE;
    const pageOrders = visibleOrders.slice(offset, offset + PER_PAGE);
    return jsonResponse({
      success: true,
      orders: pageOrders,
      total,
      page: p,
      total_pages: totalPages,
      per_page: PER_PAGE
    });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleCreateOrder(request) {
  if (!requireAuth(request)) {
    return jsonResponse({ success: false, error: "\u672A\u6388\u6743", need_auth: true }, 401);
  }
  try {
    const data = await request.json();
    const model = data.model || "";
    const tonnage = data.tonnage || "";
    const customer = data.customer || "";
    const expectedDate = data.expected_date || "";
    const queueDate = data.queue_date || "";
    const submitter = data.submitter || "\u672A\u77E5\u7528\u6237";
    const submitterId = data.submitter_id || "";
    const remark = `${tonnage}${customer}`;
    const submitTime = getBeijingTimeStr();
    let targetRow = 0;
    let scanStart = 2;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let candidateRow = await getNextEmptyRow(scanStart, 50);
      if (candidateRow < 2) candidateRow = 2;
      await ensureSheetRows(candidateRow + 10);
      const verifyVal = await readSingleCell(SHEET_ID, `A${candidateRow}`);
      if (verifyVal && verifyVal.trim()) {
        console.log(`[create_order] \u7B2C${attempt + 1}\u6B21\u5C1D\u8BD5\uFF1A\u884C${candidateRow} A\u5217\u6709\u503C\uFF08${verifyVal}\uFF09\uFF0C\u7EE7\u7EED\u5F80\u4E0B\u627E...`);
        scanStart = candidateRow + 1;
        continue;
      }
      targetRow = candidateRow;
      console.log(`[create_order] \u627E\u5230\u7A7A\u884C\uFF1A\u884C${targetRow}\uFF08\u7B2C${attempt + 1}\u6B21\u5C1D\u8BD5\uFF09`);
      break;
    }
    if (!targetRow) {
      return jsonResponse({ success: false, error: "\u672A\u80FD\u627E\u5230\u53EF\u7528\u7A7A\u884C\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" });
    }
    const serialNo = String(targetRow);
    const writeRowIdx = targetRow - 1;
    const result = await writeOrderRow(
      writeRowIdx,
      model,
      tonnage,
      customer,
      expectedDate,
      "",
      queueDate,
      submitter,
      remark,
      serialNo,
      submitterId,
      submitTime
    );
    if (!result.ok) {
      return jsonResponse({ success: false, error: "\u5199\u5165\u8868\u683C\u5931\u8D25" });
    }
    try {
      const mColBody = {
        requests: [{
          updateRangeRequest: {
            sheetId: SHEET_ID,
            gridData: {
              startRow: writeRowIdx,
              startColumn: 12,
              // M column (index 12)
              rows: [{
                values: [
                  buildCellValue(tonnage, false, true)
                ]
              }]
            }
          }
        }]
      };
      await batchUpdate(mColBody);
      console.log(`[create_order] \u5DF2\u5199\u5165M\u5217\u9996\u6B21\u5F55\u5165\u5428\u4F4D\uFF1A${tonnage}\uFF0C\u884C${targetRow}`);
    } catch (mErr) {
      console.log(`[create_order] \u5199\u5165M\u5217\u9996\u6B21\u5F55\u5165\u5428\u4F4D\u5931\u8D25\uFF08\u4E0D\u5F71\u54CD\u4E3B\u6D41\u7A0B\uFF09\uFF1A${mErr.message}`);
    }
    ordersCache = null;
    return jsonResponse({
      success: true,
      message: "\u8BA2\u5355\u521B\u5EFA\u6210\u529F",
      row: targetRow
    });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleGetOrder(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "\u672A\u6388\u6743", need_auth: true }, 401);
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const rowIndex = parseInt(parts[parts.length - 1]);
    if (!rowIndex) return jsonResponse({ success: false, error: "\u65E0\u6548\u884C\u53F7" });
    const gridData = await readSheetRange(SHEET_ID, `A${rowIndex}:L${rowIndex}`);
    const rows = gridData.rows || [];
    if (!rows.length) return jsonResponse({ success: false, error: "\u8BA2\u5355\u4E0D\u5B58\u5728" });
    const values = rows[0].values || [];
    const rowData = values.map((v) => parseCellValue(v.cellValue));
    const order = parseOrderRow(rowData);
    order.row_index = rowIndex;
    return jsonResponse({ success: true, order });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleUpdateOrder(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "\u672A\u6388\u6743", need_auth: true }, 401);
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const rowIndex = parseInt(parts[parts.length - 1]);
    if (!rowIndex) return jsonResponse({ success: false, error: "\u65E0\u6548\u884C\u53F7" });
    const data = await request.json();
    const model = data.model || "";
    const tonnage = data.tonnage || "";
    const customer = data.customer || "";
    const expectedDate = data.expected_date || "";
    const queueDate = data.queue_date || "";
    const submitter = data.submitter || "";
    const submitterId = data.submitter_id || "";
    const remark = `${tonnage}${customer}`;
    const currentUser = await getUserById(submitterId) || {};
    const gridData = await readSheetRange(SHEET_ID, `A${rowIndex}:L${rowIndex}`);
    const rows = gridData.rows || [];
    if (!rows.length) return jsonResponse({ success: false, error: "\u8BA2\u5355\u4E0D\u5B58\u5728" });
    const origValues = rows[0].values.map((v) => parseCellValue(v.cellValue));
    const originalTonnage = origValues[1] || "0";
    const originalQueueDate = origValues[5] || "";
    const originalOrder = {
      submitter: origValues[6] || "",
      submitter_id: origValues[10] || ""
    };
    if (!await canOperateOrder(originalOrder, currentUser, submitterId, submitter, "all")) {
      return jsonResponse({ success: false, error: "\u65E0\u6743\u4FEE\u6539\u4ED6\u4EBA\u8BA2\u5355" });
    }
    try {
      if (parseFloat(tonnage) > parseFloat(originalTonnage)) {
        return jsonResponse({ success: false, error: "\u5428\u4F4D\u53EA\u80FD\u6539\u5C0F\u4E0D\u80FD\u6539\u5927" });
      }
    } catch (e) {
    }
    const hasOriginalQueue = !!(originalQueueDate && isDateString(originalQueueDate) && originalTonnage);
    const [calcDateForUpdate, calcError] = await calculateDeliveryDate(
      model,
      tonnage,
      expectedDate,
      hasOriginalQueue ? originalQueueDate : null,
      hasOriginalQueue ? originalTonnage : null
    );
    if (calcDateForUpdate && calcDateForUpdate === "\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301") {
      return jsonResponse({ success: false, error: "\u53EF\u53D1\u8D27\u65E5\u671F\uFF1A\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u4FEE\u6539" });
    }
    if (calcDateForUpdate && isDateString(calcDateForUpdate) && queueDate && isDateString(queueDate)) {
      const calcD = parseDate(calcDateForUpdate);
      const queueD = parseDate(queueDate);
      if (queueD < calcD) {
        return jsonResponse({ success: false, error: `\u6392\u961F\u65E5\u671F\u4E0D\u80FD\u65E9\u4E8E\u53EF\u53D1\u8D27\u65E5\u671F\uFF08${calcDateForUpdate}\uFF09` });
      }
    }
    const submitTime = getBeijingTimeStr();
    const result = await writeOrderRow(
      rowIndex - 1,
      model,
      tonnage,
      customer,
      expectedDate,
      calcDateForUpdate,
      queueDate,
      submitter,
      remark,
      String(rowIndex),
      submitterId,
      submitTime
    );
    if (!result.ok) return jsonResponse({ success: false, error: "\u66F4\u65B0\u5931\u8D25" });
    ordersCache = null;
    return jsonResponse({ success: true, message: "\u8BA2\u5355\u4FEE\u6539\u6210\u529F" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleDeleteOrder(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "\u672A\u6388\u6743", need_auth: true }, 401);
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const rowIndex = parseInt(parts[parts.length - 1]);
    if (!rowIndex) return jsonResponse({ success: false, error: "\u65E0\u6548\u884C\u53F7" });
    const data = await request.json().catch(() => ({}));
    const expectedOrder = data.order || data;
    const submitterId = new URL(request.url).searchParams.get("submitter_id") || "";
    const submitterName = new URL(request.url).searchParams.get("submitter_name") || "";
    const currentUser = await getUserById(submitterId) || {};
    const gridData = await readSheetRange(SHEET_ID, `A${rowIndex}:L${rowIndex}`);
    const rows = gridData.rows || [];
    if (!rows.length) return jsonResponse({ success: false, error: "\u8BA2\u5355\u4E0D\u5B58\u5728" });
    const origValues = rows[0].values.map((v) => parseCellValue(v.cellValue));
    const originalOrder = {
      model: origValues[0] || "",
      customer: origValues[2] || "",
      submitter: origValues[6] || "",
      submitter_id: origValues[10] || "",
      submit_time: origValues[11] || ""
    };
    if (!orderMatchesExpected(originalOrder, expectedOrder)) {
      return jsonResponse({ success: false, error: "\u8BA2\u5355\u884C\u53F7\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5\uFF0C\u672A\u6267\u884C\u5220\u9664" });
    }
    if (!await canOperateOrder(originalOrder, currentUser, submitterId, submitterName, "all")) {
      return jsonResponse({ success: false, error: "\u65E0\u6743\u5220\u9664\u4ED6\u4EBA\u8BA2\u5355" });
    }
    const result = await deleteRow(rowIndex);
    if (!result.ok) return jsonResponse({ success: false, error: "\u5220\u9664\u5931\u8D25" });
    ordersCache = null;
    return jsonResponse({ success: true, message: "\u8BA2\u5355\u5220\u9664\u6210\u529F" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleCalculateDate(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "\u672A\u6388\u6743", need_auth: true }, 401);
  try {
    const data = await request.json();
    const model = (data.model || "").trim();
    const tonnage = data.tonnage || "";
    const expectedDate = (data.expected_date || "").trim();
    const originalQueueDate = data.original_queue_date || "";
    const originalTonnage = data.original_tonnage || "";
    const forceRefresh = !!data.force_refresh;
    if (forceRefresh) clearCache();
    const [calculatedDate, errorMsg] = await calculateDeliveryDate(
      model,
      tonnage,
      expectedDate,
      originalQueueDate || null,
      originalTonnage || null
    );
    if (errorMsg && errorMsg !== "\u8BF7\u8054\u7CFB\u5546\u52A1\u652F\u6301") {
      return jsonResponse({ success: false, error: errorMsg });
    }
    return jsonResponse({
      success: true,
      calculated_date: calculatedDate,
      row_index: 0,
      message: ""
    });
  } catch (e) {
    return jsonResponse({ success: false, error: `\u8BA1\u7B97\u5F02\u5E38: ${e.message}` });
  }
}
async function handleClearTempRow(request) {
  try {
    const data = await request.json();
    const rowIndex = data.row_index || 0;
    if (rowIndex > 0) {
      await clearTempRow(rowIndex);
    }
    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleCleanupTempRows(request) {
  return jsonResponse({ success: true, cleared_rows: [] });
}
async function handleUpdatePassword(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "\u672A\u6388\u6743", need_auth: true }, 401);
  try {
    const data = await request.json();
    const employeeId = data.employee_id || "";
    const oldPassword = data.old_password || "";
    const newPassword = data.new_password || "";
    if (!employeeId || !oldPassword || !newPassword) {
      return jsonResponse({ success: false, error: "\u53C2\u6570\u4E0D\u5B8C\u6574" });
    }
    if (newPassword.length < 6) {
      return jsonResponse({ success: false, error: "\u65B0\u5BC6\u7801\u81F3\u5C116\u4F4D" });
    }
    if (!(/[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword))) {
      return jsonResponse({ success: false, error: "\u5BC6\u7801\u5FC5\u987B\u540C\u65F6\u5305\u542B\u5B57\u6BCD\u548C\u6570\u5B57" });
    }
    const { readSheetRange: readRange, batchUpdate: doUpdate, getAccessToken: getAccessToken2 } = await Promise.resolve().then(() => (init_tencent_api(), tencent_api_exports));
    const token = await getAccessToken2();
    const headers = {
      "Content-Type": "application/json",
      "Access-Token": token,
      "Open-Id": "9bc172e5338147d8a35c1438ea8d1577",
      "Client-Id": "da815d1227294457b43413bdc16e3e90"
    };
    const resp = await fetch(`https://docs.qq.com/openapi/spreadsheet/v3/files/${USER_FILE_ID}/${USER_SHEET_ID}/A2:C200`, {
      headers,
      signal: AbortSignal.timeout(8e3)
    });
    if (!resp.ok) return jsonResponse({ success: false, error: "\u8BFB\u53D6\u7528\u6237\u8868\u5931\u8D25" });
    const respData = await resp.json();
    const rows = respData.gridData?.rows || [];
    let targetRow = null;
    for (let i = 0; i < rows.length; i++) {
      const values = rows[i].values || [];
      const rowData = values.map((v) => parseCellValue(v.cellValue));
      if (rowData.length >= 2 && normalizeUserKey(rowData[1]) === normalizeUserKey(employeeId)) {
        if (rowData.length >= 3 && rowData[2] === oldPassword) {
          targetRow = i + 2;
        } else {
          return jsonResponse({ success: false, error: "\u65E7\u5BC6\u7801\u9519\u8BEF" });
        }
        break;
      }
    }
    if (targetRow === null) {
      return jsonResponse({ success: false, error: "\u5458\u5DE5\u53F7\u4E0D\u5B58\u5728" });
    }
    const body = {
      requests: [{
        updateRangeRequest: {
          sheetId: USER_SHEET_ID,
          gridData: {
            startRow: targetRow - 1,
            // 0-based
            startColumn: 2,
            // C column
            rows: [{ values: [{ cellValue: { text: newPassword } }] }]
          }
        }
      }]
    };
    const updateResp = await fetch(`https://docs.qq.com/openapi/spreadsheet/v3/files/${USER_FILE_ID}/batchUpdate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8e3)
    });
    const updateData = await updateResp.json();
    if (updateData.responses) {
      ordersCache = null;
      return jsonResponse({ success: true, message: "\u5BC6\u7801\u4FEE\u6539\u6210\u529F" });
    }
    return jsonResponse({ success: false, error: JSON.stringify(updateData) });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

// src/handlers/admin.js
init_tencent_api();
init_utils();
var ACCESS_PASSWORD3 = "queue2025";
function requireAuth2(request) {
  const password = request.headers.get("X-Access-Password") || "";
  return password === ACCESS_PASSWORD3;
}
function requireAdmin(request) {
  if (!requireAuth2(request)) return false;
  const employeeId = normalizeUserKey(request.headers.get("X-Employee-Id") || "");
  return employeeId === ADMIN_EMPLOYEE_ID;
}
function decodeJwtExpiry(token) {
  if (!token) return 0;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return 0;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp || 0;
  } catch (e) {
    return 0;
  }
}
function maskValue(value) {
  if (!value) return "";
  const s = String(value);
  if (s.length <= 8) return `${s[0]}***${s[s.length - 1]}`;
  return `${s.slice(0, 4)}***${s.slice(-4)}`;
}
var ACCESS_TOKEN_DEFAULT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHQiOiJkYTgxNWQxMjI3Mjk0NDU3YjQzNDEzYmRjMTZlM2U5MCIsInR5cCI6MSwiZXhwIjoxNzgyMDk0NTcyLjEwODc1MywiaWF0IjoxNzc5NTAyNTcyLjEwODc1Mywic3ViIjoiOWJjMTcyZTUzMzgxNDdkOGEzNWMxNDM4ZWE4ZDE1NzcifQ.rm3BIdD1V7FrCwdToT2arErs06xWF7hTqAh0KsCKsdw";
async function handleAdminStatus(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  const now = Math.floor(Date.now() / 1e3);
  const currentToken = await getAccessToken();
  const isDefault = currentToken === ACCESS_TOKEN_DEFAULT;
  const tokenExp = decodeJwtExpiry(currentToken);
  const remainingSeconds = tokenExp > now ? tokenExp - now : 0;
  const present = !!currentToken;
  const items = [
    {
      name: "TENCENT_ACCESS_TOKEN",
      present,
      remaining_seconds: remainingSeconds,
      masked: maskValue(currentToken)
    },
    {
      name: "RENDER_API_KEY",
      present: true,
      remaining_seconds: null,
      masked: "\u7531\u4E3B Render \u670D\u52A1\u7BA1\u7406"
    },
    {
      name: "GITHUB_TOKEN",
      present: true,
      remaining_seconds: null,
      masked: "\u7531\u4E3B Render \u670D\u52A1\u7BA1\u7406"
    }
  ];
  return jsonResponse({
    success: true,
    items,
    is_default_token: isDefault,
    service: "Cloudflare Worker",
    mode: "backup",
    version: "cf-v2.0"
  });
}
async function handleAdminValidate(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  try {
    const token = await getAccessToken();
    const defaultToken = getDefaultAccessToken();
    const isDefault = token === defaultToken;
    const exp = decodeJwtExpiry(token);
    const now = Math.floor(Date.now() / 1e3);
    const valid = exp > now;
    return jsonResponse({ success: true, validated: valid, is_default: isDefault, remaining_seconds: exp > now ? exp - now : 0 });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleAdminDeploy(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  return jsonResponse({ success: true, message: "CloudFlare version auto-deploys on git push" });
}
async function handleAdminUpdate(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  try {
    const data = await request.json();
    const name = data.name || data.key || "";
    const value = data.value || "";
    if (name === "RENDER_API_KEY" || name === "GITHUB_TOKEN") {
      return jsonResponse({ success: false, error: "\u6B64\u51ED\u8BC1\u7531\u4E3B Render \u670D\u52A1\u7BA1\u7406\uFF0CCloudflare \u5907\u4EFD\u8282\u70B9\u4EC5\u652F\u6301\u66F4\u65B0\u817E\u8BAF access_token" });
    }
    if (name === "TENCENT_ACCESS_TOKEN") {
      await saveAccessToken(value);
      updateTokens(null, value, null);
      clearCache();
      return jsonResponse({ success: true, message: "\u817E\u8BAF access_token \u5DF2\u4FDD\u5B58\u5230 Cloudflare \u8282\u70B9", log: { key: name, masked: maskValue(value) } });
    }
    if (name === "CLIENT_ID") {
      updateTokens(value, null, null);
      return jsonResponse({ success: true, message: `\u51ED\u8BC1 ${name} \u5DF2\u66F4\u65B0` });
    }
    return jsonResponse({ success: false, error: "\u672A\u77E5\u51ED\u8BC1\u7C7B\u578B" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleAdminHealth(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  try {
    const token = await getAccessToken();
    const resp = await fetch("https://docs.qq.com/openapi/spreadsheet/v3/files/DRnhDemRIS25mdnFF", {
      headers: {
        "Access-Token": token,
        "Open-Id": "9bc172e5338147d8a35c1438ea8d1577",
        "Client-Id": "da815d1227294457b43413bdc16e3e90"
      },
      signal: AbortSignal.timeout(8e3)
    });
    const data = resp.ok ? await resp.json().catch(() => null) : null;
    return jsonResponse({
      success: true,
      status: resp.ok && data && !data.code ? "ok" : "error",
      http_status: resp.status,
      api_code: data?.code || null,
      service: "cloudflare-worker"
    });
  } catch (e) {
    return jsonResponse({ success: false, status: "error", error: e.message });
  }
}
async function handleDebugCapacity(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  return jsonResponse({ success: true, message: "Debug not available in CloudFlare version" });
}
async function handleTestConnection(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  try {
    const resp = await fetch("https://docs.qq.com/openapi/spreadsheet/v3/files/DRnhDemRIS25mdnFF", {
      headers: {
        "Access-Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHQiOiJkYTgxNWQxMjI3Mjk0NDU3YjQzNDEzYmRjMTZlM2U5MCIsInR5cCI6MSwiZXhwIjoxNzgyMDk0NTcyLjEwODc1MywiaWF0IjoxNzc5NTAyNTcyLjEwODc1Mywic3ViIjoiOWJjMTcyZTUzMzgxNDdkOGEzNWMxNDM4ZWE4ZDE1NzcifQ.rm3BIdD1V7FrCwdToT2arErs06xWF7hTqAh0KsCKsdw",
        "Open-Id": "9bc172e5338147d8a35c1438ea8d1577",
        "Client-Id": "da815d1227294457b43413bdc16e3e90"
      }
    });
    return jsonResponse({ success: resp.ok, status: resp.status });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleDiagCalcEngine(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  return jsonResponse({ success: true, message: "Calc engine running in memory" });
}
async function handleRefreshCapacity(request) {
  if (!requireAuth2(request)) return jsonResponse({ success: false, error: "\u672A\u6388\u6743", need_auth: true }, 401);
  try {
    clearCache();
    return jsonResponse({ success: true, message: "\u7F13\u5B58\u5DF2\u6E05\u9664\uFF0C\u6570\u636E\u5C06\u5728\u4E0B\u6B21\u8BF7\u6C42\u65F6\u91CD\u65B0\u52A0\u8F7D" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleCacheStatus(request) {
  return jsonResponse({ success: true, message: "Cache is in-memory, expires every 5 minutes" });
}
async function handleAdminModelConfigsGet(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  try {
    const configs = await readModelConfigsFromSheet();
    return jsonResponse({ success: true, configs });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}
async function handleAdminModelConfigsPost(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "\u65E0\u7BA1\u7406\u5458\u6743\u9650" }, 403);
  return jsonResponse({ success: false, error: "CloudFlare\u7248\u672C\u4E0D\u652F\u6301\u4FEE\u6539\u724C\u53F7\u914D\u7F6E" });
}

// src/index.js
init_utils();
var preloaded = false;
var index_default = {
  async fetch(request, env, ctx) {
    if (env.TOKEN_STORE) {
      setTokenStore(env.TOKEN_STORE);
    }
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Access-Password, X-Employee-Id",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    if (!preloaded && (path.startsWith("/api/") || path.startsWith("/auth/"))) {
      preloaded = true;
      ctx.waitUntil(preloadAllModels());
    }
    try {
      if (path === "/auth/check" && request.method === "GET") return handleAuthCheck(request);
      if (path === "/auth/login" && request.method === "POST") return handleAuthLogin(request);
      if (path === "/auth/users" && request.method === "GET") return handleAuthUsers(request);
      if (path === "/api/models" && request.method === "GET") return handleModels(request);
      if (path === "/api/calculate-date" && request.method === "POST") return handleCalculateDate(request);
      if (path === "/api/orders" && request.method === "GET") return handleGetOrders(request);
      if (path === "/api/orders" && request.method === "POST") return handleCreateOrder(request);
      if (path.match(/^\/api\/orders\/\d+$/) && request.method === "GET") return handleGetOrder(request);
      if (path.match(/^\/api\/orders\/\d+$/) && request.method === "PUT") return handleUpdateOrder(request);
      if (path.match(/^\/api\/orders\/\d+$/) && request.method === "DELETE") return handleDeleteOrder(request);
      if (path === "/api/clear-temp-row" && request.method === "POST") return handleClearTempRow(request);
      if (path === "/api/cleanup-user-temp-rows" && request.method === "POST") return handleCleanupTempRows(request);
      if (path === "/api/users/password" && request.method === "PUT") return handleUpdatePassword(request);
      if (path === "/api/admin/status" && request.method === "GET") return handleAdminStatus(request);
      if (path === "/api/admin/validate" && request.method === "POST") return handleAdminValidate(request);
      if (path === "/api/admin/deploy" && request.method === "POST") return handleAdminDeploy(request);
      if (path === "/api/admin/update" && request.method === "POST") return handleAdminUpdate(request);
      if (path === "/api/admin/health" && request.method === "GET") return handleAdminHealth(request);
      if (path === "/api/debug/capacity" && request.method === "GET") return handleDebugCapacity(request);
      if (path === "/api/test-connection" && request.method === "GET") return handleTestConnection(request);
      if (path === "/api/diag-calc-engine" && request.method === "GET") return handleDiagCalcEngine(request);
      if (path === "/api/refresh-capacity-data" && request.method === "POST") return handleRefreshCapacity(request);
      if (path === "/api/cache-status" && request.method === "GET") return handleCacheStatus(request);
      if (path === "/api/admin/model-configs" && request.method === "GET") return handleAdminModelConfigsGet(request);
      if (path === "/api/admin/model-configs" && request.method === "POST") return handleAdminModelConfigsPost(request);
      if (path.startsWith("/api/") || path.startsWith("/auth/")) {
        return jsonResponse({ success: false, error: "Not Found" }, 404);
      }
      try {
        if (env.ASSETS) {
          const assetResponse = await env.ASSETS.fetch(request);
          if (assetResponse && assetResponse.status !== 404) return assetResponse;
        }
        const indexResponse = env.ASSETS ? await env.ASSETS.fetch(new Request(new URL("/index.html", request.url))) : null;
        if (indexResponse && indexResponse.status !== 404) return indexResponse;
      } catch (e) {
      }
      return new Response("Not Found", { status: 404 });
    } catch (e) {
      console.error(`[Worker] Error handling ${path}:`, e.message);
      return jsonResponse({ success: false, error: `\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF: ${e.message}` }, 500);
    }
  }
};
export {
  index_default as default
};
