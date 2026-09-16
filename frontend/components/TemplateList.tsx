'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEmailTemplates, EmailTemplate, ApiError } from '@/lib/api';

export default function TemplateList() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmailTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to load email templates. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const data = await getEmailTemplates();
        if (isMounted) {
          setTemplates(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Unable to load email templates. Please try again.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
          <svg
            className="h-5 w-5 animate-spin text-zinc-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Loading email templates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
          <button
            type="button"
            onClick={loadTemplates}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No email templates found.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:block">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50">
            <tr>
              <th
                scope="col"
                className="w-1/4 px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                Name
              </th>
              <th
                scope="col"
                className="w-1/3 px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                Subject
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                Body
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {templates.map((template) => (
              <tr
                key={template.id}
                className="transition-colors hover:bg-zinc-50/75 dark:hover:bg-zinc-800/50"
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {template.name}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {template.subject}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <p className="line-clamp-2 whitespace-pre-wrap break-words font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {template.body}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card/List View */}
      <div className="space-y-4 md:hidden">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {template.name}
              </h3>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Subject:
                </span>
                <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">
                  {template.subject}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Body:
                </span>
                <p className="mt-0.5 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                  {template.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
