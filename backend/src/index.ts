import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { pool } from './db.js';
import { makeClothCode } from './codes.js';
import { uploadImage, getLocalUploadDir, ensureLocalUploadDir } from './storage.js';
import {
  listClothesQuerySchema,
  parseColors,
  parseOccasions,
  parseSeasons,
  patchClothSchema,
  uploadClothSchema,
} from './validation.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const port = Number(process.env.PORT || 4000);
const adminToken = process.env.ADMIN_TOKEN;
const webOrigin = process.env.WEB_ORIGIN;

if (!adminToken) {
  throw new Error('ADMIN_TOKEN is required');
}

app.use(
  cors({
    origin: webOrigin ? [webOrigin] : true,
  }),
);
app.use(express.json({ limit: '1mb' }));

void ensureLocalUploadDir();
app.use('/uploads', express.static(path.resolve(process.cwd(), getLocalUploadDir())));

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token || token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/v1/clothes/upload', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const parsed = uploadClothSchema.parse(req.body);
    const colors = parseColors(parsed.colors);
    const seasons = parseSeasons(parsed.seasons);
    const occasions = parseOccasions(parsed.occasions);

    const { storageUrl, storageKey } = await uploadImage({
      data: req.file.buffer,
      mimeType: req.file.mimetype,
      fileNameHint: req.file.originalname,
    });

    const clothId = randomUUID();
    const clothCode = makeClothCode();

    const result = await pool.query(
      `INSERT INTO clothes (
        id, short_code, name, category, colors, seasons, occasions, description,
        image_url, storage_key, mime_type, status
      ) VALUES (
        $1, $2, $3, $4, $5::text[], $6::text[], $7::text[], $8, $9, $10, $11, $12
      ) RETURNING short_code, name, category, colors, seasons, occasions, description, image_url, status, created_at, updated_at`,
      [
        clothId,
        clothCode,
        parsed.name,
        parsed.category,
        colors,
        seasons,
        occasions,
        parsed.description ?? null,
        storageUrl,
        storageKey,
        req.file.mimetype,
        parsed.status,
      ],
    );

    return res.status(201).json({ ok: true, cloth: toApiCloth(result.rows[0]) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return res.status(400).json({ error: message });
  }
});

app.get('/v1/clothes', async (req, res) => {
  try {
    const parsed = listClothesQuerySchema.parse({
      category: req.query.category,
      colors: parseQueryArray(req.query.colors),
      seasons: parseQueryArray(req.query.seasons),
      occasions: parseQueryArray(req.query.occasions),
      status: req.query.status,
      q: req.query.q,
      limit: req.query.limit,
      offset: req.query.offset,
    });

    const where: string[] = [];
    const values: unknown[] = [];
    const push = (value: unknown): string => {
      values.push(value);
      return `$${values.length}`;
    };

    if (parsed.category) {
      where.push(`category = ${push(parsed.category)}`);
    }

    if (parsed.colors && parsed.colors.length > 0) {
      where.push(`colors && ${push(parsed.colors)}::text[]`);
    }

    if (parsed.seasons && parsed.seasons.length > 0) {
      where.push(`seasons && ${push(parsed.seasons)}::text[]`);
    }

    if (parsed.occasions && parsed.occasions.length > 0) {
      where.push(`occasions && ${push(parsed.occasions)}::text[]`);
    }

    if (!parsed.status || parsed.status !== 'all') {
      where.push(`status = ${push(parsed.status ?? 'published')}`);
    }

    if (parsed.q) {
      const token = `%${parsed.q}%`;
      const p1 = push(token);
      const p2 = push(token);
      where.push(`(name ILIKE ${p1} OR COALESCE(description, '') ILIKE ${p2})`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const limitParam = push(parsed.limit);
    const offsetParam = push(parsed.offset);

    const result = await pool.query(
      `SELECT short_code, name, category, colors, seasons, occasions, description, image_url, status, created_at, updated_at
       FROM clothes
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      values,
    );

    return res.json({
      items: result.rows.map((row) => toApiCloth(row)),
      pagination: {
        limit: parsed.limit,
        offset: parsed.offset,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch clothes';
    return res.status(400).json({ error: message });
  }
});

app.patch('/v1/clothes/:shortCode', requireAdmin, async (req, res) => {
  try {
    const shortCode = String(req.params.shortCode || '').trim().toUpperCase();
    if (!/^C-[A-Z0-9]{6}$/.test(shortCode)) {
      return res.status(400).json({ error: 'Invalid cloth short code' });
    }

    const parsed = patchClothSchema.parse(req.body);

    const updates: string[] = [];
    const values: unknown[] = [];

    const pushUpdate = (column: string, value: unknown) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (parsed.name) pushUpdate('name', parsed.name);
    if (parsed.category) pushUpdate('category', parsed.category);
    if (parsed.colors) pushUpdate('colors', parsed.colors);
    if (parsed.seasons) pushUpdate('seasons', parsed.seasons);
    if (parsed.occasions) pushUpdate('occasions', parsed.occasions);
    if (Object.prototype.hasOwnProperty.call(parsed, 'description')) pushUpdate('description', parsed.description ?? null);
    if (parsed.status) pushUpdate('status', parsed.status);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(shortCode);

    const result = await pool.query(
      `UPDATE clothes
       SET ${updates.join(', ')}
       WHERE short_code = $${values.length}
       RETURNING short_code, name, category, colors, seasons, occasions, description, image_url, status, created_at, updated_at`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cloth not found' });
    }

    return res.json({ ok: true, cloth: toApiCloth(result.rows[0]) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to patch cloth';
    return res.status(400).json({ error: message });
  }
});

app.delete('/v1/clothes/:shortCode', requireAdmin, async (req, res) => {
  try {
    const shortCode = String(req.params.shortCode || '').trim().toUpperCase();
    if (!/^C-[A-Z0-9]{6}$/.test(shortCode)) {
      return res.status(400).json({ error: 'Invalid cloth short code' });
    }

    const result = await pool.query(
      `UPDATE clothes
       SET status = 'archived'
       WHERE short_code = $1
       RETURNING short_code, name, category, colors, seasons, occasions, description, image_url, status, created_at, updated_at`,
      [shortCode],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cloth not found' });
    }

    return res.json({ ok: true, cloth: toApiCloth(result.rows[0]) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete cloth';
    return res.status(400).json({ error: message });
  }
});

type ClothRow = {
  short_code: string;
  name: string;
  category: string;
  colors: string[];
  seasons: string[];
  occasions: string[];
  description: string | null;
  image_url: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function toApiCloth(row: ClothRow) {
  return {
    shortCode: row.short_code,
    name: row.name,
    category: row.category,
    colors: row.colors,
    seasons: row.seasons,
    occasions: row.occasions,
    description: row.description,
    imageUrl: row.image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseQueryArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}

app.listen(port, () => {
  console.log(`closet-api listening on :${port}`);
});
