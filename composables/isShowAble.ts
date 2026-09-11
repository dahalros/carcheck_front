import { computed, type ComputedRef } from "vue";
import { useCarRegistrationSearchStore } from "~/stores/carRegistrationSearch";

interface ReportEntitlements {
  isShowAble: ComputedRef<boolean>;
  includesVdiChecks: ComputedRef<boolean>;
}

export function useIsShowAble(): ReportEntitlements {
  const store = useCarRegistrationSearchStore();

  return {
    isShowAble: computed(() => store.allowFullReport),
    includesVdiChecks: computed(() => store.includesVdiChecks),
  };
}
