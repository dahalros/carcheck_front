<template>
  <section class="report-mobile md:hidden">
    <h2>What’s included<br><strong>in your report</strong></h2>
    <span class="report-title-line"></span>

    <swiper
      :modules="[Pagination]"
      :pagination="{ clickable: true }"
      :slides-per-view="1"
      :grab-cursor="true"
      class="report-swiper"
    >
      <swiper-slide
        v-for="(group, groupIndex) in mobileReportGroups"
        :key="groupIndex"
        class="report-slide"
        :class="{ 'report-slide--reverse': groupIndex === 1 }"
      >
        <div class="report-car-shadow"></div>
        <img src="/images/png/home-report-car.png" alt="" class="report-car">

        <template v-if="groupIndex === 0">
          <img src="/svg/line-info-4.svg" alt="" class="report-line report-line--one">
          <img src="/svg/line-info-5.svg" alt="" class="report-line report-line--two">
          <img src="/svg/line-info-6.svg" alt="" class="report-line report-line--three">
        </template>

        <div
          v-for="(item, itemIndex) in group"
          :key="item.label"
          class="report-item"
          :style="{ top: `${12.646 + itemIndex * 18.858}cqw` }"
        >
          <img :src="item.icon" alt="">
          <h3>{{ item.label }}</h3>
        </div>
      </swiper-slide>
    </swiper>
  </section>

  <div class="hidden md:flex flex-col items-center justify-center w-full bg-[#EEEEEE] report-bg-section relative ">
    <img src="/svg/report-car.svg" alt="Report Info" class="md:block hidden translate-y-[5.6rem] absolute" />
    <div class="container px-4 py-12 mx-auto max-w-screen-2xl">
      <div class="flex flex-col items-center justify-center pt-10 pb-10 text-4xl md:pb-24">
        <h2 class="text-gray-800">What’s included</h2>
        <p class="mt-2 text-gray-800"><span class="border-b-4 border-b-orange-500">in</span> <span
            class="font-bold">your report</span></p>
      </div>
      <div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div class="flex flex-col items-center justify-between lg:-mr-36 md:-20">
            <div class="flex flex-row items-center justify-center">
              <h3 class="text-lg font-bold text-gray-800 w-52 text-end">Outstanding Finances</h3>
              <img src="/svg/outstanding-finances.svg" alt="Line" class="w-24" />
            </div>
            <div class="flex flex-row items-center justify-center">
              <h3 class="text-lg font-bold text-gray-800 w-52 text-end">Tax record</h3>
              <img src="/svg/tax-record-icon.svg" alt="Line" class="w-24" />
            </div>
            <div class="flex flex-row items-center justify-center">
              <h3 class="text-lg font-bold text-gray-800 w-52 text-end">Engine & consumption</h3>
              <img src="/svg/consumption.svg" alt="Line" class="w-24" />
            </div>
            <div class="flex flex-row items-center justify-center">
              <h3 class="text-lg font-bold text-gray-800 w-52 text-end ">Co2 Emissions</h3>
              <img src="/svg/emission.svg" alt="Line" class="w-24" />
              <img src="/svg/line-info-1.svg" alt="Line" class="absolute hidden w-32 md:-mr-96 md:-mt-5 md:block" />
            </div>
            <div class="flex flex-row items-center justify-center">
              <h3 class="text-lg font-bold text-gray-800 w-52 text-end">Insurance Status</h3>
              <img src="/svg/ni-status.svg" alt="Line" class="w-24" />
              <img src="/svg/line-info-2.svg" alt="Line" class="absolute hidden md:w-32 md:-mr-96 md:-mt-16 md:block" />
            </div>
            <div class="flex flex-row items-center justify-center">
              <h3 class="text-lg font-bold text-gray-800 w-52 text-end">Ownership list</h3>
              <img src="/svg/owner-list.svg" alt="Line" class="w-24" />
              <img src="/svg/line-info-3.svg" alt="Line" class="absolute hidden w-32 md:-mr-96 md:block" />
            </div>
          </div>
          <div class="hidden md:block">
          </div>
          <div class="flex flex-col items-center justify-between">
            <div class="flex flex-row items-center justify-center">
              <img src="/svg/import-export.svg" alt="Line" class="w-24" />
              <h3 class="text-lg font-bold text-gray-800 w-52 text-start">Import/Export History</h3>

            </div>
            <div class="flex flex-row items-center justify-center">
              <img src="/svg/line-info-5.svg" alt="Line" class="absolute hidden w-32 -ml-96 md:-mt-16 md:block" />
              <img src="/svg/technical-data.svg" alt="Line" class="w-24" />
              <h3 class="text-lg font-bold text-gray-800 w-52 text-start">Technical Data</h3>
            </div>
            <div class="flex flex-row items-center justify-center">
              <img src="/svg/line-info-6.svg" alt="Line" class="absolute hidden w-32 -ml-96 md:-mt-16 md:block" />
              <img src="/svg/mileage-history-1.svg" alt="Line" class="w-24" />
              <h3 class="text-lg font-bold text-gray-800 w-52 text-start">Mileage History</h3>
            </div>
            <div class="flex flex-row items-center justify-center">
              <img src="/svg/mot-history-1.svg" alt="Line" class="w-24" />
              <h3 class="text-lg font-bold text-gray-800 w-52 text-start ">MOT History</h3>
            </div>
            <div class="flex flex-row items-center justify-center">
              <img src="/svg/damage-history-1.svg" alt="Line" class="w-24" />
              <h3 class="text-lg font-bold text-gray-800 w-52 text-start">Damage History</h3>
            </div>
            <div class="flex flex-row items-center justify-center">
              <img src="/svg/theft-check-1.svg" alt="Line" class="w-24" />
              <h3 class="text-lg font-bold text-gray-800 w-52 text-start">Theft Check</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/pagination';

