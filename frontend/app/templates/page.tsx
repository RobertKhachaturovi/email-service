import TemplateList from '@/components/TemplateList';

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Email Templates
      </h1>
      <TemplateList />
    </div>
  );
}

