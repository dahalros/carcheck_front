import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveCarState } from './deriveCarState.ts';
import type { CarLookupPayload } from '../types/models.ts';

const richCar = {
    vbrand_logo: 'https://cdn/honda.png',
    VehicleImages: { ImageDetailsList: [{ ImageUrl: 'https://cdn/car-a.jpg' }] },
    SmmtDetails: { ModelVariant: 'HONDA CIVIC' },
    TechnicalDetails: { Dimensions: { Length: 4500 }, General: { Doors: 5 } },
    MotHistory: {
        RecordList: [{ TestDate: '2024-01-01' }],
        Summary: { Passed: 3 },
        AdditionalInformation: { note: 'x' },
    },
    HighRiskRecordCount: 2,
    HighRiskRecordList: [{ Type: 'Finance' }],
    FinanceRecordCount: 1,
    FinanceRecordList: [{ Agreement: 'HP' }],
    WrittenOff: true,
    WriteOffCategory: 'S',
    Stolen: true,
    total_lookup: 7,
    allow_full_report: true,
} as unknown as CarLookupPayload;

const plainCar = {
    vbrand_logo: 'https://cdn/ford.png',
    SmmtDetails: { ModelVariant: 'FORD FIESTA' },
    MotHistory: { RecordList: [] },
    total_lookup: 8,
} as unknown as CarLookupPayload;

test('maps a full payload onto state', () => {
    const state = deriveCarState(richCar);

    assert.equal(state.vehicleImageUrl, 'https://cdn/car-a.jpg');
    assert.equal(state.vbrand_logo, 'https://cdn/honda.png');
    assert.equal(state.smmtDetails?.ModelVariant, 'HONDA CIVIC');
    assert.equal(state.dimensions?.Length, 4500);
    assert.equal(state.general?.Doors, 5);
    assert.equal(state.MOTHistory.length, 1);
    assert.equal(state.riskRecords?.HighRiskRecordCount, 2);
    assert.equal(state.financeRecords?.FinanceRecordCount, 1);
    assert.equal(state.writeOff?.WriteOffCategory, 'S');
    assert.equal(state.stolenRecord?.Stolen, true);
    assert.equal(state.totalNumberOfLooksUp, 7);
    assert.equal(state.allowFullReport, true);
});

test('clears every section the new payload omits', () => {
    const state = deriveCarState(plainCar);

    assert.equal(state.riskRecords, null);
    assert.equal(state.financeRecords, null);
    assert.equal(state.writeOff, null);
    assert.equal(state.stolenRecord, null);
    assert.equal(state.vehicleImageUrl, null);
    assert.equal(state.vehicleHistory, null);
    assert.equal(state.vehicleValuationsList, null);
    assert.equal(state.mileageHistory, null);
    assert.equal(state.MOTSummary, null);
    assert.equal(state.MOTAdditionalInfo, null);
    assert.equal(state.dimensions, null);
    assert.equal(state.allowFullReport, false);
    assert.deepEqual(state.MOTHistory, []);

    const carried = Object.keys(deriveCarState(richCar))
        .filter((key) => !(key in state));
    assert.deepEqual(carried, []);
});

test('derives MOT RecordCount from the record list when absent', () => {
    const state = deriveCarState({
        MotHistory: { RecordList: [{}, {}, {}], Summary: { Passed: 2 } },
    } as unknown as CarLookupPayload);

    assert.equal(state.MOTSummary?.RecordCount, 3);

    const explicit = deriveCarState({
        MotHistory: { RecordCount: 9, RecordList: [{}], Summary: { Passed: 2 } },
    } as unknown as CarLookupPayload);

    assert.equal(explicit.MOTSummary?.RecordCount, 9);
});

test('separates a paid Basic report from an unlocked full one', () => {
    const basic = deriveCarState({
        SmmtDetails: { ModelVariant: 'HONDA CIVIC' },
        allow_full_report: true,
        includes_vdi_checks: false,
    } as unknown as CarLookupPayload);

    assert.equal(basic.allowFullReport, true, 'Basic paid, so its five sections show');
    assert.equal(basic.includesVdiChecks, false, 'but it never bought the risk checks');
    assert.equal(basic.riskRecords, null);

    const spotlessFull = deriveCarState({
        SmmtDetails: { ModelVariant: 'HONDA CIVIC' },
        allow_full_report: true,
        includes_vdi_checks: true,
    } as unknown as CarLookupPayload);

    assert.equal(spotlessFull.riskRecords, null);
    assert.equal(spotlessFull.includesVdiChecks, true);
});

test('an unpaid report claims neither', () => {
    const free = deriveCarState({ SmmtDetails: {} } as unknown as CarLookupPayload);

    assert.equal(free.allowFullReport, false);
    assert.equal(free.includesVdiChecks, false);
});

test('zero-count sections stay null rather than empty shells', () => {
    const state = deriveCarState({
        FinanceRecordCount: 0,
        HighRiskRecordCount: 0,
        StolenMiaftrRecordCount: 0,
        WriteOffRecordCount: 0,
    } as unknown as CarLookupPayload);

    assert.equal(state.financeRecords, null);
    assert.equal(state.riskRecords, null);
    assert.equal(state.stolenRecord, null);
    assert.equal(state.writeOff, null);
});
