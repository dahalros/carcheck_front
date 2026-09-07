<script setup lang="ts">
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { useCarStore } from '@/stores/car';
import type { ApiRequestError, CustomPlan } from '~/types/models';

const envConfig = useRuntimeConfig();
const carStore = useCarStore();
const errorMessage = ref<string | null>(null);
const stripePromise = shallowRef<Stripe | null>(null);
const check_colors = ['#60C5FF', '#1EE6A8', '#EF343A'];

const awaitingPayment = ref(false);
const selectedPlan = ref<CustomPlan | null>(null);
const { carousel, updateCurrentSlide, startDrag, drag, endDrag } = useCarousel();

function startPlanDrag(event: PointerEvent) {
  if (window.matchMedia('(min-width: 768px)').matches || (event.target as HTMLElement).closest('button, a, input')) return;
  startDrag(event);
}

const { isEcommPay, fetchActiveProvider } = useActiveProvider();

onMounted(async () => {
  try {
    await fetchActiveProvider();

    // Only Stripe needs its SDK in the page; ECOMMPAY charges the saved card server-side.
    if (!isEcommPay.value) {
      stripePromise.value = await loadStripe(envConfig.public.stripe_public_key as string);
    }

    await carStore.fetchAllCustomPlans();
  } catch (error) {
    console.error("Failed to fetch discount widgets:", error);
  }
});

const customPlans = computed(() => carStore.custom_plans ?? []);
const mappedPlans = computed(() =>
  customPlans.value.slice(0, 3).map(item => ({
    ...item,
    checksLabel: `${item.reports_count} ${item.reports_count === 1 ? 'Check' : 'Checks'}`,
    pricePerCheck:
      item.reports_count && item.price_after_discount
        ? Number((Number(item.price_after_discount) / item.reports_count).toFixed(2))
        : null,
  }))
);

async function buyCustomPlan(plan: CustomPlan): Promise<void> {
  try {
    if (!plan.plan_code) {
      errorMessage.value = "No plan code provided.";
      return;
    }

    selectedPlan.value = plan;
    awaitingPayment.value = true;

    const response = await carStore.buyCustomPlan(plan);
    const result = response.payload;

    // ECOMMPAY charges the card on file server-side. There is no 3D Secure step to hand back
    // to the browser, so the answer is final now or settled later by the callback.
    if (isEcommPay.value) {
      if (result.success) {
        await carStore.fetchRequestCounts();
      } else if (result.pending) {
        errorMessage.value = result.message || "Your payment is being processed. Your checks will appear shortly.";
      } else {
        errorMessage.value = result.message || "Payment failed. Please try again.";
      }

      awaitingPayment.value = false;
      return;
    }

    const stripe = stripePromise.value;
    if (!stripe) {
      console.error("Stripe.js not loaded");
      return;
    }

    // Ensure requires_action is true before calling handleCardAction
    if (result.requires_action && result.payment_intent_client_secret) {
      const { error, paymentIntent } = await stripe.handleCardAction(result.payment_intent_client_secret);

      if (error) {
        console.error("Payment authentication failed:", error);
        errorMessage.value = "Payment authentication failed. Please try again.";
        return;
      }

      // Confirm payment intent on the backend
      const confirmedPayment = await carStore.confirmPaymentIntent(paymentIntent.id);

      if (!confirmedPayment.success) {
        errorMessage.value = "Payment confirmation failed. Please try again.";
        return;
      }
    } else if (result.status === "succeeded") {
      await carStore.fetchRequestCounts();
    } else {
      return;
    }

    awaitingPayment.value = false;

  } catch (error: unknown) {
    errorMessage.value =
      (error as Partial<ApiRequestError>).data?.message ||
      "An error occurred while processing the payment.";
    console.error("Error processing payment:", error);
  } finally {
    setTimeout(() => {
      errorMessage.value = "";
      awaitingPayment.value = false;
    }, 5000);
  }
}

</script>

