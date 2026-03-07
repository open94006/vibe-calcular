import { useState, useEffect } from 'react';
import { useAlert } from '../components/AlertContext';
import { Search, MapPin, Wind, Droplets, Cloud, Activity, ThermometerSun, Eye, Gauge, Zap, Heart, X } from 'lucide-react';

interface WeatherData {
    location: string;
    city?: string; // 縣市
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

interface LocationSuggestion {
    name: string;
    state?: string;
    country?: string;
    lat: number;
    lon: number;
}

interface ConfirmedLocation {
    district: string;
    city?: string;
}

interface FavoriteLocation {
    id: string;
    district: string;
    city?: string;
    lat: number;
    lon: number;
    addedAt: number;
}

// 跑步建議等級
const getRunningCondition = (temp: number, aqi: number | undefined, humidity: number, windSpeed: number) => {
    let score = 100;
    const issues: string[] = [];

    // 溫度評分 (最佳跑步溫度 10-20°C)
    if (temp < 5) {
        score -= 30;
        issues.push('氣溫過低');
    } else if (temp < 10) {
        score -= 15;
        issues.push('氣溫偏低');
    } else if (temp > 28) {
        score -= 30;
        issues.push('氣溫過高');
    } else if (temp > 23) {
        score -= 15;
        issues.push('氣溫偏高');
    }

    // 空氣品質評分
    if (aqi) {
        if (aqi >= 4) {
            score -= 40;
            issues.push('空氣品質差');
        } else if (aqi >= 3) {
            score -= 25;
            issues.push('空氣品質普通');
        } else if (aqi >= 2) {
            score -= 10;
        }
    }

    // 濕度評分
    if (humidity > 80) {
        score -= 20;
        issues.push('濕度過高');
    } else if (humidity > 70) {
        score -= 10;
        issues.push('濕度偏高');
    }

    // 風速評分
    if (windSpeed > 30) {
        score -= 15;
        issues.push('風速過強');
    } else if (windSpeed > 20) {
        score -= 8;
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 80) return { level: 'excellent', text: '絕佳', color: 'from-green-500 to-emerald-600', emoji: '🏃‍♂️💨', issues };
    if (score >= 60) return { level: 'good', text: '良好', color: 'from-blue-500 to-cyan-600', emoji: '🏃‍♂️', issues };
    if (score >= 40) return { level: 'fair', text: '尚可', color: 'from-yellow-500 to-orange-500', emoji: '🚶‍♂️', issues };
    return { level: 'poor', text: '不佳', color: 'from-red-500 to-pink-600', emoji: '⚠️', issues };
};

// 跑者指標指南卡片組件
const RunnerGuideCard = ({ icon: Icon, title, desc, colorClass }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; desc: string; colorClass: string }) => (
    <div className={`flex items-start p-3 rounded-xl bg-white dark:bg-gray-800/60 border-l-4 ${colorClass} shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700`}>
        <div className={`p-2 rounded-full mr-3 shrink-0 bg-gradient-to-br ${colorClass.replace('border-', 'from-').replace('-400', '-100')} dark:bg-gray-700/80`}>
            <Icon size={18} className={`${colorClass.replace('border-', 'text-').replace('-400', '-600')} dark:text-gray-200`} />
        </div>
        <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-0.5">{title}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-tight">{desc}</p>
        </div>
    </div>
);

const AqiLegend = () => (
    <div className="grid grid-cols-5 gap-1 text-[10px] mt-3 w-full px-1">
        <div className="flex flex-col items-center space-y-1">
            <div className="w-full h-1.5 bg-green-500 rounded-full opacity-80"></div>
            <span className="text-gray-600 dark:text-gray-400">良好</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
            <div className="w-full h-1.5 bg-yellow-500 rounded-full opacity-80"></div>
            <span className="text-gray-600 dark:text-gray-400">普通</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
            <div className="w-full h-1.5 bg-orange-500 rounded-full opacity-80"></div>
            <span className="text-gray-600 dark:text-gray-400">敏感</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
            <div className="w-full h-1.5 bg-red-600 rounded-full opacity-80"></div>
            <span className="text-gray-600 dark:text-gray-400">差</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
            <div className="w-full h-1.5 bg-purple-600 rounded-full opacity-80"></div>
            <span className="text-gray-600 dark:text-gray-400">危險</span>
        </div>
    </div>
);

