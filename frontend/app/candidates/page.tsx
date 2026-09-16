import CandidateList from '@/components/CandidateList';

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Candidates
      </h1>
      <CandidateList />
    </div>
  );
}

