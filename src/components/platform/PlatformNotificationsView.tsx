"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Loader2,
  Megaphone,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import {
  listPlatformNotificationsApi,
  sendPlatformNotificationApi,
  type PlatformNotificationAudience,
  type PlatformNotificationRow,
} from "@/lib/platform-api";
import { ApiError } from "@/lib/api-client";
import { formatPlatformWhen } from "@/lib/platform-demo";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { cn } from "@/lib/utils";

const AUDIENCES: {
  id: PlatformNotificationAudience;
  label: string;
  hint: string;
  icon: typeof Users;
  badgeClass: string;
}[] = [
  {
    id: "hq",
    label: "HQ admins",
    hint: "Transport headquarters accounts only",
    icon: Building2,
    badgeClass: "bg-amber-50 text-amber-900",
  },
  {
    id: "lead",
    label: "Branch leads",
    hint: "Station lead accounts only",
    icon: UserRound,
    badgeClass: "bg-emerald-50 text-emerald-800",
  },
  {
    id: "staff",
    label: "Counter staff",
    hint: "Station staff accounts only",
    icon: Users,
    badgeClass: "bg-sky-50 text-sky-800",
  },
  {
    id: "general",
    label: "All roles",
    hint: "HQ + branch leads + counter staff",
    icon: Bell,
    badgeClass: "bg-violet-50 text-violet-800",
  },
];

function audienceMeta(id: string) {
  return AUDIENCES.find((row) => row.id === id) ?? AUDIENCES[3]!;
}

export function PlatformNotificationsView() {
  const [audience, setAudience] = useState<PlatformNotificationAudience>("staff");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState<PlatformNotificationRow[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const rows = await listPlatformNotificationsApi();
      setHistory(rows);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || /cannot get/i.test(error.message))) {
        setHistory([]);
        setHistoryError(
          "Notifications API is not on the live server yet. Redeploy the Parcela API (Render), then refresh.",
        );
      } else {
        setHistoryError(error instanceof Error ? error.message : "Could not load history.");
      }
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (trimmedTitle.length < 2) {
      await showValidationAlert({
        title: "Add a title",
        text: "Give this update a short title (at least 2 characters).",
      });
      return;
    }
    if (trimmedBody.length < 4) {
      await showValidationAlert({
        title: "Add a message",
        text: "Write the update message recipients should receive.",
      });
      return;
    }

    const selected = audienceMeta(audience);
    const confirmed = await showConfirmDialog({
      title: "Send this update?",
      text: `SMS will go to ${selected.label.toLowerCase()}. Title: “${trimmedTitle}”.`,
      confirmText: "Send SMS",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setSending(true);
    try {
      const result = await sendPlatformNotificationApi({
        title: trimmedTitle,
        body: trimmedBody,
        audience,
      });
      setTitle("");
      setBody("");
      setHistory((prev) => [result, ...prev]);
      await showSuccessAlert({
        title: "Update sent",
        text: `Delivered to ${result.sentCount} of ${result.recipientCount} phones${
          result.failedCount > 0 ? ` (${result.failedCount} failed)` : ""
        }.`,
      });
    } catch (error) {
      await showValidationAlert({
        title: "Could not send",
        text: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Control
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-stone-900">
            Notifications
          </h1>
          <p className="font-body mt-1.5 max-w-2xl text-sm text-stone-600">
            Send an update to HQ admins, branch leads, counter staff, or everyone. Recipients see it
            as a popup when they open their dashboard (SMS is sent too).
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form
          onSubmit={(e) => void handleSend(e)}
          className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--platform-orange-soft)] text-[var(--platform-orange)]">
              <Megaphone className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">Compose update</h2>
              <p className="font-body text-xs text-stone-500">
                Dashboard popup on login · SMS via mNotify
              </p>
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="font-display mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">
              Audience
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {AUDIENCES.map((option) => {
                const active = audience === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAudience(option.id)}
                    className={cn(
                      "rounded-xl border px-3.5 py-3 text-left transition-colors",
                      active
                        ? "border-[var(--platform-orange)] bg-[var(--platform-orange-soft)]"
                        : "border-stone-200 bg-stone-50 hover:bg-white",
                    )}
                  >
                    <span className="font-display flex items-center gap-2 text-sm font-bold text-stone-900">
                      <Icon className="size-3.5 shrink-0" />
                      {option.label}
                    </span>
                    <span className="font-body mt-1 block text-[11px] leading-snug text-stone-500">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="mt-5 block">
            <span className="font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-stone-500">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Staff app update"
              className="font-body w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm text-stone-900 outline-none focus:border-[var(--platform-orange)] focus:bg-white"
              disabled={sending}
            />
          </label>

          <label className="mt-4 block">
            <span className="font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-stone-500">
              Message
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={480}
              rows={5}
              placeholder="What should they know?"
              className="font-body w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm text-stone-900 outline-none focus:border-[var(--platform-orange)] focus:bg-white"
              disabled={sending}
            />
            <span className="font-body mt-1 block text-[11px] text-stone-400">
              {body.trim().length}/480 · SMS is prefixed with “Parcela update”
            </span>
          </label>

          <button
            type="submit"
            disabled={sending}
            className="font-display mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
            style={{ background: "var(--platform-header-gradient)" }}
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send notification
              </>
            )}
          </button>
        </form>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-stone-900">Recent sends</h2>
            <button
              type="button"
              onClick={() => void loadHistory()}
              className="font-display text-xs font-semibold text-[var(--platform-orange)] hover:underline"
              disabled={loadingHistory}
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <p className="font-body mt-8 flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="size-4 animate-spin" />
              Loading history…
            </p>
          ) : historyError ? (
            <p className="font-body mt-8 text-sm text-rose-600">{historyError}</p>
          ) : history.length === 0 ? (
            <p className="font-body mt-8 text-sm text-stone-500">
              No notifications sent yet. Compose one on the left.
            </p>
          ) : (
            <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {history.map((row) => {
                const meta = audienceMeta(row.audience);
                return (
                  <li
                    key={row.id}
                    className="rounded-xl border border-stone-100 bg-stone-50/80 px-3.5 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "font-display rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          meta.badgeClass,
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="font-body text-[11px] text-stone-400">
                        {formatPlatformWhen(row.sentAt)}
                      </span>
                    </div>
                    <p className="font-display mt-1.5 text-sm font-bold text-stone-900">{row.title}</p>
                    <p className="font-body mt-1 line-clamp-3 text-xs leading-relaxed text-stone-600">
                      {row.body}
                    </p>
                    <p className="font-body mt-2 text-[11px] text-stone-500">
                      Sent {row.sentCount}/{row.recipientCount}
                      {row.failedCount > 0 ? ` · ${row.failedCount} failed` : ""}
                      {row.actorEmail ? ` · ${row.actorEmail}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