function WeatherChecker() {
    const AUTO_SELECT_SECONDS = 7;
    const FAVORITES_STORAGE_KEY = 'weather_favorite_locations_v1';
    const FAVORITES_LIMIT = 10;
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [lastQueryCoords, setLastQueryCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [locationOptions, setLocationOptions] = useState<LocationSuggestion[]>([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [confirmedLocation, setConfirmedLocation] = useState<ConfirmedLocation | null>(null);
    const [autoSelectRemaining, setAutoSelectRemaining] = useState(AUTO_SELECT_SECONDS);
    const [favorites, setFavorites] = useState<FavoriteLocation[]>(() => {
        try {
            const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed
                .filter((item) => item && typeof item.id === 'string' && typeof item.district === 'string' && typeof item.lat === 'number' && typeof item.lon === 'number')
                .slice(0, FAVORITES_LIMIT);
        } catch (error) {
            console.warn('最愛地點初始化讀取失敗，已忽略:', error);
            return [];
        }
    });
    const { showAlert } = useAlert();

    useEffect(() => {
        handleGetCurrentLocation();
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.warn('最愛地點儲存失敗:', error);
        }
    }, [favorites]);

    const normalizeTaiwanText = (text: string) => text.trim().replace(/台/g, '臺');

    const rankLocationOptions = (list: LocationSuggestion[], query: string) => {
        const normalizedQuery = normalizeTaiwanText(query);
        const normalizeStateBase = (state?: string) => {
            const normalized = normalizeTaiwanText(state || '').trim();
            if (!normalized) return '';
            if (/^(臺灣|台灣|TW)$/i.test(normalized)) return '';
            return normalized.replace(/[縣市]$/, '');
        };

        const normalizeDistrictBase = (name: string) => {
            return normalizeTaiwanText(name || '')
                .trim()
                .replace(/區$/, '');
        };

        const score = (item: LocationSuggestion) => {
            const name = normalizeTaiwanText(item.name || '');
            const state = normalizeTaiwanText(item.state || '');
            const full = `${state}${name}`;

            if (name === normalizedQuery || full === normalizedQuery) return 4;
            if (name.startsWith(normalizedQuery)) return 3;
            if (full.includes(normalizedQuery) || name.includes(normalizedQuery)) return 2;
            return 1;
        };

        // 先排序，再去重：保留最前面的候選
        const sorted = [...list].sort((a, b) => score(b) - score(a));
        const deduped: LocationSuggestion[] = [];

        for (const item of sorted) {
            const currentDistrictBase = normalizeDistrictBase(item.name || '');
            const currentStateBase = normalizeStateBase(item.state);
            const currentCountry = (item.country || '').toUpperCase();

            const duplicated = deduped.some((existing) => {
                const existingDistrictBase = normalizeDistrictBase(existing.name || '');
                const existingStateBase = normalizeStateBase(existing.state);
                const existingCountry = (existing.country || '').toUpperCase();

                if (existingCountry !== currentCountry) return false;
                if (existingDistrictBase !== currentDistrictBase) return false;

                // 同縣市，或其中一筆只有「台灣」等模糊層級時，視為同一筆
                if (!existingStateBase || !currentStateBase) return true;
                return existingStateBase === currentStateBase;
            });

            if (!duplicated) {
                deduped.push(item);
            }
        }

        return deduped;
    };

    // 處理搜尋輸入
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCity(e.target.value);
        setConfirmedLocation(null);
    };

    const fetchTaiwanLocations = async (keyword: string): Promise<LocationSuggestion[]> => {
        const response = await fetch(`/api/weather/search?q=${encodeURIComponent(keyword)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '搜尋失敗');
        }

        if (!Array.isArray(data)) return [];

        return data.filter((item): item is LocationSuggestion => item && item.country === 'TW' && typeof item.name === 'string' && typeof item.lat === 'number' && typeof item.lon === 'number');
    };

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const keyword = city.trim();
        if (!keyword) return;

        setShowLocationModal(false);
        setLocationOptions([]);
        setLoading(true);

        try {
            const locations = await fetchTaiwanLocations(keyword);
            const ranked = rankLocationOptions(locations, keyword);

            if (ranked.length === 0) {
                showAlert('找不到符合的台灣鄉鎮市區', 'warning');
                return;
            }

            if (ranked.length === 1) {
                const target = ranked[0];
                await fetchWeather(`/api/weather/coordinates?lat=${target.lat}&lon=${target.lon}`, {
                    district: normalizeTaiwanText(target.name),
                    city: target.state ? normalizeTaiwanText(target.state) : undefined,
                });
                return;
            }

            setLocationOptions(ranked);
            setShowLocationModal(true);
        } catch (error) {
            console.error('搜尋地點錯誤:', error);
            showAlert('搜尋地點失敗，請稍後再試', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = async (suggestion: LocationSuggestion) => {
        const selected: ConfirmedLocation = {
            district: normalizeTaiwanText(suggestion.name),
            city: suggestion.state ? normalizeTaiwanText(suggestion.state) : undefined,
        };
        setCity(selected.district);
        setConfirmedLocation(selected);
        setShowLocationModal(false);
        setLocationOptions([]);
        await fetchWeather(`/api/weather/coordinates?lat=${suggestion.lat}&lon=${suggestion.lon}`, selected);
    };

    useEffect(() => {
        if (!showLocationModal || locationOptions.length <= 1) return;

        setAutoSelectRemaining(AUTO_SELECT_SECONDS);

        const startedAt = Date.now();
        const intervalId = window.setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
            const remainingSeconds = Math.max(0, AUTO_SELECT_SECONDS - elapsedSeconds);
            setAutoSelectRemaining(remainingSeconds);
        }, 250);

        const timeoutId = window.setTimeout(() => {
            void handleLocationSelect(locationOptions[0]);
        }, AUTO_SELECT_SECONDS * 1000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [showLocationModal, locationOptions]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            showAlert('您的瀏覽器不支援定位功能', 'error');
            return;
        }

        setConfirmedLocation(null);
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await fetchWeather(`/api/weather/coordinates?lat=${latitude}&lon=${longitude}`);
            },
            (error) => {
                setLoading(false);
                console.error('定位錯誤:', error);
            },
        );
    };

    const fetchWeather = async (url: string, confirmed?: ConfirmedLocation) => {
        setLoading(true);
        try {
            const parsedUrl = new URL(url, window.location.origin);
            const latParam = parsedUrl.searchParams.get('lat');
            const lonParam = parsedUrl.searchParams.get('lon');

            if (latParam && lonParam) {
                const lat = Number(latParam);
                const lon = Number(lonParam);
                if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
                    setLastQueryCoords({ lat, lon });
                }
            } else {
                setLastQueryCoords(null);
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                showAlert(data.message || '查詢失敗', 'error');
                setWeather(null);
                return;
            }

            const normalizedData = {
                ...data,
                location: data.location ? normalizeTaiwanText(data.location) : data.location,
                city: data.city ? normalizeTaiwanText(data.city) : data.city,
            };

            if (confirmed) {
                normalizedData.location = confirmed.district;
                normalizedData.city = confirmed.city;
                setConfirmedLocation(confirmed);
                setCity(confirmed.district);
            } else {
                setConfirmedLocation(null);
                if (normalizedData.location) setCity(normalizedData.location);
            }

            setWeather(normalizedData);
        } catch (error) {
            console.error('天氣查詢錯誤:', error);
            showAlert('無法連接到伺服器', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIconUrl = (iconCode: string) => {
        return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    };

    const getAqiColor = (aqi: number) => {
        switch (aqi) {
            case 1:
                return 'bg-green-600 text-white';
            case 2:
                return 'bg-yellow-600 text-white';
            case 3:
                return 'bg-orange-600 text-white';
            case 4:
                return 'bg-red-600 text-white';
            case 5:
                return 'bg-purple-700 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDisplayLocation = (data: WeatherData) => {
        const location = normalizeTaiwanText(data.location || '').trim();
        const city = normalizeTaiwanText(data.city || '').trim();
        const taiwanCityPrefixes = [
            '臺北市',
            '新北市',
            '桃園市',
            '臺中市',
            '臺南市',
            '高雄市',
            '基隆市',
            '新竹市',
            '嘉義市',
            '宜蘭縣',
            '新竹縣',
            '苗栗縣',
            '彰化縣',
            '南投縣',
            '雲林縣',
            '嘉義縣',
            '屏東縣',
            '花蓮縣',
            '臺東縣',
            '澎湖縣',
            '金門縣',
            '連江縣',
        ];

        if (city) {
            if (location.startsWith(city) && location.length > city.length) {
                return {
                    title: location.slice(city.length), // 鄉鎮市區
                    subtitle: city, // 縣市
                };
            }

            // 沒有鄉鎮區時，標題顯示縣市
            return {
                title: city,
                subtitle: '',
            };
        }

        // 若後端已把「縣市+鄉鎮」合併到 location，這裡嘗試拆解
        for (const prefix of taiwanCityPrefixes) {
            if (location.startsWith(prefix) && location.length > prefix.length) {
                return {
                    title: location.slice(prefix.length),
                    subtitle: prefix,
                };
            }
        }

        return {
            title: location,
            subtitle: '',
        };
    };

    const runningCondition = weather ? getRunningCondition(weather.temperature, weather.airQuality?.aqi, weather.humidity, weather.windSpeed) : null;
    const locationDisplay = weather ? (confirmedLocation ? { title: confirmedLocation.district, subtitle: confirmedLocation.city || '' } : getDisplayLocation(weather)) : { title: '', subtitle: '' };

    const getFavoriteId = (district: string, city?: string) => {
        const normalizedDistrict = normalizeTaiwanText(district).trim();
        const normalizedCity = normalizeTaiwanText(city || '').trim();
        return `${normalizedCity}-${normalizedDistrict}`;
    };

    const currentFavoriteId = weather ? getFavoriteId(locationDisplay.title || weather.location, locationDisplay.subtitle || weather.city) : '';
    const isCurrentFavorite = currentFavoriteId ? favorites.some((item) => item.id === currentFavoriteId) : false;

    const toggleCurrentFavorite = () => {
        if (!weather) return;

        const district = locationDisplay.title || weather.location;
        const cityName = locationDisplay.subtitle || weather.city;
        const id = getFavoriteId(district, cityName);

        const exists = favorites.some((item) => item.id === id);
        if (exists) {
            setFavorites((prev) => prev.filter((item) => item.id !== id));
            showAlert(`已移除最愛：${district}`, 'info');
            return;
        }

        if (!lastQueryCoords) {
            showAlert('目前查詢沒有座標資訊，暫時無法收藏', 'warning');
            return;
        }

        if (favorites.length >= FAVORITES_LIMIT) {
            showAlert(`最多只能收藏 ${FAVORITES_LIMIT} 個地點，請先移除舊收藏`, 'warning');
            return;
        }

        const newFavorite: FavoriteLocation = {
            id,
            district,
            city: cityName,
            lat: lastQueryCoords.lat,
            lon: lastQueryCoords.lon,
            addedAt: Date.now(),
        };

        setFavorites((prev) => [newFavorite, ...prev]);
        showAlert(`已加入最愛：${district}`, 'success');
    };

    const removeFavorite = (favoriteId: string) => {
        setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
        showAlert('已移除最愛地點', 'info');
    };

    const handleFavoriteQuickSelect = async (favorite: FavoriteLocation) => {
        const selected: ConfirmedLocation = {
            district: favorite.district,
            city: favorite.city,
        };
        setCity(favorite.district);
        setConfirmedLocation(selected);
        await fetchWeather(`/api/weather/coordinates?lat=${favorite.lat}&lon=${favorite.lon}`, selected);
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 flex flex-col h-full overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* 頂部跑者標題 */}
            <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🏃</span>
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-gray-800 dark:text-white tracking-tight">跑者天氣站</h1>
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Runner&apos;s Weather Hub</p>
                </div>
            </div>

            {/* 搜尋列 */}
            <form onSubmit={handleSearchSubmit} className="relative mb-4 lg:mb-5 flex gap-2 z-0 lg:z-50 max-w-3xl">
                <div className="flex-1 relative">
                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3">
                        <input
                            type="text"
                            value={city}
                            onChange={handleInputChange}
                            placeholder="搜尋城市/鄉鎮（例如：西屯）"
                            className="flex-1 bg-transparent focus:outline-none text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading} className="text-gray-500 hover:text-blue-500 p-1 transition-colors">
                            <Search size={20} />
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="px-4 bg-blue-500 text-white rounded-2xl shadow-sm hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center shrink-0"
                    title="定位"
                >
                    <MapPin size={24} />
                </button>
            </form>

            {favorites.length > 0 && (
                <div className="mb-4 max-w-4xl">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <Heart size={14} className="text-rose-600 dark:text-rose-300" />
                        <p className="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300">最愛地點</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {favorites.map((favorite) => (
                            <div
                                key={favorite.id}
                                className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleFavoriteQuickSelect(favorite);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-l-full transition-colors text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title={`快速查詢 ${favorite.city ? `${favorite.city}${favorite.district}` : favorite.district}`}
                                >
                                    {favorite.city ? `${favorite.city}${favorite.district}` : favorite.district}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeFavorite(favorite.id)}
                                    className="pr-2 pl-2 py-1.5 border-l border-gray-300 dark:border-gray-500 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                                    aria-label={`移除最愛 ${favorite.city ? `${favorite.city}${favorite.district}` : favorite.district}`}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-h-0 z-0">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 animate-pulse text-lg font-medium">載入中...</div>
                ) : weather ? (
                    <div className="h-full overflow-y-auto pb-6 scrollbar-hide">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
                            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                                {runningCondition && (
                                    <div className={`bg-gradient-to-r ${runningCondition.color} rounded-3xl p-5 lg:p-6 text-white shadow-2xl relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-8 -mt-8" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl -ml-6 -mb-6" />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-white/95 drop-shadow-sm">
                                                        <MapPin size={18} className="drop-shadow-sm" />
                                                        <h2 className="text-xl lg:text-2xl font-black leading-tight tracking-tight">{locationDisplay.title || weather.location}</h2>
                                                        <button
                                                            type="button"
                                                            onClick={toggleCurrentFavorite}
                                                            className="ml-1 p-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all"
                                                            title={isCurrentFavorite ? '從最愛移除' : '加入最愛'}
                                                            aria-label={isCurrentFavorite ? '從最愛移除' : '加入最愛'}
                                                        >
                                                            <Heart size={16} className={isCurrentFavorite ? 'text-rose-300 fill-rose-300' : 'text-white'} />
                                                        </button>
                                                    </div>
                                                    {locationDisplay.subtitle && <p className="text-xs font-medium text-white/80 ml-6 mt-0.5">{locationDisplay.subtitle}</p>}
                                                </div>
                                                <p className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm shadow-sm inline-flex items-center gap-1">
                                                    🕐 {formatTime(weather.timestamp)}
                                                </p>
                                            </div>

                                            <div className="mt-5 mb-5 lg:mt-6 lg:mb-6">
                                                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-2 ml-1">跑步狀態</p>
                                                <p className="text-5xl sm:text-6xl font-black tracking-tighter drop-shadow-md leading-none">{runningCondition.text}</p>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-white/20 flex flex-col gap-3">
                                                {runningCondition.issues.length > 0 ? (
                                                    <div>
                                                        <p className="text-xs font-bold mb-2 opacity-90 flex items-center gap-1">⚠️ 注意事項</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {runningCondition.issues.map((issue, idx) => (
                                                                <span key={idx} className="bg-white/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-white/10">
                                                                    {issue}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold opacity-90 flex items-center gap-1">✨ 天氣狀況良好，享受跑步！</p>
                                                )}
                                                {weather.source && <p className="text-[10px] text-white/60 text-right mt-1 font-medium">資料來源：{weather.source}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-3xl p-5 lg:p-6 text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12" />
                                    <div className="flex items-center gap-4 relative z-10 w-full justify-between">
                                        <div className="flex items-center gap-4">
                                            <img src={getWeatherIconUrl(weather.icon)} alt={weather.description} className="w-20 h-20 drop-shadow-lg" />
                                            <div className="flex flex-col">
                                                <span className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">{weather.temperature}°</span>
                                                <span className="text-lg font-medium opacity-90 capitalize mt-1">{weather.description}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                                                <p className="text-[10px] opacity-70 uppercase tracking-wide">體感溫度</p>
                                                <p className="text-2xl font-bold">{weather.feelsLike}°</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40 p-4 rounded-2xl shadow-sm border border-blue-200/60 dark:border-blue-700 flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-md transition-all">
                                        <Droplets className="text-blue-700 dark:text-blue-300 mb-2" size={28} />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wide">濕度</span>
                                        <span className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                            {weather.humidity}
                                            <span className="text-base font-normal ml-0.5">%</span>
                                        </span>
                                        <span className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 font-medium">{weather.humidity > 70 ? '⚠️ 影響散熱' : '✓ 舒適'}</span>
                                    </div>
                                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/60 dark:to-gray-800/60 p-4 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-600 flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-md transition-all">
                                        <Wind className="text-slate-700 dark:text-slate-300 mb-2" size={28} />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wide">風速</span>
                                        <span className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                            {weather.windSpeed}
                                            <span className="text-base font-normal ml-0.5">km/h</span>
                                        </span>
                                        <span className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 font-medium">{weather.windSpeed > 20 ? '⚠️ 強風' : '✓ 微風'}</span>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 p-4 rounded-2xl shadow-sm border border-purple-200/60 dark:border-purple-700 flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-md transition-all">
                                        <Activity className="text-purple-700 dark:text-purple-300 mb-2" size={28} />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wide">PM2.5</span>
                                        <span className="text-2xl font-black text-gray-900 dark:text-white mt-1">{weather.airQuality?.components.pm2_5.toFixed(1)}</span>
                                        <span className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 font-medium">{(weather.airQuality?.components.pm2_5 || 0) > 35 ? '⚠️ 不佳' : '✓ 良好'}</span>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/40 dark:to-red-900/40 p-4 rounded-2xl shadow-sm border border-orange-200/60 dark:border-orange-700 flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-md transition-all">
                                        <Eye className="text-orange-700 dark:text-orange-300 mb-2" size={28} />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wide">能見度</span>
                                        <span className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                            {(weather.visibility / 1000).toFixed(1)}
                                            <span className="text-base font-normal ml-0.5">km</span>
                                        </span>
                                        <span className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 font-medium">{weather.visibility > 5000 ? '✓ 清晰' : '⚠️ 霧霾'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                                {weather.airQuality && (
                                    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-900/80 p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <Gauge className="text-purple-700 dark:text-purple-300" size={20} />
                                                <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">空氣品質</h3>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 ${getAqiColor(weather.airQuality.aqi)}`}>
                                                <span>AQI {weather.airQuality.aqi}</span>
                                                <span className="border-l border-white/30 pl-2">{weather.airQuality.description}</span>
                                            </div>
                                        </div>
                                        <AqiLegend />
                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                                            <div className="text-center bg-white dark:bg-gray-700/60 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="text-[10px] text-gray-600 dark:text-gray-300 mb-1 font-semibold">PM2.5</div>
                                                <div className="font-black text-base text-gray-900 dark:text-white">{weather.airQuality.components.pm2_5.toFixed(1)}</div>
                                            </div>
                                            <div className="text-center bg-white dark:bg-gray-700/60 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="text-[10px] text-gray-600 dark:text-gray-300 mb-1 font-semibold">PM10</div>
                                                <div className="font-black text-base text-gray-900 dark:text-white">{weather.airQuality.components.pm10.toFixed(1)}</div>
                                            </div>
                                            <div className="text-center bg-white dark:bg-gray-700/60 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="text-[10px] text-gray-600 dark:text-gray-300 mb-1 font-semibold">NO2</div>
                                                <div className="font-black text-base text-gray-900 dark:text-white">{weather.airQuality.components.no2.toFixed(1)}</div>
                                            </div>
                                            <div className="text-center bg-white dark:bg-gray-700/60 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="text-[10px] text-gray-600 dark:text-gray-300 mb-1 font-semibold">O3</div>
                                                <div className="font-black text-base text-gray-900 dark:text-white">{weather.airQuality.components.o3.toFixed(1)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <Zap className="text-orange-500 dark:text-orange-400" size={18} />
                                        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">跑者建議</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <RunnerGuideCard
                                            icon={ThermometerSun}
                                            title="最佳跑步溫度"
                                            desc="10-20°C 是最理想的跑步溫度。低於 5°C 注意保暖，高於 28°C 建議清晨或傍晚跑步。"
                                            colorClass="border-orange-400"
                                        />
                                        <RunnerGuideCard
                                            icon={Activity}
                                            title="空氣品質建議"
                                            desc="AQI < 50 最適合跑步。51-100 可正常訓練。> 100 建議減少戶外高強度運動，改室內訓練。"
                                            colorClass="border-purple-400"
                                        />
                                        <RunnerGuideCard
                                            icon={Droplets}
                                            title="濕度與補水"
                                            desc="濕度 > 70% 會影響排汗散熱，體感溫度更高。建議增加補水頻率，穿著透氣衣物。"
                                            colorClass="border-blue-400"
                                        />
                                        <RunnerGuideCard icon={Wind} title="風速影響" desc="風速 > 20 km/h 逆風時阻力顯著增加，配速可能受影響。順風時注意不要跑太快。" colorClass="border-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 pb-20">
                        <Cloud size={64} className="mb-4 text-gray-200 dark:text-gray-700" />
                        <p className="text-lg font-medium text-gray-400 dark:text-gray-500">請搜尋城市或使用定位</p>
                    </div>
                )}
            </div>

            {showLocationModal && locationOptions.length > 1 && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowLocationModal(false)} aria-label="關閉地點選擇彈窗" />
                    <div className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-5 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">請選擇地點</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">找到多個符合結果，請選擇要查詢的鄉鎮市區。</p>

                        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="relative w-7 h-7 shrink-0">
                                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeDasharray="62.83"
                                        strokeDashoffset={62.83 * (1 - autoSelectRemaining / AUTO_SELECT_SECONDS)}
                                        className="text-blue-500 dark:text-blue-400 transition-all duration-200"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-200">{autoSelectRemaining}</span>
                            </div>
                            <span>{autoSelectRemaining} 秒內未選擇，將自動套用第一個地點</span>
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-2">
                            {locationOptions.map((item, index) => (
                                <button
                                    key={`${item.lat}-${item.lon}-${index}`}
                                    type="button"
                                    onClick={() => handleLocationSelect(item)}
                                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors"
                                >
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.state || '台灣'}</div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowLocationModal(false)}
                                className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WeatherChecker;
