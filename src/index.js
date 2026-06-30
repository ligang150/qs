// Main Worker entry point
import { handleAuthCheck, handleAuthLogin, handleAuthUsers } from './handlers/auth.js';
import { handleModels } from './handlers/models.js';
import { handleGetOrders, handleCreateOrder, handleGetOrder, handleUpdateOrder, handleDeleteOrder, handleCalculateDate, handleClearTempRow, handleCleanupTempRows, handleUpdatePassword } from './handlers/orders.js';
import { handleAdminStatus, handleAdminValidate, handleAdminDeploy, handleAdminUpdate, handleAdminHealth, handleDebugCapacity, handleTestConnection, handleDiagCalcEngine, handleRefreshCapacity, handleCacheStatus, handleAdminModelConfigsGet, handleAdminModelConfigsPost } from './handlers/admin.js';
import { preloadAllModels } from './calc-engine.js';
import { jsonResponse } from './utils.js';

// Preload data on first request
let preloaded = false;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Access-Password, X-Employee-Id',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Preload on first API request (non-blocking)
    if (!preloaded && (path.startsWith('/api/') || path.startsWith('/auth/'))) {
      preloaded = true;
      ctx.waitUntil(preloadAllModels());
    }

    // Route matching
    try {
      // Auth routes
      if (path === '/auth/check' && request.method === 'GET') return handleAuthCheck(request);
      if (path === '/auth/login' && request.method === 'POST') return handleAuthLogin(request);
      if (path === '/auth/users' && request.method === 'GET') return handleAuthUsers(request);

      // Model routes
      if (path === '/api/models' && request.method === 'GET') return handleModels(request);

      // Calculate date
      if (path === '/api/calculate-date' && request.method === 'POST') return handleCalculateDate(request);

      // Orders CRUD
      if (path === '/api/orders' && request.method === 'GET') return handleGetOrders(request);
      if (path === '/api/orders' && request.method === 'POST') return handleCreateOrder(request);
      if (path.match(/^\/api\/orders\/\d+$/) && request.method === 'GET') return handleGetOrder(request);
      if (path.match(/^\/api\/orders\/\d+$/) && request.method === 'PUT') return handleUpdateOrder(request);
      if (path.match(/^\/api\/orders\/\d+$/) && request.method === 'DELETE') return handleDeleteOrder(request);

      // Temp row management
      if (path === '/api/clear-temp-row' && request.method === 'POST') return handleClearTempRow(request);
      if (path === '/api/cleanup-user-temp-rows' && request.method === 'POST') return handleCleanupTempRows(request);

      // Password
      if (path === '/api/users/password' && request.method === 'PUT') return handleUpdatePassword(request);

      // Admin routes
      if (path === '/api/admin/status' && request.method === 'GET') return handleAdminStatus(request);
      if (path === '/api/admin/validate' && request.method === 'POST') return handleAdminValidate(request);
      if (path === '/api/admin/deploy' && request.method === 'POST') return handleAdminDeploy(request);
      if (path === '/api/admin/update' && request.method === 'POST') return handleAdminUpdate(request);
      if (path === '/api/admin/health' && request.method === 'GET') return handleAdminHealth(request);

      // Debug routes
      if (path === '/api/debug/capacity' && request.method === 'GET') return handleDebugCapacity(request);
      if (path === '/api/test-connection' && request.method === 'GET') return handleTestConnection(request);
      if (path === '/api/diag-calc-engine' && request.method === 'GET') return handleDiagCalcEngine(request);
      if (path === '/api/refresh-capacity-data' && request.method === 'POST') return handleRefreshCapacity(request);
      if (path === '/api/cache-status' && request.method === 'GET') return handleCacheStatus(request);

      // Admin model configs
      if (path === '/api/admin/model-configs' && request.method === 'GET') return handleAdminModelConfigsGet(request);
      if (path === '/api/admin/model-configs' && request.method === 'POST') return handleAdminModelConfigsPost(request);

      // Static file serving and index page - handled by Cloudflare Pages assets
      // The Worker won't handle static files; Cloudflare will serve them from [assets] directory
      // For API 404s
      if (path.startsWith('/api/') || path.startsWith('/auth/')) {
        return jsonResponse({ success: false, error: "Not Found" }, 404);
      }

      // For non-API paths, return the index.html (SPA fallback)
      // This is served by Cloudflare [assets] binding
      return new Response('Not Found', { status: 404 });
    } catch (e) {
      console.error(`[Worker] Error handling ${path}:`, e.message);
      return jsonResponse({ success: false, error: `服务器内部错误: ${e.message}` }, 500);
    }
  }
};
