import { redirect } from 'next/navigation';

/**
 * Legacy unauthenticated /staff/[role] route is disabled.
 * All staff dashboards must be accessed via authenticated tenant-scoped /hotel/[slug]/[role] routes.
 */
export default function LegacyStaffRoleRedirect() {
  redirect('/login');
}
