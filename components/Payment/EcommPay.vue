<script setup lang="ts">
import { useCarRegistrationSearchStore } from '@/stores/carRegistrationSearch';
import { usePlanStore } from '@/stores/plan';
import { useSubscriptionStore } from '@/stores/subscription';
import type { ApiRequestError } from '~/types/models';

/**
 * ECOMMPAY checkout.
 *
 * The card is entered on ECOMMPAY's own page inside the iframe, so nothing here ever touches
 * card data. That also means this component never learns the outcome directly: the payment is
 * confirmed by a server-to-server callback to the backend, and we poll until that lands.
 *
 * The source integration this was ported from listened for a postMessage from the iframe.
 * That only worked because its payment page and app shared an origin. Ours do not, so polling
 * is the mechanism.
 */

const POLL_INTERVAL_MS = 3000;
const POLL_CEILING_MS = 3 * 60 * 1000;

const subscriptionStore = useSubscriptionStore();
const registrationSearchStore = useCarRegistrationSearchStore();
const planStore = usePlanStore();
const { applyPaymentPayload, redirectToReport } = usePaymentSuccess();

const paymentUrl = ref<string | null>(null);
const paymentId = ref<string | null>(null);
const loading = ref(true);
const done = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const statusLabel = ref('Loading secure payment form...');

let pollTimer: ReturnType<typeof setTimeout> | null = null;

const stopPolling = () => {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
};

async function loadPaymentPage() {
  const plan = planStore.getSelectedPlan;

  if (!plan) {
    errorMessage.value = 'No plan selected.';
    loading.value = false;
    return;
  }

  try {
    const response = await subscriptionStore.createPaymentIntent(
      null,
      { name: '' },
      plan.id,
      registrationSearchStore.reg_number || null,
    );

    paymentUrl.value = response.payload?.payment_url ?? null;
    paymentId.value = response.payload?.payment_id ?? null;

    if (!paymentUrl.value || !paymentId.value) {
      throw new Error('The payment page could not be created.');
    }

    statusLabel.value = 'Enter your card details to continue.';
    startPolling();
  } catch (error: unknown) {
    errorMessage.value =
      (error as Partial<ApiRequestError>).data?.message ||
      'We could not start the payment. Please try again.';
  } finally {
    loading.value = false;
  }
}

function startPolling() {
  const startedAt = Date.now();

  const poll = async () => {
    if (done.value || !paymentId.value) return;

    if (Date.now() - startedAt > POLL_CEILING_MS) {
      // Not a failure: the callback may still land. Say so rather than claiming a decline.
      statusLabel.value =
        'Still waiting on your bank. If you completed the payment, your report will appear shortly.';
      return;
    }

    try {
      const response = await subscriptionStore.checkEcommPayStatus(paymentId.value);
      const payload = response.payload;

      if (payload?.status === 'success') {
        stopPolling();
        done.value = true;
        successMessage.value = 'Payment successful.';
        await applyPaymentPayload(payload);
        redirectToReport();
        return;
      }

      if (payload?.status === 'failed') {
        stopPolling();
        errorMessage.value = payload.message || 'Payment failed. Please try another card.';
        return;
      }
    } catch (error) {
      // A single failed poll says nothing about the payment -- keep waiting.
      console.error('Payment status check failed:', error);
    }

    pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
  };

  pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
}

onMounted(loadPaymentPage);
onBeforeUnmount(stopPolling);
</script>

<template>
  <div class="flex flex-col h-full">
    <p v-if="!done" class="mb-2 text-sm text-[#2C2C2C]">{{ statusLabel }}</p>

    <div v-if="loading" class="flex items-center justify-center flex-1 text-sm text-[#2C2C2C]">
      Loading secure payment form...
    </div>

    <iframe
      v-else-if="paymentUrl && !done"
      :src="paymentUrl"
      class="flex-1 w-full border-0 rounded-[10px]"
      allow="payment"
      title="Secure card payment"
    ></iframe>

    <div v-if="done" class="flex items-center justify-center flex-1 font-bold text-center text-brand">
      {{ successMessage }}<br />Redirecting to your report...
    </div>

    <p v-if="errorMessage" class="mt-3 text-sm text-[#EF343A]">{{ errorMessage }}</p>
  </div>
</template>
