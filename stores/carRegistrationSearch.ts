import ApiService from "@/services/apiService";
import { defineStore } from "pinia";
import { decryptData, encryptData } from '~/composables/useCrypto';
import { systematicFourCharCode } from '~/composables/useGenerateLocalstorageCode';
import { useTokenStore } from '~/stores/token';
import { useAuthStore } from '~/stores/auth';
import { useCarStore } from '~/stores/car';
import { deriveCarState } from '~/stores/deriveCarState';
import type {
    ApiPayloadResponse,
    CarLookupPayload,
    CarRegistrationSearchState,
    FinanceRecords,
    MileageHistory,
    MotRecord,
    MotSummary,
    MotVed,
    RiskRecords,
    SmmtDetails,
    StolenRecord,
    VehicleData,
    VehicleHistory,
    VehicleRegistration,
    VehicleValuations,
    WriteOffRecord,
} from '~/types/models';

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const mergeDeep = (target: PlainObject, source: PlainObject): PlainObject => {
    for (const [key, value] of Object.entries(source)) {
        if (value === null || value === undefined) continue;

        target[key] = isPlainObject(value)
            ? mergeDeep(isPlainObject(target[key]) ? target[key] : {}, value)
            : value;
    }

    return target;
};

export const useCarRegistrationSearchStore = defineStore('carRegistrationSearch', {
    state: (): CarRegistrationSearchState => {
        return {
            reg_number: "",
            vehicleImageUrl: null,
            vehicleStatus: null,
            vehicleDetails: null,
            MOTHistory: [],
            MOTSummary: null,
            mileageHistory: null,
            MOTAdditionalInfo: null,
            technicalDetails: null,
            classificationDetails: null,
            vehicleHistory: null,
            vehicleValuationsList: null,
            dimensions: null,
            general: null,
            vehicleRegistration: null,
            motVed: null,
            smmtDetails: null,
            performance: null,
            vbrand_logo: null,
            getFullReportText: "Get full report",
            stolenRecord: null,
            writeOff: null,
            riskRecords: null,
            financeRecords: null,
            totalNumberOfLooksUp: 0,
            allowFullReport: false,
            includesVdiChecks: false,
            dataVersion: 0,
        }
    },
    actions: {
        async fetchVehicleImageUrl(): Promise<string | null> {
            const code = systematicFourCharCode('VehicleImageUrl');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.vehicleImageUrl = JSON.parse(decrypted) as string;
                } catch (error) {
                    devError("Failed to decrypt vehicle image url:", error);
                }
            }
            return this.vehicleImageUrl;
        },
        async fetchVehicleLogo(): Promise<string | null> {
            const code = systematicFourCharCode('VehicleLogo');
            const encryptedData = localStorage.getItem(code);

            if (!encryptedData) return null;

            try {
                const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                // Ensure vbrand_logo is updated in state
                this.$patch({ vbrand_logo: JSON.parse(decrypted) as string });
            } catch (error) {
                devError("Failed to decrypt Vehicle logo: ", error);
            }

            return this.vbrand_logo;
        },
        async fetchSmmtDetails(): Promise<SmmtDetails | null> {
            const code = systematicFourCharCode('SmmtDetails');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.smmtDetails = JSON.parse(decrypted) as SmmtDetails;
                } catch (error) {
                    devError("Failed to decrypt SmmtDetails:", error);
                }
            }
            return this.smmtDetails;
        },
        async fetchVehicleDimension(): Promise<VehicleData | null> {
            const code = systematicFourCharCode('VehicleDimension');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.dimensions = JSON.parse(decrypted) as VehicleData;
                } catch (error) {
                    devError("Failed to decrypt Vehicle Dimensions:", error);
                }
            }
            return this.dimensions;
        },
        async fetchVehicleRegistration(): Promise<VehicleRegistration | null> {
            const code = systematicFourCharCode('VehicleRegistration');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.vehicleRegistration = JSON.parse(decrypted) as VehicleRegistration;
                } catch (error) {
                    devError("Failed to decrypt Vehicle Registration:", error);
                }
            }
            return this.vehicleRegistration;
        },
        async fetchVehicleMotVed(): Promise<MotVed | null> {
            const code = systematicFourCharCode('VehicleMotVed');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.motVed = JSON.parse(decrypted) as MotVed;
                } catch (error) {
                    devError("Failed to decrypt Vehicle MotVed: ", error);
                }
            }
            return this.motVed;
        },
        async fetchVehicleGeneralInfo(): Promise<VehicleData | null> {
            const code = systematicFourCharCode('VehicleGeneralInfo');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.general = JSON.parse(decrypted) as VehicleData;
                } catch (error) {
                    devError("Failed to decrypt Vehicle General Information: ", error);
                }
            }
            return this.general;
        },
        async fetchPerformance(): Promise<VehicleData | null> {
            const code = systematicFourCharCode('Performance');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.performance = JSON.parse(decrypted) as VehicleData;
                } catch (error) {
                    devError("Failed to decrypt Vehicle Technical Performance: ", error);
                }
            }
            return this.performance;
        },
        async fetchClassificationDetails(): Promise<VehicleData | null> {
            const code = systematicFourCharCode('VehicleClassificationDetails');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.classificationDetails = JSON.parse(decrypted) as VehicleData;
                } catch (error) {
                    devError("Failed to decrypt Vehicle Classification Information: ", error);
                }
            }
            return this.classificationDetails;
        },
        async fetchVehicleHistory(): Promise<VehicleHistory | null> {
            const code = systematicFourCharCode('VehicleHistory');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.vehicleHistory = JSON.parse(decrypted) as VehicleHistory;
                } catch (error) {
                    devError("Failed to decrypt Vehicle History: ", error);
                }
            }
            return this.vehicleHistory;
        },
        async fetchMOTHistory(): Promise<MotRecord[]> {
            const code = systematicFourCharCode('MOTHistory');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.MOTHistory = JSON.parse(decrypted) as MotRecord[];
                } catch (error) {
                    devError("Failed to decrypt Vehicle MOT Additional Information: ", error);
                }
            }
            return this.MOTHistory;
        },
        async fetchMileageHistory(): Promise<MileageHistory | null> {
            const code = systematicFourCharCode('MileageHistory');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.mileageHistory = JSON.parse(decrypted) as MileageHistory;
                } catch (error) {
                    devError("Failed to decrypt mileage history: ", error);
                }
            }
            return this.mileageHistory;
        },
        async fetchMOTSummary(): Promise<MotSummary | null> {
            const code = systematicFourCharCode('MOTSummary');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.MOTSummary = JSON.parse(decrypted) as MotSummary;
                } catch (error) {
                    devError("Failed to decrypt MOT summary: ", error);
                }
            }
            return this.MOTSummary;
        },
        async fetchMOTAdditionalInformation(): Promise<VehicleData | null> {
            const code = systematicFourCharCode('MOTAdditionalInfo');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.MOTAdditionalInfo = JSON.parse(decrypted) as VehicleData;
                } catch (error) {
                    devError("Failed to decrypt Vehicle MOT History: ", error);
                }
            }
            return this.MOTAdditionalInfo;
        },

        async fetchValuationList(): Promise<VehicleValuations | null> {
            const code = systematicFourCharCode('VehicleValuationsList');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.vehicleValuationsList = JSON.parse(decrypted) as VehicleValuations;
                } catch (error) {
                    devError("Failed to decrypt Vehicle MOT History: ", error);
                }
            }
            return this.vehicleValuationsList;
        },
        async fetchFullReportText(): Promise<string> {
            return this.getFullReportText;
        },
        async fetchStolenRecords(): Promise<StolenRecord | null> {
            const code = systematicFourCharCode('vehicleStolenRecords');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.stolenRecord = JSON.parse(decrypted) as StolenRecord;
                } catch (error) {
                    devError("Failed to decrypt Vehicle Stolen data: ", error);
                }
            }

            return this.stolenRecord;
        },
        async fetchWriteOffRecords(): Promise<WriteOffRecord | null> {
            const code = systematicFourCharCode('vehicleWriteOffRecords');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.writeOff = JSON.parse(decrypted) as WriteOffRecord;
                } catch (error) {
                    devError("Failed to decrypt Vehicle write-off data: ", error);
                }
            }
            return this.writeOff;
        },
        async fetchRiskRecords(): Promise<RiskRecords | null> {
            const code = systematicFourCharCode('vehicleRiskRecords');
            const encryptedData = localStorage.getItem(code);
            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.riskRecords = JSON.parse(decrypted) as RiskRecords;
                } catch (error) {
                    devError("Failed to decrypt Vehicle risk data: ", error);
                }
            }

            return this.riskRecords;
        },
        async fetchFinanceRecords(): Promise<FinanceRecords | null> {
            const code = systematicFourCharCode('vehicleFinanceRecords');
            const encryptedData = localStorage.getItem(code);

            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.financeRecords = JSON.parse(decrypted) as FinanceRecords;
                } catch (error) {
                    devError("Failed to decrypt Vehicle finance data: ", error);
                }
            }
            return this.financeRecords;
        },
        async fetchNumberOfLooksUp(): Promise<number> {
            const code = systematicFourCharCode('numberOfLooksUp');
            const encryptedData = localStorage.getItem(code);

            if (encryptedData) {
                try {
                    const decrypted = await decryptData(`${code}`, JSON.parse(encryptedData));
                    this.totalNumberOfLooksUp = JSON.parse(decrypted) as number;
                } catch (error) {
                    devError("Failed to decrypt Vehicle total looks up: ", error);
                }
            }
            return this.totalNumberOfLooksUp;
        },

        // Search and store vehicle registration details
        async searchCarRegNumber(car_reg_number: string): Promise<void> {
            try {
                const tokenStore = useTokenStore();
                const carStore = useCarStore();
                const token = tokenStore.getToken;

                this.reg_number = car_reg_number.replace(/[^a-zA-Z0-9]/g, "");
                carStore.setCarRegNumber(this.reg_number);

                const response = token
                    ? await ApiService.get<ApiPayloadResponse<CarLookupPayload[]>>(`v1/car-check/${this.reg_number}`, token)
                    : await ApiService.get<ApiPayloadResponse<CarLookupPayload[]>>(`v1/car-check/${this.reg_number}`);
                if(response.success){
                    await this.cleanupLocalStorage();
                }

                await this.applyCarData(response.payload);
            } catch (error) {
                devError("Error while fetching car details:", error);
                throw error;
            }
        },

        async applyCarData(payload: CarLookupPayload[]): Promise<void> {
            if (!Array.isArray(payload)) return;

            const authStore = useAuthStore();
            const combinedPayload = payload.reduce<PlainObject>(
                (accumulator, item) => mergeDeep(accumulator, item),
                {},
            ) as CarLookupPayload;

            this.$patch((state) => Object.assign(state, deriveCarState(combinedPayload), {
                dataVersion: state.dataVersion + 1,
            }));

            if (authStore.user) {
                authStore.user.request_count = Number(combinedPayload.request_count) || 0;
                authStore.user.one_off_request_count = Number(combinedPayload.one_off_request_count) || 0;
                authStore.user.request_count_trial = Number(combinedPayload.request_count_trial) || 0;
            }

            await Promise.all([
                this.setVehicleImageUrl(combinedPayload),
                this.setVehicleLogo(combinedPayload),
                this.setSmmtDetails(combinedPayload),
                this.setVehicleDimension(combinedPayload),
                this.setVehicleRegistration(combinedPayload),
                this.setMotVed(combinedPayload),
                this.setVehicleGeneralInfo(combinedPayload),
                this.setPerformance(combinedPayload),
                this.setClassificationDetails(combinedPayload),
                this.setMOTHistory(combinedPayload),
                this.setMOTSummary(combinedPayload),
                this.setMileageHistory(combinedPayload),
                this.setMOTAdditionalInfo(combinedPayload),
                this.setVehicleHistory(combinedPayload),
                this.setVehicleValuationList(combinedPayload),
                this.setStolenRecord(combinedPayload),
                this.setWriteOffRecords(combinedPayload),
                this.setFinanceRecords(combinedPayload),
                this.setRiskRecords(combinedPayload),
                this.setNumberOfLooksUp(combinedPayload),
            ]);

            localStorage.setItem('reg_number', this.reg_number);
        },

        async hydrateFromStorage(): Promise<void> {
            await Promise.all([
                this.fetchVehicleImageUrl(),
                this.fetchVehicleLogo(),
                this.fetchSmmtDetails(),
                this.fetchVehicleDimension(),
                this.fetchVehicleRegistration(),
                this.fetchVehicleMotVed(),
                this.fetchVehicleGeneralInfo(),
                this.fetchPerformance(),
                this.fetchClassificationDetails(),
                this.fetchVehicleHistory(),
                this.fetchMOTHistory(),
                this.fetchMileageHistory(),
                this.fetchMOTSummary(),
                this.fetchMOTAdditionalInformation(),
                this.fetchValuationList(),
                this.fetchStolenRecords(),
                this.fetchWriteOffRecords(),
                this.fetchRiskRecords(),
                this.fetchFinanceRecords(),
                this.fetchNumberOfLooksUp(),
            ]);
        },

        // Set data in localStorage with encryption
        async setVehicleImageUrl(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleImageUrl');
            const imageUrl = combinedPayload.VehicleImages?.ImageDetailsList?.[0]?.ImageUrl;
            if (imageUrl) {
                const data = JSON.stringify(imageUrl);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setVehicleLogo(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleLogo');
            if (combinedPayload.vbrand_logo) {
                const data = JSON.stringify(combinedPayload.vbrand_logo);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setSmmtDetails(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('SmmtDetails');
            if (combinedPayload.SmmtDetails) {
                const data = JSON.stringify(combinedPayload.SmmtDetails);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setVehicleDimension(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleDimension');
            if (combinedPayload.TechnicalDetails && combinedPayload.TechnicalDetails.Dimensions) {
                const data = JSON.stringify(combinedPayload.TechnicalDetails.Dimensions);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setVehicleRegistration(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleRegistration');
            if (combinedPayload.VehicleRegistration) {
                const data = JSON.stringify(combinedPayload.VehicleRegistration);

                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setMotVed(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleMotVed');
            if (combinedPayload.VehicleStatus && combinedPayload.VehicleStatus.MotVed) {
                const data = JSON.stringify(combinedPayload.VehicleStatus.MotVed);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setVehicleGeneralInfo(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleGeneralInfo');
            if (combinedPayload.TechnicalDetails && combinedPayload.TechnicalDetails.General) {
                const data = JSON.stringify(combinedPayload.TechnicalDetails.General);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setPerformance(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('Performance');
            if (combinedPayload.TechnicalDetails && combinedPayload.TechnicalDetails.Performance) {
                const data = JSON.stringify(combinedPayload.TechnicalDetails.Performance);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setClassificationDetails(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleClassificationDetails');
            if (combinedPayload.ClassificationDetails) {
                const data = JSON.stringify(combinedPayload.ClassificationDetails);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setVehicleHistory(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleHistory');
            if (combinedPayload.VehicleHistory) {
                const data = JSON.stringify(combinedPayload.VehicleHistory);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setMOTHistory(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('MOTHistory');
            if (combinedPayload.MotHistory?.RecordList) {
                const data = JSON.stringify(combinedPayload.MotHistory.RecordList);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setMileageHistory(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('MileageHistory');
            if (combinedPayload.MileageHistory) {
                const data = JSON.stringify(combinedPayload.MileageHistory);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setMOTSummary(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('MOTSummary');
            const history = combinedPayload.MotHistory;
            if (history?.Summary) {
                const data = JSON.stringify({
                    RecordCount: history.RecordCount ?? history.RecordList?.length ?? 0,
                    ...history.Summary,
                });
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setMOTAdditionalInfo(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('MOTAdditionalInfo');
            if (combinedPayload.MotHistory?.AdditionalInformation) {
                const data = JSON.stringify(combinedPayload.MotHistory.AdditionalInformation);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setFullReportText(text: string): Promise<void> {
            this.getFullReportText = text;
        },
        async setVehicleValuationList(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('VehicleValuationsList');
            if (combinedPayload && combinedPayload.ValuationList) {
                const data = JSON.stringify(combinedPayload.ValuationList);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setStolenRecord(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('vehicleStolenRecords');

            if (combinedPayload.Stolen || (combinedPayload.StolenMiaftrRecordCount ?? 0) > 0) {
                const stolenData: StolenRecord = {
                    Stolen: combinedPayload.Stolen,
                    StolenInfoSource: combinedPayload.StolenInfoSource,
                    StolenStatus: combinedPayload.StolenStatus,
                    StolenPoliceForce: combinedPayload.StolenPoliceForce,
                    StolenDate: combinedPayload.StolenDate,
                    StolenMiaftrRecordCount: combinedPayload.StolenMiaftrRecordCount,
                    StolenMiaftrRecordList: combinedPayload.StolenMiaftrRecordList,
                };

                const data = JSON.stringify(stolenData);
                const encryptedData = await encryptData(code, data);

                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setWriteOffRecords(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('vehicleWriteOffRecords');
            if (combinedPayload.WrittenOff || (combinedPayload.WriteOffRecordCount ?? 0) > 0) {
                const writtenOffData: WriteOffRecord = {
                    WrittenOff: combinedPayload.WrittenOff,
                    WriteOffDate: combinedPayload.WriteOffDate,
                    WriteOffCategory: combinedPayload.WriteOffCategory,
                    WriteOffRecordList: combinedPayload.WriteOffRecordList,
                    WriteOffRecordCount: combinedPayload.WriteOffRecordCount,
                };

                const data = JSON.stringify(writtenOffData);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setFinanceRecords(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('vehicleFinanceRecords');
            if ((combinedPayload.FinanceRecordCount ?? 0) > 0) {
                const financeRecords: FinanceRecords = {
                    FinanceRecordCount: combinedPayload.FinanceRecordCount ?? 0,
                    FinanceRecordList: combinedPayload.FinanceRecordList ?? [],
                };
                const data = JSON.stringify(financeRecords);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setRiskRecords(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('vehicleRiskRecords');
            if ((combinedPayload.HighRiskRecordCount ?? 0) > 0) {
                const riskData: RiskRecords = {
                    HighRiskRecordCount: combinedPayload.HighRiskRecordCount ?? 0,
                    HighRiskRecordList: combinedPayload.HighRiskRecordList ?? [],
                };
                const data = JSON.stringify(riskData);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },
        async setNumberOfLooksUp(combinedPayload: CarLookupPayload): Promise<void> {
            const code = systematicFourCharCode('numberOfLooksUp');
            if ((combinedPayload.total_lookup ?? 0) > 0) {
                const data = JSON.stringify(combinedPayload.total_lookup);
                const encryptedData = await encryptData(code, data);
                localStorage.setItem(code, JSON.stringify(encryptedData));
            }
        },

        async cleanupLocalStorage(): Promise<void> {
            const keysToRemove = [
                'VehicleImageUrl', 'VehicleLogo', 'SmmtDetails', 'VehicleDimension',
                'VehicleRegistration', 'VehicleMotVed', 'VehicleGeneralInfo', 'Performance',
                'VehicleClassificationDetails', 'VehicleHistory', 'MOTHistory', 'MOTSummary', 'MileageHistory', 'MOTAdditionalInfo', 'VehicleValuationsList',
                'vehicleStolenRecords', 'vehicleWriteOffRecords', 'vehicleRiskRecords',
                'vehicleFinanceRecords', 'numberOfLooksUp', 'reg_number','car_reg_number'
            ];

            keysToRemove.forEach(key => {
                const storageKey = systematicFourCharCode(key);
                localStorage.removeItem(storageKey);
            });

            localStorage.removeItem('reg_number');
        }
    },
    persist: {
        pick: ["reg_number", "getFullReportText", "allowFullReport", "includesVdiChecks"],
    },
});
