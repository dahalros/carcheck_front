<script setup lang="ts">
/**
 * Where ECOMMPAY returns the customer from an external step -- typically a bank's 3D Secure
 * page. Renders inside the checkout iframe while the final status is still being decided.
 */
definePageMeta({
  title: 'Completing payment',
  layout: false,
});
</script>

<template>
  <div class="flex items-center justify-center min-h-[200px] p-6 text-center">
    <p class="text-[15px] leading-relaxed text-[#2C2C2C]">
      Confirming your payment with your bank&hellip;
    </p>
  </div>
</template>
