import { defineStore } from "pinia";
import ApiService from "~/services/apiService";
import { useSubscriptionStore } from "~/stores/subscription";
import { useTokenStore } from "~/stores/token";
import type {
  ApiDataResponse,
  ApiMessageResponse,
  ApiPayloadResponse,
  AuthenticatedUser,
  EmailCheckPayload,
  EmailForm,
  LoginForm,
  LoginPayload,
  PaginatedResult,
  PasswordChangeForm,
  Permission,
  RegistrationForm,
  ReportLink,
  ResetTokenForm,
  Role,
  SearchHistoryItem,
  User,
  UserUpdateForm,
} from "~/types/models";

interface AuthState {
  user: AuthenticatedUser | null;
}

interface RolesAndPermissions {
  roles: Array<Role | string>;
  permissions: Array<Permission | string>;
}

const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({ user: null }),

  getters: {
    getCurrentUser: (state): AuthenticatedUser | null => state.user,
    isAuthenticated: (state): boolean => state.user !== null,
  },

  persist: {
    pick: ["user"],
  },

  actions: {
    setUser(user: AuthenticatedUser | null): void {
      this.user = user;
    },

    async makeLogin(form: LoginForm): Promise<ApiPayloadResponse<LoginPayload>> {
      const response = await ApiService.post<ApiPayloadResponse<LoginPayload>>("login", form);
      const payload = response.payload;
      const subscriptionStore = useSubscriptionStore();

      useTokenStore().setToken(payload.access_token, payload.refresh_token);
      await subscriptionStore.setCurrentSubscription(payload.subscription || null);
      await subscriptionStore.setHasSubscription(payload.hasSubscription);
      this.setUser(payload.user);

      return response;
    },

    async createNewUser(form: RegistrationForm): Promise<ApiDataResponse<User>> {
      return ApiService.post<ApiDataResponse<User>>("users", form);
    },

    async logout(): Promise<void> {
      const tokenStore = useTokenStore();

      try {
        await ApiService.post<ApiMessageResponse>("logout", null, tokenStore.token);
      } catch (error) {
        console.warn("Remote logout failed; clearing the local session.", error);
      }

      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }

      if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });
      window.performance?.clearResourceTimings?.();

      window.location.href = "/auth/login";
    },

    fetchUserRolesAndPermissions(): Promise<ApiPayloadResponse<RolesAndPermissions>> {
      return ApiService.get<ApiPayloadResponse<RolesAndPermissions>>(
        "user/fetch-users-role-and-permissions",
        useTokenStore().token,
      );
    },

    fetchUserCars(
      page = 1,
      perPage = 1,
    ): Promise<ApiPayloadResponse<PaginatedResult<SearchHistoryItem>>> {
      return ApiService.get<ApiPayloadResponse<PaginatedResult<SearchHistoryItem>>>(
        `v1/user/cars?page=${page}&perPage=${perPage}`,
        useTokenStore().token,
      );
    },

    async checkEmailExists(form: EmailForm): Promise<ApiPayloadResponse<EmailCheckPayload>> {
      const response = await ApiService.post<ApiPayloadResponse<EmailCheckPayload>>(
        "users/check-email-exist",
        form,
      );
      const payload = response.payload;

      if (payload?.user_type === "newlyCreatedUser") {
        useTokenStore().setToken(payload.access_token, payload.access_token);
        this.setUser({
          request_count: 0,
          one_off_request_count: 0,
          request_count_trial: 0,
          ...payload.user,
        });
      }

      return response;
    },

    fetchReportLink(regNumber: string | null): Promise<ApiPayloadResponse<ReportLink>> {
      if (!this.user?.email) throw new Error("Cannot download a report without a user email.");

      return ApiService.post<ApiPayloadResponse<ReportLink>>(
        "users/download-report",
        { email: this.user.email, reg_number: regNumber },
        useTokenStore().getToken,
      );
    },

    fetchReportStatus(regNumber: string | null): Promise<ApiPayloadResponse<ReportLink>> {
      return ApiService.post<ApiPayloadResponse<ReportLink>>(
        "users/report-status",
        { reg_number: regNumber },
        useTokenStore().getToken,
      );
    },

    submitEmailForPasswordReset(form: EmailForm): Promise<ApiDataResponse<User>> {
      return ApiService.post<ApiDataResponse<User>>("users/verify-email", form);
    },

    submitTokenForPasswordReset(form: ResetTokenForm): Promise<ApiDataResponse<User>> {
      return ApiService.post<ApiDataResponse<User>>("users/verify-reset-token", form);
    },

    handlePasswordResetSubmit(form: PasswordChangeForm): Promise<ApiDataResponse<User>> {
      return ApiService.post<ApiDataResponse<User>>("users/change-password", form);
    },

    async fetchUserDetails(): Promise<ApiDataResponse<AuthenticatedUser>> {
      const response = await ApiService.get<ApiDataResponse<AuthenticatedUser>>("users/details");
      this.setUser(this.user ? { ...this.user, ...response.data } : response.data);
      return response;
    },

    async updateUserDetails(form: UserUpdateForm): Promise<ApiDataResponse<User>> {
      if (!this.user?.username) throw new Error("Cannot update a user without a username.");

      const response = await ApiService.put<ApiDataResponse<User>>(
        `users/${this.user.username}`,
        form,
      );
      this.setUser({ ...this.user, ...response.data });
      return response;
    },

    updatePassword(form: PasswordChangeForm): Promise<ApiDataResponse<User>> {
      if (!this.user?.email) throw new Error("Cannot update a password without a user email.");

      return ApiService.post<ApiDataResponse<User>>("users/change-password", {
        ...form,
        email: this.user.email,
      });
    },
  },
});

export { useAuthStore };
