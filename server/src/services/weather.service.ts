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
    private baseUrl: string = 'https://api.openweathermap.org/data/2.5/weather';
    private airQualityUrl: string = 'https://api.openweathermap.org/data/2.5/air_pollution';
    private geoUrl: string = 'http://api.openweathermap.org/geo/1.0/reverse';
    private geoDirectUrl: string = 'http://api.openweathermap.org/geo/1.0/direct';

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
            // 平行搜尋：全球搜尋 + 台灣限定搜尋
            const [globalRes, twRes] = await Promise.all([
                fetch(`${this.geoDirectUrl}?q=${encodeURIComponent(query)}&limit=5&appid=${this.apiKey}`),
                fetch(`${this.geoDirectUrl}?q=${encodeURIComponent(query)},TW&limit=5&appid=${this.apiKey}`),
            ]);

            if (!globalRes.ok || !twRes.ok) {
                // 這裡簡化處理，只要其中一個失敗就視為失敗，或者可以容錯
                // 但通常 API key 有效的話都會成功
                console.warn('部分 Geocoding API 請求可能失敗');
            }

            const globalData = globalRes.ok ? await globalRes.json() : [];
            const twData = twRes.ok ? await twRes.json() : [];

            // 合併並去重 (使用 lat,lon 作為 key)
            // 優先放入 twData
            const combined = [...twData, ...globalData];
            const uniqueMap = new Map();
            combined.forEach((item) => {
                // 過濾中國大陸地區 (CN)
                if (item.country === 'CN') return;

                // 簡單去重 key: lat,lon (取到小數點後 2 位避免浮點數誤差)
                const key = `${item.lat.toFixed(3)},${item.lon.toFixed(3)}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, item);
                }
            });

            const data = Array.from(uniqueMap.values());

            // 排序：台灣 (TW) 優先
            data.sort((a: any, b: any) => {
                if (a.country === 'TW' && b.country !== 'TW') return -1;
                if (a.country !== 'TW' && b.country === 'TW') return 1;
                return 0;
            });

            return data.map((item: any) => {
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
        } catch (error) {
            console.error('搜尋地點錯誤:', error);
            return {
                error: 'SEARCH_ERROR',
                message: '搜尋地點失敗，請稍後再試',
            };
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
        try {
            const url = `${this.geoUrl}?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
            const response = await fetch(url);

            if (!response.ok) return null;

            const data = await response.json();
            if (data && data.length > 0) {
                const result = data[0];
                // 優先取用繁體中文名稱，若無則用 zh，最後用 name
                let localName = result.local_names?.['zh_tw'] || result.local_names?.['zh-tw'] || result.local_names?.zh || result.name;

                // 嘗試翻譯英文地名 (針對縣市層級)
                if (localName && !/[\u4e00-\u9fa5]/.test(localName) && this.cityMapping[localName]) {
                    localName = this.cityMapping[localName];
                } else if (result.name && !/[\u4e00-\u9fa5]/.test(localName) && this.cityMapping[result.name]) {
                    localName = this.cityMapping[result.name];
                }

                let stateName = result.state;
                // 嘗試翻譯 State
                if (stateName && this.cityMapping[stateName]) {
                    stateName = this.cityMapping[stateName];
                }

                // 如果 localName 和 stateName 一樣，就只回傳 name，避免重複顯示 (例如：台北市 台北市)
                if (localName === stateName) {
                    return { name: localName };
                }

                return {
                    name: localName,
                    state: stateName,
                };
            }
            return null;
        } catch (error) {
            console.error('Reverse Geocoding 錯誤:', error);
            return null;
        }
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
