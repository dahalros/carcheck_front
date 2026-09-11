import { defineStore } from "pinia";
import { decryptData, encryptData } from "~/composables/useCrypto";
import { systematicFourCharCode } from "~/composables/useGenerateLocalstorageCode";
import ApiService from "~/services/apiService";
import type {
  ApiPayloadResponse,
  BillingDetails,
  EcommPayStatusPayload,
  EcommPayWidgetConfig,
  PaymentIntentPayload,
  Subscription,
  SubscriptionPurchasePayload,
  SubscriptionStatus,
} from "~/types/models";

interface SubscriptionState {
  hasSubscription: SubscriptionStatus;
  subscription: Subscription | null;
}

interface ProcessPaymentInput {
  customerId: string;
  paymentMethodId: string;
  email: string;
  billingDetails: BillingDetails;
  planId: number;
  regNumber: string;
}

const storeEncrypted = async (key: string, value: unknown): Promise<void> => {
  const code = systematicFourCharCode(key);
  const encryptedData = await encryptData(code, JSON.stringify(value));
  localStorage.setItem(code, JSON.stringify(encryptedData));
};

const readEncrypted = async <T>(key: string): Promise<T | null> => {
  const code = systematicFourCharCode(key);
  const encryptedData = localStorage.getItem(code);
  if (!encryptedData) return null;

  const decrypted = await decryptData(code, JSON.parse(encryptedData));
  return JSON.parse(decrypted) as T;
};

export const useSubscriptionStore = defineStore("subscription", {
  state: (): SubscriptionState => ({
    hasSubscription: {
      auth: false,
      active: false,
      subscription_type: null,
      request_count: 0,
      one_off_request_count: 0,
      request_count_trial: 0,
    },
    subscription: null,
  }),

  persist: true,

  getters: {
    getSubscriptionStatus: (state): boolean => state.hasSubscription.active,
    getSubscriptionDetails: (state): Subscription | null => state.subscription,
  },

  actions: {
    async setHasSubscription(hasSubscription: SubscriptionStatus): Promise<void> {
      await storeEncrypted("hasSubscription", hasSubscription);
      this.hasSubscription = hasSubscription;
    },

    async getHasSubscription(): Promise<SubscriptionStatus> {
      try {
        const stored = await readEncrypted<SubscriptionStatus>("hasSubscription");
        if (stored) this.hasSubscription = stored;
      } catch (error) {
        console.error("Failed to decrypt current subscription status:", error);
      }

      return this.hasSubscription;
    },

    async setCurrentSubscription(subscription: Subscription | null): Promise<void> {
      await storeEncrypted("currentSubscription", subscription);
      this.subscription = subscription;
    },

    async getUserSubscription(): Promise<Subscription | null> {
      try {
        const stored = await readEncrypted<Subscription>("currentSubscription");
        if (stored) this.subscription = stored;
      } catch (error) {
        console.error("Failed to decrypt current subscription:", error);
      }

      return this.subscription;
    },

    /**
     * paymentMethodId is Stripe's; ECOMMPAY collects the card on its own page and sends null.
     * regNumber is only read by ECOMMPAY, which has to remember it across the hosted page and
     * the callback that comes back with nothing but a payment id.
     */
    createPaymentIntent(
      paymentMethodId: string | null,
      billingDetails: BillingDetails,
      planId: number,
      regNumber: string | null = null,
    ): Promise<ApiPayloadResponse<PaymentIntentPayload>> {
      return ApiService.post<ApiPayloadResponse<PaymentIntentPayload>>("payment/token/create", {
        payment_method_id: paymentMethodId,
        billing_details: billingDetails,
        plan_id: planId,
        reg_number: regNumber,
      });
    },

    /**
     * Signed parameters for the ECOMMPAY embedded widgets. Amount and currency are decided by
     * the backend from the plan row, so nothing here is worth tampering with client-side.
     */
    fetchEcommPayWidgetConfig(
      planId: number,
      regNumber: string | null = null,
    ): Promise<ApiPayloadResponse<EcommPayWidgetConfig>> {
      return ApiService.post<ApiPayloadResponse<EcommPayWidgetConfig>>(
        "payment/ecommpay/widget-config",
        { plan_id: planId, reg_number: regNumber },
      );
    },

    /** Polled while the customer is on the ECOMMPAY hosted page. */
    checkEcommPayStatus(paymentId: string): Promise<ApiPayloadResponse<EcommPayStatusPayload>> {
      return ApiService.get<ApiPayloadResponse<EcommPayStatusPayload>>(
        `payment/ecommpay/status/${encodeURIComponent(paymentId)}`,
      );
    },

    processPayment(
      payment: ProcessPaymentInput,
    ): Promise<ApiPayloadResponse<SubscriptionPurchasePayload>> {
      return ApiService.post<ApiPayloadResponse<SubscriptionPurchasePayload>>("payment/process", {
        customer_id: payment.customerId,
        payment_method_id: payment.paymentMethodId,
        email: payment.email,
        billing_details: payment.billingDetails,
        plan_id: payment.planId,
        reg_number: payment.regNumber,
      });
    },

    async fetchUserSubscription(email: string): Promise<Subscription | null> {
      const response = await ApiService.post<ApiPayloadResponse<Subscription | null>>(
        "payment/subscription",
        { email },
      );

      await this.setCurrentSubscription(response.payload);
      return response.payload;
    },

    cancelSubscription(): Promise<ApiPayloadResponse<Subscription>> {
      return ApiService.post<ApiPayloadResponse<Subscription>>("payment/subscription/cancel", {});
    },
  },
});
