// Orders CRUD handlers - synced with Flask app.py
import { readSheetRange, readSingleCell, writeOrderRow, deleteRow, updateOrderRow, clearTempRow, ensureSheetRows, batchUpdate, SHEET_ID, USER_FILE_ID, USER_SHEET_ID } from '../tencent-api.js';
import { calculateDeliveryDate, clearCache } from '../calc-engine.js';
import { readUsers } from '../tencent-api.js';
import { jsonResponse, parseCellValue, normalizeUserKey, getBeijingTimeStr, ADMIN_EMPLOYEE_ID, isDateString, parseDate, formatDate, buildCellValue } from '../utils.js';

// Pagination
const PER_PAGE = 20;

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

// Cache for orders
let ordersCache = null;
let ordersCacheTime = 0;
const ORDERS_CACHE_TTL = 60000; // 1 minute

async function readAllOrders(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && ordersCache && now - ordersCacheTime < ORDERS_CACHE_TTL) {
    return ordersCache;
  }

  const orders = [];
  const batchSize = 500;
  let emptyStreak = 0;

  for (let offset = 0; offset < 4000; offset += batchSize) {
    const start = offset + 1;
    const end = offset + batchSize;
    const gridData = await readSheetRange(SHEET_ID, `A${start}:L${end}`);
    const rows = gridData.rows || [];
    if (rows.length === 0) {
      emptyStreak++;
      if (emptyStreak >= 2) break;
      continue;
    }
    emptyStreak = 0;

    let foundAny = false;
    for (let i = 0; i < rows.length; i++) {
      const actualRow = start + i;
      if (actualRow < 2) continue;
      const values = rows[i].values || [];
      const rowData = values.map(v => parseCellValue(v.cellValue));
      const aVal = rowData[0] || "";
      const jVal = rowData[9] || "";
      if (!aVal) continue;
      if (jVal === "DELETED") continue;
      foundAny = true;
      const order = parseOrderRow(rowData);
      order.row_index = actualRow;
      orders.push(order);
    }

    if (!foundAny) {
      emptyStreak++;
      if (emptyStreak >= 2) break;
    }
  }

  ordersCache = orders;
  ordersCacheTime = now;
  return orders;
}

const ACCESS_PASSWORD = "queue2025";

function requireAuth(request) {
  const password = request.headers.get('X-Access-Password') || '';
  return password === ACCESS_PASSWORD;
}

// ============ 权限辅助函数 ============

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
    if (!currentDept) return true; // fallback: allow all when dept info incomplete
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

// ============ 查找空行 ============

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

// ============ 订单API ============

function normalizeViewMode(currentUser, requestedViewMode) {
  const accessLevel = (currentUser || {}).access_level || "self";
  if (requestedViewMode === "all") return "all";
  return "mine";
}

