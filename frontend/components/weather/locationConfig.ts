import cambodiaLocationData from "../../data/cambodia_locations.json";
import nigeriaLocationData from "../../data/nigeria_locations.json";

export type LocationData = {
    [region: string]: {
        [district: string]: string[];
    };
};

export type CountryCode = "Cambodia" | "Nigeria";

export interface CountryLocationConfig {
    label: string;
    locationData: LocationData;
    labels: {
        state: string;
        district: string;
        commune: string;
    };
    hasCommuneLevel: boolean;
}

export const COUNTRY_LOCATION_CONFIG: Record<CountryCode, CountryLocationConfig> = {
    Cambodia: {
        label: "Cambodia",
        locationData: cambodiaLocationData as LocationData,
        labels: {
            state: "Province",
            district: "District",
            commune: "Commune",
        },
        hasCommuneLevel: true,
    },
    Nigeria: {
        label: "Nigeria",
        locationData: nigeriaLocationData as LocationData,
        labels: {
            state: "State",
            district: "LGA",
            commune: "Ward",
        },
        hasCommuneLevel: false,
    },
};

export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_LOCATION_CONFIG) as CountryCode[];

export function getStatesForCountry(country: CountryCode): string[] {
    return Object.keys(COUNTRY_LOCATION_CONFIG[country].locationData).sort();
}

export function getDistrictsForState(country: CountryCode, state: string): string[] {
    const stateData = COUNTRY_LOCATION_CONFIG[country].locationData[state];
    if (!stateData) return [];
    return Object.keys(stateData).sort();
}

export function getCommunesForDistrict(
    country: CountryCode,
    state: string,
    district: string
): string[] {
    const stateData = COUNTRY_LOCATION_CONFIG[country].locationData[state];
    if (!stateData || !stateData[district]) return [];
    return [...stateData[district]].sort();
}

export function normalizeCountry(country?: string | string[]): CountryCode | undefined {
    if (!country) return undefined;
    const value = Array.isArray(country) ? country[0] : country;
    if (value in COUNTRY_LOCATION_CONFIG) {
        return value as CountryCode;
    }
    return undefined;
}

export function getCountryConfig(country?: string | string[]): CountryLocationConfig {
    return COUNTRY_LOCATION_CONFIG[normalizeCountry(country) ?? "Cambodia"];
}
