# 天氣查詢功能說明

## 功能概述

天氣查詢功能專為跑者設計，提供快速、直觀的即時天氣資訊，包括：
- 氣溫（攝氏）與體感溫度
- **空氣品質指數 (AQI)** 與詳細污染物數值 (PM2.5, PM10, NO2, O3)
- 天氣描述與圖示
- 濕度、風速、氣壓、能見度
- 目前位置自動偵測
- **中文詳細地名**（支援縣市與鄉鎮區級別顯示）

## 功能特色

1.  **跑者優先設計**：
    - **快速定位**：進入頁面自動嘗試定位，立即顯示當地天氣。
    - **視覺化 AQI**：以顏色標示空氣品質（綠/黃/橘/紅/紫），一眼判斷是否適合戶外運動。
    - **關鍵數據突顯**：大字體顯示溫度，並將濕度、風速等跑者關心的數據卡片化呈現。
2.  **城市搜尋**：支援全球城市名稱查詢。
3.  **響應式設計**：完美支援手機與桌面瀏覽。
4.  **即時資料**：使用 OpenWeatherMap Current Weather 與 Air Pollution API。

## 環境設定

### 1. 取得 OpenWeatherMap API Key

1.  前往 [OpenWeatherMap](https://openweathermap.org/api) 註冊帳號。
2.  在帳號設定中產生 API Key。
3.  確保您的 API Key 有權限存取 Current Weather Data, Air Pollution API 以及 Geocoding API。

### 2. 設定環境變數

在專案根目錄或伺服器環境中設定環境變數：

```bash
# .env 檔案
OPENWEATHER_API_KEY=your_api_key_here
```

## API 端點

### 1. 根據城市名稱查詢

```
GET /api/weather/city/:city
```

**回傳範例（包含 AQI 與中文地名）：**

```json
{
    "location": "臺北市",
    "temperature": 16,
    "description": "多雲",
    "humidity": 86,
    "windSpeed": 17,
    "icon": "04n",
    "feelsLike": 16,
    "pressure": 1023,
    "visibility": 10,
    "timestamp": "2026-01-31T09:54:06.423Z",
    "airQuality": {
        "aqi": 2,
        "description": "普通",
        "components": {
            "co": 213.86,
            "no": 0.01,
            "no2": 16.07,
            "o3": 71.37,
            "so2": 21.33,
            "pm2_5": 7.99,
            "pm10": 12.34,
            "nh3": 0.3
        }
    }
}
```

### 2. 根據經緯度查詢

```
GET /api/weather/coordinates?lat={latitude}&lon={longitude}
```

## AQI 參考指標

| AQI | 描述                        | 顏色 |
| :-- | :-------------------------- | :--- |
| 1   | 優良 (Good)                 | 綠色 |
| 2   | 普通 (Fair)                 | 黃色 |
| 3   | 對敏感族群不健康 (Moderate) | 橘色 |
| 4   | 對所有族群不健康 (Poor)     | 紅色 |
| 5   | 非常不健康 (Very Poor)      | 紫色 |

## 檔案結構

```
server/
├── src/
│   ├── services/
│   │   └── weather.service.ts      # 天氣、AQI 與 Geocoding 服務邏輯
│   ├── controllers/
│   │   └── weather.controller.ts   # 控制器
│   └── routes/
│       └── weather.route.ts        # 路由

client/
├── src/
│   └── pages/
│       └── WeatherChecker.tsx      # 前端 UI 元件
```
