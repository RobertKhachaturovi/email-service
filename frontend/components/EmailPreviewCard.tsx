'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCandidates,
  getEmailTemplates,
  previewEmail,
  sendEmail,
  Candidate,
  EmailTemplate,
  EmailPreview,
  SentEmail,
  ApiError,
} from '@/lib/api';

export default function EmailPreviewCard() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');

  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [sending, setSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentResult, setSentResult] = useState<SentEmail | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    setTemplatesError(null);
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (err: unknown) {
      if (err instanceof ApiError || err instanceof Error) {
        setTemplatesError(err.message);
      } else {
        setTemplatesError('Failed to load templates.');
      }
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    setCandidatesError(null);
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (err: unknown) {
      if (err instanceof ApiError || err instanceof Error) {
        setCandidatesError(err.message);
      } else {
        setCandidatesError('Failed to load candidates.');
      }
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [templatesData, candidatesData] = await Promise.all([
          getEmailTemplates(),
          getCandidates(),
        ]);
        if (isMounted) {
          setTemplates(templatesData);
          setCandidates(candidatesData);
          setTemplatesError(null);
          setCandidatesError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof ApiError || err instanceof Error
              ? err.message
              : 'Failed to load initial data.';
          setTemplatesError(msg);
          setCandidatesError(msg);
        }
      } finally {
        if (isMounted) {
          setLoadingTemplates(false);
          setLoadingCandidates(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setPreview(null);
    setPreviewError(null);
    setSentResult(null);
    setSendError(null);
  };

  const handleCandidateChange = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setPreview(null);
    setPreviewError(null);
    setSentResult(null);
    setSendError(null);
  };

  const handlePreview = async () => {
    if (!selectedTemplateId || !selectedCandidateId) return;

    setLoadingPreview(true);
    setPreviewError(null);
    setSentResult(null);
    setSendError(null);

    try {
      const result = await previewEmail(selectedCandidateId, selectedTemplateId);
      setPreview(result);
    } catch (err: unknown) {
      if (err instanceof ApiError || err instanceof Error) {
        setPreviewError(err.message);
      } else {
        setPreviewError('Unable to generate email preview. Please try again.');
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSend = async () => {
    if (
      !selectedCandidateId ||
      !selectedTemplateId ||
      !preview ||
      !preview.ready ||
      sending
    ) {
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const result = await sendEmail(selectedCandidateId, selectedTemplateId);
      setSentResult(result);
    } catch (err: unknown) {
      if (err instanceof ApiError || err instanceof Error) {
        setSendError(err.message);
      } else {
        setSendError('Failed to send email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setSentResult(null);
    setSendError(null);
    setPreview(null);
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);
  const isPreviewButtonDisabled =
    !selectedTemplateId ||
    !selectedCandidateId ||
    loadingPreview ||
    sending ||
    loadingTemplates ||
    loadingCandidates;

  const isSendButtonDisabled =
    !selectedTemplateId ||
    !selectedCandidateId ||
    !preview ||
    !preview.ready ||
    sending ||
    loadingPreview;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Preview & Send Email
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Template Selector */}
        <div>
          <label
            htmlFor="template-select"
            className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Select Template
          </label>
          {loadingTemplates ? (
            <div className="py-2 text-xs text-zinc-500">Loading templates...</div>
          ) : templatesError ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 dark:text-red-400">
                {templatesError}
              </span>
              <button
                type="button"
                onClick={fetchTemplates}
                className="text-xs text-zinc-700 underline dark:text-zinc-300"
              >
                Retry
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div className="py-2 text-xs text-zinc-500">
              No email templates found.
            </div>
          ) : (
            <select
              id="template-select"
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
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

        {/* Candidate Selector */}
        <div>
          <label
            htmlFor="candidate-select"
            className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Select Candidate
          </label>
          {loadingCandidates ? (
            <div className="py-2 text-xs text-zinc-500">Loading candidates...</div>
          ) : candidatesError ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 dark:text-red-400">
                {candidatesError}
              </span>
              <button
                type="button"
                onClick={fetchCandidates}
                className="text-xs text-zinc-700 underline dark:text-zinc-300"
              >
                Retry
              </button>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-2 text-xs text-zinc-500">No candidates found.</div>
          ) : (
            <select
              id="candidate-select"
              value={selectedCandidateId}
              onChange={(e) => handleCandidateChange(e.target.value)}
              disabled={sending}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">-- Choose a candidate --</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName || `${c.firstName} ${c.lastName}`} ({c.email}) —{' '}
                  {c.projectTitle}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Action Button: Preview Email */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPreviewButtonDisabled}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
        >
          {loadingPreview ? (
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
              <span>Generating Preview...</span>
            </>
          ) : (
            'Preview Email'
          )}
        </button>
      </div>

      {/* Preview Error State */}
      {previewError && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          <span>{previewError}</span>
          <button
            type="button"
            onClick={handlePreview}
            className="ml-4 rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/60 dark:text-red-200 dark:hover:bg-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Sent Success State */}
      {sentResult && (
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
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Send Another Email
            </button>
          </div>
        </div>
      )}

      {/* Preview Result & Send Flow Display */}
      {!sentResult && (
        <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {!preview && !previewError && !loadingPreview && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select a template and candidate to preview the email.
            </p>
          )}

          {preview && (
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

              {/* Missing Variables List & Blocked Notice (when ready === false) */}
              {!preview.ready &&
                preview.missingVariables &&
                preview.missingVariables.length > 0 && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <p className="font-semibold">
                      Cannot send email: template variables are missing.
                    </p>
                    <p className="mt-1 text-xs">
                      Missing variables:{' '}
                      <span className="font-mono">
                        {preview.missingVariables.join(', ')}
                      </span>
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
                    {selectedCandidate.fullName ||
                      `${selectedCandidate.firstName} ${selectedCandidate.lastName}`}{' '}
                    <span className="font-normal text-zinc-600 dark:text-zinc-400">
                      &lt;{selectedCandidate.email}&gt;
                    </span>
                  </p>
                </div>
              )}

              {/* Subject */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Subject
                </span>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {preview.subject}
                </p>
              </div>

              {/* Body */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Body
                </span>
                <div className="whitespace-pre-wrap font-mono text-sm text-zinc-800 dark:text-zinc-200">
                  {preview.body}
                </div>
              </div>

              {/* Send Error State */}
              {sendError && (
                <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <span>{sendError}</span>
                  <button
                    type="button"
                    onClick={handleSend}
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
                  onClick={handleSend}
                  disabled={isSendButtonDisabled}
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
          )}
        </div>
      )}
    </div>
  );
}