export async function handleGetOrders(request) {
  if (!requireAuth(request)) {
    return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '20');
    const modelFilter = url.searchParams.get('model_filter') || '';
    const customerFilter = url.searchParams.get('customer_filter') || '';
    const sortType = url.searchParams.get('sort') || '';
    const submitterId = normalizeUserKey(request.headers.get('X-Employee-Id') || '');
    const submitterName = url.searchParams.get('submitter_name') || '';
    const requestedViewMode = url.searchParams.get('view_mode') || 'mine';

    // Read all users once and build lookup maps (avoid per-order API calls)
    const allUsers = await readUsers();
    const userById = new Map();
    const userByName = new Map();
    for (const u of allUsers) {
      userById.set(normalizeUserKey(u.employee_id), u);
      userByName.set(String(u.name || "").trim(), u);
    }
    const getUserByIdCached = (id) => userById.get(normalizeUserKey(id)) || null;
    const getUserByNameCached = (name) => userByName.get(String(name || "").trim()) || null;
    const getOrderSubmitterCached = (order) => getUserByIdCached(order.submitter_id) || getUserByNameCached(order.submitter);

    const allOrders = await readAllOrders();

    // Get current user info
    const currentUser = getUserByIdCached(submitterId);
    const accessLevel = (currentUser || {}).access_level || "self";
    const isAdmin = accessLevel === "admin";
    const viewMode = normalizeViewMode(currentUser, requestedViewMode);

    // Filter by permission (inline to avoid async per-order calls)
    const visibleOrders = [];
    const currentDept = String((currentUser || {}).department || "").trim();

    for (const o of allOrders) {
      if (viewMode === "mine") {
        if (isSameSubmitter(o, submitterId, submitterName)) visibleOrders.push(o);
        continue;
      }
      // viewMode === "all"
      if (accessLevel === "admin") {
        visibleOrders.push(o);
        continue;
      }
      if (accessLevel === "department" || accessLevel === "self") {
        if (isSameSubmitter(o, submitterId, submitterName)) {
          visibleOrders.push(o);
          continue;
        }
        if (!currentDept) {
          visibleOrders.push(o); // fallback: allow all when dept info incomplete
          continue;
        }
        const orderUser = getOrderSubmitterCached(o);
        const orderDept = String((orderUser || {}).department || "").trim();
        if (currentDept && orderDept && currentDept === orderDept) {
          visibleOrders.push(o);
        }
      }
    }

    // Apply model filter
    if (modelFilter) {
      for (let i = visibleOrders.length - 1; i >= 0; i--) {
        if (visibleOrders[i].model !== modelFilter) visibleOrders.splice(i, 1);
      }
    }

    // Apply customer filter
    if (customerFilter) {
      const lowerFilter = customerFilter.toLowerCase();
      for (let i = visibleOrders.length - 1; i >= 0; i--) {
        const customer = String(visibleOrders[i].customer || "").toLowerCase();
        if (!customer.includes(lowerFilter)) visibleOrders.splice(i, 1);
      }
    }

    // Apply sorting
    if (sortType) {
      visibleOrders.sort((a, b) => {
        if (sortType === 'model') return (a.model || '').localeCompare(b.model || '');
        if (sortType === 'queueDate') return (b.queue_date || '9999-12-31').localeCompare(a.queue_date || '9999-12-31');
        if (sortType === 'tonnage') {
          const ta = parseFloat(a.tonnage) || 0;
          const tb = parseFloat(b.tonnage) || 0;
          return tb - ta;
        }
        return 0;
      });
    }

    // Pagination
    const total = visibleOrders.length;
    const safePerPage = Math.max(1, Math.min(perPage, 100));
    const totalPages = Math.ceil(total / safePerPage) || 1;
    const p = Math.max(1, Math.min(page, totalPages));
    const startIdx = (p - 1) * safePerPage;
    const endIdx = startIdx + safePerPage;
    const paginatedOrders = visibleOrders.slice(startIdx, endIdx);

    return jsonResponse({
      success: true,
      orders: paginatedOrders,
      is_admin: isAdmin,
      access_level: (currentUser || {}).access_level || "self",
      department: (currentUser || {}).department || "",
      view_mode: viewMode,
      pagination: {
        page: p,
        per_page: safePerPage,
        total: total,
        total_pages: totalPages
      }
    });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleCreateOrder(request) {
  if (!requireAuth(request)) {
    return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);
  }

  try {
    const data = await request.json();
    const model = data.model || '';
    const tonnage = data.tonnage || '';
    const customer = data.customer || '';
    const expectedDate = data.expected_date || '';
    const queueDate = data.queue_date || '';
    const submitter = data.submitter || '未知用户';
    const submitterId = data.submitter_id || '';
    const remark = `${tonnage}${customer}`;
    const submitTime = getBeijingTimeStr();

    // Scan for empty row with retry (up to 3 times)
    let targetRow = 0;
    let scanStart = 2;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let candidateRow = await getNextEmptyRow(scanStart, 50);
      if (candidateRow < 2) candidateRow = 2;

      // Ensure enough rows
      await ensureSheetRows(candidateRow + 10);

      // Verify: target row A column must be empty
      const verifyVal = await readSingleCell(SHEET_ID, `A${candidateRow}`);
      if (verifyVal && verifyVal.trim()) {
        console.log(`[create_order] 第${attempt + 1}次尝试：行${candidateRow} A列有值（${verifyVal}），继续往下找...`);
        scanStart = candidateRow + 1;
        continue;
      }

      targetRow = candidateRow;
      console.log(`[create_order] 找到空行：行${targetRow}（第${attempt + 1}次尝试）`);
      break;
    }

    if (!targetRow) {
      return jsonResponse({ success: false, error: "未能找到可用空行，请稍后重试" });
    }

    // Serial number: use row number
    const serialNo = String(targetRow);

    // Write order
    const writeRowIdx = targetRow - 1;
    const result = await writeOrderRow(
      writeRowIdx, model, tonnage, customer, expectedDate, "", queueDate,
      submitter, remark, serialNo, submitterId, submitTime
    );

    if (!result.ok) {
      return jsonResponse({ success: false, error: "写入表格失败" });
    }

    // Write M column (首次录入吨位)
    try {
      const mColBody = {
        requests: [{
          updateRangeRequest: {
            sheetId: SHEET_ID,
            gridData: {
              startRow: writeRowIdx,
              startColumn: 12,  // M column (index 12)
              rows: [{
                values: [
                  buildCellValue(tonnage, false, true),
                ]
              }]
            }
          }
        }]
      };
      await batchUpdate(mColBody);
      console.log(`[create_order] 已写入M列首次录入吨位：${tonnage}，行${targetRow}`);
    } catch (mErr) {
      console.log(`[create_order] 写入M列首次录入吨位失败（不影响主流程）：${mErr.message}`);
    }

    // Invalidate cache
    ordersCache = null;

    return jsonResponse({
      success: true,
      message: "订单创建成功",
      row: targetRow
    });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleGetOrder(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const rowIndex = parseInt(parts[parts.length - 1]);
    if (!rowIndex) return jsonResponse({ success: false, error: "无效行号" });

    const gridData = await readSheetRange(SHEET_ID, `A${rowIndex}:L${rowIndex}`);
    const rows = gridData.rows || [];
    if (!rows.length) return jsonResponse({ success: false, error: "订单不存在" });

    const values = rows[0].values || [];
    const rowData = values.map(v => parseCellValue(v.cellValue));
    const order = parseOrderRow(rowData);
    order.row_index = rowIndex;
    return jsonResponse({ success: true, order });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleUpdateOrder(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const rowIndex = parseInt(parts[parts.length - 1]);
    if (!rowIndex) return jsonResponse({ success: false, error: "无效行号" });

    const data = await request.json();
    const model = data.model || '';
    const tonnage = data.tonnage || '';
    const customer = data.customer || '';
    const expectedDate = data.expected_date || '';
    const queueDate = data.queue_date || '';
    const submitter = data.submitter || '';
    const submitterId = data.submitter_id || '';

    const remark = `${tonnage}${customer}`;
    const currentUser = await getUserById(submitterId) || {};

    // Read original order for permission check and tonnage validation
    const gridData = await readSheetRange(SHEET_ID, `A${rowIndex}:L${rowIndex}`);
    const rows = gridData.rows || [];
    if (!rows.length) return jsonResponse({ success: false, error: "订单不存在" });

    const origValues = rows[0].values.map(v => parseCellValue(v.cellValue));
    const originalTonnage = origValues[1] || "0";
    const originalQueueDate = origValues[5] || "";
    const originalOrder = {
      submitter: origValues[6] || "",
      submitter_id: origValues[10] || ""
    };

    // Permission check
    if (!await canOperateOrder(originalOrder, currentUser, submitterId, submitter, "all")) {
      return jsonResponse({ success: false, error: "无权修改他人订单" });
    }

    // Tonnage can only decrease
    try {
      if (parseFloat(tonnage) > parseFloat(originalTonnage)) {
        return jsonResponse({ success: false, error: "吨位只能改小不能改大" });
      }
    } catch (e) { /* ignore parse error */ }

    // Recalculate delivery date with capacity compensation
    const hasOriginalQueue = !!(originalQueueDate && isDateString(originalQueueDate) && originalTonnage);
    const [calcDateForUpdate, calcError] = await calculateDeliveryDate(
      model, tonnage, expectedDate,
      hasOriginalQueue ? originalQueueDate : null,
      hasOriginalQueue ? originalTonnage : null
    );

    // Block if "请联系商务支持"
    if (calcDateForUpdate && calcDateForUpdate === "请联系商务支持") {
      return jsonResponse({ success: false, error: "可发货日期：请联系商务支持，无法保存修改" });
    }

    // Validate queue_date >= calculated_date
    if (calcDateForUpdate && isDateString(calcDateForUpdate) && queueDate && isDateString(queueDate)) {
      const calcD = parseDate(calcDateForUpdate);
      const queueD = parseDate(queueDate);
      if (queueD < calcD) {
        return jsonResponse({ success: false, error: `排队日期不能早于可发货日期（${calcDateForUpdate}）` });
      }
    }

    const submitTime = getBeijingTimeStr();
    const result = await writeOrderRow(
      rowIndex - 1, model, tonnage, customer, expectedDate,
      calcDateForUpdate, queueDate, submitter, remark, String(rowIndex), submitterId, submitTime
    );

    if (!result.ok) return jsonResponse({ success: false, error: "更新失败" });

    ordersCache = null;
    return jsonResponse({ success: true, message: "订单修改成功" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleDeleteOrder(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const rowIndex = parseInt(parts[parts.length - 1]);
    if (!rowIndex) return jsonResponse({ success: false, error: "无效行号" });

    const data = await request.json().catch(() => ({}));
    const expectedOrder = data.order || data;
    const submitterId = new URL(request.url).searchParams.get('submitter_id') || '';
    const submitterName = new URL(request.url).searchParams.get('submitter_name') || '';
    const currentUser = await getUserById(submitterId) || {};

    // Read original order for validation and permission check
    const gridData = await readSheetRange(SHEET_ID, `A${rowIndex}:L${rowIndex}`);
    const rows = gridData.rows || [];
    if (!rows.length) return jsonResponse({ success: false, error: "订单不存在" });

    const origValues = rows[0].values.map(v => parseCellValue(v.cellValue));
    const originalOrder = {
      model: origValues[0] || "",
      customer: origValues[2] || "",
      submitter: origValues[6] || "",
      submitter_id: origValues[10] || "",
      submit_time: origValues[11] || ""
    };

    // Data consistency check
    if (!orderMatchesExpected(originalOrder, expectedOrder)) {
      return jsonResponse({ success: false, error: "订单行号已变化，请刷新后重试，未执行删除" });
    }

    // Permission check
    if (!await canOperateOrder(originalOrder, currentUser, submitterId, submitterName, "all")) {
      return jsonResponse({ success: false, error: "无权删除他人订单" });
    }

    const result = await deleteRow(rowIndex);
    if (!result.ok) return jsonResponse({ success: false, error: "删除失败" });

    ordersCache = null;
    return jsonResponse({ success: true, message: "订单删除成功" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleCalculateDate(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);

  try {
    const data = await request.json();
    const model = (data.model || '').trim();
    const tonnage = data.tonnage || '';
    const expectedDate = (data.expected_date || '').trim();
    const originalQueueDate = data.original_queue_date || '';
    const originalTonnage = data.original_tonnage || '';
    const forceRefresh = !!data.force_refresh;

    if (forceRefresh) clearCache();

    const [calculatedDate, errorMsg] = await calculateDeliveryDate(
      model, tonnage, expectedDate,
      originalQueueDate || null,
      originalTonnage || null
    );

    if (errorMsg && errorMsg !== "请联系商务支持") {
      return jsonResponse({ success: false, error: errorMsg });
    }

    return jsonResponse({
      success: true,
      calculated_date: calculatedDate,
      row_index: 0,
      message: ""
    });
  } catch (e) {
    return jsonResponse({ success: false, error: `计算异常: ${e.message}` });
  }
}

export async function handleClearTempRow(request) {
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

export async function handleCleanupTempRows(request) {
  return jsonResponse({ success: true, cleared_rows: [] });
}

export async function handleUpdatePassword(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);

  try {
    const data = await request.json();
    const employeeId = data.employee_id || '';
    const oldPassword = data.old_password || '';
    const newPassword = data.new_password || '';

    if (!employeeId || !oldPassword || !newPassword) {
      return jsonResponse({ success: false, error: "参数不完整" });
    }
    if (newPassword.length < 6) {
      return jsonResponse({ success: false, error: "新密码至少6位" });
    }
    if (!(/[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword))) {
      return jsonResponse({ success: false, error: "密码必须同时包含字母和数字" });
    }

    // Read user table to find the row
    const { readSheetRange: readRange, batchUpdate: doUpdate, getAccessToken } = await import('../tencent-api.js');
    const token = await getAccessToken();
    const headers = {
      "Content-Type": "application/json",
      "Access-Token": token,
      "Open-Id": "9bc172e5338147d8a35c1438ea8d1577",
      "Client-Id": "da815d1227294457b43413bdc16e3e90"
    };

    const resp = await fetch(`https://docs.qq.com/openapi/spreadsheet/v3/files/${USER_FILE_ID}/${USER_SHEET_ID}/A2:C200`, {
      headers,
      signal: AbortSignal.timeout(8000)
    });
    if (!resp.ok) return jsonResponse({ success: false, error: "读取用户表失败" });
    const respData = await resp.json();
    const rows = respData.gridData?.rows || [];
    let targetRow = null;

    for (let i = 0; i < rows.length; i++) {
      const values = rows[i].values || [];
      const rowData = values.map(v => parseCellValue(v.cellValue));
      if (rowData.length >= 2 && normalizeUserKey(rowData[1]) === normalizeUserKey(employeeId)) {
        if (rowData.length >= 3 && rowData[2] === oldPassword) {
          targetRow = i + 2; // A2 start, so +2
        } else {
          return jsonResponse({ success: false, error: "旧密码错误" });
        }
        break;
      }
    }

    if (targetRow === null) {
      return jsonResponse({ success: false, error: "员工号不存在" });
    }

    // Update password (C column, text format)
    const body = {
      requests: [{
        updateRangeRequest: {
          sheetId: USER_SHEET_ID,
          gridData: {
            startRow: targetRow - 1,  // 0-based
            startColumn: 2,  // C column
            rows: [{ values: [{ cellValue: { text: newPassword } }] }]
          }
        }
      }]
    };

    const updateResp = await fetch(`https://docs.qq.com/openapi/spreadsheet/v3/files/${USER_FILE_ID}/batchUpdate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000)
    });

    const updateData = await updateResp.json();
    if (updateData.responses) {
      // Clear user cache by invalidating orders cache
      ordersCache = null;
      return jsonResponse({ success: true, message: "密码修改成功" });
    }
    return jsonResponse({ success: false, error: JSON.stringify(updateData) });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}