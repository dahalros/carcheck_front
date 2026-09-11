<script setup lang="ts">
import Hashed from '../Includes/Hashed.vue';

const { reportDate } = useDownloadReport();
const carRegistrationSearchStore = useCarRegistrationSearchStore();

const reg_number = computed(() => carRegistrationSearchStore.reg_number);
const vbrand_logo = computed(() => carRegistrationSearchStore.vbrand_logo);
const vehicle_image = computed(() => carRegistrationSearchStore.vehicleImageUrl);
const smmtDetail = computed(() => carRegistrationSearchStore.smmtDetails);
const totalNumberOfLooksUp = computed(() => carRegistrationSearchStore.totalNumberOfLooksUp);

const { isShowAble } = useIsShowAble();

onMounted(async () => {
  await carRegistrationSearchStore.fetchVehicleLogo();
  await carRegistrationSearchStore.fetchVehicleImageUrl();
  await carRegistrationSearchStore.fetchSmmtDetails();
  await carRegistrationSearchStore.fetchNumberOfLooksUp();
});
</script>

<template>
  <div class="w-full lg:bg-white">
    <report-wrapper class="w-full !px-4 pb-7 md:!px-5 lg:py-5 xl:!px-[8.25rem]">
      <h1 class="px-6 mb-3 text-[30px] font-bold leading-tight text-[#0F1829] lg:hidden">
        Your report is here !
      </h1>
      <div
        class="flex flex-col h-full px-6 py-7 text-black bg-white rounded-lg shadow-[0_10px_30px_rgba(15,24,41,0.08)] lg:flex-row lg:items-stretch lg:gap-8 lg:p-0 lg:bg-transparent lg:rounded-none lg:shadow-none">
        <div class="contents lg:w-[24%] lg:flex lg:flex-col lg:items-center lg:justify-center">

          <img v-if="vbrand_logo" :src="vbrand_logo" alt="Vehicle manufacturer logo"
            class="order-1 object-contain w-auto h-16 mx-auto lg:h-auto">
          <div v-else class="order-1 w-24 h-16 mx-auto rounded bg-gray-200 animate-pulse"></div>

          <h3 v-if="smmtDetail?.ModelVariant" class="order-2 mt-1 text-base font-bold text-center lg:mt-0">{{ smmtDetail.ModelVariant }}</h3>
          <div v-else class="order-2 w-40 h-5 mx-auto mt-1 rounded bg-gray-200 animate-pulse lg:mt-0"></div>

          <div class="order-4 bg-[#FFA500] h-[42px] flex items-center justify-center rounded w-full mt-3 lg:mt-0">
            <img src="/assets/svg/uk-flag.svg" alt="UK" class="w-8 h-7 mr-3 lg:hidden">
            <h4 class="w-3/5 py-[2px] text-xl font-bold text-center border border-[#0F1829] rounded lg:w-1/2">{{ reg_number }}</h4>
          </div>
          <div class="flex items-center justify-center order-5 mt-2 text-sm lg:mt-0">
            <label class="font-extralight">
              Report date: &nbsp;
            </label>
            <p class="font-bold">{{ reportDate() }}</p>
          </div>
          <div class="flex items-center justify-center order-6 text-sm">
            <label class="font-extralight">
              Number of look ups: &nbsp;
            </label>
            <p class="font-bold" v-if="isShowAble">{{ totalNumberOfLooksUp }}</p>
            <Hashed v-else />
          </div>
        </div>

        <!-- ---------------------------------------------------- -->

        <div class="order-3 lg:w-[36.5%] flex items-center justify-center mt-3 lg:mt-0">
          <img v-if="vehicle_image" :src="vehicle_image" alt="Vehicle" class="object-contain w-full h-32 rounded-lg lg:h-auto">
          <div v-else class="w-full h-32 rounded-lg bg-gray-200 animate-pulse lg:h-40"></div>
        </div>

        <!-- ---------------------------------------------------- -->

        <div class="flex flex-col items-center justify-center flex-1 order-7 mt-5 space-y-2 lg:mt-0 lg:space-y-4">
          <h3 class="hidden text-3xl font-bold lg:block">
            Your report is ready !
          </h3>
          <div class="hidden lg:block">
            <ul class="grid w-full grid-cols-3 gap-x-2">
              <li class="flex items-center justify-start col-span-1 space-x-2">
                <img src="/assets/svg/damage-check.svg" class="w-4" alt="">
                <small class="font-extralight">Damage Check</small>
              </li>
              <li class="flex items-center justify-start col-span-1 space-x-2">
                <img src="/assets/svg/owner-history.svg" class="w-4" alt="">

                <small class="font-extralight">Owners History</small>
              </li>
              <li class="flex items-center justify-start col-span-1 space-x-2">
                <img src="/assets/svg/theft-check.svg" class="w-4" alt="">

                <small class="font-extralight">Theft Check</small>
              </li>
              <li class="flex items-center justify-start col-span-1 space-x-2">
                <img src="/assets/svg/milage-history.svg" class="w-4" alt="">

                <small class="font-extralight">Mileage History</small>
              </li>
              <li class="flex items-center justify-start col-span-1 space-x-2">
                <img src="/assets/svg/car-features.svg" class="w-4" alt="">

                <small class="font-extralight">Car Features</small>
              </li>
              <li class="col-span-1">
                <p class="text-lg font-bold text-[#FF7400]">And more...</p>
              </li>
            </ul>
          </div>
          <Includes-get-full-report get-full-report="Download Report" class="w-full"></Includes-get-full-report>
          <NuxtLink to="/dashboard"
            class="flex items-center justify-center w-full py-2 text-xl font-bold border border-[#0F1829] rounded-lg lg:hidden">
            Go to Dashboard
          </NuxtLink>
          <!-- <button @click.prevent="downloadReport"
          class="bg-[#FF7400] w-full rounded text-xl py-2 font-bold text-white">{{ reportText }}</button> -->
          <!-- <p class="font-light">Gain full access now for £0.00</p> -->
        </div>
      </div>
    </report-wrapper>
  </div>


</template>
