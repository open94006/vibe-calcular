import { calculateDistance } from '../utils/geo.util.js';

interface MoenvStation {
    sitename: string;
    county: string;
    aqi: string;
    pollutant: string;
    status: string;
    so2: string;
    co: string;
    o3: string;
    pm10: string;
    'pm2.5': string;
    no2: string;
    longitude: string;
    latitude: string;
    publishtime: string;
}

interface MoenvResponse {
    records: MoenvStation[];
}

export interface MoenvAqiData {
    aqi: number;
    status: string; // 狀態 (良好, 普通...)
    pm2_5: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
    stationName: string;
    timestamp: string;
    distance?: number;
}

class MoenvService {
    private apiKey: string;
    private baseUrl: string = 'https://data.moenv.gov.tw/api/v2/aqx_p_432';
    private cache: MoenvStation[] | null = null;
    private lastFetchTime: number = 0;
    private cacheTTL: number = 20 * 60 * 1000; // 20 minutes (AQI updates hourly usually)

    constructor() {
        this.apiKey = process.env.MOENV_API_KEY || '';
        if (!this.apiKey) {
            console.warn('MOENV_API_KEY 未設定，將無法使用環境部空氣品質資料');
        }
    }

    private async getAllStations(): Promise<MoenvStation[]> {
        if (!this.apiKey) return [];

        const now = Date.now();
        if (this.cache && now - this.lastFetchTime < this.cacheTTL) {
            return this.cache;
        }

        try {
            // limit=1000 確保抓取所有測站 (全台約 80+ 個)
            const url = `${this.baseUrl}?api_key=${this.apiKey}&limit=1000&sort=ImportDate desc&format=JSON`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`MOENV API Error: ${response.status} ${response.statusText}`);
                return [];
            }

            const data: any = await response.json();
            if (data.records) {
                this.cache = data.records;
                this.lastFetchTime = now;
                return this.cache || [];
            }
            return [];
        } catch (error) {
            console.error('MOENV Fetch Error:', error);
            return [];
        }
    }

    async getNearestAqi(lat: number, lon: number): Promise<MoenvAqiData | null> {
        if (!this.apiKey) return null;

        const stations = await this.getAllStations();
        if (stations.length === 0) return null;

        let nearestStation: MoenvStation | null = null;
        let minDistance = Infinity;

        for (const station of stations) {
            const sLat = parseFloat(station.latitude);
            const sLon = parseFloat(station.longitude);

            if (isNaN(sLat) || isNaN(sLon)) continue;

            const dist = calculateDistance(lat, lon, sLat, sLon);
            if (dist < minDistance) {
                minDistance = dist;
                nearestStation = station;
            }
        }

        if (nearestStation) {
            // 轉換數值，API 回傳的都是 string，有些可能是空字串
            const parseVal = (val: string) => {
                const num = parseFloat(val);
                return isNaN(num) ? 0 : num;
            };

            const aqi = parseVal(nearestStation.aqi);

            // 如果 AQI 無效，可能該站維修中
            if (aqi < 0) return null;

            return {
                aqi: aqi,
                status: nearestStation.status,
                pm2_5: parseVal(nearestStation['pm2.5']),
                pm10: parseVal(nearestStation.pm10),
                o3: parseVal(nearestStation.o3),
                no2: parseVal(nearestStation.no2),
                so2: parseVal(nearestStation.so2),
                co: parseVal(nearestStation.co),
                stationName: nearestStation.sitename,
                timestamp: nearestStation.publishtime,
                distance: minDistance,
            };
        }

        return null;
    }
}

export default new MoenvService();
