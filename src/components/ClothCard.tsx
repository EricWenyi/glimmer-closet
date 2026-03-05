import Image from 'next/image';
import type { Cloth } from '@/lib/api';

type ClothCardProps = {
  cloth: Cloth;
  categoryLabel: string;
  colorLabels: string[];
  seasonLabels: string[];
  occasionLabels: string[];
};

// 颜色映射表
const colorMap: Record<string, string> = {
  '黑': '#2d2d2d',
  '白': '#f8f8f8',
  '灰': '#9a9a9a',
  '红': '#c97b7b',
  '蓝': '#7b9ac9',
  '绿': '#8fb89a',
  '黄': '#e6d29a',
  '粉': '#e6b8c7',
  '紫': '#b8a8c9',
  '棕': '#a89080',
  '米色': '#e8dcc8',
  '花色': 'linear-gradient(45deg, #e6b8c7, #b8a8c9, #e6d29a)',
};

export default function ClothCard({ cloth, categoryLabel, colorLabels, seasonLabels, occasionLabels }: ClothCardProps) {
  return (
    <article className="cloth-card" data-cloth-id={cloth.shortCode}>
      <div className="cloth-image-wrap">
        <Image
          src={cloth.imageUrl}
          alt={cloth.name}
          className="cloth-image"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                background: colorMap[label] || '#f0f0f0',
                color: ['白', '米色'].includes(label) ? '#666' : '#fff',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="chip-group">
          {seasonLabels.map((label) => (
            <span key={`${cloth.shortCode}-season-${label}`} className="chip chip-season">{label}</span>
          ))}
          {occasionLabels.map((label) => (
            <span key={`${cloth.shortCode}-occasion-${label}`} className="chip chip-occasion">{label}</span>
          ))}
        </div>

        {cloth.description && <p className="cloth-description">{cloth.description}</p>}
      </div>
    </article>
  );
}
