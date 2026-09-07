import { defineStore } from "pinia";
import ApiService from "~/services/apiService";
import { useSubscriptionStore } from "~/stores/subscription";
import type {
  ApiDataResponse,
  ApiPayloadResponse,
  CarDetail,
  CarListItem,
  CarReport,
  CustomPlan,
  CustomPlanPurchase,
  PaymentIntentConfirmation,
  RequestCounts,
} from "~/types/models";

interface CarState {
  car_reg_number: string | null;
  requestCounts: RequestCounts;
  userCarsList: CarListItem[] | null;
  userReports: CarReport[] | null;
  custom_plans: CustomPlan[] | null;
  etags: {
    requestCounts: string | null;
    userCarsList: string | null;
  };
}

export const useCarStore = defineStore("car", {
  state: (): CarState => ({
    car_reg_number: null,
    requestCounts: {
      request_count: 0,
      one_off_request_count: 0,
      request_count_trial: 0,
    },
    userCarsList: null,
    userReports: null,
    custom_plans: null,
    etags: {
      requestCounts: null,
      userCarsList: null,
    },
  }),

  persist: {
    pick: ["car_reg_number", "requestCounts", "userCarsList", "userReports", "etags"],
  },

  getters: {
    getCarRegNumber: (state): string | null => state.car_reg_number,
  },

  actions: {
    setRequestCounts(counts: RequestCounts): void {
      this.requestCounts = counts;
    },

    setCarRegNumber(carRegistrationNumber: string): void {
      this.car_reg_number = carRegistrationNumber;
      localStorage.setItem("car_reg_number", carRegistrationNumber);
    },

    async fetchRequestCounts(): Promise<RequestCounts> {
      const response = await ApiService.getConditional<ApiPayloadResponse<RequestCounts>>(
        "fetch-user-request-counts",
        this.etags.requestCounts,
      );

      if (!response.notModified && response.data) {
        this.requestCounts = response.data.payload;
        this.etags.requestCounts = response.etag;
        if (this.requestCounts.has_subscription) {
          await useSubscriptionStore().setHasSubscription(this.requestCounts.has_subscription);
        }
      }

      return this.requestCounts;
    },

    async fetchCarsUserList(): Promise<CarListItem[] | null> {
      const response = await ApiService.getConditional<ApiDataResponse<CarListItem[]>>(
        "v1/fetch-users-car-detail",
        this.userCarsList ? this.etags.userCarsList : null,
      );

      if (!response.notModified && response.data) {
        this.userCarsList = response.data.data;
        this.etags.userCarsList = response.etag;
      }

      return this.userCarsList;
    },

    async fetchCarDetail(carId: number): Promise<CarDetail | null> {
      const response = await ApiService.get<ApiDataResponse<CarDetail>>(
        `v1/fetch-users-car-detail/${carId}`,
      );
      return response.data;
    },

    async fetchCarsUserReports(): Promise<CarReport[] | null> {
      const response = await ApiService.get<ApiDataResponse<CarReport[]>>(
        "v1/fetch-all-user-car-reports",
      );
      this.userReports = response.data;
      return this.userReports;
    },

    async fetchAllCustomPlans(force = false): Promise<CustomPlan[] | null> {
      if (!force && this.custom_plans) return this.custom_plans;
      const response = await ApiService.get<ApiDataResponse<CustomPlan[]>>("custom-plans");
      this.custom_plans = response.data;
      return this.custom_plans;
    },

    buyCustomPlan(
      customPlan: Pick<CustomPlan, "plan_code">,
    ): Promise<ApiPayloadResponse<CustomPlanPurchase>> {
      return ApiService.post<ApiPayloadResponse<CustomPlanPurchase>>("buy-custom-plan", {
        plan_code: customPlan.plan_code,
      });
    },

    confirmPaymentIntent(
      paymentIntentId: string,
    ): Promise<ApiPayloadResponse<PaymentIntentConfirmation>> {
      return ApiService.post<ApiPayloadResponse<PaymentIntentConfirmation>>(
        "confirm-payment-intent",
        { payment_intent_id: paymentIntentId },
      );
    },
  },
});
