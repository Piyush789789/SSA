import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

/**
 * Renders the loading / error state of a useApi() result, otherwise its children.
 * `children` may be a function receiving the loaded data:
 *
 *   <AsyncState state={students}>{(list) => <StudentTable students={list} />}</AsyncState>
 *
 * Pass several states as an array to wait for all of them; the function then receives an array of data.
 */
export const AsyncState = ({ state, children, loadingText = 'Loading…' }) => {
  const states = Array.isArray(state) ? state : [state];
  const failed = states.find((s) => s.error && s.data == null);
  if (failed) {
    return <ErrorMessage error={failed.error} onRetry={() => states.forEach((s) => s.reload())} />;
  }
  if (states.some((s) => s.loading)) {
    return <LoadingMessage text={loadingText} />;
  }
  if (typeof children !== 'function') return children;
  return Array.isArray(state) ? children(states.map((s) => s.data)) : children(state.data);
};

export const LoadingMessage = ({ text = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
    <Loader2 className="h-5 w-5 animate-spin text-[#FF6B2C]" />
    {text}
  </div>
);

export const ErrorMessage = ({ error, onRetry }) => (
  <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center">
    <AlertCircle className="h-5 w-5 flex-shrink-0" />
    <span className="flex-1">{error?.message ?? 'Something went wrong.'}</span>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100"
      >
        Try again
      </button>
    ) : null}
  </div>
);

export const EmptyMessage = ({ text }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-slate-500">
    <Inbox className="h-7 w-7 text-slate-400" />
    {text}
  </div>
);

export default AsyncState;
