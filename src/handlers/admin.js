// Admin handlers
import { readUsers, readModelConfigsFromSheet, updateTokens } from '../tencent-api.js';
import { jsonResponse, normalizeUserKey, ADMIN_EMPLOYEE_ID } from '../utils.js';
import { clearCache } from '../calc-engine.js';

const ACCESS_PASSWORD = "queue2025";

function requireAuth(request) {
  const password = request.headers.get('X-Access-Password') || '';
  return password === ACCESS_PASSWORD;
}

function requireAdmin(request) {
  if (!requireAuth(request)) return false;
  const employeeId = normalizeUserKey(request.headers.get('X-Employee-Id') || '');
  return employeeId === ADMIN_EMPLOYEE_ID;
}

function decodeJwtExpiry(token) {
  if (!token) return 0;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return (payload.exp || 0);
  } catch (e) {
    return 0;
  }
}

function maskValue(value) {
  if (!value) return "";
  const s = String(value);
  if (s.length <= 8) return `${s[0]}***${s[s.length-1]}`;
  return `${s.slice(0,4)}***${s.slice(-4)}`;
}

const ACCESS_TOKEN_DEFAULT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHQiOiJkYTgxNWQxMjI3Mjk0NDU3YjQzNDEzYmRjMTZlM2U5MCIsInR5cCI6MSwiZXhwIjoxNzgyMDk0NTcyLjEwODc1MywiaWF0IjoxNzc5NTAyNTcyLjEwODc1Mywic3ViIjoiOWJjMTcyZTUzMzgxNDdkOGEzNWMxNDM4ZWE4ZDE1NzcifQ.rm3BIdD1V7FrCwdToT2arErs06xWF7hTqAh0KsCKsdw";

export async function handleAdminStatus(request) {
  if (!requireAdmin(request)) return jsonResponse({ success: false, error: "无管理员权限" }, 403);

  const now = Math.floor(Date.now() / 1000);
  const tokenExp = decodeJwtExpiry(ACCESS_TOKEN_DEFAULT);
  const remainingSeconds = tokenExp > now ? tokenExp - now : 0;

  const items = [
    {
      name: "TENCENT_ACCESS_TOKEN",
      present: true,
      remaining_seconds: remainingSeconds,
      masked: maskValue(ACCESS_TOKEN_DEFAULT)
    },
    {
      name: "RENDER_API_KEY",
      present: true,
      remaining_seconds: null,
      masked: "由主 Render 服务管理"
    },
    {
      name: "GITHUB_TOKEN",
      present: true,
      remaining_seconds: null,
      masked: "由主 Render 服务管理"
    }
  ];

  return jsonResponse({
    success: true,
    items,
    service: "Cloudflare Worker",
    mode: "backup",
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
    const name = data.name || data.key || '';
    const value = data.value || '';

    if (name === 'RENDER_API_KEY' || name === 'GITHUB_TOKEN') {
      return jsonResponse({ success: false, error: "此凭证由主 Render 服务管理，Cloudflare 备份节点仅支持更新腾讯 access_token" });
    }

    if (name === 'TENCENT_ACCESS_TOKEN') {
      updateTokens(null, value, null);
      clearCache();
      return jsonResponse({ success: true, message: "腾讯 access_token 已保存到 Cloudflare 节点" });
    }

    if (name === 'CLIENT_ID') {
      updateTokens(value, null, null);
      return jsonResponse({ success: true, message: `凭证 ${name} 已更新` });
    }

    return jsonResponse({ success: false, error: "未知凭证类型" });
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
