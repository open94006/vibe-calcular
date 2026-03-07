import { isLocationInTaiwan } from '../utils/geo.util.js';
import cwaService from './cwa.service.js';
import moenvService from './moenv.service.js';

interface WeatherData {
    location: string;
    city?: string; // 縣市 (例如：臺北市)
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
    feelsLike: number;
    pressure: number;
    visibility: number;
    timestamp: string;
    source?: string; // 資料來源
    airQuality?: {
        aqi: number;
        description: string;
        components: {
            co: number;
            no: number;
            no2: number;
            o3: number;
            so2: number;
            pm2_5: number;
            pm10: number;
            nh3: number;
        };
    };
}

interface WeatherError {
    error: string;
    message: string;
}

interface LocationInfo {
    name: string;
    state?: string;
    country?: string;
    lat?: number;
    lon?: number;
}

/**
 * 天氣服務 - 使用 OpenWeatherMap API
 * 需要設定環境變數 OPENWEATHER_API_KEY
 */
class WeatherService {
    private apiKey: string;
    private googleGeocodeApiKey: string;
    private openCageApiKey: string;
    private baseUrl: string = 'https://api.openweathermap.org/data/2.5/weather';
    private airQualityUrl: string = 'https://api.openweathermap.org/data/2.5/air_pollution';
    private geoUrl: string = 'http://api.openweathermap.org/geo/1.0/reverse';
    private geoDirectUrl: string = 'http://api.openweathermap.org/geo/1.0/direct';
    private nominatimUrl: string = 'https://nominatim.openstreetmap.org/search';
    private nominatimReverseUrl: string = 'https://nominatim.openstreetmap.org/reverse';
    private googleGeocodeUrl: string = 'https://maps.googleapis.com/maps/api/geocode/json';
    private openCageGeocodeUrl: string = 'https://api.opencagedata.com/geocode/v1/json';

