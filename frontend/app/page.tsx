import GmailConnectionCard from '@/components/GmailConnectionCard';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <GmailConnectionCard />
    </main>
  );
}
