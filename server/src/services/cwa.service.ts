import { calculateDistance } from '../utils/geo.util.js';

interface CwaStation {
    StationName: string;
    StationId: string;
    GeoInfo: {
        Coordinates: Array<{
            CoordinateName: string;
            CoordinateFormat: string;
            StationLatitude: number;
            StationLongitude: number;
        }>;
    };
    WeatherElement: {
        AirTemperature: number;
        RelativeHumidity: number;
        WindSpeed: number;
        Weather: string; // 天氣現象
    };
    ObsTime: {
        DateTime: string;
    };
}

interface CwaResponse {
    success: string;
    records: {
        Station: CwaStation[];
    };
}

export interface CwaWeatherData {
    stationName: string;
    temperature: number;
    humidity: number;
    windSpeed: number; // m/s
    description: string;
    timestamp: string;
    lat: number;
    lon: number;
    distance?: number;
}

class CwaService {
    private apiKey: string;
    private baseUrl: string = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001';
    private forecast36hrUrl: string = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001';
    private cache: CwaStation[] | null = null;
    private lastFetchTime: number = 0;
    private cacheTTL: number = 10 * 60 * 1000; // 10 minutes

    constructor() {
        this.apiKey = process.env.CWA_API_KEY || '';
        if (!this.apiKey) {
            console.warn('CWA_API_KEY 未設定，將無法使用中央氣象署資料');
        }
    }

    /**
     * 獲取所有測站資料 (含快取)
     */
    private async getAllStations(): Promise<CwaStation[]> {
        if (!this.apiKey) return [];

        const now = Date.now();
        if (this.cache && now - this.lastFetchTime < this.cacheTTL) {
            return this.cache;
        }

        try {
            // 請求自動氣象站資料 (O-A0001-001)
            // 參數 StationStatus=OPEN 只取開站中的
            const url = `${this.baseUrl}?Authorization=${this.apiKey}&format=JSON&StationStatus=OPEN`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`CWA API Error: ${response.status} ${response.statusText}`);
                return [];
            }

            const data: any = await response.json();

            if (data.success === 'true' && data.records && data.records.Station) {
                this.cache = data.records.Station;
                this.lastFetchTime = now;
                return this.cache || [];
            }

            return [];
        } catch (error) {
            console.error('CWA Fetch Error:', error);
            return [];
        }
    }

    /**
     * 根據經緯度尋找最近的測站並回傳天氣資料
     */
    async getNearestObservation(lat: number, lon: number): Promise<CwaWeatherData | null> {
        if (!this.apiKey) return null;

        const stations = await this.getAllStations();
        if (stations.length === 0) return null;

        let nearestStation: CwaStation | null = null;
        let minDistance = Infinity;

        for (const station of stations) {
            // 找出 WGS84 座標
            const coord = station.GeoInfo.Coordinates.find((c) => c.CoordinateName === 'WGS84');
            if (!coord) continue;

            const dist = calculateDistance(lat, lon, coord.StationLatitude, coord.StationLongitude);
            if (dist < minDistance) {
                minDistance = dist;
                nearestStation = station;
            }
        }

        // 如果最近的測站距離超過 20 公里，可能不太準確，但還是回傳 (或者可以設個閾值回傳 null)
        if (nearestStation) {
            const coord = nearestStation.GeoInfo.Coordinates.find((c) => c.CoordinateName === 'WGS84')!;

            // 處理數值可能的特殊狀況 (例如 -99)
            const temp = nearestStation.WeatherElement.AirTemperature;
            const humid = nearestStation.WeatherElement.RelativeHumidity;
            const wind = nearestStation.WeatherElement.WindSpeed;

            // CWA 的數值如果是 -99 代表儀器故障或無數據
            if (temp < -50 || humid < 0) return null;

            return {
                stationName: nearestStation.StationName,
                temperature: temp,
                humidity: humid,
                windSpeed: wind < 0 ? 0 : wind, // m/s
                description: nearestStation.WeatherElement.Weather || '多雲', // CWA 自動站有時沒有天氣現象描述，預設多雲或需 mapping
                timestamp: nearestStation.ObsTime.DateTime,
                lat: coord.StationLatitude,
                lon: coord.StationLongitude,
                distance: minDistance,
            };
        }

        return null;
    }

    /**
     * 取得縣市 36 小時天氣預報中的降雨機率（PoP）
     */
    async getRainProbabilityByCity(cityName: string): Promise<number | null> {
        if (!this.apiKey || !cityName) return null;

        try {
            const params = new URLSearchParams({
                Authorization: this.apiKey,
                format: 'JSON',
                locationName: cityName,
                elementName: 'PoP',
            });

            const response = await fetch(`${this.forecast36hrUrl}?${params.toString()}`);
            if (!response.ok) {
                console.warn(`CWA PoP API Error: ${response.status} ${response.statusText}`);
                return null;
            }

            const data: any = await response.json();
            const locations = data?.records?.location;
            if (!Array.isArray(locations) || locations.length === 0) return null;

            const weatherElements = locations[0]?.weatherElement;
            if (!Array.isArray(weatherElements)) return null;

            const popElement = weatherElements.find((el: any) => el?.elementName === 'PoP');
            const times = popElement?.time;
            if (!Array.isArray(times) || times.length === 0) return null;

            const now = Date.now();
            const currentSlot = times.find((slot: any) => {
                const start = new Date(slot?.startTime).getTime();
                const end = new Date(slot?.endTime).getTime();
                return Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end;
            });

            const targetSlot = currentSlot || times[0];
            const rawValue = targetSlot?.parameter?.parameterName;
            const parsed = Number(rawValue);
            if (!Number.isFinite(parsed)) return null;

            return Math.max(0, Math.min(100, Math.round(parsed)));
        } catch (error) {
            console.error('CWA 降雨機率查詢錯誤:', error);
            return null;
        }
    }
}

export default new CwaService();
