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

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pollForReport = async (
  authStore: ReturnType<typeof useAuthStore>,
  regNumber: string | null,
): Promise<string> => {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const response = await authStore.fetchReportStatus(regNumber);
    const payload = response?.payload;

    if (payload?.status === "completed" && payload.report_link) {
      return payload.report_link;
    }

    if (payload?.status === "failed") {
      throw new Error(payload.error || "Report generation failed. Please try again.");
    }

  }

  throw new Error("Your report is taking longer than expected. Please try again shortly.");
};

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

      const regNumber = toRegNumber(car);
      const response = await authStore.fetchReportLink(regNumber);

      if (!response.success || !response.payload) {
        throw new Error("Failed to retrieve the report data.");
      }

      const reportLink =
        response.payload.report_link ??
        (await pollForReport(authStore, regNumber));

      const link = document.createElement("a");
      link.href = reportLink;
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
