import TemplateList from '@/components/TemplateList';
import EmailPreviewCard from '@/components/EmailPreviewCard';

export default function TemplatesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Email Templates
      </h1>
      <EmailPreviewCard />
      <div className="pt-2">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          All Templates
        </h2>
        <TemplateList />
      </div>
    </div>
  );
}


