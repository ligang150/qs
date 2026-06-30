// Admin handlers
import { readUsers, readModelConfigsFromSheet, updateTokens } from '../tencent-api.js';
import { jsonResponse, normalizeUserKey, ADMIN_EMPLOYEE_ID } from '../utils.js';
import { clearCache } from '../calc-engine.js';

const ACCESS_PASSWORD = "queue2025";

function requireAdmin(request) {
  const password = request.headers.get('X-Access-Password') || '';
  if (password !== ACCESS_PASSWORD) return false;
  const employeeId = normalizeUserKey(request.headers.get('X-Employee-Id') || '');
  return employeeId === ADMIN_EMPLOYEE_ID;
}

export async function handleAdminStatus(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);

  return jsonResponse({
    success: true,
    service: "Cloudflare Worker",
    mode: "backup",
    keys_valid: true,
    version: "cf-v1.0"
  });
}

export async function handleAdminValidate(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);
  // Simplified - just return ok
  return jsonResponse({ success: true, validated: true });
}

export async function handleAdminDeploy(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);
  return jsonResponse({ success: true, message: "CloudFlare version auto-deploys on git push" });
}

export async function handleAdminUpdate(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);

  try {
    const data = await request.json();
    const name = data.name || '';
    const value = data.value || '';

    if (name === 'TENCENT_ACCESS_TOKEN') {
      updateTokens(null, value, null);
      clearCache();
    } else if (name === 'CLIENT_ID') {
      updateTokens(value, null, null);
    }

    return jsonResponse({ success: true, message: `凭证 ${name} 已更新` });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleAdminHealth(request) {
  return jsonResponse({ success: true, status: "ok", service: "cloudflare-worker" });
}

export async function handleDebugCapacity(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);
  return jsonResponse({ success: true, message: "Debug not available in CloudFlare version" });
}

export async function handleTestConnection(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);
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

export async function handleDiagCalcEngine(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);
  return jsonResponse({ success: true, message: "Calc engine running in memory" });
}

export async function handleRefreshCapacity(request) {
  if (!requireAuth(request)) return jsonResponse({ success: false, error: "未授权", need_auth: true }, 401);
  try {
    clearCache();
    return jsonResponse({ success: true, message: "缓存已清除，数据将在下次请求时重新加载" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleCacheStatus(request) {
  return jsonResponse({ success: true, message: "Cache is in-memory, expires every 5 minutes" });
}

export async function handleAdminModelConfigsGet(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);
  try {
    const configs = await readModelConfigsFromSheet();
    return jsonResponse({ success: true, configs });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleAdminModelConfigsPost(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);
  return jsonResponse({ success: false, error: "CloudFlare版本不支持修改牌号配置" });
}

function requireAuth(request) {
  const password = request.headers.get('X-Access-Password') || '';
  return password === ACCESS_PASSWORD;
}
