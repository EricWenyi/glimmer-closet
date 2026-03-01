import Image from 'next/image';
import type { Cloth } from '@/lib/api';

type ClothCardProps = {
  cloth: Cloth;
  categoryLabel: string;
  colorLabels: string[];
  seasonLabels: string[];
  occasionLabels: string[];
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
          sizes="(max-width: 700px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
            <span key={`${cloth.shortCode}-color-${label}`} className="chip chip-color">{label}</span>
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
