import { PrimaryButton } from "@/components/auth/ui/PrimaryButton";
import { useLogoutMutation, useSessionsQuery } from "@/lib/hooks/use-auth-actions";
import { getStoredUser } from "@/lib/auth/auth-storage";

export function AppShell() {
  const user = getStoredUser();
  const logoutMutation = useLogoutMutation();
  const sessionsQuery = useSessionsQuery();

  const sessions = sessionsQuery.data?.sessions ?? [];

  return (
    <div className="min-h-dvh bg-[#0f0f0f] text-ink">
      <header className="border-b border-white/10 bg-[#141414]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-ink">
              <span className="font-serif text-xl">৳</span>
            </div>
            <div>
              <p className="font-serif text-lg leading-none text-canvas">Tally</p>
              <p className="text-xs text-white/50">Test app shell</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-white/5 disabled:opacity-60"
          >
            {logoutMutation.isPending ? "Signing out…" : "Log out"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <section className="mb-6 rounded-card bg-canvas p-6 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Signed in as</p>
          <h1 className="mt-2 font-serif text-3xl">{user?.username ?? "User"}</h1>
          <p className="mt-1 text-sm text-muted">{user?.email}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-field border border-line bg-white px-4 py-3">
              <dt className="text-muted-2">Currency</dt>
              <dd className="mt-1 font-semibold">{user?.currency ?? "—"}</dd>
            </div>
            <div className="rounded-field border border-line bg-white px-4 py-3">
              <dt className="text-muted-2">Language</dt>
              <dd className="mt-1 font-semibold">{user?.language ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-card bg-canvas p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl">Active sessions</h2>
              <p className="mt-1 text-sm text-muted">
                Protected API call — verifies your access token works.
              </p>
            </div>
            <PrimaryButton
              testId="refresh-sessions"
              busy={sessionsQuery.isFetching}
              onClick={() => sessionsQuery.refetch()}
            >
              Refresh
            </PrimaryButton>
          </div>

          {sessionsQuery.isLoading && (
            <p className="mt-4 text-sm text-muted">Loading sessions…</p>
          )}

          {sessionsQuery.isError && (
            <p className="mt-4 text-sm text-red-600">
              Could not load sessions. If your token expired, the client will try to refresh it automatically.
            </p>
          )}

          {sessionsQuery.isSuccess && (
            <ul className="mt-4 space-y-3">
              {sessions.length === 0 ? (
                <li className="text-sm text-muted">No active sessions found.</li>
              ) : (
                sessions.map((session) => (
                  <li
                    key={session.id}
                    className="rounded-field border border-line bg-white px-4 py-3 text-sm"
                  >
                    <p className="font-semibold">{session.device_name ?? "Unknown device"}</p>
                    <p className="mt-1 text-muted-2">
                      Expires {session.expires_at ? new Date(session.expires_at).toLocaleString() : "—"}
                    </p>
                  </li>
                ))
              )}
            </ul>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-white/40">
          Main app UI will replace this page later. Token refresh runs automatically on 401 responses.
        </p>
      </main>
    </div>
  );
}
