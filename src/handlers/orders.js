// Orders CRUD handlers
import { readSheetRange, readSingleCell, writeOrderRow, deleteRow, updateOrderRow, clearTempRow, ensureSheetRows, SHEET_ID } from '../tencent-api.js';
import { calculateDeliveryDate, clearCache } from '../calc-engine.js';
import { readUsers } from '../tencent-api.js';
import { jsonResponse, parseCellValue, normalizeUserKey, getBeijingTimeStr, ADMIN_EMPLOYEE_ID } from '../utils.js';

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
  const batchSize = 200;

  for (let offset = 0; offset < 4000; offset += batchSize) {
    const start = offset + 1;
    const end = offset + batchSize;
    const gridData = await readSheetRange(SHEET_ID, `A${start}:L${end}`);
    const rows = gridData.rows || [];
    if (rows.length === 0) break;

    for (let i = 0; i < rows.length; i++) {
      const actualRow = start + i;
      if (actualRow < 2) continue;
      const values = rows[i].values || [];
      const rowData = values.map(v => parseCellValue(v.cellValue));
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

const ACCESS_PASSWORD = "queue2025";

function requireAuth(request) {
  const password = request.headers.get('X-Access-Password') || '';
  return password === ACCESS_PASSWORD;
}

export async function handleGetOrders(request) {
  if (!requireAuth(request)) {
    return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const filterModel = url.searchParams.get('model') || '';
    const filterCustomer = url.searchParams.get('customer') || '';
    const sortBy = url.searchParams.get('sort') || '';
    const submitterId = normalizeUserKey(request.headers.get('X-Employee-Id') || '');
    const viewAll = url.searchParams.get('all') === '1';

    const allOrders = await readAllOrders();

    // Filter by user access level
    let visibleOrders;
    if (viewAll && submitterId === ADMIN_EMPLOYEE_ID) {
      visibleOrders = allOrders;
    } else {
      // Get user access info
      const users = await readUsers();
      let user = null;
      for (const u of users) {
        if (normalizeUserKey(u.employee_id) === submitterId) { user = u; break; }
      }

      if (user && (user.access_level === 'admin' || user.access_level === 'department')) {
        if (user.access_level === 'admin') {
          visibleOrders = allOrders;
        } else {
          visibleOrders = allOrders.filter(o =>
            normalizeUserKey(o.submitter_id) === submitterId
          );
        }
      } else {
        visibleOrders = allOrders.filter(o =>
          normalizeUserKey(o.submitter_id) === submitterId
        );
      }
    }

    // Apply filters
    if (filterModel) visibleOrders = visibleOrders.filter(o => o.model === filterModel);
    if (filterCustomer) visibleOrders = visibleOrders.filter(o => o.customer && o.customer.includes(filterCustomer));

    // Apply sorting
    if (sortBy === 'model') visibleOrders.sort((a, b) => (a.model || '').localeCompare(b.model || ''));
    else if (sortBy === 'queueDate') visibleOrders.sort((a, b) => (b.queue_date || '').localeCompare(a.queue_date || ''));
    else if (sortBy === 'tonnage') visibleOrders.sort((a, b) => (parseFloat(b.tonnage) || 0) - (parseFloat(a.tonnage) || 0));

    // Pagination
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

    // Find first empty row
    let targetRow = 2;

    // Scan for empty row in column A
    const batchSize = 200;
    for (let offset = 0; offset < 4000; offset += batchSize) {
      const start = offset + 1;
      const end = offset + batchSize;
      const gridData = await readSheetRange(SHEET_ID, `A${start}:A${end}`);
      const rows = gridData.rows || [];
      if (rows.length === 0) { targetRow = start; break; }

      let found = false;
      for (let i = 0; i < rows.length; i++) {
        const actualRow = start + i;
        if (actualRow < 2) continue;
        const values = rows[i].values || [];
        const aVal = values.length > 0 && values[0].cellValue ? parseCellValue(values[0].cellValue) : "";
        if (!aVal) { targetRow = actualRow; found = true; break; }
      }
      if (found) break;

      if (rows.length < batchSize) {
        targetRow = start + rows.length;
        // Verify
        const verify = await readSingleCell(SHEET_ID, `A${targetRow}`);
        if (verify && verify.trim()) continue;
        break;
      }
    }

    // Calculate serial number based on count
    const allOrders = await readAllOrders();
    const serialNo = `CF${String(allOrders.length + 1).padStart(3, '0')}`;

    // Ensure enough rows
    await ensureSheetRows(targetRow + 10);

    // Write order
    const result = await writeOrderRow(
      targetRow - 1, model, tonnage, customer, expectedDate, "", queueDate,
      submitter, remark, serialNo, submitterId, submitTime
    );

    if (!result.ok) {
      return jsonResponse({ success: false, error: "写入表格失败" });
    }

    // Invalidate cache
    ordersCache = null;

    return jsonResponse({
      success: true,
      order: parseOrderRow([model, tonnage, customer, expectedDate, "", queueDate, submitter, remark, serialNo, "", submitterId, submitTime])
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

    const result = await updateOrderRow(rowIndex, model, tonnage, customer, expectedDate, "", queueDate, submitter, "");
    if (!result.ok) return jsonResponse({ success: false, error: "更新失败" });

    ordersCache = null;
    return jsonResponse({ success: true });
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

    const result = await deleteRow(rowIndex);
    if (!result.ok) return jsonResponse({ success: false, error: "删除失败" });

    ordersCache = null;
    return jsonResponse({ success: true });
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
    const forceRefresh = !!data.force_refresh;

    if (forceRefresh) clearCache();

    const [calculatedDate, errorMsg] = await calculateDeliveryDate(model, tonnage, expectedDate);

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

  return jsonResponse({ success: false, error: "CloudFlare版本暂不支持修改密码，请在主服务操作" });
}
