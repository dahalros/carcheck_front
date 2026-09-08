<script setup lang="ts">
import { useCarRegistrationSearchStore } from '@/stores/carRegistrationSearch';
import { usePlanStore } from '@/stores/plan';
import { useSubscriptionStore } from '@/stores/subscription';
import type { ApiRequestError, EcommPayWidgetParams } from '~/types/models';

/**
 * ECOMMPAY embedded checkout: the card microframe plus Apple Pay / Google Pay buttons.
 *
 * Different integration from EcommPay.vue, which loads a whole hosted Payment Page in an
 * iframe. Here ECOMMPAY's merchant.js renders a bare card form inside our layout and the page
 * owns the submit button, so the checkout looks like the rest of the site. The card itself is
 * still entered inside ECOMMPAY's frame -- nothing on this page ever touches card data.
 *
 * The widget's own onPaymentSuccess is a UI signal, not proof of payment. Entitlement is
 * granted by the server-to-server callback, so success here starts a poll of our own status
 * endpoint and waits for that to agree.
 *
 * https://developers.ecommpay.com/en/en_pp_microframe_solution.html
 * https://developers.ecommpay.com/en/en_pp_embedded_payment_buttons.html
 */

const CDN_CSS = 'https://paymentpage.ecommpay.com/shared/merchant.css';
const CDN_JS = 'https://paymentpage.ecommpay.com/shared/merchant.js';

const POLL_INTERVAL_MS = 2000;
const POLL_CEILING_MS = 3 * 60 * 1000;
const LIBRARY_TIMEOUT_MS = 15000;

type WidgetHandle = { trySubmit?: () => void; exitIframeFullscren?: () => void };
type EPayWidgetApi = {
  runEmbedded: (params: Record<string, unknown>, method: string) => WidgetHandle;
};

const subscriptionStore = useSubscriptionStore();
const registrationSearchStore = useCarRegistrationSearchStore();
const planStore = usePlanStore();
const { applyPaymentPayload, redirectToReport } = usePaymentSuccess();

const loading = ref(true);
const submitting = ref(false);
const done = ref(false);
const errorMessage = ref<string | null>(null);
const needsRestart = ref(false);
const successMessage = ref<string | null>(null);
const pendingNotice = ref<string | null>(null);
const termsAccepted = ref(false);
const expressAvailable = ref(false);
const buttonLabel = ref('Get report');

const cardTargetId = ref('ecommpay-card-frame');
const expressTargetId = ref('ecommpay-express-buttons');

let cardWidget: WidgetHandle | null = null;
let expressWidget: WidgetHandle | null = null;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let frameLoadTimer: ReturnType<typeof setTimeout> | null = null;
let cardPaymentId: string | null = null;
let expressPaymentId: string | null = null;
let activePaymentId: string | null = null;
let paymentStarted = false;
let confirming = false;

function finishLoading(failed = false) {
  if (frameLoadTimer) clearTimeout(frameLoadTimer);
  loading.value = false;
  if (failed) {
    needsRestart.value = true;
    errorMessage.value = 'The payment form could not be loaded. Please try again.';
  }
}

const leaveFullscreen = () => {
  cardWidget?.exitIframeFullscren?.();
  expressWidget?.exitIframeFullscren?.();
};

// The library is loaded from ECOMMPAY's CDN on purpose: their docs are explicit that hosting
// merchant.js locally causes critical errors, since it is versioned with the payment frames.
useHead({
  link: [{ rel: 'stylesheet', href: CDN_CSS }],
  script: [{ src: CDN_JS, defer: true }],
});

const canSubmit = computed(() => termsAccepted.value && !submitting.value && !done.value && !loading.value && !needsRestart.value && !errorMessage.value);

const stopPolling = () => {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
};

