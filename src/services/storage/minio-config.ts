import { Client } from 'minio';

// Initialize MinIO client
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Default bucket name
export const defaultBucket = process.env.MINIO_BUCKET || 'uploads';

// Base URL for public access
export const publicBaseUrl =
  process.env.MINIO_PUBLIC_URL ||
  `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}/${defaultBucket}`;

// Initialize bucket if it doesn't exist
export const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(defaultBucket);

    if (!bucketExists) {
      await minioClient.makeBucket(defaultBucket, 'us-east-1');
      console.log(`Created bucket '${defaultBucket}'`);

      // Set the bucket policy to public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${defaultBucket}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(defaultBucket, JSON.stringify(policy));
      console.log(`Set bucket '${defaultBucket}' policy to public read`);
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
    throw error;
  }
};
