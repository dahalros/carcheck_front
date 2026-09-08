import type {
    CarLookupPayload,
    CarRegistrationSearchState,
    VehicleData,
} from '../types/models';

export type CarDataState = Omit<
    CarRegistrationSearchState,
    'reg_number' | 'getFullReportText' | 'dataVersion'
>;

export const deriveCarState = (payload: CarLookupPayload): CarDataState => {
    const motHistory = payload.MotHistory;
    const summary = motHistory?.Summary;

    return {
        vehicleImageUrl: payload.VehicleImages?.ImageDetailsList?.[0]?.ImageUrl ?? null,
        vbrand_logo: payload.vbrand_logo ?? null,
        smmtDetails: payload.SmmtDetails ?? null,
        dimensions: payload.TechnicalDetails?.Dimensions ?? null,
        general: payload.TechnicalDetails?.General ?? null,
        performance: payload.TechnicalDetails?.Performance ?? null,
        vehicleRegistration: payload.VehicleRegistration ?? null,
        motVed: payload.VehicleStatus?.MotVed ?? null,
        classificationDetails: payload.ClassificationDetails ?? null,
        vehicleHistory: payload.VehicleHistory ?? null,
        MOTHistory: motHistory?.RecordList ?? [],
        MOTSummary: summary
            ? {
                RecordCount: motHistory?.RecordCount ?? motHistory?.RecordList?.length ?? 0,
                ...summary,
            }
            : null,
        MOTAdditionalInfo: (motHistory?.AdditionalInformation as VehicleData | null) ?? null,
        mileageHistory: payload.MileageHistory ?? null,
        vehicleValuationsList: payload.ValuationList ?? null,
        stolenRecord: payload.Stolen || (payload.StolenMiaftrRecordCount ?? 0) > 0
            ? {
                Stolen: payload.Stolen,
                StolenInfoSource: payload.StolenInfoSource,
                StolenStatus: payload.StolenStatus,
                StolenPoliceForce: payload.StolenPoliceForce,
                StolenDate: payload.StolenDate,
                StolenMiaftrRecordCount: payload.StolenMiaftrRecordCount,
                StolenMiaftrRecordList: payload.StolenMiaftrRecordList,
            }
            : null,
        writeOff: payload.WrittenOff || (payload.WriteOffRecordCount ?? 0) > 0
            ? {
                WrittenOff: payload.WrittenOff,
                WriteOffDate: payload.WriteOffDate,
                WriteOffCategory: payload.WriteOffCategory,
                WriteOffRecordList: payload.WriteOffRecordList,
                WriteOffRecordCount: payload.WriteOffRecordCount,
            }
            : null,
        financeRecords: (payload.FinanceRecordCount ?? 0) > 0
            ? {
                FinanceRecordCount: payload.FinanceRecordCount ?? 0,
                FinanceRecordList: payload.FinanceRecordList ?? [],
            }
            : null,
        riskRecords: (payload.HighRiskRecordCount ?? 0) > 0
            ? {
                HighRiskRecordCount: payload.HighRiskRecordCount ?? 0,
                HighRiskRecordList: payload.HighRiskRecordList ?? [],
            }
            : null,
        totalNumberOfLooksUp: payload.total_lookup ?? 0,
        allowFullReport: !!payload.allow_full_report,
        includesVdiChecks: !!payload.includes_vdi_checks,

        vehicleStatus: null,
        vehicleDetails: null,
        technicalDetails: null,
    };
};