    // 縣市名稱對照表
    private cityMapping: { [key: string]: string } = {
        'Taipei City': '臺北市',
        Taipei: '臺北市',
        'New Taipei City': '新北市',
        'New Taipei': '新北市',
        'Taoyuan City': '桃園市',
        Taoyuan: '桃園市',
        'Taichung City': '臺中市',
        Taichung: '臺中市',
        'Tainan City': '臺南市',
        Tainan: '臺南市',
        'Kaohsiung City': '高雄市',
        Kaohsiung: '高雄市',
        'Keelung City': '基隆市',
        Keelung: '基隆市',
        'Hsinchu City': '新竹市',
        Hsinchu: '新竹市',
        'Chiayi City': '嘉義市',
        Chiayi: '嘉義市',
        'Hsinchu County': '新竹縣',
        'Miaoli County': '苗栗縣',
        Miaoli: '苗栗縣',
        'Changhua County': '彰化縣',
        Changhua: '彰化縣',
        'Nantou County': '南投縣',
        Nantou: '南投縣',
        'Yunlin County': '雲林縣',
        Yunlin: '雲林縣',
        'Chiayi County': '嘉義縣',
        'Pingtung County': '屏東縣',
        Pingtung: '屏東縣',
        'Yilan County': '宜蘭縣',
        Yilan: '宜蘭縣',
        'Hualien County': '花蓮縣',
        Hualien: '花蓮縣',
        'Taitung County': '臺東縣',
        Taitung: '臺東縣',
        'Penghu County': '澎湖縣',
        Penghu: '澎湖縣',
        'Kinmen County': '金門縣',
        Kinmen: '金門縣',
        'Lienchiang County': '連江縣',
        Lienchiang: '連江縣',
    };

    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY || '';
        this.googleGeocodeApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
        this.openCageApiKey = process.env.OPENCAGE_API_KEY || '';
        if (!this.apiKey) {
            console.warn('警告: OPENWEATHER_API_KEY 環境變數未設定');
        }
    }

    /**
     * 搜尋地點 (Geocoding)
     */
    async searchLocations(query: string): Promise<LocationInfo[] | WeatherError> {
        if (!this.apiKey) {
            return {
                error: 'API_KEY_MISSING',
                message: '天氣 API 金鑰未設定',
            };
        }

        try {
            // 平行搜尋：台灣限定搜尋 + 台灣鄉鎮補強搜尋(Nominatim)
            const [twRes, twDistrictResults] = await Promise.all([
                fetch(`${this.geoDirectUrl}?q=${encodeURIComponent(query)},TW&limit=5&appid=${this.apiKey}`),
                this.searchTaiwanDistrictLocations(query),
            ]);

            if (!twRes.ok) {
                console.warn('台灣 Geocoding API 請求可能失敗');
            }

            const twData = twRes.ok ? await twRes.json() : [];

            // 合併並去重 (使用 lat,lon 作為 key)
            const combined = [...twData];
            const uniqueMap = new Map();
            combined.forEach((item) => {
                // 目前只保留台灣地點
                if (item.country !== 'TW') return;

                // 簡單去重 key: lat,lon (取到小數點後 2 位避免浮點數誤差)
                const key = `${item.lat.toFixed(3)},${item.lon.toFixed(3)}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, item);
                }
            });

            const data = Array.from(uniqueMap.values());
            const mappedOwmData: LocationInfo[] = data.map((item: any) => {
                let localName = item.local_names?.['zh_tw'] || item.local_names?.['zh-tw'] || item.local_names?.zh || item.name;

                // 嘗試翻譯英文地名 (針對縣市層級，如果 API 只回傳英文)
                if (localName && !/[\u4e00-\u9fa5]/.test(localName) && this.cityMapping[localName]) {
                    localName = this.cityMapping[localName];
                } else if (item.name && !/[\u4e00-\u9fa5]/.test(localName) && this.cityMapping[item.name]) {
                    localName = this.cityMapping[item.name];
                }

                let stateName = item.state;
                if (stateName && this.cityMapping[stateName]) {
                    stateName = this.cityMapping[stateName];
                }

                return {
                    name: localName,
                    state: stateName,
                    country: item.country,
                    lat: item.lat,
                    lon: item.lon,
                };
            });

            // 合併結果，台灣鄉鎮補強結果優先
            const merged: LocationInfo[] = [...twDistrictResults, ...mappedOwmData];

            // 去重並排序（台灣優先 + 關鍵字匹配優先）
            const normalizedQuery = this.normalizeTaiwanText(query);
            const resultMap = new Map<string, LocationInfo>();

            for (const item of merged) {
                if (typeof item.lat !== 'number' || typeof item.lon !== 'number') continue;
                const key = `${item.lat.toFixed(3)},${item.lon.toFixed(3)}`;
                if (!resultMap.has(key)) {
                    resultMap.set(key, item);
                }
            }

            return Array.from(resultMap.values())
                .sort((a, b) => {
                    const aName = this.normalizeTaiwanText(a.name);
                    const bName = this.normalizeTaiwanText(b.name);
                    const aState = this.normalizeTaiwanText(a.state || '');
                    const bState = this.normalizeTaiwanText(b.state || '');

                    const score = (name: string, state: string) => {
                        if (name === normalizedQuery) return 4;
                        if (`${state}${name}` === normalizedQuery) return 3;
                        if (name.startsWith(normalizedQuery)) return 2;
                        if (`${state}${name}`.includes(normalizedQuery)) return 1;
                        return 0;
                    };

                    return score(bName, bState) - score(aName, aState);
                })
                .slice(0, 8);
        } catch (error) {
            console.error('搜尋地點錯誤:', error);
            return {
                error: 'SEARCH_ERROR',
                message: '搜尋地點失敗，請稍後再試',
            };
        }
    }

    /**
     * 透過 Nominatim 補強台灣鄉鎮地區搜尋
     */
    private async searchTaiwanDistrictLocations(query: string): Promise<LocationInfo[]> {
        // 僅在中文關鍵字時啟用，避免增加無效請求
        if (!/[\u4e00-\u9fa5]/.test(query)) {
            return [];
        }

        try {
            const searchParams = new URLSearchParams({
                q: `${query} 台灣`,
                format: 'jsonv2',
                addressdetails: '1',
                limit: '8',
                countrycodes: 'tw',
                'accept-language': 'zh-TW',
            });

            const response = await fetch(`${this.nominatimUrl}?${searchParams.toString()}`, {
                headers: {
                    'User-Agent': 'vibe-calculator/1.0 (weather-search)',
                },
            });

            if (!response.ok) {
                return [];
            }

            const data = (await response.json()) as any[];
            if (!Array.isArray(data)) return [];

            const normalizedQuery = this.normalizeTaiwanText(query);
            const resultMap = new Map<string, LocationInfo>();

            for (const item of data) {
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                if (isNaN(lat) || isNaN(lon)) continue;

                const address = item.address || {};
                const rawName = address.city_district || address.town || address.suburb || address.village || address.municipality || item.name || '';

                const rawCity = address.city || address.county || address.state || '';

                const name = this.normalizeTaiwanText(rawName);
                const state = this.normalizeTaiwanText(rawCity);

                if (!name) continue;

                const fullName = `${state}${name}`;
                if (!name.includes(normalizedQuery) && !fullName.includes(normalizedQuery)) {
                    continue;
                }

                const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
                if (!resultMap.has(key)) {
                    resultMap.set(key, {
                        name,
                        state: state && state !== name ? state : undefined,
                        country: 'TW',
                        lat,
                        lon,
                    });
                }
            }

            return Array.from(resultMap.values());
        } catch (error) {
            console.warn('Nominatim 台灣鄉鎮搜尋失敗，回退 OWM:', error);
            return [];
        }
    }

    private normalizeTaiwanText(text: string): string {
        return text.trim().replace(/台/g, '臺');
    }

    private localizeName(name?: string): string {
        if (!name) return '';
        const normalized = this.normalizeTaiwanText(name);
        if (this.cityMapping[normalized]) return this.cityMapping[normalized];
        if (this.cityMapping[name]) return this.cityMapping[name];
        return normalized;
    }

    private buildLocationInfo(name?: string, state?: string): LocationInfo | null {
        const localizedName = this.localizeName(name);
        const localizedState = this.localizeName(state);

        if (!localizedName) return null;

        if (localizedState && localizedState === localizedName) {
            return { name: localizedName };
        }

        return {
            name: localizedName,
            state: localizedState || undefined,
        };
    }

    private getAddressComponent(components: any[], targetTypes: string[]): string | undefined {
        const found = components.find((component) => targetTypes.some((type) => component.types?.includes(type)));
        return found?.long_name || found?.short_name;
    }

    /**
     * Reverse Geocoding: Google Maps Geocoding API
     */
    private async getLocationFromGoogle(lat: number, lon: number): Promise<LocationInfo | null> {
        if (!this.googleGeocodeApiKey) return null;

        try {
            const params = new URLSearchParams({
                latlng: `${lat},${lon}`,
                language: 'zh-TW',
                region: 'tw',
                key: this.googleGeocodeApiKey,
            });

            const response = await fetch(`${this.googleGeocodeUrl}?${params.toString()}`);
            if (!response.ok) return null;

            const data: any = await response.json();
            if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
                return null;
            }

            const twResult = data.results.find(
                (result: any) => Array.isArray(result.address_components) && result.address_components.some((component: any) => component.types?.includes('country') && component.short_name === 'TW'),
            );

            const result = twResult || data.results[0];
            const components = result.address_components || [];

            const district =
                this.getAddressComponent(components, ['administrative_area_level_3']) ||
                this.getAddressComponent(components, ['sublocality_level_1']) ||
                this.getAddressComponent(components, ['locality']) ||
                this.getAddressComponent(components, ['administrative_area_level_2']);

            const city = this.getAddressComponent(components, ['administrative_area_level_1']) || this.getAddressComponent(components, ['administrative_area_level_2']);

            return this.buildLocationInfo(district || city, city);
        } catch (error) {
            console.warn('Google Reverse Geocoding 失敗，嘗試下一來源:', error);
            return null;
        }
    }

    /**
     * Reverse Geocoding: OpenCage Geocoder API
     */
    private async getLocationFromOpenCage(lat: number, lon: number): Promise<LocationInfo | null> {
        if (!this.openCageApiKey) return null;

        try {
            const params = new URLSearchParams({
                q: `${lat},${lon}`,
                key: this.openCageApiKey,
                language: 'zh-TW',
                countrycode: 'tw',
                pretty: '0',
                no_annotations: '1',
                limit: '1',
            });

            const response = await fetch(`${this.openCageGeocodeUrl}?${params.toString()}`);
            if (!response.ok) return null;

            const data: any = await response.json();
            if (!Array.isArray(data.results) || data.results.length === 0) {
                return null;
            }

            const components = data.results[0].components || {};
            const district = components.city_district || components.town || components.suburb || components.village || components.municipality;
            const city = components.city || components.county || components.state;

            return this.buildLocationInfo(district || city, city);
        } catch (error) {
            console.warn('OpenCage Reverse Geocoding 失敗，嘗試下一來源:', error);
            return null;
        }
    }

    /**
     * Reverse Geocoding: Nominatim
     */
    private async getLocationFromNominatim(lat: number, lon: number): Promise<LocationInfo | null> {
        try {
            const params = new URLSearchParams({
                lat: String(lat),
                lon: String(lon),
                format: 'jsonv2',
                addressdetails: '1',
                'accept-language': 'zh-TW',
            });

            const response = await fetch(`${this.nominatimReverseUrl}?${params.toString()}`, {
                headers: {
                    'User-Agent': 'vibe-calculator/1.0 (reverse-geocoding)',
                },
            });

            if (!response.ok) return null;

            const data: any = await response.json();
            const address = data?.address || {};
            const district = address.city_district || address.town || address.suburb || address.village || address.municipality;
            const city = address.city || address.county || address.state;

            return this.buildLocationInfo(district || city, city);
        } catch (error) {
            console.warn('Nominatim Reverse Geocoding 失敗，嘗試下一來源:', error);
            return null;
        }
    }

    /**
     * Reverse Geocoding: OpenWeatherMap fallback
     */
    private async getLocationFromOwm(lat: number, lon: number): Promise<LocationInfo | null> {
        try {
            const url = `${this.geoUrl}?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
            const response = await fetch(url);

            if (!response.ok) return null;

            const data = await response.json();
            if (data && data.length > 0) {
                const result = data[0];
                const localName = result.local_names?.['zh_tw'] || result.local_names?.['zh-tw'] || result.local_names?.zh || result.name;
                return this.buildLocationInfo(localName, result.state);
            }

            return null;
        } catch (error) {
            console.error('OWM Reverse Geocoding 錯誤:', error);
            return null;
        }
    }

    /**
     * 根據城市名稱查詢天氣
     */
    async getWeatherByCity(city: string): Promise<WeatherData | WeatherError> {
        if (!this.apiKey) {
            return {
                error: 'API_KEY_MISSING',
                message: '天氣 API 金鑰未設定，請聯繫管理員',
            };
        }

        try {
            const url = `${this.baseUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=zh_tw`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    return {
                        error: 'CITY_NOT_FOUND',
                        message: `找不到城市: ${city}`,
                    };
                }
                throw new Error(`API 請求失敗: ${response.status}`);
            }

            const data = await response.json();
            let weatherData = this.formatWeatherData(data);

            // 取得詳細中文地名 & 空氣品質
            if (data.coord) {
                weatherData = await this.enrichWeatherData(weatherData, data.coord.lat, data.coord.lon);
            }

            return weatherData;
        } catch (error) {
            console.error('天氣查詢錯誤:', error);
            return {
                error: 'FETCH_ERROR',
                message: '無法取得天氣資訊，請稍後再試',
            };
        }
    }

    /**
     * 根據經緯度查詢天氣
     */
    async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData | WeatherError> {
        if (!this.apiKey) {
            return {
                error: 'API_KEY_MISSING',
                message: '天氣 API 金鑰未設定，請聯繫管理員',
            };
        }

        try {
            const url = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=zh_tw`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API 請求失敗: ${response.status}`);
            }

            const data = await response.json();
            let weatherData = this.formatWeatherData(data);

            // 取得詳細中文地名 & 空氣品質
            weatherData = await this.enrichWeatherData(weatherData, lat, lon);

            return weatherData;
        } catch (error) {
            console.error('天氣查詢錯誤:', error);
            return {
                error: 'FETCH_ERROR',
                message: '無法取得天氣資訊，請稍後再試',
            };
        }
    }

    /**
     * 豐富天氣資料：整合 OpenWeatherMap, CWA, MOENV
     */
    private async enrichWeatherData(baseData: WeatherData, lat: number, lon: number): Promise<WeatherData> {
        const enrichedData = { ...baseData };
        const sources: string[] = ['OpenWeatherMap'];

        // 1. 基礎: 取得詳細地名 (Reverse Geocoding)
        const locInfo = await this.getDetailedLocationName(lat, lon);
        if (locInfo) {
            enrichedData.location = locInfo.name;
            if (locInfo.state) {
                enrichedData.city = locInfo.state;
            }
        }

        // 2. 判斷是否在台灣
        if (isLocationInTaiwan(lat, lon)) {
            // 優化台灣地名顯示：合併 縣市 + 鄉鎮市區 (例如：台北市 + 信義區 => 台北市信義區)
            if (enrichedData.city && enrichedData.location) {
                const isChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);
                if (isChinese(enrichedData.location) && isChinese(enrichedData.city)) {
                    if (!enrichedData.location.startsWith(enrichedData.city)) {
                        enrichedData.location = `${enrichedData.city}${enrichedData.location}`;
                        enrichedData.city = undefined; // 清除 city 以避免重複顯示
                    }
                }
            }

            try {
                // 平行請求 CWA 和 MOENV
                const [cwaData, moenvData] = await Promise.all([cwaService.getNearestObservation(lat, lon), moenvService.getNearestAqi(lat, lon)]);

                // 整合 CWA 資料
                if (cwaData) {
                    enrichedData.temperature = cwaData.temperature;
                    enrichedData.humidity = cwaData.humidity;
                    enrichedData.windSpeed = Math.round(cwaData.windSpeed * 3.6); // m/s to km/h
                    // 保留 OWM 的 description 和 icon，但如果 CWA 有天氣描述也可以考慮加註
                    // enrichedData.description = cwaData.description; // 暫時保留 OWM 描述以配合 Icon
                    enrichedData.feelsLike = cwaData.temperature; // 簡單近似，因為自動站通常沒體感溫度公式
                    sources.push(`中央氣象署(${cwaData.stationName})`);
                }

                // 整合 MOENV 資料
                if (moenvData) {
                    enrichedData.airQuality = {
                        aqi: this.convertMoenvAqiToLevel(moenvData.aqi),
                        description: moenvData.status,
                        components: {
                            co: moenvData.co,
                            no: 0, // MOENV API 有時無 NO
                            no2: moenvData.no2,
                            o3: moenvData.o3,
                            so2: moenvData.so2,
                            pm2_5: moenvData.pm2_5,
                            pm10: moenvData.pm10,
                            nh3: 0, // MOENV 無 NH3
                        },
                    };
                    sources.push(`環境部(${moenvData.stationName})`);
                } else {
                    // 如果 MOENV 沒資料，嘗試用 OWM AQI
                    const owmAqi = await this.getAirQuality(lat, lon);
                    if (owmAqi) {
                        enrichedData.airQuality = owmAqi;
                    }
                }
            } catch (error) {
                console.error('台灣在地資料整合失敗，回退至 OWM:', error);
                // 失敗時確保 AQI 至少有 OWM
                if (!enrichedData.airQuality) {
                    const owmAqi = await this.getAirQuality(lat, lon);
                    if (owmAqi) enrichedData.airQuality = owmAqi;
                }
            }
        } else {
            // 非台灣地區，使用 OWM AQI
            const owmAqi = await this.getAirQuality(lat, lon);
            if (owmAqi) {
                enrichedData.airQuality = owmAqi;
            }
        }

        enrichedData.source = sources.join(', ');
        return enrichedData;
    }

    private convertMoenvAqiToLevel(aqi: number): number {
        if (aqi <= 50) return 1;
        if (aqi <= 100) return 2;
        if (aqi <= 150) return 3;
        if (aqi <= 200) return 4;
        return 5;
    }

    /**
     * 取得空氣品質資訊
     */
    private async getAirQuality(lat: number, lon: number) {
        try {
            const url = `${this.airQualityUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
            const response = await fetch(url);

            if (!response.ok) return null;

            const data = await response.json();
            if (data.list && data.list.length > 0) {
                const aqi = data.list[0].main.aqi;
                return {
                    aqi,
                    description: this.getAqiDescription(aqi),
                    components: data.list[0].components,
                };
            }
            return null;
        } catch (error) {
            console.error('AQI 查詢錯誤:', error);
            return null;
        }
    }

    /**
     * 取得詳細中文地名 (Reverse Geocoding)
     */
    private async getDetailedLocationName(lat: number, lon: number): Promise<LocationInfo | null> {
        // 優先順序：Google -> OpenCage -> Nominatim -> OWM fallback
        const providers = [
            () => this.getLocationFromGoogle(lat, lon),
            () => this.getLocationFromOpenCage(lat, lon),
            () => this.getLocationFromNominatim(lat, lon),
            () => this.getLocationFromOwm(lat, lon),
        ];

        for (const provider of providers) {
            const result = await provider();
            if (result?.name) {
                return result;
            }
        }

        return null;
    }

    private getAqiDescription(aqi: number): string {
        switch (aqi) {
            case 1:
                return '優良';
            case 2:
                return '普通';
            case 3:
                return '對敏感族群不健康';
            case 4:
                return '對所有族群不健康';
            case 5:
                return '非常不健康';
            default:
                return '未知';
        }
    }

    /**
     * 格式化 API 回應資料
     */
    private formatWeatherData(data: any): WeatherData {
        return {
            location: data.name,
            temperature: Math.round(data.main.temp),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 3.6), // 轉換為 km/h
            icon: data.weather[0].icon,
            feelsLike: Math.round(data.main.feels_like),
            pressure: data.main.pressure,
            visibility: Math.round(data.visibility / 1000), // 轉換為 km
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * 取得天氣圖示 URL
     */
    getWeatherIconUrl(iconCode: string): string {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    }
}

export default new WeatherService();
export type { WeatherData, WeatherError, LocationInfo };
