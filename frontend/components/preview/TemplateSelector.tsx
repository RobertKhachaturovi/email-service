'use client';

import { EmailTemplate } from '@/types/api';

interface TemplateSelectorProps {
  templates: EmailTemplate[];
  selectedTemplateId: string;
  loading: boolean;
  error: string | null;
  sending: boolean;
  onSelect: (templateId: string) => void;
  onRetry: () => void;
}

export default function TemplateSelector({
  templates,
  selectedTemplateId,
  loading,
  error,
  sending,
  onSelect,
  onRetry,
}: TemplateSelectorProps) {
  return (
    <div>
      <label
        htmlFor="template-select"
        className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        Select Template
      </label>
      {loading ? (
        <div className="py-2 text-xs text-zinc-500">Loading templates...</div>
      ) : error ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="text-xs text-zinc-700 underline dark:text-zinc-300"
          >
            Retry
          </button>
        </div>
      ) : templates.length === 0 ? (
        <div className="py-2 text-xs text-zinc-500">No email templates found.</div>
      ) : (
        <select
          id="template-select"
          value={selectedTemplateId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={sending}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">-- Choose a template --</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.subject}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
