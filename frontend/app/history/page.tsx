import EmailHistoryList from '@/components/EmailHistoryList';

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Email History
      </h1>
      <EmailHistoryList />
    </div>
  );
}
