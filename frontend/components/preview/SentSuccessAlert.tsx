'use client';

import { SentEmail } from '@/types/api';

interface SentSuccessAlertProps {
  sentResult: SentEmail;
  onReset: () => void;
}

export default function SentSuccessAlert({ sentResult, onReset }: SentSuccessAlertProps) {
  return (
    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/40">
      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
        <svg
          className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <h3 className="font-semibold">Email sent successfully.</h3>
      </div>
      <div className="mt-3 space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
        <p>
          <span className="font-medium">To:</span> {sentResult.toEmail}
        </p>
        <p>
          <span className="font-medium">Subject:</span> {sentResult.subject}
        </p>
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Send Another Email
        </button>
      </div>
    </div>
  );
}
