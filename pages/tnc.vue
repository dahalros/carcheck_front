<script setup>
</script>
<template>
  <div class="py-10 md:px-0 px-8">
    <h1 class="text-4xl font-bold text-brand max-w-5xl mx-auto">
      About Us
    </h1>
    <h2 class="text-2xl font-bold text-brand mb-6 max-w-5xl mx-auto">
      Helping You Drive with Confidence
    </h2>
    <div class="flex items-center justify-center max-w-5xl mx-auto">
      <div class="grid w-full grid-cols-1 md:grid-cols-3 gap-8 h-full">
        <div class="md:col-span-2 text-black space-y-6">
          <p class="leading-relaxed text-justify">
            At Car Check, we believe that buying a used car should be simple, safe,
            and stress-free. Our mission is to help people find high-quality,
            reliable vehicles by providing instant, accurate car history checks.
            With hidden issues like outstanding finance, accident history, or
            mileage fraud, it’s more important than ever to check a vehicle’s past
            before purchasing. Our service stands out with fast, detailed reports,
            data sourced from trusted industry databases like the DVLA, police
            records, and finance providers, and an easy-to-use platform designed for
            everyone. We are committed to transparency, accuracy, and customer
            satisfaction—backed by industry certifications for reliability.
          </p>
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-lg text-center font-bold text-brand mb-6">
              Start your car check today – Enter a vehicle registration number now!
            </h3>
            <div class="flex items-center justify-center">
              <SearchBar class="lg:scale-[120%]" width="w-[20rem]" />
            </div>
          </div>
        </div>
        <div
          class="md:col-span-1 flex justify-center items-center h-full rounded-lg shadow-md bg-white overflow-hidden">
          <img src="/images/about.webp" alt="About Us" class="w-full lg:scale-150 "
            style="filter: drop-shadow(0 0 10px rgba(255, 165, 0, 0.6));" />
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
