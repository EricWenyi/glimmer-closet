'use client';

import { useEffect, useState } from 'react';
import { type WeatherData, type WeatherCondition, fetchWeather } from '@/lib/api';

const conditionLabel: Record<WeatherCondition, string> = {
  sunny: '☀️ 晴天',
  cloudy: '⛅ 多云',
  rainy: '🌧 有雨',
  snowy: '❄️ 下雪',
  stormy: '⛈ 雷暴',
};

type Props = {
  onWeather: (w: WeatherData) => void;
  onGeoError: () => void;
};

type BannerState = 'loading' | 'denied' | 'ready' | 'error';

export default function WeatherBanner({ onWeather, onGeoError }: Props) {
  const [state, setState] = useState<BannerState>('loading');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState('denied');
      onGeoError();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          setWeather(w);
          setState('ready');
          onWeather(w);
        } catch {
          setState('error');
        }
      },
      () => {
        setState('denied');
        onGeoError();
      },
      { timeout: 8000 },
    );
  }, [onWeather, onGeoError]);

  if (state === 'loading') {
    return <div className="weather-banner weather-loading">获取天气中...</div>;
  }

  if (state === 'denied' || state === 'error') {
    return (
      <div className="weather-banner weather-denied">
        📍 无法获取位置，请允许位置权限后刷新页面
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="weather-banner weather-ready">
      <span className="weather-condition">{conditionLabel[weather.condition]}</span>
      <span className="weather-temp">{weather.temperature}°C</span>
    </div>
  );
}