<template>
  <div
    class="relative h-[348px] w-[87.2vw] ml-[7.5vw] overflow-hidden bg-white rounded-xl flex flex-col md:h-auto md:min-h-[11.5rem] md:w-auto md:ml-0 md:overflow-visible md:flex-row md:justify-between 2xl:min-h-[13rem]">
    <div class="flex flex-col px-6 pt-6 text-[#0F1829] md:justify-between md:px-5 md:pt-4 md:pb-6 lg:px-9">
      <div class="md:pr-8">
        <p class="text-2xl font-bold leading-[1.2]">
          <span class="md:hidden">You are </span>running out of <br /> checks ?
        </p>
        <p class="mt-3 text-[15px] md:mt-1 md:text-[0.9rem]">These offers are for you</p>
      </div>
      <div class="absolute bottom-3 left-[27px] flex items-center space-x-1 font-bold md:static">
        <small>
          <span class="md:hidden">Get a new plan instead</span>
          <span class="hidden md:inline">Member-only discounts</span>
        </small>
        <span>
          <img src="/images/svg/icon-chev-right.svg" alt="">
        </span>
      </div>
    </div>
    <div
      ref="carousel"
      class="plans-scroll flex w-full min-w-0 cursor-grab select-none flex-row gap-[clamp(16px,7vw,25px)] overflow-x-auto px-[clamp(1rem,6.7vw,1.5rem)] mt-[12px] pb-12 active:cursor-grabbing md:mt-0 md:cursor-auto md:select-auto md:gap-0 md:px-[1.1rem] md:py-[0.9rem] md:space-x-2 lg:space-x-5 2xl:my-auto"
      @scroll.passive="updateCurrentSlide" @pointerdown="startPlanDrag" @pointermove="drag"
      @pointerup="endDrag" @pointercancel="endDrag" @pointerleave="endDrag">
      <div v-for="(pln, index) in mappedPlans" :key="pln.id"
        class="w-[52.2vw] min-w-[168px] max-w-[200px] aspect-[188/173] rounded-md px-[14px] pt-3 pb-3 flex flex-col flex-shrink-0 shadow-[0_4px_5px_rgba(0,0,0,0.06)] md:h-[9.4rem] md:w-[10rem] md:min-w-0 md:max-w-none md:aspect-auto md:rounded-lg md:px-[0.8rem] md:pt-[1.2rem] md:pb-[0.6rem] md:shadow-none lg:w-[10.35rem]"
        :style="{ backgroundColor: `rgba(${parseInt(check_colors[index].slice(1, 3), 16)}, ${parseInt(check_colors[index].slice(3, 5), 16)}, ${parseInt(check_colors[index].slice(5, 7), 16)}, 0.30)` }">
        <div class="flex flex-col flex-1 text-center text-[#0F1829] md:hidden">
          <p class="text-[23px] font-bold leading-7">{{ pln.checksLabel }}</p>
          <p class="text-xs leading-3">Full Report</p>
          <p class="mt-1 text-[32px] leading-9 text-white"
            style="text-shadow: -1px -1px 0 #0F1829, 1px -1px 0 #0F1829, -1px 1px 0 #0F1829, 1px 1px 0 #0F1829;">
            -{{ pln.discount_percentage }}%
          </p>
          <p class="text-[11px]">£{{ pln.pricePerCheck }} per check</p>
        </div>
        <div class="flex-1 hidden space-y-2 text-center text-black md:block">
          <div class="flex items-center justify-between">
            <div class="leading-[0.9rem] text-start">
              <p class="text-[0.95rem] font-extrabold">{{ pln.checksLabel }}</p>
              <p class="text-[0.7rem]">Full Report</p>
            </div>
            <p class="text-xl text-white outlined-text"
              style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;">
              -{{ pln.discount_percentage }}%
            </p>
          </div>
          <div class="leading-[0.4rem]">
            <small class="text-[0.7rem]">
              <span class="text-2xl"> £{{ pln.pricePerCheck }}</span>
              per check
            </small>
            <br />
            <small>
              You pay £{{ pln.price_after_discount }}
            </small>
          </div>
        </div>
        <button v-if="awaitingPayment && selectedPlan === pln" disabled class="w-full h-[35px] transition-all duration-300 bg-green-500 text-white rounded-[0.4rem] text-[0.8rem] font-semibold
          flex items-center justify-center md:h-[1.95rem]
          ">
          <svg class="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </button>
        <button @click="buyCustomPlan(pln)" v-else
          class="w-full h-[35px] bg-[#0F1829] text-white rounded-[6px] text-[15px] font-semibold md:h-[1.95rem] md:text-[0.8rem]">
          Get now
        </button>
        <p class="text-red-500" v-if="errorMessage">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-scroll {
  scrollbar-width: none;
}

.plans-scroll::-webkit-scrollbar {
  display: none;
}

@media (max-width: 767px) {
  .plans-scroll {
    overflow-x: scroll;
    overflow-y: hidden;
    overscroll-behavior-inline: contain;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
