<script setup>
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

import { onMounted } from 'vue';
import { useCarRegistrationSearchStore } from '@/stores/carRegistrationSearch';

const store = useCarRegistrationSearchStore();
const showArrow = ref(false);
const expandedRow = ref(null);

onMounted(async () => {
  await store.fetchAndDecryptMOTHistory;
});
const motHistory = computed(() => store.decryptedMOTHistory);

const handleExpandRow = (index) => {
    expandedRow.value = expandedRow.value === index ? null : index;
    showArrow.value = !showArrow.value;
};

</script>

<template>
    <div class="flex flex-row justify-left px-20 py-10">
      <div class="w-full p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 dark:bg-gray-800 dark:border-gray-700">
        <h5 class="mb-3 text-base font-semibold text-green-900 md:text-xl dark:text-white">MOT History</h5>
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">S.No.</th>
                <th class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Test Date</th>
                <th class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Result</th>
                <th class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Odometer Reading (mi)</th>
                <th class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Days Since Last Test</th>
                <th class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Major Failures</th>
                <th class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Advisories</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(record, index) in motHistory" :key="index">
                <tr @click="handleExpandRow(index)"  class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer">
                  <td colspan="7" class="px-6 py-4">
                    MOT #{{ index + 1 }}
                    <span v-if="expandedRow === index" class="px-2">
                      <font-awesome-icon :icon="faArrowDown" />
                    </span>
                    <span v-else class="px-2">
                      <font-awesome-icon :icon="faArrowUp" />
                    </span>
                  </td>
                </tr>
                <tr v-if="expandedRow === index" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td colspan="7" class="px-6 py-4">
                    <ul>
                      <li>Test Number: {{ record.TestNumber }}</li>
                      <li>Test Date: {{ record.TestDate }}</li>
                      <li>Expiry Date: {{ record.ExpiryDate }}</li>
                      <li>Test Result: {{ record.TestResult }}</li>
                      <li>Odometer Reading: {{ record.OdometerReading }} mi</li>
                      <li>Advisory Notices: {{ record.AdvisoryNoticeCount }}</li>
                      <li>Major Failures: {{ record.MajorFailureCount }}</li>
                    </ul>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <style scoped>
  /* Additional styles if needed */
  </style>
  

<style scoped>
/* table {
    width: 100%;
    border: 1px solid black;
  } */
/* tr {
    cursor: pointer;
    border: 1px solid black;
  } */
li {
    list-style: none;
    font-size: 14px;
    color: gray;
}

/* th {
    border: 1px solid black;
    background: rgb(255, 185, 185);
  } */

.MOTHeads {}
</style>