const mobileReportGroups = [
  [
    { label: 'Import/Export History', icon: '/svg/import-export.svg' },
    { label: 'Technical Data', icon: '/svg/technical-data.svg' },
    { label: 'Mileage History', icon: '/svg/mileage-history-1.svg' },
    { label: 'MOT History', icon: '/svg/mot-history-1.svg' },
    { label: 'Damage History', icon: '/svg/damage-history-1.svg' },
    { label: 'Theft Check', icon: '/svg/theft-check-1.svg' },
  ],
  [
    { label: 'Outstanding Finances', icon: '/svg/outstanding-finances.svg' },
    { label: 'Tax record', icon: '/svg/tax-record-icon.svg' },
    { label: 'Engine & consumption', icon: '/svg/consumption.svg' },
    { label: 'Co2 Emissions', icon: '/svg/emission.svg' },
    { label: 'Insurance Status', icon: '/svg/ni-status.svg' },
    { label: 'Ownership list', icon: '/svg/owner-list.svg' },
  ],
];
</script>
<style scoped>
.report-mobile {
  position: relative;
  width: 100%;
  height: 156.389cqw;
  overflow: hidden;
  container-type: inline-size;
  background: #eee;
  color: #0f1829;
  font-family: "TT Norms Pro", sans-serif;
}

.report-mobile h2 {
  position: absolute;
  z-index: 3;
  top: 0;
  left: 9.077cqw;
  margin: 0;
  font-size: 6.766cqw;
  font-weight: 500;
  line-height: 1.19;
}

.report-mobile h2 strong {
  font-weight: 700;
}

.report-title-line {
  position: absolute;
  z-index: 3;
  top: 17.5cqw;
  left: 9.167cqw;
  width: 9.735cqw;
  height: 1.111cqw;
  border-radius: 999px;
  background: #ff7400;
}

.report-swiper {
  position: absolute;
  top: 21.944cqw;
  left: 0;
  width: 100%;
  height: 134.445cqw;
}

.report-slide {
  position: relative;
  height: 132.378cqw;
  overflow: hidden;
}

.report-car-shadow {
  position: absolute;
  z-index: 0;
  top: 3.465cqw;
  left: -32.783cqw;
  width: 52.224cqw;
  height: 119.209cqw;
  border-radius: 15.074cqw;
  background: rgb(15 24 41 / 22%);
  filter: blur(27.576cqw);
}

.report-car {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 26.555cqw;
  width: 132.378cqw;
  height: 66.278cqw;
  max-width: none;
  transform: rotate(90deg);
  transform-origin: top left;
}

.report-line {
  position: absolute;
  z-index: 1;
  max-width: none;
}

.report-line--one {
  top: 9.936cqw;
  left: 3.65cqw;
  width: 33.64cqw;
  height: 6.067cqw;
}

.report-line--two {
  top: 29.87cqw;
  left: 15.46cqw;
  width: 16.986cqw;
  height: 8.84cqw;
}

.report-line--three {
  top: 52.05cqw;
  left: 15.02cqw;
  width: 18.03cqw;
  height: 5.72cqw;
}

.report-item {
  position: absolute;
  z-index: 3;
  left: 28.425cqw;
  width: 67cqw;
  height: 18.03cqw;
}

.report-item img {
  display: block;
  width: 18.03cqw;
  height: 18.03cqw;
  max-width: none;
}

.report-item h3 {
  position: absolute;
  top: 4.95cqw;
  left: 15.646cqw;
  margin: 0;
  color: #0f1829;
  font-size: 4.256cqw;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
}

.report-slide--reverse .report-car-shadow {
  right: -32.783cqw;
  left: auto;
}

.report-slide--reverse .report-car {
  right: 26.555cqw;
  left: auto;
  transform: rotate(-90deg);
  transform-origin: top right;
}

.report-slide--reverse .report-item {
  left: 4.5cqw;
}

.report-swiper :deep(.swiper-pagination) {
  top: 130.278cqw !important;
  bottom: auto !important;
  height: 4.167cqw;
  line-height: 0;
}

.report-swiper :deep(.swiper-pagination-bullet) {
  box-sizing: border-box;
  width: 4.167cqw;
  height: 4.167cqw;
  margin: 0 .833cqw !important;
  border: .13cqw solid #000;
  background: transparent;
  opacity: 1;
}

.report-swiper :deep(.swiper-pagination-bullet-active) {
  border: 0;
  background: #ff4d00;
}

.report-bg-section {
  background-image: url("/assets/svg/report-info-bg.svg");
  background-size: cover;
  /* Zoom in */
  background-repeat: no-repeat;
  background-position: center;
}
</style>
