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
import TemplateSelector from './preview/TemplateSelector';
import CandidateSelector from './preview/CandidateSelector';
import PreviewContent from './preview/PreviewContent';
import SentSuccessAlert from './preview/SentSuccessAlert';

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
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load templates.';
      setTemplatesError(msg);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    setCandidatesError(null);
    try {
      const data = await getCandidates();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load candidates.';
      setCandidatesError(msg);
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
          setTemplates(Array.isArray(templatesData) ? templatesData : []);
          setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
          setTemplatesError(null);
          setCandidatesError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load initial data.';
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
      const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Unable to generate email preview.';
      setPreviewError(msg);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSend = async () => {
    if (!selectedCandidateId || !selectedTemplateId || !preview || !preview.ready || sending) {
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const result = await sendEmail(selectedCandidateId, selectedTemplateId);
      setSentResult(result);
    } catch (err: unknown) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Failed to send email.';
      setSendError(msg);
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
        <TemplateSelector
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          loading={loadingTemplates}
          error={templatesError}
          sending={sending}
          onSelect={handleTemplateChange}
          onRetry={fetchTemplates}
        />

        <CandidateSelector
          candidates={candidates}
          selectedCandidateId={selectedCandidateId}
          loading={loadingCandidates}
          error={candidatesError}
          sending={sending}
          onSelect={handleCandidateChange}
          onRetry={fetchCandidates}
        />
      </div>

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

      {sentResult && <SentSuccessAlert sentResult={sentResult} onReset={handleReset} />}

      {!sentResult && (
        <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {!preview && !previewError && !loadingPreview && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select a template and candidate to preview the email.
            </p>
          )}

          {preview && (
            <PreviewContent
              preview={preview}
              selectedCandidate={selectedCandidate}
              sending={sending}
              sendError={sendError}
              onSend={handleSend}
              isSendDisabled={isSendButtonDisabled}
            />
          )}
        </div>
      )}
    </div>
  );
}
