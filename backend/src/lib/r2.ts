import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from './logger';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'hdb-interior-design';

let r2: S3Client | null = null;

if (accountId && accessKeyId && secretAccessKey) {
  r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  logger.info('R2 client initialized');
} else {
  logger.warn('R2 credentials not fully set — upload features will be stubbed');
}

export function getR2Client(): S3Client {
  if (!r2) {
    throw new Error('R2 client not initialized. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
  }
  return r2;
}

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'model/vnd.collada+xml',   // .dae
  'model/obj',                 // .obj
  'model/gltf-binary',        // .glb
];

const MAX_FILE_SIZES: Record<string, number> = {
  'floor-plan': 50 * 1024 * 1024,      // 50 MB
  'model-import': 50 * 1024 * 1024,    // 50 MB
  'furniture-model': 10 * 1024 * 1024, // 10 MB
  texture: 20 * 1024 * 1024,           // 20 MB
};

export function validateUploadRequest(mimeType: string, category: string): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `Unsupported MIME type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  const maxSize = MAX_FILE_SIZES[category];
  if (!maxSize) {
    return { valid: false, error: `Unknown upload category: ${category}` };
  }

  return { valid: true };
}

export async function generateUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 900 }); // 15 minutes
}

export async function generateDownloadUrl(
  key: string,
  expiresIn = 900
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export { bucketName };
