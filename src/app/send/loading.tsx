import { AppShell } from "@/components/ui/AppShell";

export default function SendLoading() {
  return (
    <AppShell
      shellClassName="h-dvh max-h-dvh overflow-hidden"
      className="flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !pb-0 !pt-0"
    >
      <div className="animate-pulse shrink-0 border-b border-border bg-surface px-5 pb-4 pt-2">
        <div className="mb-3 h-4 w-12 rounded bg-border" />
        <div className="mx-auto h-[190px] w-full max-w-[360px] rounded-xl bg-border" />
        <div className="mt-4 space-y-2">
          <div className="h-5 w-24 rounded-full bg-border" />
          <div className="h-7 w-48 rounded-lg bg-border" />
          <div className="h-4 w-56 rounded bg-border" />
        </div>
        <div className="mt-5 h-11 rounded-2xl bg-border" />
        <div className="mt-4 h-12 rounded-2xl bg-border" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-5 pt-4">
          <div className="mb-3 h-4 w-28 rounded bg-border" />
        </div>
        <div className="space-y-2.5 overflow-hidden px-5">
          <div className="h-28 rounded-2xl bg-border" />
          <div className="h-28 rounded-2xl bg-border" />
          <div className="h-28 rounded-2xl bg-border" />
        </div>
      </div>
    </AppShell>
  );
}
