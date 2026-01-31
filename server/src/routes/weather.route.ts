import express from 'express';
import { getWeatherByCity, getWeatherByCoordinates, searchLocations } from '../controllers/weather.controller.js';

const router = express.Router();

// 搜尋地點
router.get('/search', searchLocations);

// 根據城市名稱查詢天氣
router.get('/city/:city', getWeatherByCity);

// 根據經緯度查詢天氣
router.get('/coordinates', getWeatherByCoordinates);

export default router;
