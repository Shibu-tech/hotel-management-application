import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_SRC = path.resolve(__dirname, '../src');

// Mirror of core authApi.ts runtime behavior & direct source contract verification
// plus live fetch/cookie/CSRF unit tests against authApi.ts & hotelEmployeesApi.ts

describe('1. Quick Access Feature Flag & Live Rollout Kill-Switch', () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origFlag = process.env.NEXT_PUBLIC_DEV_QUICK_ACCESS;

  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv;
    if (origFlag === undefined) {
      delete process.env.NEXT_PUBLIC_DEV_QUICK_ACCESS;
    } else {
      process.env.NEXT_PUBLIC_DEV_QUICK_ACCESS = origFlag;
    }
  });

  function evaluateDevQuickAccessFlag(flagValue) {
    return flagValue !== 'false';
  }

  it('is disabled when NEXT_PUBLIC_DEV_QUICK_ACCESS=false (live hotel rollout switch)', () => {
    assert.equal(evaluateDevQuickAccessFlag('false'), false);
  });

  it('is enabled by default for local & staging/demo testing unless disabled via NEXT_PUBLIC_DEV_QUICK_ACCESS=false', () => {
    assert.equal(evaluateDevQuickAccessFlag('true'), true);
    assert.equal(evaluateDevQuickAccessFlag(undefined), true);
  });

  it('authApi.ts checks NEXT_PUBLIC_DEV_QUICK_ACCESS kill-switch and never stores tokens in localStorage', () => {
    const authApiSrc = fs.readFileSync(path.join(FRONTEND_SRC, 'lib/authApi.ts'), 'utf8');
    assert.match(authApiSrc, /return process\.env\.NEXT_PUBLIC_DEV_QUICK_ACCESS !== ['"]false['"];/);
    assert.match(authApiSrc, /credentials:\s*['"]include['"]/);
    assert.match(authApiSrc, /X-XSRF-TOKEN/);
    assert.doesNotMatch(authApiSrc, /localStorage\.(getItem|setItem|removeItem|clear)/);
    assert.doesNotMatch(authApiSrc, /sessionStorage\.(getItem|setItem|removeItem|clear)/);
  });

  it('authContext.tsx persists devQuickAccessEntries in localStorage for dev testing across page refreshes', () => {
    const authCtxSrc = fs.readFileSync(path.join(FRONTEND_SRC, 'lib/authContext.tsx'), 'utf8');
    assert.match(authCtxSrc, /hotel_dev_quick_access_accounts_v1/);
    assert.match(authCtxSrc, /localStorage\.getItem/);
    assert.match(authCtxSrc, /localStorage\.setItem/);
    assert.match(authCtxSrc, /devQuickAccessEntries:\s*devEnabled\s*\?\s*devEntries\s*:\s*\[\]/);
  });
});

describe('2. Login Page Security, Autofill & No Offline Auth Bypass', () => {
  const loginSrc = fs.readFileSync(
    path.join(FRONTEND_SRC, 'components/login/PortalLoginView.tsx'),
    'utf8',
  );

  it('removes offline auth bypass, substring role inference, and localStorage token storage, and strips baseline entries when NEXT_PUBLIC_DEV_QUICK_ACCESS=false', () => {
    assert.doesNotMatch(loginSrc, /handleOfflineFallback/);
    assert.doesNotMatch(loginSrc, /localStorage\.setItem\(['"]authToken/);
    assert.doesNotMatch(loginSrc, /cleanEmail\.includes\(['"]admin['"]\)/);
    assert.match(loginSrc, /process\.env\.NEXT_PUBLIC_DEV_QUICK_ACCESS === 'false'\s*\?\s*\[\]/);
  });

  it('DEV QUICK ACCESS autofills email & password ONLY and never auto-submits', () => {
    assert.match(loginSrc, /devQuickAccessEnabled\s*&&\s*\(/);
    assert.match(loginSrc, /Quick Access \(Dev\)/);
    const autofillMatch = loginSrc.match(/const handleQuickFill[\s\S]*?\n  \};/);
    assert.ok(autofillMatch, 'handleQuickFill handler must exist');
    assert.match(autofillMatch[0], /setEmail\(item\.email\)/);
    assert.match(autofillMatch[0], /setPassword\(item\.pass\)/);
    assert.doesNotMatch(autofillMatch[0], /login\(/);
    assert.doesNotMatch(autofillMatch[0], /router\.push/);
  });

  it('redirects strictly using backend-supplied redirectUrl with router.replace and fails closed when backend is unreachable', () => {
    assert.match(loginSrc, /authUser\.redirectUrl/);
    assert.match(loginSrc, /router\.replace\(targetUrl\)/);
    assert.doesNotMatch(loginSrc, /router\.push\(targetUrl\)/);
    assert.match(loginSrc, /Authentication server is unreachable/);
  });
});

describe('3. Backend Login, Role Redirect & GM Employee API Integration (Mocked Fetch)', () => {
  const origFetch = globalThis.fetch;
  const origDocument = globalThis.document;

  beforeEach(() => {
    globalThis.document = { cookie: 'XSRF-TOKEN=test-csrf-token-123' };
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    globalThis.document = origDocument;
  });

  it('sends credentials: include on POST /api/auth/login and resolves backend redirectUrl', async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          userId: 10,
          email: 'gm@meridian.test',
          fullName: 'Clara GM',
          role: 'GENERAL_MANAGER',
          hotelId: 2,
          hotelSlug: 'grand-meridian',
          hotelName: 'Grand Meridian',
          mustChangePassword: true,
          redirectUrl: '/hotel/grand-meridian/gm',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const { loginWithBackend } = await import('../src/lib/authApi.ts');
    const session = await loginWithBackend('GM@Meridian.TEST', 'TempPass#99');

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/auth\/login$/);
    assert.equal(calls[0].init.credentials, 'include');
    assert.equal(session.role, 'GENERAL_MANAGER');
    assert.equal(session.redirectUrl, '/hotel/grand-meridian/gm');
    assert.equal(session.mustChangePassword, true);
  });

  it('propagates backend 401 failure without bypassing authentication', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: 'Invalid email or password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    const { loginWithBackend, ApiError } = await import('../src/lib/authApi.ts');
    await assert.rejects(
      () => loginWithBackend('bad@meridian.test', 'WrongPass'),
      (err) => err instanceof ApiError && err.status === 401 && err.message === 'Invalid email or password.',
    );
  });

  it('attaches X-XSRF-TOKEN and credentials: include when GM creates department & employee', async () => {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, init });
      if (String(url).endsWith('/departments')) {
        return new Response(
          JSON.stringify({ id: 5, hotelId: 2, name: 'Housekeeping', active: true }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          employee: {
            id: 42,
            employeeCode: 'SUP-1042',
            fullName: 'Meera Sup',
            email: 'meera.sup@meridian.test',
            role: 'SUPERVISOR',
            hotelId: 2,
            hotelSlug: 'grand-meridian',
            departmentId: 5,
            departmentName: 'Housekeeping',
            active: true,
            mustChangePassword: true,
          },
          temporaryPassword: 'Generated#Temp99',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const { apiFetch, parseApiJson } = await import('../src/lib/authApi.ts');

    const deptRes = await apiFetch('/hotels/grand-meridian/departments', {
      method: 'POST',
      body: JSON.stringify({ name: 'Housekeeping' }),
    });
    const dept = await parseApiJson(deptRes);
    assert.equal(dept.id, 5);
    assert.equal(calls[0].init.credentials, 'include');
    assert.equal(calls[0].init.headers.get('X-XSRF-TOKEN'), 'test-csrf-token-123');

    const empRes = await apiFetch('/hotels/grand-meridian/employees', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Meera Sup',
        email: 'meera.sup@meridian.test',
        role: 'SUPERVISOR',
        departmentId: 5,
      }),
    });
    const created = await parseApiJson(empRes);
    assert.equal(created.employee.role, 'SUPERVISOR');
    assert.equal(created.employee.departmentName, 'Housekeeping');
    assert.equal(created.temporaryPassword, 'Generated#Temp99');
    assert.equal(calls[1].init.headers.get('X-XSRF-TOKEN'), 'test-csrf-token-123');

    // Verify hotelEmployeesApi.ts delegates to apiFetch for all department & employee operations
    const empApiSrc = fs.readFileSync(path.join(FRONTEND_SRC, 'lib/hotelEmployeesApi.ts'), 'utf8');
    assert.match(empApiSrc, /apiFetch\(`\/hotels\/\$\{encodeURIComponent\(slug\)\}\/departments`/);
    assert.match(empApiSrc, /apiFetch\(`\/hotels\/\$\{encodeURIComponent\(slug\)\}\/employees`/);
    assert.match(empApiSrc, /reset-password/);
  });
});

describe('4. StaffRosterTab & Admin Dashboard Real API Wiring & Route Protection', () => {
  it('StaffRosterTab uses real backend APIs and removes localStorage addStaffAccount', () => {
    const staffSrc = fs.readFileSync(
      path.join(FRONTEND_SRC, 'components/executive/StaffRosterTab.tsx'),
      'utf8',
    );
    assert.match(staffSrc, /createHotelEmployee/);
    assert.match(staffSrc, /createHotelDepartment/);
    assert.match(staffSrc, /resetHotelEmployeePassword/);
    assert.doesNotMatch(staffSrc, /addStaffAccount/);
    assert.doesNotMatch(staffSrc, /updateStaffRole/);
    assert.doesNotMatch(staffSrc, /toggleStaffStatus/);
    // GM UI only permits FRONT_DESK, SUPERVISOR, FULFILLER assignment
    assert.match(staffSrc, /type AssignableRole = 'FRONT_DESK' \| 'SUPERVISOR' \| 'FULFILLER'/);
  });

  it('Admin Dashboard and RoleDashboard are wrapped in ProtectedRoute with zero localStorage fallback', () => {
    const adminSrc = fs.readFileSync(
      path.join(FRONTEND_SRC, 'app/admin/dashboard/page.tsx'),
      'utf8',
    );
    assert.match(adminSrc, /<ProtectedRoute allowedRoles=\{\['ADMIN'\]\}>/);
    assert.doesNotMatch(adminSrc, /admin_cached_hotels/);
    assert.doesNotMatch(adminSrc, /DEFAULT_HOTELS/);
    assert.doesNotMatch(adminSrc, /useState\('gm123'\)/);

    const roleDashSrc = fs.readFileSync(
      path.join(FRONTEND_SRC, 'components/staff/RoleDashboard.tsx'),
      'utf8',
    );
    assert.match(roleDashSrc, /<ProtectedRoute allowedRoles=\{allowedBackendRolesFor\(roleId\)\} requiredHotelSlug=\{hotelSlug\}>/);

    const legacyStaffSrc = fs.readFileSync(
      path.join(FRONTEND_SRC, 'app/staff/[role]/page.tsx'),
      'utf8',
    );
    assert.match(legacyStaffSrc, /redirect\(['"]\/login['"]\)/);
  });
});

describe('5. Production API URL Normalization & Same-Origin Vercel Rewrite Proxy', () => {
  const origApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const origWindow = globalThis.window;

  afterEach(() => {
    if (origApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = origApiUrl;
    }
    if (origWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = origWindow;
    }
  });

  it('normalizes NEXT_PUBLIC_API_URL to always include /api without duplication', async () => {
    const { normalizeApiBaseUrl } = await import('../src/lib/authApi.ts');
    assert.equal(
      normalizeApiBaseUrl('https://hotel-management-application-4v49.onrender.com'),
      'https://hotel-management-application-4v49.onrender.com/api',
    );
    assert.equal(
      normalizeApiBaseUrl('https://hotel-management-application-4v49.onrender.com/'),
      'https://hotel-management-application-4v49.onrender.com/api',
    );
    assert.equal(
      normalizeApiBaseUrl('https://hotel-management-application-4v49.onrender.com/api/'),
      'https://hotel-management-application-4v49.onrender.com/api',
    );
    assert.equal(normalizeApiBaseUrl('/api'), '/api');
    assert.equal(normalizeApiBaseUrl(''), 'http://localhost:8080/api');
  });

  it('uses same-origin /api proxy on HTTPS cross-origin deployments (Vercel -> Render) and normalized direct URL on localhost', async () => {
    const { getApiBaseUrl } = await import('../src/lib/authApi.ts');

    process.env.NEXT_PUBLIC_API_URL = 'https://hotel-management-application-4v49.onrender.com';
    globalThis.window = {
      location: {
        protocol: 'https:',
        origin: 'https://hotel-management-application-seven.vercel.app',
      },
    };
    assert.equal(getApiBaseUrl(), '/api');

    globalThis.window = {
      location: {
        protocol: 'http:',
        origin: 'http://localhost:3000',
      },
    };
    assert.equal(getApiBaseUrl(), 'https://hotel-management-application-4v49.onrender.com/api');
  });

  it('next.config.mjs defines /api/:path* rewrite for production cookie & CSRF compatibility', () => {
    const nextConfigSrc = fs.readFileSync(path.resolve(__dirname, '../next.config.mjs'), 'utf8');
    assert.match(nextConfigSrc, /async rewrites\(\)/);
    assert.match(nextConfigSrc, /source:\s*['"]\/api\/:path\*['"]/);
  });
});

describe('6. Browser Back/Forward Navigation, Logout Revocation & bfcache Hardening', () => {
  it('PortalLoginView blocks already-authenticated users from landing on /login and replaces history on login', () => {
    const loginSrc = fs.readFileSync(
      path.join(FRONTEND_SRC, 'components/login/PortalLoginView.tsx'),
      'utf8',
    );
    assert.match(loginSrc, /user:\s*authenticatedUser/);
    assert.match(loginSrc, /if\s*\(!authLoading\s*&&\s*authenticatedUser\s*&&\s*!isSubmitting\)/);
    assert.match(loginSrc, /router\.replace\(target\)/);
    assert.match(loginSrc, /router\.replace\(targetUrl\)/);
  });

  it('FulfillerProfileTab revokes backend session via await logout() and uses router.replace(/login)', () => {
    const fulfillerSrc = fs.readFileSync(
      path.join(FRONTEND_SRC, 'components/staff/fulfiller/FulfillerProfileTab.tsx'),
      'utf8',
    );
    assert.match(fulfillerSrc, /const\s*\{\s*logout\s*\}\s*=\s*useAuth\(\)/);
    assert.match(fulfillerSrc, /await logout\(\)/);
    assert.match(fulfillerSrc, /router\.replace\(['"]\/login['"]\)/);
    assert.doesNotMatch(fulfillerSrc, /router\.push\(['"]\/login['"]\)/);
  });

  it('AuthProvider revalidates sessions on bfcache pageshow/popstate and syncs logout across tabs', () => {
    const authCtxSrc = fs.readFileSync(path.join(FRONTEND_SRC, 'lib/authContext.tsx'), 'utf8');
    assert.match(authCtxSrc, /window\.addEventListener\(['"]pageshow['"]/);
    assert.match(authCtxSrc, /event\.persisted/);
    assert.match(authCtxSrc, /window\.addEventListener\(['"]popstate['"]/);
    assert.match(authCtxSrc, /BroadcastChannel/);
    assert.match(authCtxSrc, /broadcastAuthEvent\(['"]LOGOUT['"]\)/);
  });

  it('next.config.mjs sends Cache-Control: no-store headers on protected routes and /login', () => {
    const nextConfigSrc = fs.readFileSync(path.resolve(__dirname, '../next.config.mjs'), 'utf8');
    assert.match(nextConfigSrc, /async headers\(\)/);
    assert.match(nextConfigSrc, /no-store, no-cache, must-revalidate, private/);
    assert.match(nextConfigSrc, /source:\s*['"]\/admin\/:path\*['"]/);
    assert.match(nextConfigSrc, /source:\s*['"]\/hotel\/:path\*['"]/);
  });
});
