import React from 'react';
import { historyService } from '@/services/history-service';
import { getCurrentUser } from '@/lib/session';
import { HistoryClient } from '@/components/history/HistoryClient';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const overview = historyService.getUserHistory(user.id);

  return <HistoryClient initialHistory={overview} userName={user.name} />;
}
