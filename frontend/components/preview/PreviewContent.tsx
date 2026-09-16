'use client';

import { Candidate, EmailPreview } from '@/types/api';

interface PreviewContentProps {
  preview: EmailPreview;
  selectedCandidate?: Candidate;
  sending: boolean;
  sendError: string | null;
  onSend: () => void;
  isSendDisabled: boolean;
}

export default function PreviewContent({
  preview,
  selectedCandidate,
  sending,
  sendError,
  onSend,
  isSendDisabled,
}: PreviewContentProps) {
  return (
    <div className="space-y-4">
      {/* Status Indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Preview Result
        </span>

        {preview.ready ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ready to Send
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
            Missing Variables
          </span>
        )}
      </div>

      {/* Missing Variables List */}
      {!preview.ready && preview.missingVariables && preview.missingVariables.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <p className="font-semibold">Cannot send email: template variables are missing.</p>
          <p className="mt-1 text-xs">
            Missing variables: <span className="font-mono">{preview.missingVariables.join(', ')}</span>
          </p>
        </div>
      )}

      {/* Recipient Details */}
      {selectedCandidate && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
          <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Recipient
          </span>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedCandidate.fullName || `${selectedCandidate.firstName} ${selectedCandidate.lastName}`}{' '}
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              &lt;{selectedCandidate.email}&gt;
            </span>
          </p>
        </div>
      )}

      {/* Subject */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
        <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Subject</span>
        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {preview.subject}
        </p>
      </div>

      {/* Body */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <span className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Body</span>
        <div className="whitespace-pre-wrap font-mono text-sm text-zinc-800 dark:text-zinc-200">
          {preview.body}
        </div>
      </div>

      {/* Send Error */}
      {sendError && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          <span>{sendError}</span>
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="ml-4 rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/60 dark:text-red-200 dark:hover:bg-red-900"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Send Email Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSend}
          disabled={isSendDisabled}
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
        >
          {sending ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin text-current"
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
              <span>Sending Email...</span>
            </>
          ) : (
            'Send Email'
          )}
        </button>
      </div>
    </div>
  );
}
