// Date calculation engine - ported from calc_engine.py
import { readSheetRange, readSingleCell, readModelConfigsFromSheet } from './tencent-api.js';
import { parseCellValue, parseDate, parseNumber, formatDate } from './utils.js';

// Model configuration (from calc_engine.py MODEL_CONFIG)
const MODEL_CONFIG = {
  "F5631":  ["000005", 6, "J", "M1", 179],
  "F3500":  ["000005", 6, "K", "N1", 179],
  "C210":   ["000003", 4, "AC", "E1", 180],
  "C220":   ["000003", 4, "AD", "F1", 180],
  "C230":   ["000003", 4, "AE", "G1", 180],
  "C240A":  ["000003", 4, "AF", "H1", 180],
  "C3050A": ["000003", 4, "AG", "I1", 180],
  "C280":   ["000003", 4, "AH", "J1", 180],
  "330N":   ["00000a", 3, "H", "I1", 216],
  "F3600":  ["00000a", 3, "M", "O1", 216],
  "C204":   ["000006", 4, "AA", "F2", 225],
  "C307":   ["000006", 4, "AB", "G2", 225],
  "C305":   ["000006", 4, "AC", "H2", 225],
  "C310":   ["000006", 4, "AD", "I2", 225],
  "4110B":  ["000001", 4, "AB", "I2", 185],
  "5118G":  ["000001", 4, "AD", "L2", 185],
  "R4110":  ["000001", 4, "AE", "K2", 185],
  "6001C":  ["000001", 4, "AF", "M2", 185],
  "R403":   ["000001", 4, "AJ", "AK1", 185],
  "R6207":  ["000004", 3, "O", "I1", 201],
  "R6205":  ["000004", 3, "S", "J1", 201],
  "R6048":  ["000004", 3, "W", "K1", 201],
  "304铁桶": ["00000c", 3, "I", "L1", 186],
  "304吨桶": ["00000c", 3, "J", "M1", 186],
  "350T":   ["000009", 3, "N", "K1", 241],
  "8001A":  ["000009", 3, "Q", "O1", 241],
  "INOVOL R8315": ["000004", 3, "AB", "AP1", 180],
};

// In-memory cache
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

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

  // Read date column and capacity column in parallel
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
    result.sortedDates = Object.values(dateCapacityMap)
      .sort((a, b) => a.date - b.date)
      .map(e => e.date);
    result.capacities = result.sortedDates.map(d => dateCapacityMap[d.getTime()].capacity);
  }

  setCache(cacheKey, result);
  return result;
}

async function getModelConfig(model) {
  if (MODEL_CONFIG[model]) return MODEL_CONFIG[model];
  const sheetConfigs = await readModelConfigsFromSheet();
  return sheetConfigs[model] || null;
}

export async function calculateDeliveryDate(model, tonnageStr, expectedDateStr, originalQueueDateStr = null, originalTonnageStr = null) {
  // Check cache (no cache when compensation params are provided)
  const cacheKey = `calc:${model}:${tonnageStr}:${expectedDateStr}:${originalQueueDateStr || ''}:${originalTonnageStr || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const config = await getModelConfig(model);
  if (!config) return ["请联系商务支持", `型号 ${model} 暂无排产数据，请检查型号是否正确`];

  const tonnage = parseNumber(tonnageStr);
  if (tonnage === null || tonnage <= 0) return ["", "吨位不能为空或无效"];

  const expectedDate = parseDate(expectedDateStr);
  if (!expectedDate) return ["", `期望发货日期格式无效: ${expectedDateStr}`];

  const [sheetId, startRow, capacityCol, limitCell, rowCount] = config;

  const sheetData = await getSheetData(sheetId, startRow, capacityCol, limitCell, rowCount);
  const { dateCapacityMap, limitDate, sortedDates, capacities: origCapacities } = sheetData;

  if (!sortedDates || sortedDates.length === 0) {
    return ["请联系商务支持", "排产数据读取失败，请稍后重试或联系管理员检查Token"];
  }

  // ========== 修改排队时的产能补偿逻辑 ==========
  // 如果有原排队日期和原吨位，将原排队日期及之后每天的产能加上原吨位
  let capacities = origCapacities;
  const originalQueueDate = originalQueueDateStr ? parseDate(originalQueueDateStr) : null;
  const originalTonnage = originalTonnageStr ? parseNumber(originalTonnageStr) : null;

  if (originalQueueDate && originalTonnage && originalTonnage > 0) {
    capacities = [...origCapacities]; // copy, don't mutate cache
    const effectiveLimitDate = limitDate || sortedDates[sortedDates.length - 1];
    // Find index of original queue date
    let origIdx = 0;
    for (; origIdx < sortedDates.length; origIdx++) {
      if (sortedDates[origIdx] >= originalQueueDate) break;
    }
    // Find index of limit date
    let limitIdx = sortedDates.length - 1;
    for (let k = sortedDates.length - 1; k >= 0; k--) {
      if (sortedDates[k] <= effectiveLimitDate) { limitIdx = k; break; }
    }
    for (let k = origIdx; k <= Math.min(limitIdx, capacities.length - 1); k++) {
      capacities[k] += originalTonnage;
    }
  }
  // ===========================================

  const effectiveLimitDate = limitDate || sortedDates[sortedDates.length - 1];

  // Find index of expected date (bisect_left)
  let i = 0;
  for (; i < sortedDates.length; i++) {
    if (sortedDates[i] >= expectedDate) break;
  }
  if (i >= sortedDates.length) return ["请联系商务支持", "请联系商务支持"];

  // Find index of limit date (bisect_right - 1)
  let j = sortedDates.length - 1;
  for (let k = sortedDates.length - 1; k >= 0; k--) {
    if (sortedDates[k] <= effectiveLimitDate) { j = k; break; }
  }
  if (j < i) return ["请联系商务支持", "请联系商务支持"];

  // Scan backwards from j to i
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

  if (resultIdx < 0) return ["请联系商务支持", "请联系商务支持"];

  const resultDate = sortedDates[resultIdx];
  const resultStr = formatDate(resultDate);

  const result = resultDate.getTime() === expectedDate.getTime()
    ? [expectedDateStr, ""]
    : [resultStr, ""];

  setCache(cacheKey, result);
  return result;
}

export function clearCache() {
  cache.clear();
}

// Preload all model data (for initial warm-up)
export async function preloadAllModels() {
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
  const ok = results.filter(r => r.ok).length;
  console.log(`[preload] ${ok}/${results.length} models preloaded`);
  return { success: ok, total: results.length };
}
