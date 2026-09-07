import { ref } from "vue";
import { navigateTo } from "nuxt/app";

const reportDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

const toRegNumber = (car: any): string | null =>
  (typeof car === "string" ? car : car?.reg_number) ||
  (import.meta.client ? localStorage.getItem("reg_number") : null);

export const useDownloadReport = () => {
  const isDownloading = ref(false);
  const isAnyDownloading = useState("report-download-in-progress", () => false);
  const errorMessage = ref<string | null>(null);

  const downloadReport = async (car?: any) => {
    if (isAnyDownloading.value) return;

    const tokenStore = useTokenStore();
    const subscriptionStore = useSubscriptionStore();
    const authStore = useAuthStore();
    const carStore = useCarStore();

    isDownloading.value = true;
    isAnyDownloading.value = true;
    errorMessage.value = null;

    try {
      if (!(tokenStore.getToken && tokenStore.getStatus)) {
        return navigateTo("/auth/login");
      }
      await carStore.fetchRequestCounts();
      if (!subscriptionStore.getSubscriptionStatus) {
        return navigateTo("/pricing");
      }

      const hasSubscription = await subscriptionStore.getHasSubscription();
      const subscription = await subscriptionStore.getUserSubscription();
      const user = authStore.user;

      const canDownload =
        hasSubscription?.active ||
        hasSubscription?.request_count > 0 ||
        user?.request_count > 0 ||
        user?.one_off_request_count > 0 ||
        carStore?.requestCounts?.one_off_request_count > 0;

      if (!canDownload) {
        return navigateTo("/payment/plans");
      }
      if (!subscription) {
        errorMessage.value =
          "You don't have any active subscription. Please buy or upgrade plan.";
        return { success: false };
      }

      const response = await authStore.fetchReportLink(toRegNumber(car));

      if (!response.success || !response.payload) {
        throw new Error("Failed to retrieve the report data.");
      }

      const link = document.createElement("a");
      link.href = response.payload.report_link;
      link.download = `report-${reportDate()}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error: any) {
      console.error("Download error:", error);
      errorMessage.value =
        error?.data?.message ||
        error?.data?.error ||
        "Error occurred during the download process.";
      return { success: false, error };
    } finally {
      isDownloading.value = false;
      isAnyDownloading.value = false;
    }
  };

  return { downloadReport, isDownloading, isAnyDownloading, errorMessage, reportDate };
};
