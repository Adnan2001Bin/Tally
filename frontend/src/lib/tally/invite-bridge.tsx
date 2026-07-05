import { useEffect, useRef } from "react";
import { AUTH_ROUTES } from "@/lib/auth/auth-routes";
import {
  clearPendingGroupInvite,
  getPendingGroupInvite,
  normalizeInviteCode,
} from "@/lib/auth/pending-invite";
import { getGroupErrorMessage, useJoinGroupMutation } from "@/lib/hooks/use-groups";
import { useTally } from "@/lib/tally/store";

/** After sign-in, completes a pending /group/:code invite (join request). */
export function InviteBridge() {
  const joinMutation = useJoinGroupMutation();
  const { actions } = useTally();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("join");
    const fromStorage = getPendingGroupInvite();
    const raw = fromUrl ?? fromStorage;
    if (!raw) return;

    const inviteCode = normalizeInviteCode(raw);
    if (inviteCode.length < 4) {
      clearPendingGroupInvite();
      return;
    }

    started.current = true;
    clearPendingGroupInvite();

    if (fromUrl) {
      window.history.replaceState({}, "", AUTH_ROUTES.app);
    }

    void joinMutation
      .mutateAsync({ invite_code: inviteCode })
      .then(() => {
        actions.go("groups");
        actions.flash("Join request sent — waiting for admin approval");
      })
      .catch((error) => {
        actions.go("groups");
        actions.flash(getGroupErrorMessage(error));
      });
  }, [actions, joinMutation]);

  return null;
}
