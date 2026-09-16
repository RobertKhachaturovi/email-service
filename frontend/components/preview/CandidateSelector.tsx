'use client';

import { Candidate } from '@/types/api';

interface CandidateSelectorProps {
  candidates: Candidate[];
  selectedCandidateId: string;
  loading: boolean;
  error: string | null;
  sending: boolean;
  onSelect: (candidateId: string) => void;
  onRetry: () => void;
}

export default function CandidateSelector({
  candidates,
  selectedCandidateId,
  loading,
  error,
  sending,
  onSelect,
  onRetry,
}: CandidateSelectorProps) {
  return (
    <div>
      <label
        htmlFor="candidate-select"
        className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        Select Candidate
      </label>
      {loading ? (
        <div className="py-2 text-xs text-zinc-500">Loading candidates...</div>
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
      ) : candidates.length === 0 ? (
        <div className="py-2 text-xs text-zinc-500">No candidates found.</div>
      ) : (
        <select
          id="candidate-select"
          value={selectedCandidateId}
          onChange={(e) => onSelect(e.target.value)}
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
  );
}
