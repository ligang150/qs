// Auth handlers - synced with Flask app.py
import { readUsers } from '../tencent-api.js';
import { jsonResponse, normalizeUserKey, ADMIN_EMPLOYEE_ID } from '../utils.js';

const ACCESS_PASSWORD = "queue2025";

export async function handleAuthCheck(request) {
  const password = request.headers.get('X-Access-Password') || '';
  if (password === ACCESS_PASSWORD) return jsonResponse({ authorized: true });
  return jsonResponse({ authorized: false });
}

export async function handleAuthLogin(request) {
  try {
    const data = await request.json();
    const employeeId = normalizeUserKey(data.employee_id || '');
    const password = data.password || '';
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
        return jsonResponse({ success: false, error: "密码错误" });
      }
    }
    return jsonResponse({ success: false, error: "员工号不存在" });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

export async function handleAuthUsers(request) {
  try {
    const users = await readUsers();
    return jsonResponse({
      success: true,
      users: users.map(u => ({ name: u.name, employee_id: normalizeUserKey(u.employee_id) }))
    });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}