/** merchant.js is deferred, so it may not have defined EPayWidget by the time we mount. */
function waitForLibrary(): Promise<EPayWidgetApi> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      const api = (window as unknown as { EPayWidget?: EPayWidgetApi }).EPayWidget;
      if (api?.runEmbedded) return resolve(api);

      if (Date.now() - startedAt > LIBRARY_TIMEOUT_MS) {
        return reject(new Error('The payment library could not be loaded.'));
      }

      setTimeout(check, 100);
    };

    check();
  });
}

function releaseSubmission() {
  activePaymentId = null;
  paymentStarted = false;
  confirming = false;
  submitting.value = false;
  buttonLabel.value = 'Get report';
}

function sharedCallbacks(paymentId: string) {
  return {
    onCheckSubmit: async (_data: unknown, resolve: () => void, reject: () => void) => {
      if (!termsAccepted.value || loading.value || done.value || needsRestart.value || errorMessage.value ||
        paymentStarted || ![cardPaymentId, expressPaymentId].includes(paymentId) ||
        (activePaymentId !== null && activePaymentId !== paymentId)) return reject();

      activePaymentId = paymentId;
      paymentStarted = true;
      submitting.value = true;
      buttonLabel.value = 'PROCESSING...';
      resolve();
    },
    onShowLoader: () => {
      if (activePaymentId !== paymentId || done.value) return;
      submitting.value = true;
      buttonLabel.value = 'PROCESSING...';
    },
    onHideLoader: () => {
    },
    onValidationError: () => {
      if (activePaymentId === paymentId && !paymentStarted) releaseSubmission();
    },
    onPaymentSuccess: () => {
      if (activePaymentId !== paymentId || done.value) return;
      leaveFullscreen();
      buttonLabel.value = 'ALMOST THERE!';
      // The widget says the customer is done; our callback says whether they paid.
      confirmWithBackend(paymentId);
    },
    onPaymentFail: () => {
      if (activePaymentId !== paymentId || done.value) return;
      stopPolling();
      leaveFullscreen();
      releaseSubmission();
      needsRestart.value = true;
      errorMessage.value = 'That payment did not go through. Please try another card.';
    },
    onError: ({ messages }: { messages?: string[] }) => {
      if (activePaymentId !== paymentId || done.value) return;
      leaveFullscreen();
      if (paymentStarted) {
        buttonLabel.value = 'CHECKING PAYMENT...';
        confirmWithBackend(paymentId);
        return;
      }
      releaseSubmission();
      errorMessage.value = messages?.length
        ? messages.join(' ')
        : 'Something went wrong with the payment form.';
    },
  };
}

async function initialise() {
  const plan = planStore.getSelectedPlan;

  if (!plan) {
    errorMessage.value = 'No plan selected.';
    loading.value = false;
    return;
  }

  try {
    const [api, response] = await Promise.all([
      waitForLibrary(),
      subscriptionStore.fetchEcommPayWidgetConfig(
        plan.id,
        registrationSearchStore.reg_number || null,
      ),
    ]);

    const config = response.payload;
    if (!config?.card) throw new Error('The payment form could not be prepared.');

    // Target ids come from the backend because they are part of the signed parameter set.
    cardTargetId.value = config.card.target_element;
    expressTargetId.value = config.express?.target_element ?? expressTargetId.value;
    cardPaymentId = config.card.payment_id;
    expressPaymentId = config.express?.payment_id ?? null;
    await nextTick();

    frameLoadTimer = setTimeout(() => finishLoading(true), LIBRARY_TIMEOUT_MS);
    cardWidget = runWidget(api, config.card);

    // Express buttons are a bonus, not a requirement: if the wallets are unavailable on this
    // device the card form must still work, so their failure is logged and swallowed.
    if (config.express) {
      try {
        expressWidget = runWidget(api, config.express);
        expressAvailable.value = true;
      } catch (error) {
        console.error('Express payment buttons unavailable:', error);
      }
    }
  } catch (error: unknown) {
    finishLoading();
    errorMessage.value =
      (error as Partial<ApiRequestError>).data?.message ||
      (error as Error).message ||
      'We could not start the payment. Please try again.';
  }
}

