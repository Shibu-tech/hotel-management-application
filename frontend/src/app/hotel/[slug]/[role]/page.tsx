import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RoleDashboard } from '@/components/staff/RoleDashboard';
import { GuestPortalPreview } from '@/components/shared/GuestPortalPreview';
import { roleBySlug } from '@/lib/roles';

export function generateStaticParams() {
  return [
    { slug: 'grand-adp', role: 'gm' },
    { slug: 'grand-adp', role: 'supervisor' },
    { slug: 'grand-adp', role: 'front-desk' },
    { slug: 'grand-adp', role: 'fulfiller' },
    { slug: 'grand-adp', role: 'guest' },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; role: string }>;
}): Promise<Metadata> {
  const { slug, role } = await params;
  if (role === 'guest') {
    return { title: `Guest Portal · ${slug.toUpperCase()} · The Grand ADP` };
  }
  const meta = roleBySlug(role);
  return {
    title: meta
      ? `${meta.name} · ${slug.toUpperCase()} · The Grand ADP`
      : 'The Grand ADP Hotel Portal',
  };
}

export default async function HotelRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; role: string }>;
  searchParams?: Promise<{ room?: string; token?: string; dept?: string }>;
}) {
  const { slug, role } = await params;
  const sParams = searchParams ? await searchParams : {};

  if (role === 'guest') {
    const room = sParams.room || '402';
    const token = sParams.token || '';
    return <GuestPortalPreview room={room} token={token} />;
  }

  const meta = roleBySlug(role);
  if (!meta) {
    notFound();
  }

  return <RoleDashboard roleId={meta.id} hotelSlug={slug} />;
}
