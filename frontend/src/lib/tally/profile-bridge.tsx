import { useEffect } from "react";
import { useProfileQuery } from "@/lib/hooks/use-profile";
import { useTally } from "@/lib/tally/store";

/** Syncs profile (monthly budget) from the API into the tally store. */
export function ProfileBridge() {
  const { data, isSuccess } = useProfileQuery();
  const { actions } = useTally();

  useEffect(() => {
    if (!isSuccess || !data) return;
    actions.syncMonthlyBudget(data.user.monthly_budget ?? null);
  }, [actions, data, isSuccess]);

  return null;
}
