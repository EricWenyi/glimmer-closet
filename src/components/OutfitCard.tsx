import Image from 'next/image';
import type { Cloth, OutfitRecommendation } from '@/lib/api';

type Props = {
  outfit: OutfitRecommendation;
  clothMap: Map<string, Cloth>; // shortCode → Cloth
  selected: boolean;
  onSelect: () => void;
};

export default function OutfitCard({ outfit, clothMap, selected, onSelect }: Props) {
  const resolvedItems = outfit.items
    .map((item) => ({ ...item, cloth: clothMap.get(item.shortCode) }))
    .filter((item): item is typeof item & { cloth: Cloth } => item.cloth !== undefined);

  return (
    <article
      className={`outfit-card ${selected ? 'outfit-card--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="outfit-thumbs">
        {resolvedItems.slice(0, 3).map((item) => (
          <div key={item.shortCode} className="outfit-thumb-wrap">
            <Image
              src={item.cloth.imageUrl}
              alt={item.cloth.name}
              fill
              className="outfit-thumb-img"
              unoptimized
              sizes="80px"
            />
          </div>
        ))}
        {resolvedItems.length === 0 && (
          <div className="outfit-thumb-empty">👗</div>
        )}
      </div>
      <p className="outfit-label">{outfit.label}</p>
      {selected && <div className="outfit-selected-badge">✓ 今日穿搭</div>}
    </article>
  );
}
