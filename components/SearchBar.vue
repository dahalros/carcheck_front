<script setup lang="ts">
import { useCarRegistrationSearchStore } from "@/stores/carRegistrationSearch";
import type { ApiErrorBody, ApiRequestError } from "~/types/models";

interface Props {
  width?: string;
  inputHeight?: string;
  inputWidth?: string;
  buttonClass?: string;
  focused?: boolean;
  hero?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: "w-2/3",
  inputHeight: "h-[0.25rem]",
  inputWidth: "w-full",
  buttonClass: "h-9 w-[2.85rem]",
  focused: false,
  hero: false,
});

const MIN_LENGTH = 5;
const MAX_LENGTH = 10;
const GENERIC_ERROR =
  "Something went wrong while checking car number. Please verify Registration Number.";

const router = useRouter();
const carRegistrationSearch = useCarRegistrationSearchStore();

const searchInput = ref<HTMLInputElement | null>(null);
const vehicleNumber = ref("");
const errors = ref<string[]>([]);
const errorMessage = ref("");
const searchTxt = ref<string | null>(null);

const placeholderText = computed(() => (props.hero ? "0000 0000" : "AB12 CDE"));

const processedCarNumber = computed({
  get: () => vehicleNumber.value.toUpperCase(),
  set: (value: string) => {
    vehicleNumber.value = value.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase();
  },
});

const focusInput = () => nextTick(() => searchInput.value?.focus());

const errorBodyOf = (error: unknown): ApiErrorBody | undefined =>
  typeof error === "object" && error !== null && "data" in error
    ? (error as ApiRequestError).data
    : undefined;

onMounted(() => {
  vehicleNumber.value = localStorage.getItem("reg_number") ?? "";
  if (props.focused) focusInput();
});

watch(errors, () => {
  setTimeout(() => {
    errors.value = [];
  }, 5000);
});

watch(() => props.focused, (focused) => {
  if (focused) focusInput();
});

const handleBlur = () => {
  if (props.focused) focusInput();
};

const searchForCarReg = async () => {
  errorMessage.value = "";
  errors.value = [];

  const length = processedCarNumber.value.length;
  if (length < MIN_LENGTH || length > MAX_LENGTH) {
    errors.value = ["Vehicle number is not valid."];
    return;
  }

  searchTxt.value = "Processing...";
  try {
    await carRegistrationSearch.searchCarRegNumber(processedCarNumber.value);
    if (router.currentRoute.value.path !== "/report") {
      router.push("/report");
    }
  } catch (error) {
    const body = errorBodyOf(error);
    if (body?.message) {
      errorMessage.value = body.message;
    } else {
      errors.value = Object.values(body?.errors ?? {}).flat();
      if (!errors.value.length) errors.value = [GENERIC_ERROR];
    }

    setTimeout(() => {
      errorMessage.value = "";
      errors.value = [];
    }, 5000);
  } finally {
    searchTxt.value = null;
  }
};
</script>

<template>
  <div class="relative">
    <div class="relative bg-[#FFA500] flex flex-row items-center"
      :class="[props.width, props.hero ? 'hero-search-shell' : 'py-1 pl-2 pr-1 rounded space-x-1']">
      <div class="flex items-center justify-center"
        :class="props.hero ? 'hero-flag absolute' : 'mr-[0.27rem]'">
        <img src="/assets/svg/uk-flag.svg" :class="props.hero ? 'size-full' : 'w-8'" alt="UK Flag" />
      </div>
      <input @keyup.enter="searchForCarReg" @blur="handleBlur" type="text" :placeholder="placeholderText"
        v-model="processedCarNumber" required
        class="block placeholder-opacity-low custom-spacing transition bg-[#FFA500] ring-0 active:ring-0 active:border-transparent outline-none focus:outline-none active:outline-none focus:border-transparent"
        :class="props.hero
          ? 'hero-placeholder hero-input absolute border-[#0F1829] py-0 font-bold leading-none text-[#0F1829]'
          : ['w-full py-4 text-2xl text-white rounded hover:bg-brand md:hover:bg-transparent md:hover:text-white md:dark:hover:text-white', props.inputHeight, props.inputWidth]"
        :autofocus="props.focused" ref="searchInput" />

      <button @click="searchForCarReg"
        class="bg-[#0F1829] flex items-center justify-center"
        :class="props.hero
          ? 'hero-button absolute'
          : ['py-1 px-2 rounded hover:bg-white md:hover:bg-transparent md:dark:hover:bg-transparent', props.buttonClass]">
        <template v-if="searchTxt">
          <svg class="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </template>
        <img src="/assets/svg/search-icon.svg" v-else :class="props.hero ? 'hero-search-icon' : 'w-full'"
          alt="Search car registration" />
      </button>
    </div>
    <div v-if="errors && errors.length && Array.isArray(errors)"
      class="absolute px-6 py-4 text-center transition-all duration-300 bg-white rounded-b alert alert-danger">
      <ul v-if="Array.isArray(errors)">
        <li v-for="error in errors" :key="error">{{ error }}</li>
      </ul>
    </div>
    <div class="absolute px-6 py-4 text-center transition-all duration-300 bg-white rounded-b alert alert-danger"
      style="line-height: 1rem;" v-if="errorMessage">
      <small>{{ errorMessage }}</small>
    </div>
  </div>
</template>

<style scoped>
.custom-spacing {
  letter-spacing: 0.1em;
}

.custom-spacing::placeholder {
  letter-spacing: 0.1em;
}

.placeholder-opacity-low::placeholder {
  opacity: 0.5;
}

.hero-placeholder::placeholder {
  opacity: 0.08;
}

@media screen and (max-width: 767px) {
  .hero-search-shell { height: 13.892cqw; border-radius: 1.27cqw; }
  .hero-flag { left: 3.085cqw; top: 4.174cqw; width: 5.807cqw; height: 6.944cqw; }
  .hero-input {
    left: 11.796cqw;
    top: 1.27cqw;
    width: 55.532cqw;
    height: 11.252cqw;
    border-width: 0.181cqw;
    border-radius: 1.27cqw;
    padding-inline: 6.667cqw;
    font-size: 7.094cqw;
  }
  .hero-button {
    left: 68.44cqw;
    top: 1.429cqw;
    width: 10.828cqw;
    height: 11.032cqw;
    border-radius: 0.817cqw;
  }
  .hero-search-icon { width: 7.151cqw; height: 7.151cqw; }

  .mobile-vin-search .hero-search-shell { height: auto; aspect-ratio: 240 / 41.5; border-radius: 4px; }
  .mobile-vin-search .hero-flag { left: 3.83%; top: 30.1%; width: 7.2%; height: 22.2%; }
  .mobile-vin-search .hero-input {
    left: 14.67%;
    top: 9.2%;
    width: 69%;
    height: 81%;
    border-width: 1px;
    border-radius: 4px;
    padding-inline: 8.3%;
    font-size: clamp(18px, 5.9vw, 21px);
  }
  .mobile-vin-search .hero-button {
    left: 85.1%;
    top: 10.4%;
    width: 13.45%;
    height: 79.3%;
    border-radius: 3px;
  }
  .mobile-vin-search .hero-search-icon { width: 66%; height: 66%; }
}

.alert {
  color: red;
  justify-content: center;
}
</style>
