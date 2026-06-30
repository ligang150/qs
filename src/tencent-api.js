// Tencent Docs API wrapper
import { getBeijingTimeStr, parseCellValue, buildCellValue, parseDate, parseNumber, formatDate } from './utils.js';

const BASE_URL = "https://docs.qq.com/openapi/spreadsheet/v3";

// Config (same as original app.py)
const FILE_ID = "DRnhDemRIS25mdnFF";
const SHEET_ID = "000007";
const MODEL_FILE_ID = "DRmxUY0RBQVJXRXpC";
const MODEL_SHEET_ID = "fkayvi";
const USER_FILE_ID = "DRmxUY0RBQVJXRXpC";
const USER_SHEET_ID = "s9osf8";
const CONFIG_FILE_ID = "DRnhDemRIS25mdnFF";

const DEFAULT_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHQiOiJkYTgxNWQxMjI3Mjk0NDU3YjQzNDEzYmRjMTZlM2U5MCIsInR5cCI6MSwiZXhwIjoxNzgyMDk0NTcyLjEwODc1MywiaWF0IjoxNzc5NTAyNTcyLjEwODc1Mywic3ViIjoiOWJjMTcyZTUzMzgxNDdkOGEzNWMxNDM4ZWE4ZDE1NzcifQ.rm3BIdD1V7FrCwdToT2arErs06xWF7hTqAh0KsCKsdw";

let CLIENT_ID = "da815d1227294457b43413bdc16e3e90";
let OPEN_ID = "9bc172e5338147d8a35c1438ea8d1577";

// KV-backed token store
let _tokenStore = null;
let _cachedToken = null;

export function setTokenStore(kv) {
  _tokenStore = kv;
}

export async function getAccessToken() {
  if (_tokenStore) {
    try {
      const stored = await _tokenStore.get("TENCENT_ACCESS_TOKEN");
      if (stored) {
        _cachedToken = stored;
        return stored;
      }
    } catch (e) { /* fall through */ }
  }
  return _cachedToken || DEFAULT_ACCESS_TOKEN;
}

export async function saveAccessToken(token) {
  _cachedToken = token;
  if (_tokenStore) {
    try {
      await _tokenStore.put("TENCENT_ACCESS_TOKEN", token);
    } catch (e) { console.error("[KV] save token error:", e.message); }
  }
}

export function getDefaultAccessToken() {
  return DEFAULT_ACCESS_TOKEN;
}

export function updateTokens(clientId, accessToken, openId) {
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
  const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!resp.ok) {
    console.log(`[TencentAPI] HTTP ${resp.status}: ${path}`);
    return null;
  }
  const data = await resp.json();
  if (data.code && data.code !== 0) {
    console.log(`[TencentAPI] Error code=${data.code}: ${data.message || ''} for ${path}`);
    return null;
  }
  return data;
}

async function apiPost(path, body) {
  const url = `${BASE_URL}${path}`;
  const headers = await getHeaders();
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });
  return resp;
}

export async function readSheetRange(sheetId, rangeStr, fileId = null) {
  const fid = fileId || FILE_ID;
  const data = await apiGet(`/files/${fid}/${sheetId}/${rangeStr}`);
  return data ? data.gridData || {} : {};
}

export async function readSingleCell(sheetId, cell, fileId = null) {
  const gridData = await readSheetRange(sheetId, `${cell}:${cell}`, fileId);
  const rows = gridData.rows || [];
  if (rows.length > 0) {
    for (const v of rows[0].values || []) {
      if (v.cellValue) return parseCellValue(v.cellValue);
    }
  }
  return "";
}

export async function batchUpdate(body) {
  const resp = await apiPost(`/files/${FILE_ID}/batchUpdate`, body);
  if (!resp.ok) {
    console.log(`[TencentAPI] batchUpdate failed HTTP ${resp.status}`);
    return { ok: false, status: resp.status };
  }
  const data = await resp.json();
  return { ok: true, data };
}

export async function getFileInfo() {
  return await apiGet(`/files/${FILE_ID}`);
}

export async function readUsers() {
  const data = await apiGet(`/files/${USER_FILE_ID}/${USER_SHEET_ID}/A2:F200`);
  const users = [];
  if (!data) {
    // Fallback admin
    users.push({
      name: "李刚", employee_id: "20150465", password: "queue2025",
      is_admin: true, is_manager: false, role: "管理员",
      department: "", access_level: "admin", permission: "能操作所有数据"
    });
    return users;
  }
  const rows = data.gridData?.rows || [];
  for (const row of rows) {
    const values = row.values || [];
    const rowData = values.map(v => parseCellValue(v.cellValue));
    if (rowData.length >= 3 && rowData[0] && rowData[1]) {
      const role = (rowData[3] || "").trim();
      const department = (rowData[4] || "").trim();
      const permissionText = (rowData[5] || "").trim();
      const isAdmin = role === "管理员" || permissionText === "能操作所有数据";
      const isManager = role === "经理" || permissionText === "能操作本部门所有数据";
      const accessLevel = isAdmin ? "admin" : (isManager ? "department" : "self");
      users.push({
        name: rowData[0], employee_id: rowData[1], password: rowData[2],
        is_admin: isAdmin, is_manager: isManager, role,
        department, access_level: accessLevel, permission: permissionText
      });
    }
  }
  if (users.length === 0) {
    users.push({
      name: "李刚", employee_id: "20150465", password: "queue2025",
      is_admin: true, is_manager: false, role: "管理员",
      department: "", access_level: "admin", permission: "能操作所有数据"
    });
  }
  return users;
}

