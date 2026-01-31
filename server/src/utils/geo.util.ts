/**
 * 地理位置工具函式庫
 */

/**
 * 計算兩點經緯度之間的距離 (Haversine formula)
 * @param lat1 第一點緯度
 * @param lon1 第一點經度
 * @param lat2 第二點緯度
 * @param lon2 第二點經度
 * @returns 距離 (公里)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半徑 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * 判斷座標是否在台灣本島及離島大致範圍內
 * 粗略範圍：緯度 21.5 - 26.5, 經度 118.0 - 122.5 (包含金馬澎)
 */
export function isLocationInTaiwan(lat: number, lon: number): boolean {
    return lat >= 21.5 && lat <= 26.5 && lon >= 118.0 && lon <= 122.5;
}
