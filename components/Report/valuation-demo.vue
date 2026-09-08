<script lang="ts" setup>
const isTableVisible = ref(true);
const toggleTableVisibility = () => {
  isTableVisible.value = !isTableVisible.value;
};

const isAuthenticated = computed(() => useAuthStore().isAuthenticated);

const chartData = [
  { label: "OTR(On The Road)", value: 30000 },
  { label: "Valuation 1", value: 12371 },
  { label: "Valuation 2", value: 23444 },
  { label: "Valuation 3", value: 30000 },
  { label: "Valuation 4", value: 23523 },
  { label: "Valuation 5", value: 64645 },
  { label: "Valuation 6", value: 34555 },
  { label: "Valuation 7", value: 34543 },
  { label: "Valuation 8", value: 52335 },
];

function getChartHeight() {

  const screenWidth = window.innerWidth;

  if (screenWidth >= 1024) {
    return 25;
  } else if (screenWidth >= 768) {
    return 40;
  } else {
    return 50;
  }

}
</script>
<template>
  <report-wrapper>
    <div class="grid grid-cols-[1fr_auto] items-center text-black md:flex md:flex-row md:justify-between">
      <div class="flex items-center space-x-2 cursor-pointer md:space-x-4" @click="toggleTableVisibility">
        <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_230_6081)">
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M13.1011 0.832886C20.3434 0.832886 26.2022 6.69432 26.2022 13.9164C26.2022 21.1386 20.3434 27 13.1011 27C5.85881 27 0 21.1386 0 13.9164C0 6.69432 5.86929 0.832886 13.1011 0.832886Z"
              fill="#0F1829" />
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M13.1016 2.4552C19.4425 2.4552 24.5781 7.58396 24.5781 13.9164C24.5781 20.2488 19.4425 25.3776 13.1016 25.3776C6.76063 25.3776 1.625 20.2488 1.625 13.9164C1.625 7.58396 6.76063 2.4552 13.1016 2.4552Z"
              fill="#EEEEEE" />
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M12.7028 6.64206C8.67809 6.87233 5.59672 10.3055 5.82729 14.3247C5.9321 16.3239 6.85442 18.1033 8.2379 19.3383L6.96971 20.7618H6.98019C5.2194 19.2023 4.06651 16.9624 3.91978 14.4294C3.64727 9.36344 7.5252 5.03016 12.5979 4.74756L12.7028 6.64206Z"
              fill="#0F1829" />
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M13.6146 4.74756C18.6873 5.03016 22.5652 9.36344 22.2823 14.4294C22.146 16.9624 20.9826 19.2023 19.2218 20.7618H19.2323L17.9641 19.3488C19.3581 18.1033 20.2699 16.3344 20.3852 14.3247C20.6053 10.3055 17.5344 6.87233 13.5098 6.64206L13.6146 4.74756Z"
              fill="#0F1829" />
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M22.7751 8.84009L15.994 12.0115L9.21289 15.1935L9.50635 15.7482L9.79982 16.3134L16.2875 12.5768L22.7751 8.84009Z"
              fill="#0F1829" />
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M13.1007 12.0428C14.1383 12.0428 14.9872 12.8802 14.9872 13.9164C14.9872 14.9526 14.1383 15.79 13.1007 15.79C12.0631 15.79 11.2246 14.9526 11.2246 13.9164C11.2246 12.8802 12.0631 12.0428 13.1007 12.0428Z"
              fill="#0F1829" />
          </g>
          <defs>
            <clipPath id="clip0_230_6081">
              <rect width="26.2022" height="26.1671" fill="white" transform="translate(0 0.832886)" />
            </clipPath>
          </defs>
        </svg>

        <p class="flex items-center justify-center text-xl font-bold md:text-2xl">
          VALUATION DETAILS
        </p>
        <span>
          <img v-if="isTableVisible" src="/svg/chev-down.svg" alt="">
          <img v-else src="/svg/chev-up.svg" alt="">
        </span>
      </div>

      <small class="hidden md:block">Unlock all valuation details on the full report</small>
      <Includes-get-full-report class="hidden md:block" :show-form="isAuthenticated"
        get-full-report="Get full report"></Includes-get-full-report>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="8" fill="#BDBDBD" />
        <rect x="6.66602" y="6.22229" width="2.66666" height="7.1111" rx="1.33333" fill="white" />
        <rect x="6.66602" y="2.66663" width="2.66667" height="2.66667" rx="1.33333" fill="white" />
      </svg>
    </div>
    <div v-show="isTableVisible" class="w-full my-6 text-black md:my-10">

      <ClientOnly>
        <chart-bar :data="chartData" :height="getChartHeight()" width="100%" />
      </ClientOnly>
      <Includes-get-full-report :show-form="isAuthenticated" get-full-report="Download Report"
        class="w-full mt-6 md:hidden"></Includes-get-full-report>
    </div>
  </report-wrapper>
</template>
