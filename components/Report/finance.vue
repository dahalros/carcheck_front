<script lang="ts" setup>
import Hashed from '@/components/Includes/Hashed.vue';
import { useSubscriptionStore } from '@/stores/subscription';
import { computed, onMounted, ref } from 'vue';
const isTableVisible = ref(true);


const toggleTableVisibility = () => {
  isTableVisible.value = !isTableVisible.value;
};

const subscriptionStore = useSubscriptionStore();
const hasSubscription = computed(() => subscriptionStore.hasSubscription);


const carRegistrationSearchStore = useCarRegistrationSearchStore();
const financeRecords = computed(() => carRegistrationSearchStore.financeRecords);


const finance = ref([]);

onMounted(async () => {
  try {
    await carRegistrationSearchStore.fetchFinanceRecords();
    if (financeRecords.value && financeRecords.value['FinanceRecordCount'] > 0) {
      finance.value = financeRecords.value['FinanceRecordList'];
    }
  } catch (error) {
    console.error('Error fetching finance records:', error);
  }
});

const formatDate = (dateString: string) => String(dateString ?? '').split('T')[0];

const { includesVdiChecks } = useIsShowAble();
</script>


<template>
  <report-wrapper class="py-8">
    <div class="flex items-center justify-between text-black">
      <div class="flex items-center space-x-2 cursor-pointer md:space-x-4" @click="toggleTableVisibility">
        <svg class="w-5 h-auto md:w-6" width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_230_6359)">
            <path
              d="M11.725 5.83167L11.7451 4.96399C11.7451 4.89337 11.7651 4.83283 11.7952 4.77229L13.5288 1.13007C13.659 0.867754 13.619 0.575166 13.4286 0.363292C13.2382 0.141328 12.9576 0.0606143 12.687 0.141328L10.1116 0.948468C9.81102 1.03927 9.49036 1.04936 9.18973 0.958558L5.9129 0.0303465C5.64234 -0.0503675 5.37177 0.0303465 5.1914 0.25231C5.01102 0.464184 4.96092 0.746683 5.08117 0.998915L6.65445 4.61087C6.68451 4.6714 6.69453 4.73194 6.69453 4.79247V5.83167H11.735H11.725Z"
              fill="#0F1829" />
            <path
              d="M9.24844 19.6438C11.7537 19.6438 13.7879 17.5957 13.7879 15.0734C13.7879 12.551 11.7537 10.5029 9.24844 10.5029C6.74322 10.5029 4.70898 12.551 4.70898 15.0734C4.70898 17.5957 6.74322 19.6438 9.24844 19.6438ZM8.78748 12.1172V11.4816C8.78748 11.2294 8.99792 11.0175 9.24844 11.0175C9.49896 11.0175 9.7094 11.2294 9.7094 11.4816V12.1172C10.5512 12.2988 11.1925 12.9849 11.1925 13.8021C11.1925 14.0543 10.9821 14.2662 10.7315 14.2662C10.481 14.2662 10.2706 14.0543 10.2706 13.8021C10.2706 13.3582 9.81963 12.995 9.25846 12.995C8.69729 12.995 8.24635 13.3582 8.24635 13.8021C8.24635 14.246 8.70731 14.6093 9.26848 14.6093C10.0301 14.6093 10.7215 15.0128 11.0322 15.6283C11.2426 16.0318 11.2626 16.4959 11.1023 16.9197C10.9219 17.3838 10.5311 17.7571 10.02 17.9488C9.91984 17.9892 9.82965 18.0093 9.72944 18.0295V18.6651C9.72944 18.9174 9.51901 19.1292 9.26848 19.1292C9.01796 19.1292 8.80752 18.9174 8.80752 18.6651V18.0396C8.24635 17.9185 7.75533 17.5755 7.50481 17.071C7.42464 16.9197 7.37454 16.7583 7.3545 16.5968C7.31441 16.3446 7.48477 16.1025 7.73529 16.0621C7.98581 16.0217 8.22631 16.1933 8.2664 16.4455C8.27642 16.5161 8.29646 16.5767 8.33654 16.6473C8.557 17.0811 9.18832 17.2829 9.7094 17.0811C9.96994 16.9802 10.1704 16.7986 10.2505 16.5867C10.3207 16.4152 10.3107 16.2235 10.2205 16.052C10.0702 15.7493 9.68936 15.5375 9.2785 15.5375C8.20627 15.5375 7.33445 14.7606 7.33445 13.8021C7.33445 12.9849 7.96577 12.3089 8.81754 12.1172H8.78748Z"
              fill="#0F1829" />
            <path
              d="M9.24927 26.0001C11.995 26.0001 14.3599 25.2333 15.9833 23.841C15.4021 23.0943 15.0614 22.146 15.0614 21.137V16.0823C15.0614 15.9411 15.1215 15.8099 15.2317 15.7292C15.342 15.6384 15.4722 15.6081 15.6125 15.6283C16.6848 15.8301 17.5566 15.6283 18.2079 15.3054C17.3962 11.5422 15.0213 8.17235 12.1754 6.78003H6.33319C2.77578 8.51538 0 13.3784 0 17.8984C0 23.8712 4.77996 25.99 9.24927 25.99V26.0001ZM10.3415 25.0315C10.3415 25.0315 10.2413 25.1122 10.1912 25.1324C10.1311 25.1526 10.081 25.1727 10.0209 25.1727C9.90063 25.1727 9.78037 25.1223 9.69019 25.0315C9.6 24.9407 9.55992 24.8297 9.55992 24.6985C9.55992 24.638 9.56994 24.5775 9.6 24.5169C9.62004 24.4665 9.66012 24.406 9.70021 24.3656C9.81044 24.2546 9.97077 24.2042 10.1111 24.2344C10.1411 24.2344 10.1712 24.2546 10.2013 24.2647C10.2313 24.2748 10.2614 24.295 10.2814 24.3051C10.3115 24.3252 10.3315 24.3454 10.3516 24.3656C10.3916 24.406 10.4217 24.4564 10.4518 24.5169C10.4718 24.5775 10.4919 24.638 10.4919 24.6985C10.4919 24.8196 10.4418 24.9407 10.3616 25.0315H10.3415ZM9.24927 9.57475C12.2656 9.57475 14.7106 12.0466 14.7106 15.0734C14.7106 18.1002 12.2555 20.572 9.24927 20.572C6.24301 20.572 3.78789 18.1002 3.78789 15.0734C3.78789 12.0466 6.24301 9.57475 9.24927 9.57475ZM1.24259 19.4824C1.48309 19.4017 1.74363 19.5328 1.8238 19.775C2.09436 20.5619 2.77578 22.035 4.3691 23.1145C5.97244 24.2042 7.60584 24.2748 8.43758 24.2243C8.70814 24.2243 8.90856 24.406 8.9286 24.6582C8.94864 24.9104 8.74822 25.1324 8.4977 25.1526C8.36743 25.1526 8.22714 25.1626 8.0668 25.1626C7.0547 25.1626 5.45136 24.9508 3.86806 23.8813C2.05428 22.6504 1.27265 20.9655 0.972025 20.0777C0.891858 19.8355 1.02213 19.5732 1.26263 19.4925L1.24259 19.4824Z"
              fill="#0F1829" />
            <path
              d="M16.9762 23.5585C17.1766 23.7603 17.4071 23.9318 17.6576 24.073C17.8079 24.1537 17.9683 24.2345 18.1286 24.295C19.1106 24.6582 19.6718 24.9508 20.0025 25.1627C20.3232 24.9407 20.8943 24.6481 21.8764 24.295C21.9866 24.2546 22.0969 24.2042 22.1971 24.1537C23.2994 23.6089 24.0108 22.4184 24.0108 21.1169V16.607C21.9766 16.7886 20.6138 15.7595 20.0025 15.144C19.3912 15.7595 18.0284 16.7987 15.9941 16.607V21.127C15.9941 22.0653 16.3549 22.9329 16.9762 23.5484V23.5585Z"
              fill="#0F1829" />
          </g>
          <defs>
            <clipPath id="clip0_230_6359">
              <rect width="24" height="26" fill="white" />
            </clipPath>
          </defs>
        </svg>


        <p class="flex items-center justify-center text-xl font-bold md:text-2xl">
          FINANCE
        </p>
        <span>
          <img v-if="isTableVisible" src="/svg/chev-down.svg" alt="">
          <img v-else src="/svg/chev-up.svg" alt="">

        </span>
      </div>

      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="8" fill="#BDBDBD" />
        <rect x="6.66602" y="6.22229" width="2.66666" height="7.1111" rx="1.33333" fill="white" />
        <rect x="6.66602" y="2.66663" width="2.66667" height="2.66667" rx="1.33333" fill="white" />
      </svg>
    </div>
    <div v-show="isTableVisible">
      <table class="w-full mt-6 text-black">
        <thead>
          <tr class="header-row">
            <th colspan="2">
              <div class="flex items-center justify-between w-full">
                <p>FINANCE CHECK</p>
                <svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="23" rx="3" fill="#0F1829" />
                  <path
                    d="M21.1943 11.3634C20.5114 9.87013 17.8337 5.00073 12.0007 5.00073C6.16768 5.00073 3.48993 9.87013 2.80708 11.3634C2.71542 11.5635 2.66797 11.781 2.66797 12.0011C2.66797 12.2212 2.71542 12.4388 2.80708 12.6389C3.48993 14.1306 6.16768 19 12.0007 19C17.8337 19 20.5114 14.1306 21.1943 12.6373C21.2858 12.4374 21.3331 12.2202 21.3331 12.0003C21.3331 11.7805 21.2858 11.5633 21.1943 11.3634V11.3634ZM12.0007 17.4445C7.09551 17.4445 4.80664 13.2712 4.22334 12.0089C4.80664 10.7295 7.09551 6.5562 12.0007 6.5562C16.8942 6.5562 19.1839 10.7116 19.778 12.0003C19.1839 13.2891 16.8942 17.4445 12.0007 17.4445Z"
                    fill="white" />
                  <path
                    d="M12 8.11194C11.2309 8.11194 10.4791 8.34001 9.83957 8.7673C9.20008 9.19459 8.70166 9.80192 8.40734 10.5125C8.11301 11.223 8.036 12.0049 8.18605 12.7593C8.3361 13.5136 8.70646 14.2065 9.2503 14.7503C9.79414 15.2942 10.487 15.6645 11.2414 15.8146C11.9957 15.9646 12.7776 15.8876 13.4881 15.5933C14.1987 15.299 14.806 14.8005 15.2333 14.161C15.6606 13.5216 15.8887 12.7697 15.8887 12.0006C15.8874 10.9697 15.4774 9.98127 14.7484 9.25227C14.0193 8.52327 13.031 8.11317 12 8.11194V8.11194ZM12 14.3338C11.5385 14.3338 11.0874 14.197 10.7037 13.9406C10.3201 13.6842 10.021 13.3198 9.8444 12.8935C9.66781 12.4672 9.6216 11.998 9.71163 11.5454C9.80166 11.0928 10.0239 10.6771 10.3502 10.3508C10.6765 10.0245 11.0922 9.80227 11.5448 9.71224C11.9974 9.62221 12.4665 9.66842 12.8929 9.84501C13.3192 10.0216 13.6836 10.3207 13.94 10.7044C14.1964 11.088 14.3332 11.5391 14.3332 12.0006C14.3332 12.6194 14.0874 13.2129 13.6498 13.6504C13.2123 14.088 12.6188 14.3338 12 14.3338Z"
                    fill="white" />
                </svg>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="includesVdiChecks">
            <template v-for="(record, index) in finance" :key="index">
              <tr v-if="finance.length > 1">
                <th colspan="2">Agreement {{ index + 1 }}</th>
              </tr>
              <tr>
                <th>Agreement Date</th>
                <td>{{ record.AgreementDate ? formatDate(record.AgreementDate) : 'Not available' }}</td>
              </tr>
              <tr>
                <th>Agreement Type</th>
                <td>{{ record.AgreementType || 'Not available' }}</td>
              </tr>
              <tr>
                <th>Term (months)</th>
                <td>{{ record.AgreementTerm || 'Not available' }}</td>
              </tr>
              <tr>
                <th>Agreement Number</th>
                <td>{{ record.AgreementNumber || 'Not available' }}</td>
              </tr>
              <tr>
                <th>Finance Company</th>
                <td>{{ record.FinanceCompany || 'Not available' }}</td>
              </tr>
              <tr>
                <th>Contact Number</th>
                <td>{{ record.ContactNumber || 'Not available' }}</td>
              </tr>
              <tr>
                <th>Vehicle Description</th>
                <td>{{ record.VehicleDescription || 'Not available' }}</td>
              </tr>
            </template>
            <tr v-if="!finance || finance.length === 0">
              <td colspan="2" class="w-full py-3 text-center">No finance information available</td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <th>Agreement Date</th>
              <td>
                <hashed />
              </td>
            </tr>
            <tr>
              <th>Agreement Type</th>
              <td>
                <hashed />
              </td>
            </tr>
            <tr>
              <th>Term (months)</th>
              <td>
                <hashed />
              </td>
            </tr>
            <tr>
              <th>Agreement Number</th>
              <td>
                <hashed />
              </td>
            </tr>
            <tr>
              <th>Finance Company</th>
              <td>
                <hashed />
              </td>
            </tr>
            <tr>
              <th>Contact Number</th>
              <td>
                <hashed />
              </td>
            </tr>
            <tr>
              <th>Vehicle Description</th>
              <td>
                <hashed />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-if="!hasSubscription?.active" class="bg-[#FF7400] w-full flex items-center justify-center py-2">
        <h3 class="text-xl font-semibold">Unlock finance data with the
          <a href="#" class="underline">full report</a>
        </h3>
      </div>
    </div>
  </report-wrapper>
</template>

<style scoped>
table {
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ddd;
  text-align: left;
  width: 50%;
}

th {
  font-weight: bold;
  padding: 0.5rem 1rem;
}

td {
  padding: 0.68rem 1rem;
}

/* tr:nth-child(even) {
  background-color: #f9f9f9;
} */

.header-row th {
  text-transform: uppercase;
}

@media (min-width: 768px) {
  th {
    padding: 0.25rem 1.5rem;
  }

  td {
    padding-inline: 1.5rem;
  }
}
</style>
