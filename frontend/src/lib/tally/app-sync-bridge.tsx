import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { expensesQueryKey, useExpensesQuery } from "@/lib/hooks/use-expenses";
import { groupsQueryKey, useGroupsQuery } from "@/lib/hooks/use-groups";
import { useTally } from "@/lib/tally/store";

/** Tracks React Query loading state and mirrors it into the tally store for UI loaders. */
export function AppSyncBridge() {
  const expenses = useExpensesQuery();
  const groups = useGroupsQuery();
  const queryClient = useQueryClient();
  const { state, actions } = useTally();
  const prevScreen = useRef(state.screen);

  const initialLoading = expenses.isPending || groups.isPending;
  const refreshing =
    !initialLoading &&
    ((expenses.isFetching && expenses.isSuccess) || (groups.isFetching && groups.isSuccess));

  useEffect(() => {
    actions.setAppLoading(initialLoading);
  }, [actions, initialLoading]);

  useEffect(() => {
    actions.setAppRefreshing(refreshing);
  }, [actions, refreshing]);

  // Keep home + balances in sync when returning from another screen.
  useEffect(() => {
    if (state.screen === "home" && prevScreen.current !== "home") {
      void queryClient.invalidateQueries({ queryKey: expensesQueryKey });
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey });
    }
    prevScreen.current = state.screen;
  }, [queryClient, state.screen]);

  return null;
}