export async function readModelConfigsFromSheet() {
  const configSheetId = "dc53jt";
  const data = await apiGet(`/files/${CONFIG_FILE_ID}/${configSheetId}/A2:F200`);
  if (!data) return {};
  const rows = data.gridData?.rows || [];
  const configs = {};
  for (const row of rows) {
    const values = row.values || [];
    if (values.length < 6) continue;
    const cells = values.slice(0, 6).map(v => parseCellValue(v.cellValue));
    const modelName = (cells[0] || "").trim();
    if (!modelName) continue;
    try {
      let sheetId = (cells[1] || "").trim();
      if (/^\d+$/.test(sheetId) && sheetId.length < 6) sheetId = sheetId.padStart(6, '0');
      const startRow = parseInt(cells[2]);
      const capacityCol = (cells[3] || "").trim();
      const limitCell = (cells[4] || "").trim();
      const rowCount = parseInt(cells[5]);
      configs[modelName] = [sheetId, startRow, capacityCol, limitCell, rowCount];
    } catch (e) { /* skip invalid */ }
  }
  return configs;
}

export async function readModels() {
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

export async function ensureSheetRows(minRowCount) {
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

export async function writeOrderRow(rowIndex0based, model, tonnage, customer, expectedDate, calculatedDate, queueDate, submitter, remark, serialNo, submitterId, submitTime) {
  const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v).trim());
  const requests = [
    {
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: rowIndex0based, startColumn: 0,
          rows: [{
            values: [
              buildCellValue(model),
              buildCellValue(tonnage, false, true),
              buildCellValue(customer),
              buildCellValue(expectedDate, true),
            ]
          }]
        }
      }
    },
    {
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: rowIndex0based, startColumn: 5,
          rows: [{
            values: [
              buildCellValue(queueDate, isDate(queueDate)),
              buildCellValue(submitter),
              buildCellValue(remark),
              buildCellValue(serialNo),
              buildCellValue(""),
              buildCellValue(submitterId),
              buildCellValue(submitTime),
            ]
          }]
        }
      }
    }
  ];
  return await batchUpdate({ requests });
}

export async function deleteRow(rowIndex1based) {
  const idx = rowIndex1based - 1;
  const requests = [
    { updateRangeRequest: { sheetId: SHEET_ID, gridData: { startRow: idx, startColumn: 1, rows: [{ values: [buildCellValue("")] }] } } },
    { updateRangeRequest: { sheetId: SHEET_ID, gridData: { startRow: idx, startColumn: 7, rows: [{ values: [buildCellValue("")] }] } } },
    { updateRangeRequest: { sheetId: SHEET_ID, gridData: { startRow: idx, startColumn: 9, rows: [{ values: [buildCellValue("DELETED")] }] } } }
  ];
  return await batchUpdate({ requests });
}

export async function updateOrderRow(rowIndex1based, model, tonnage, customer, expectedDate, calculatedDate, queueDate, submitter, serialNo) {
  const idx = rowIndex1based - 1;
  const requests = [
    {
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: idx, startColumn: 0,
          rows: [{
            values: [
              buildCellValue(model),
              buildCellValue(tonnage, false, true),
              buildCellValue(customer),
              buildCellValue(expectedDate, true),
            ]
          }]
        }
      }
    },
    {
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: idx, startColumn: 5,
          rows: [{
            values: [
              buildCellValue(queueDate, /^\d{4}-\d{2}-\d{2}$/.test(String(queueDate).trim())),
              buildCellValue(submitter),
              buildCellValue(""),  // H column (remark) - keep empty
            ]
          }]
        }
      }
    }
  ];
  return await batchUpdate({ requests });
}

export async function clearTempRow(rowIndex1based) {
  if (rowIndex1based < 2) return null;
  // Safety: check if already submitted
  const kVal = await readSingleCell(SHEET_ID, `K${rowIndex1based}`);
  if (kVal && kVal.trim()) return null; // already submitted, don't clear

  const idx = rowIndex1based - 1;
  const body = {
    requests: [{
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: idx, startColumn: 0,
          rows: [{ values: [buildCellValue(""), buildCellValue(""), buildCellValue(""), buildCellValue("")] }]
        }
      }
    }]
  };
  return await batchUpdate(body);
}

export async function writeTempRow(rowIndex0based, model, tonnage, expectedDate) {
  const body = {
    requests: [{
      updateRangeRequest: {
        sheetId: SHEET_ID,
        gridData: {
          startRow: rowIndex0based, startColumn: 0,
          rows: [{
            values: [
              buildCellValue(model),
              buildCellValue(tonnage, false, true),
              buildCellValue(""),
              buildCellValue(expectedDate, true),
            ]
          }]
        }
      }
    }]
  };
  return await batchUpdate(body);
}

export { FILE_ID, SHEET_ID, MODEL_FILE_ID, MODEL_SHEET_ID, USER_FILE_ID, USER_SHEET_ID, CONFIG_FILE_ID };
