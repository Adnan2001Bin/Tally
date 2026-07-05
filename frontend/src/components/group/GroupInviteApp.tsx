import { AuthLoader } from "@/components/auth/AuthLoader";
import { isAuthenticated } from "@/lib/auth/auth-storage";
import { redirectToApp, redirectToLogin } from "@/lib/auth/auth-routes";
import {
  normalizeInviteCode,
  savePendingGroupInvite,
} from "@/lib/auth/pending-invite";
import { useEffect } from "react";

function readInviteCode(): string {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("code");
  if (fromQuery) return normalizeInviteCode(fromQuery);

  const match = window.location.pathname.match(/^\/group\/([^/]+)\/?$/);
  if (match && match[1] !== "join") return normalizeInviteCode(match[1]);

  return "";
}

/** Landing page for group invite links — sends users to login or app join flow. */
export default function GroupInviteApp() {
  useEffect(() => {
    const inviteCode = readInviteCode();
    if (!inviteCode || inviteCode.length < 4) {
      window.location.href = "/app";
      return;
    }

    savePendingGroupInvite(inviteCode);

    if (isAuthenticated()) {
      redirectToApp(inviteCode);
    } else {
      redirectToLogin(inviteCode);
    }
  }, []);

  return <AuthLoader message="Opening group invite…" />;
}
