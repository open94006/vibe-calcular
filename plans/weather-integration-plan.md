# 天氣服務整合計畫 (CWA & MOENV)

本計畫旨在將中央氣象署 (CWA) 與環境部 (MOENV) 的開放資料整合至現有的天氣查詢服務中，以提供台灣使用者更精確的在地化資訊。

## 1. 架構設計

### 現有架構

- `WeatherService` 直接呼叫 OpenWeatherMap API。
- 介面：`getWeatherByCity`, `getWeatherByCoordinates`。

### 新架構

- **WeatherService** (Facade): 作為統一入口，負責判斷地點並分派請求。
    - 若地點在台灣且有 API Key -> 呼叫 `TaiwanWeatherService` (新模組)。
    - 若地點在國外或無 API Key -> 呼叫 `OpenWeatherMapService` (原邏輯)。
- **TaiwanWeatherService**:
    - 負責協調 CWA 與 MOENV 的資料獲取。
    - 實作「尋找最近測站」邏輯。
- **CwaService**: 專責處理 CWA API (天氣觀測)。
- **MoenvService**: 專責處理 MOENV API (空氣品質)。

## 2. 資料來源細節

### 中央氣象署 (CWA)

- **API**: `O-A0003-001` (局屬氣象站-現在天氣觀測報告) 或 `O-A0001-001` (自動氣象站-氣象觀測資料)。
- **策略**:
    - 由於 API 回傳全台資料，需實作快取 (Cache) 機制，避免頻繁請求。
    - 根據使用者經緯度，計算距離最近的測站 (Haversine Formula)。
    - 取用資料：溫度、濕度、風速、降雨量等。

### 環境部 (MOENV)

- **API**: `AQX_P_432` (空氣品質指標(AQI) - 全台測站)。
- **策略**:
    - 同樣回傳全台資料，需快取。
    - 根據經緯度找最近測站。
    - 取用資料：AQI, PM2.5, PM10, O3 等。

## 3. 實作步驟

### Step 1: 環境變數與設定

- 更新 `.env` 支援 `CWA_API_KEY`, `MOENV_API_KEY`。

### Step 2: 建立基礎工具

- 實作 `GeoUtils.calculateDistance(lat1, lon1, lat2, lon2)` 用於計算距離。

### Step 3: 實作 CwaService

- 方法：`getObservations()` (含 Cache)。
- 方法：`getNearestObservation(lat, lon)`。
- 資料轉換：將 CWA 格式轉為內部 `WeatherData` 格式。

### Step 4: 實作 MoenvService

- 方法：`getAqiData()` (含 Cache)。
- 方法：`getNearestAqi(lat, lon)`。
- 資料轉換：將 MOENV 格式轉為內部 `AirQuality` 格式。

### Step 5: 整合至 WeatherService

- 修改 `WeatherService`。
- 加入判斷邏輯：`isLocationInTaiwan(lat, lon)`。
- 整合資料流：
    ```typescript
    if (isTaiwan) {
        const weather = await cwaService.getNearestObservation(lat, lon);
        const aqi = await moenvService.getNearestAqi(lat, lon);
        return mergeData(weather, aqi);
    } else {
        return openWeatherMapService.getWeather(...);
    }
    ```

### Step 6: 前端微調

- 在 UI 上標示資料來源 (例如：「資料來源：中央氣象署、環境部」)。

## 4. 錯誤處理與 Fallback

- 若 CWA API 請求失敗，自動降級使用 OpenWeatherMap。
- 若 MOENV API 請求失敗，嘗試使用 OpenWeatherMap 空污資料或隱藏 AQI。
