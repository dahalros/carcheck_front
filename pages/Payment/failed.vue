<script setup lang="ts">
/**
 * Where ECOMMPAY returns the customer after a declined or abandoned payment.
 *
 * redirect_fail_mode is parent_page, so this replaces the checkout rather than rendering
 * inside the frame. Nothing is recorded here -- a failed payment simply leaves no rows.
 */
definePageMeta({
  title: 'Payment failed',
  layout: 'checkout',
});
</script>

<template>
  <section class="flex items-center justify-center min-h-[60vh] px-6">
    <div class="w-full max-w-md p-8 text-center bg-white shadow rounded-[10px]">
      <p class="text-[17px] leading-relaxed text-[#2C2C2C]">
        That payment did not go through.
      </p>
      <p class="mt-2 text-sm text-[#BEC0C6]">
        You have not been charged. Please try again with a different card.
      </p>

      <NuxtLink
        to="/payment/checkout"
        class="inline-block px-6 py-3 mt-6 font-bold text-white rounded-lg bg-brand"
      >
        Try again
      </NuxtLink>
    </div>
  </section>
</template>
