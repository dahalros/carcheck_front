<script setup>
import featureData from '@/static/features.json';

const addedMoreFeatures = ref([]);
const isAddMoreBtnHidden = ref(false);
const moreFeatures = () => {
  addedMoreFeatures.value = featureData.features.more;
  isAddMoreBtnHidden.value = true;
}
</script>

<template>
  <div
    class="section-1-bg relative mx-auto w-full max-w-screen-2xl overflow-hidden font-['TT_Norms_Pro'] md:flex md:min-h-0 md:flex-col md:items-start md:px-4 md:pt-[5.4%] lg:min-h-[41rem] lg:px-[9.12rem]"
    :class="isAddMoreBtnHidden ? 'hero-expanded' : ''"
    style="--section-bg: url('/png/car-find-section-bg-1.png')"
    id="check">
    <div class="hero-background absolute left-0 w-full overflow-hidden md:hidden" aria-hidden="true">
      <img src="/images/home/hero-background.png" alt=""
        class="absolute left-[-206.38%] top-[-76.41%] h-[176.41%] w-[306.45%] max-w-none" />
    </div>

    <h1
      class="hero-title absolute z-10 whitespace-nowrap font-medium leading-[normal] text-[#0F1829] md:static md:text-xl md:leading-[2.8rem] lg:text-[2.5rem]">
      Check it before
      <br />
      <span class="font-bold md:text-2xl lg:text-4xl">you regret it </span>
    </h1>

    <div class="home-hero-search absolute z-20 md:hidden">
      <SearchBar hero width="w-full" :focused="false" />
    </div>
    <div class="relative mt-4 hidden h-[4.25rem] items-center md:flex md:translate-x-[15%] lg:translate-x-[30%]">
      <SearchBar class="lg:scale-[160%] md:scale-[120%]" width="lg:w-[15.55rem] w-[75%] min-w-[15.55rem]"
        :focused="false" />
    </div>

    <p
      class="hero-subtitle absolute  whitespace-nowrap font-light leading-[normal] text-[#0F1829] md:static md:mt-5 md:text-2xl lg:text-[1.95rem]">
      We can generate a <span class="font-bold">full history</span><br />
      report for <span class="font-bold">any car</span>
    </p>

    <!--  features      -->
    <div class="hero-feature-block absolute  md:static">
      <Features :addedMoreFeatures="addedMoreFeatures" class="hero-features md:mt-[1.9rem]"
        alignment="flex flex-col md:grid md:grid-cols-2 md:gap-x-[2.1rem] md:gap-y-[0.35rem]"
        text-size="hero-feature-text md:text-xl" />
      <div class="hero-more absolute left-0 flex w-full flex-row items-center md:static md:mt-5 md:justify-center"
        v-if="isAddMoreBtnHidden == false">
        <button class="bg-none" @click="moreFeatures">
          <p class="hero-more-text whitespace-nowrap font-bold leading-[normal] text-[#FF7400] md:text-[1.3rem] md:tracking-widest">
            And more...</p>
        </button>
      </div>
    </div>

    <img src="/images/home/hero-car.png" alt="White car"
      class="hero-car pointer-events-none absolute z-[5] object-cover md:hidden" />
  </div>
</template>
<style scoped>
.section-1-bg {
  background-color: #eee;
  container-type: inline-size;
}

@media screen and (max-width: 767px) {
  .section-1-bg { min-height: 124.167cqw; }
  .section-1-bg.hero-expanded { min-height: 161.111cqw; }
  .hero-background { top: -26.944cqw; height: 202.5cqw; }
  .hero-title { left: 8.889cqw; top: 6.667cqw; font-size: 7.956cqw; }
  .home-hero-search { left: 8.889cqw; top: 28.935cqw; width: 80.494cqw; }
  .hero-subtitle { left: 8.889cqw; top: 47.322cqw; font-size: 6.068cqw; }
  .hero-feature-block { left: 8.889cqw; top: 66.667cqw; }
  .hero-features { gap: 2.527cqw; }
  .hero-more { top: 45.278cqw; }
  .hero-more-text { font-size: 4.939cqw; }
  .hero-car { left: 21.389cqw; top: 67.5cqw; width: 68.056cqw; height: 48.333cqw; }

  .hero-features :deep(> div) {
    position: relative;
    height: 4.444cqw;
    gap: 0;
  }

  .hero-features :deep(> div:nth-child(1)) { order: 1; }
  .hero-features :deep(> div:nth-child(2)) { order: 4; }
  .hero-features :deep(> div:nth-child(3)) { order: 2; }
  .hero-features :deep(> div:nth-child(4)) { order: 5; }
  .hero-features :deep(> div:nth-child(5)) { order: 3; }
  .hero-features :deep(> div:nth-child(6)) { order: 6; }
  .hero-features :deep(> div:nth-child(n+7)) { order: 7; }

  .hero-features :deep(img) {
    position: absolute;
    object-fit: contain;
  }

  .hero-features :deep(p) {
    margin-left: 6.971cqw !important;
    font-size: 4.354cqw;
    font-weight: 300;
    line-height: 4.444cqw;
  }

  .hero-features :deep(> div:nth-child(1) img) { left: 0; width: 5.07cqw; height: 2.596cqw; }
  .hero-features :deep(> div:nth-child(2) img) { left: 0.293cqw; width: 3.591cqw; height: 3.803cqw; }
  .hero-features :deep(> div:nth-child(3) img) { left: 0.423cqw; width: 4.225cqw; height: 4.225cqw; }
  .hero-features :deep(> div:nth-child(4) img) { left: 0.412cqw; width: 3.472cqw; height: 4.262cqw; }
  .hero-features :deep(> div:nth-child(5) img) { left: 0.634cqw; width: 4.014cqw; height: 4.225cqw; }
  .hero-features :deep(> div:nth-child(6) img) { left: 0.082cqw; width: 4.225cqw; height: 3.803cqw; }
}

@media screen and (min-width: 768px) {
  .section-1-bg {
    background-image: var(--section-bg);
    background-size: cover;
    background-position: 0% 79%;
  }
}

@media screen and (min-width: 1500px) {
  .section-1-bg {
    background-position: 0% 75%;
  }
}
</style>
