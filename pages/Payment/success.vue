<script setup lang="ts">
import { useSubscriptionStore } from '@/stores/subscription';

/**
 * Where ECOMMPAY returns the customer after a successful card payment.
 *
 * redirect_success_mode is parent_page, so this replaces the whole checkout page rather than
 * rendering inside the frame -- which means the checkout's own poll is gone by the time we
 * get here and this page has to finish the job itself.
 *
 * Nothing here decides entitlement. It polls our backend, which confirms the payment against
 * ECOMMPAY and records it; a customer landing on this URL by hand gets nothing.
 */

const POLL_INTERVAL_MS = 2000;
const POLL_CEILING_MS = 2 * 60 * 1000;

const route = useRoute();
const subscriptionStore = useSubscriptionStore();
const { applyPaymentPayload, redirectToReport } = usePaymentSuccess();

const paymentId = computed(() => {
  const id = route.query.payment_id;
  return typeof id === 'string' && id ? id : null;
});

const state = ref<'confirming' | 'done' | 'slow' | 'failed'>('confirming');
const message = ref('Confirming your payment...');

let pollTimer: ReturnType<typeof setTimeout> | null = null;
const stopPolling = () => {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
};

async function confirm() {
  if (!paymentId.value) {
    state.value = 'failed';
    message.value = 'We could not identify this payment.';
    return;
  }

  const startedAt = Date.now();

  const poll = async () => {
    if (Date.now() - startedAt > POLL_CEILING_MS) {
      // The money may well have moved -- never tell someone their payment failed here.
      state.value = 'slow';
      message.value =
        'Your payment went through but is taking longer than usual to confirm. Your report will appear in your account shortly.';
      return;
    }

    try {
      const response = await subscriptionStore.checkEcommPayStatus(paymentId.value as string);
      const payload = response.payload;

      if (payload?.status === 'success') {
        stopPolling();
        state.value = 'done';
        message.value = 'Payment successful. Taking you to your report...';
        await applyPaymentPayload(payload);
        redirectToReport(1500);
        return;
      }

      if (payload?.status === 'failed') {
        stopPolling();
        state.value = 'failed';
        message.value = payload.message || 'That payment did not go through.';
        return;
      }
    } catch (error) {
      // One failed poll says nothing about the payment -- keep waiting.
      console.error('Payment confirmation check failed:', error);
    }

    pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
  };

  await poll();
}

onMounted(confirm);
onBeforeUnmount(stopPolling);

definePageMeta({
  title: 'Payment complete',
  layout: 'checkout',
});
</script>

<template>
  <section class="flex items-center justify-center min-h-[60vh] px-6">
    <div class="w-full max-w-md p-8 text-center bg-white shadow rounded-[10px]">
      <p
        class="text-[17px] leading-relaxed"
        :class="state === 'failed' ? 'text-[#EF343A]' : 'text-[#2C2C2C]'"
      >
        {{ message }}
      </p>

      <p v-if="state === 'confirming'" class="mt-3 text-xs text-[#BEC0C6]">
        Please do not close this page.
      </p>

      <NuxtLink
        v-if="state === 'failed'"
        to="/payment/checkout"
        class="inline-block px-6 py-3 mt-6 font-bold text-white rounded-lg bg-brand"
      >
        Try again
      </NuxtLink>

      <NuxtLink
        v-else-if="state === 'slow'"
        to="/dashboard"
        class="inline-block px-6 py-3 mt-6 font-bold text-white rounded-lg bg-brand"
      >
        Go to my account
      </NuxtLink>
    </div>
  </section>
</template>
