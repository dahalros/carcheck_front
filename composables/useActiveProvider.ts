import ApiService from "~/services/apiService";
import type { ApiPayloadResponse, PaymentProvider } from "~/types/models";

/**
 * Which provider is taking money right now. It is a row in the backend's payment_providers
 * table, so it can change without a deploy and must not be baked into the bundle.
 *
 * Cached for the page's lifetime -- checkout and the top-up widget both ask, and the answer
 * does not change mid-session.
 */
const activeProvider = ref<string | null>(null);
let inFlight: Promise<string> | null = null;

export const useActiveProvider = () => {
  const fetchActiveProvider = async (): Promise<string> => {
    if (activeProvider.value) return activeProvider.value;

    if (!inFlight) {
      inFlight = ApiService.get<ApiPayloadResponse<PaymentProvider | null>>("check-active-provider")
        .then((response) => response.payload?.provider_code ?? "stripe")
        // A failed lookup must not block checkout: fall back to the historical provider.
        .catch(() => "stripe")
        .finally(() => {
          inFlight = null;
        });
    }

    activeProvider.value = await inFlight;
    return activeProvider.value;
  };

  const isEcommPay = computed(() => activeProvider.value === "ecommpay");

  return { activeProvider, fetchActiveProvider, isEcommPay };
};
