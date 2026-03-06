'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type Cloth,
  type OutfitRecommendation,
  type WeatherData,
  fetchClothes,
  recommendOutfits,
} from '@/lib/api';
import WeatherBanner from './WeatherBanner';
import OutfitCard from './OutfitCard';

export default function TodaysLookTab() {
  const [geoDenied, setGeoDenied] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [wardrobe, setWardrobe] = useState<Cloth[]>([]);
  const [outfits, setOutfits] = useState<OutfitRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleWeather = useCallback((w: WeatherData) => {
    setWeather(w);
  }, []);

  const handleGeoError = useCallback(() => {
    setGeoDenied(true);
    setLoading(false);
  }, []);

  // Fetch wardrobe once on mount
  useEffect(() => {
    fetchClothes({})
      .then(setWardrobe)
      .catch(() => setWardrobe([]));
  }, []);

  // Generate recommendations when both weather and wardrobe are ready
  useEffect(() => {
    if (!weather || wardrobe.length === 0) return;

    setLoading(true);
    recommendOutfits(weather, wardrobe)
      .then((results) => {
        setOutfits(results);
        setSelectedIndex(null);
      })
      .finally(() => setLoading(false));
  }, [weather, wardrobe]);

  // Build a map for quick cloth lookup in OutfitCard
  const clothMap = new Map(wardrobe.map((c) => [c.shortCode, c]));

  return (
    <div className="today-tab">
      <WeatherBanner onWeather={handleWeather} onGeoError={handleGeoError} />

      {geoDenied && (
        <p className="state-text">开启位置权限后，我们可以根据天气为你推荐今日穿搭。</p>
      )}

      {!geoDenied && wardrobe.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">👗</div>
          <h3>衣橱还是空的</h3>
          <p>先用右下角 + 按钮上传几件衣服，就能看到今日推荐啦</p>
        </div>
      )}

      {!geoDenied && loading && wardrobe.length > 0 && (
        <div className="outfit-row">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="outfit-card outfit-skeleton">
              <div className="outfit-thumbs">
                <div className="outfit-thumb-wrap skeleton-image" />
                <div className="outfit-thumb-wrap skeleton-image" />
              </div>
              <div className="skeleton-line short" style={{ marginTop: 12 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && outfits.length > 0 && (
        <>
          <h2 className="section-heading">今日推荐穿搭</h2>
          <div className="outfit-row">
            {outfits.map((outfit, i) => (
              <OutfitCard
                key={i}
                outfit={outfit}
                clothMap={clothMap}
                selected={selectedIndex === i}
                onSelect={() => setSelectedIndex(i === selectedIndex ? null : i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
