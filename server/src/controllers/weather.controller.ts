import { Request, Response } from 'express';
import weatherService from '../services/weather.service.js';

/**
 * 搜尋地點
 */
export const searchLocations = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                error: 'INVALID_REQUEST',
                message: '請提供搜尋關鍵字',
            });
        }

        const locations = await weatherService.searchLocations(q as string);

        // 檢查是否為錯誤回應
        if ('error' in locations) {
            return res.status(500).json(locations);
        }

        return res.status(200).json(locations);
    } catch (error) {
        console.error('搜尋控制器錯誤:', error);
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: '伺服器錯誤，請稍後再試',
        });
    }
};

/**
 * 根據城市名稱查詢天氣
 */
export const getWeatherByCity = async (req: Request, res: Response) => {
    try {
        const { city } = req.params;

        if (!city) {
            return res.status(400).json({
                error: 'INVALID_REQUEST',
                message: '請提供城市名稱',
            });
        }

        const weatherData = await weatherService.getWeatherByCity(city);

        // 檢查是否為錯誤回應
        if ('error' in weatherData) {
            const statusCode = weatherData.error === 'CITY_NOT_FOUND' ? 404 : 500;
            return res.status(statusCode).json(weatherData);
        }

        return res.status(200).json(weatherData);
    } catch (error) {
        console.error('天氣控制器錯誤:', error);
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: '伺服器錯誤，請稍後再試',
        });
    }
};

/**
 * 根據經緯度查詢天氣
 */
export const getWeatherByCoordinates = async (req: Request, res: Response) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                error: 'INVALID_REQUEST',
                message: '請提供經緯度座標',
            });
        }

        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lon as string);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                error: 'INVALID_COORDINATES',
                message: '經緯度格式不正確',
            });
        }

        const weatherData = await weatherService.getWeatherByCoordinates(latitude, longitude);

        // 檢查是否為錯誤回應
        if ('error' in weatherData) {
            return res.status(500).json(weatherData);
        }

        return res.status(200).json(weatherData);
    } catch (error) {
        console.error('天氣控制器錯誤:', error);
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: '伺服器錯誤，請稍後再試',
        });
    }
};
