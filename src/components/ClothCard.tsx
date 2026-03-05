import Image from 'next/image';
import type { Cloth } from '@/lib/api';

type ClothCardProps = {
  cloth: Cloth;
  categoryLabel: string;
  colorLabels: string[];
  seasonLabels: string[];
  occasionLabels: string[];
};

// Apple-style color palette
const colorMap: Record<string, string> = {
  黑: '#1a1a1a',
  白: '#f2f2f7',
  灰: '#8e8e93',
  红: '#ff3b30',
  蓝: '#007aff',
  绿: '#34c759',
  黄: '#ffcc00',
  粉: '#ff2d55',
  紫: '#af52de',
  棕: '#a2845e',
  米色: '#e5d4b8',
  花色: 'linear-gradient(135deg, #ff3b30, #ffcc00, #34c759, #007aff)',
};

const colorTextMap: Record<string, string> = {
  黑: '#ffffff',
  白: '#1a1a1a',
  灰: '#ffffff',
  红: '#ffffff',
  蓝: '#ffffff',
  绿: '#ffffff',
  黄: '#1a1a1a',
  粉: '#ffffff',
  紫: '#ffffff',
  棕: '#ffffff',
  米色: '#1a1a1a',
  花色: '#ffffff',
};

export default function ClothCard({
  cloth,
  categoryLabel,
  colorLabels,
  seasonLabels,
  occasionLabels,
}: ClothCardProps) {
  return (
    <article className="cloth-card" data-cloth-id={cloth.shortCode}>
      <div className="cloth-image-wrap">
        <Image
          src={cloth.imageUrl}
          alt={cloth.name}
          className="cloth-image"
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized
        />
      </div>

      <div className="cloth-content">
        <div className="cloth-head">
          <h3>{cloth.name}</h3>
          <span className="cloth-code">{cloth.shortCode}</span>
        </div>

        <p className="cloth-category">{categoryLabel}</p>

        <div className="chip-group">
          {colorLabels.map((label) => (
            <span
              key={`${cloth.shortCode}-color-${label}`}
              className="chip chip-color"
              style={{
                background: colorMap[label] || '#f2f2f7',
                color: colorTextMap[label] || '#1a1a1a',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="chip-group">
          {seasonLabels.map((label) => (
            <span key={`${cloth.shortCode}-season-${label}`} className="chip chip-season">
              {label}
            </span>
          ))}
          {occasionLabels.map((label) => (
            <span key={`${cloth.shortCode}-occasion-${label}`} className="chip chip-occasion">
              {label}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
