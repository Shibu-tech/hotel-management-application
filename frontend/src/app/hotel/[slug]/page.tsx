import type { Metadata } from 'next';
import { HotelPreview } from '@/components/shared/HotelPreview';

export function generateStaticParams() {
  return [{ slug: 'grand-adp' }, { slug: 'palace-mumbai' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `The Grand ADP · ${slug.toUpperCase()} · Luxury Hotel & Residences` };
}

export default async function TenantHotelPage() {
  return <HotelPreview />;
}
