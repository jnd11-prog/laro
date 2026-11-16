'use client';
import { useEffect } from 'react';
import { startTracking, track } from '../track';
/** Records one landing-page view (queued if offline). */
export default function TrackView({ page }: { page: string }) {
  useEffect(() => { startTracking(); track('page_view', { page, ref: new URLSearchParams(location.search).get('ref') || '' }); }, [page]);
  return null;
}