/** Params go through verbatim -- anything added here would break the server-side signature. */
function runWidget(api: EPayWidgetApi, params: EcommPayWidgetParams): WidgetHandle {
  return api.runEmbedded({
    ...params,
    ...sharedCallbacks(params.payment_id),
    ...(params.target_element === cardTargetId.value ? {
      onLoaded: () => finishLoading(),
      onFailLoading: () => finishLoading(true),
    } : {}),
  }, 'POST');
}

function handleSubmit() {
  if (!canSubmit.value) {
    if (!termsAccepted.value) errorMessage.value = 'You must accept the terms and conditions.';
    return;
  }

  errorMessage.value = null;
  if (!cardWidget?.trySubmit || !cardPaymentId) return;
  activePaymentId = cardPaymentId;
  submitting.value = true;
  buttonLabel.value = 'PROCESSING...';
  try {
    cardWidget.trySubmit();
  } catch {
    if (paymentStarted) {
      confirmWithBackend(cardPaymentId);
      return;
    }
    releaseSubmission();
    errorMessage.value = 'The payment form could not be submitted. Please try again.';
  }
}

/** Poll our own status endpoint until the ECOMMPAY callback has recorded the payment. */
function confirmWithBackend(paymentId: string) {
  if (confirming || done.value) return;
  confirming = true;
  submitting.value = true;
  stopPolling();
  const startedAt = Date.now();

  const poll = async () => {
    if (done.value || activePaymentId !== paymentId) return;

    if (Date.now() - startedAt > POLL_CEILING_MS) {
      stopPolling();
      done.value = true;
      submitting.value = false;
      successMessage.value = 'Payment confirmation pending.';
      pendingNotice.value =
        'Please check your account or contact support before trying another payment.';
      return;
    }

    try {
      const response = await subscriptionStore.checkEcommPayStatus(paymentId);
      const payload = response.payload;
      if (done.value || activePaymentId !== paymentId) return;

      if (payload?.status === 'success') {
        stopPolling();
        done.value = true;
        submitting.value = false;
        buttonLabel.value = 'REDIRECTING!';
        successMessage.value = 'Payment successful.';
        await applyPaymentPayload(payload);
        redirectToReport();
        return;
      }

      if (payload?.status === 'failed') {
        stopPolling();
        leaveFullscreen();
        releaseSubmission();
        needsRestart.value = true;
        errorMessage.value = payload.message || 'Payment failed. Please try another card.';
        return;
      }
    } catch (error) {
      // A single failed poll says nothing about the payment -- keep waiting.
      console.error('Payment status check failed:', error);
    }

    if (!done.value && activePaymentId === paymentId) pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
  };

  poll();
}

async function dismissError() {
  errorMessage.value = null;

  if (!needsRestart.value) return;

  stopPolling();
  leaveFullscreen();
  cardWidget = null;
  expressWidget = null;
  needsRestart.value = false;
  expressAvailable.value = false;
  releaseSubmission();
  loading.value = true;

  for (const id of [cardTargetId.value, expressTargetId.value]) {
    const target = document.getElementById(id);
    if (target) target.innerHTML = '';
  }

  await initialise();
}

onMounted(initialise);
onBeforeUnmount(() => {
  activePaymentId = null;
  stopPolling();
  if (frameLoadTimer) clearTimeout(frameLoadTimer);
});
</script>

