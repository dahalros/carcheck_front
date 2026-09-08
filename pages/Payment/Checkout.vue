<script setup>
import { ref } from 'vue';
import Stripe from '~/components/Payment/Stripe.vue';

import EcommPayMicroframe from '~/components/Payment/EcommPayMicroframe.vue';

import { useSubscriptionStore } from '@/stores/subscription';
const subscriptionStore = useSubscriptionStore();
// const hasSubscription = computed(() => subscriptionStore.hasSubscription);

const { isEcommPay, fetchActiveProvider } = useActiveProvider();
const providerResolved = ref(false);

onMounted(async () => {
  // has subs? redirect else
  startTimer();
  await fetchActiveProvider();
  providerResolved.value = true;
});

definePageMeta({
  title: 'Payment Checkout',
  meta: [
    { hid: 'Car check payment checkout', name: 'Car check payment checkout', content: 'Car check payment checkout' }
  ],
  layout: 'checkout',
  middleware: ['plan-check', 'auth'],
});

const minutes = ref(14);
const seconds = ref(59);

const startTimer = () => {
  const interval = setInterval(() => {
    if (seconds.value === 0) {
      minutes.value ? (minutes.value--, seconds.value = 59) : clearInterval(interval);
    } else {
      seconds.value--;
    }
  }, 1000);

  onUnmounted(() => clearInterval(interval));
};

const planStore = usePlanStore();

const planPrice = computed(() => {
  const selectedPlan = planStore.getSelectedPlan;
  if (!selectedPlan) return '0';
  const amount = selectedPlan.plan_code === 'single-offer'
    ? selectedPlan.amount_premium
    : selectedPlan.amount_trial;
  return `${selectedPlan.currency?.symbol || '£'}${amount}`;
});

const subsPrice = computed(() => planStore?.getSubsPrice);

</script>

<template>

  <section class="relative p-0 m-0 overflow-hidden">
    <div class="relative min-h-[calc(100svh-6rem)] lg:min-h-[calc(100svh-8rem)]">
      <h1 class="mx-auto mt-[19px] w-[286px] text-center text-[28px] leading-[1.2] text-black lg:hidden">
        Your report <span class="font-bold">is waiting for you !</span>
      </h1>
      <div
        class="relative z-10 flex flex-col-reverse mx-auto px-[17px] py-4 lg:flex-row lg:px-[9.12rem] lg:pt-9 lg:pb-10 lg:space-x-5 max-w-screen-2xl">
        <div class="flex-1 h-full mt-[27px] lg:mt-0">
          <OrderSummary />
        </div>
        <div class="space-y-[18px] lg:w-[27rem] lg:space-y-6">
          <div class="flex items-center justify-center space-x-2 text-[22px] leading-[1.5] lg:text-[29px] lg:leading-[1.45]">
            <span class="w-[31px] h-[31px] shrink-0 lg:w-10 lg:h-10">
              <img src="/assets/svg/fire.svg" class="object-contain w-full h-full" alt="">
            </span>
            <p class="text-black">
              Report stored for
            </p>
            <span class="font-bold text-brand whitespace-nowrap">
              {{ minutes === 0 ? '00' : minutes < 10 ? '0' + minutes : minutes }}:{{ seconds === 0 ? '00' : seconds <
                10
                ? '0' + seconds : seconds }} </span>
          </div>
          <div class="relative flex flex-col h-[393px] bg-white rounded-[10px] text-[#2C2C2C] shadow z-30 lg:h-[32.5rem] lg:rounded-[13px] lg:px-[38px]"
            :class="isEcommPay ? 'px-5 py-4 lg:py-6' : 'px-[29px] py-7 lg:py-9'">
            <EcommPayMicroframe v-if="providerResolved && isEcommPay" />
            <Stripe v-else-if="providerResolved" />
          </div>
        </div>
      </div>

      <div
        class="relative transition-all duration-300 pointer-events-none checkout-decoration lg:absolute lg:inset-x-0 lg:bottom-0">
        <div class="relative z-10 mx-auto max-w-screen-2xl">
          <img src="/images/webp/checkout-car.webp"
            class="ml-[14px] w-[323px] lg:ml-0 lg:w-[35rem] lg:translate-x-[6.9rem] lg:translate-y-[3.5rem]" alt="">
        </div>
        <img src="/images/webp/checkout-road.webp"
          class="-mt-[33px] -translate-x-[128px] w-[942px] max-w-none lg:mt-0 lg:w-full lg:max-w-full lg:translate-x-0 lg:scale-[110%]" alt="">
      </div>
    </div>

    <div class="mx-auto px-8 py-4 text-xs leading-none text-black lg:px-[9.12rem] lg:text-sm lg:leading-4 max-w-screen-2xl">
      <small>Get your CarCheck report and full access to CarCheck for just {{ planPrice }} with a 2-day trial. After
        the
        trial,
        unless you cancel, the subscription will automatically renew at {{ subsPrice }} per month. You can
        cancel anytime. Feel
        free to contact us with any questions.</small>
    </div>
  </section>
</template>

<style scoped></style>
