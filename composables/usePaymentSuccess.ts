import { useAuthStore } from "@/stores/auth";
import { useCarRegistrationSearchStore } from "@/stores/carRegistrationSearch";
import { useSubscriptionStore } from "@/stores/subscription";
import type { SubscriptionPurchasePayload } from "~/types/models";

/**
 * What happens once a payment has cleared, regardless of who took it.
 *
 * Both checkout components end here, so the counters, the stored subscription, the freshly
 * unlocked car data and the redirect stay in step between Stripe and ECOMMPAY.
 */
export const usePaymentSuccess = () => {
  const applyPaymentPayload = async (
    payload: Partial<SubscriptionPurchasePayload> | null | undefined,
  ): Promise<void> => {
    if (!payload) return;

    const subscriptionStore = useSubscriptionStore();
    const registrationSearchStore = useCarRegistrationSearchStore();
    const user = useAuthStore().getCurrentUser;

    if (payload.hasSubscription) {
      if (user) {
        user.request_count = Number(payload.hasSubscription.request_count) || 0;
        user.one_off_request_count = Number(payload.hasSubscription.one_off_request_count) || 0;
        user.request_count_trial = Number(payload.hasSubscription.request_count_trial) || 0;
      }

      await subscriptionStore.setHasSubscription(payload.hasSubscription);
    }

    if (payload.subscription) {
      await subscriptionStore.setCurrentSubscription(payload.subscription);
    }

    if (payload.car_data) {
      await registrationSearchStore.applyCarData(payload.car_data);
      return;
    }

    const regNumber =
      registrationSearchStore.reg_number ||
      (import.meta.client ? localStorage.getItem("reg_number") : null);

    if (!regNumber) return;

    try {
      await registrationSearchStore.searchCarRegNumber(regNumber);
    } catch (error) {
      console.error("Post-payment report refresh failed:", error);
    }
  };

  /** The pause is deliberate: the success state is shown before the redirect. */
  const redirectToReport = (delayMs = 3000): void => {
    setTimeout(() => navigateTo("/report"), delayMs);
  };

  return { applyPaymentPayload, redirectToReport };
};
