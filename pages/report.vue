<script lang="ts" setup>
const { isShowAble } = useIsShowAble();
const carRegistrationSearchStore = useCarRegistrationSearchStore();

const dataVersion = computed(() => carRegistrationSearchStore.dataVersion);

definePageMeta({
  title: 'Car Check Report',
  meta: [
    { hid: 'Car report generated.', name: 'Download all data of the car', content: 'Download all data of the car' },
  ],
  middleware: ['check-reg-number'],
});
</script>

<template>
  <div class="report-page overflow-x-hidden bg-[#EEEEEE]" :key="dataVersion">

    <!-- Section 1 -->
    <ReportSection1 id="report" />
    <!-- Section 2 -->
    <ReportInfo />
    <!-- Section 3 -->
    <ReportMileage />

    <!-- Section 4 -->
    <ReportDamage />
    <!-- Section 5 -->
    <ReportMot />

    <!-- Section 6 -->
    <ReportVehicle />

    <!-- Section 7 -->
    <ReportFinance />

    <!-- Section 8 -->
    <ReportValuation v-if="isShowAble" />
    <ReportValuationDemo v-else />

    <!-- Section 9 -->
    <ReportTax />

    <!-- Section 10 -->
    <ReportRisk />

    <ReportFixedBottomBar />

    <section class="mt-16">
      <img src="/svg/plan-end-track.svg" alt="Plan End Track" class="w-full" />
    </section>
  </div>

</template>

<style scoped>
.report-page {
  font-family: 'TT Norms Pro', sans-serif;
}
</style>