<template>
  <div class="relative flex flex-col flex-1 w-full min-w-0 min-h-0">
    <div v-if="loading" role="status" class="absolute inset-0 z-10 flex items-center justify-center bg-white text-sm text-[#2C2C2C]">
      Loading secure payment form...
    </div>

    <div class="flex flex-col flex-1 min-h-0" :class="{ invisible: loading || done }" :inert="loading || done">
      <!-- Apple Pay / Google Pay. ECOMMPAY renders whichever the device supports. -->
      <div v-show="expressAvailable" class="shrink-0" :inert="done || needsRestart || !termsAccepted">
        <div :id="expressTargetId"></div>
        <div class="flex items-center gap-3 my-1 text-xs text-[#BEC0C6] lg:my-2">
          <span class="h-px flex-1 bg-[#E5E7EB]"></span>
          <span>or pay by card</span>
          <span class="h-px flex-1 bg-[#E5E7EB]"></span>
        </div>
      </div>

      <!-- The card microframe. Card data lives in ECOMMPAY's frame, never in this page. -->
      <div :id="cardTargetId" class="w-full shrink-0"></div>

      <div class="flex items-center justify-center w-full gap-3 pt-2 mt-auto shrink-0">
        <input id="ecommpay-agree-terms" v-model="termsAccepted" type="checkbox" :disabled="submitting || done"
          class="w-4 h-4 shrink-0 border border-[#0F1829] rounded-[30%] lg:w-[1.35rem] lg:h-[1.35rem]" />
        <label for="ecommpay-agree-terms" class="flex-1 text-[13px] font-thin leading-[1.15] lg:text-[17px]">
          I agree to the
          <a href="/terms" target="_blank" rel="noopener noreferrer" class="text-brand hover:underline">privacy policy</a>
          and
          <a href="/terms" target="_blank" rel="noopener noreferrer" class="text-brand hover:underline">terms &amp; conditions</a>
          of service.
        </label>
      </div>

      <button
        type="button"
        class="flex items-center justify-center w-full h-[35px] gap-2 px-3 mt-2 text-[15px] font-bold text-center text-white rounded-[6px] hover:bg-brand/90 focus:ring-4 focus:outline-none focus:ring-blue-300 bg-brand disabled:opacity-60 disabled:cursor-not-allowed shrink-0 lg:mt-3 lg:h-[46px] lg:text-[20px] lg:rounded-lg"
        :disabled="!canSubmit"
        :aria-busy="submitting"
        @click="handleSubmit"
      >
        <span v-if="submitting" class="w-5 h-5 border-2 rounded-full border-white/40 border-t-white animate-spin"
          aria-hidden="true"></span>
        {{ buttonLabel }}
      </button>
    </div>

    <div v-if="done" role="status" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white text-center">
      <p class="font-bold text-brand">{{ successMessage }}</p>

      <p v-if="pendingNotice" class="mt-2 text-sm leading-snug text-[#2C2C2C]">
        {{ pendingNotice }}
      </p>
      <p v-else class="mt-2 font-bold text-brand">Redirecting to your report...</p>

      <NuxtLink
        v-if="pendingNotice"
        to="/dashboard"
        class="px-6 py-2 mt-5 text-sm font-bold text-white rounded-lg bg-brand"
      >
        Go to my account
      </NuxtLink>
    </div>

    <div
      v-if="errorMessage"
      class="absolute inset-0 z-40 flex items-center justify-center bg-white/90 rounded-[10px] lg:rounded-[13px]"
      role="alert"
    >
      <div class="w-full max-w-[19rem] p-5 text-center bg-white border border-[#F5D5D6] rounded-[10px] shadow-lg">
        <p class="text-sm leading-snug text-[#EF343A]">{{ errorMessage }}</p>
        <button
          type="button"
          class="w-full py-2 mt-4 text-sm font-bold text-white rounded-lg bg-brand"
          @click="dismissError"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.fullscreen-iframe {
  z-index: 2147483000 !important;
}

iframe.fullscreen-iframe.white,
iframe.fullscreen-iframe.transparent {
  background: transparent !important;
}

body:has(.fullscreen-iframe) .checkout-decoration {
  transform: translateY(100%);
  opacity: 0;
}
</style>
