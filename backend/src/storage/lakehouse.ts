import * as path from 'path';
import * as fs from 'fs';
import * as Minio from 'minio';

// --- Type Definition Import ---
// Importing shared file types from the new centralized location.
import { File, IMinioConfig } from '../declarations/typesAndInterfaces';



// --- Local Storage Setup (Retained for fallback/initial setup clarity) ---
const BRONZE_BUCKET_DIR: string = path.join(process.cwd(), 'bronze-bucket-uploads');

// Ensure the local fallback directory exists for demonstration/testing
if (!fs.existsSync(BRONZE_BUCKET_DIR)) {
    fs.mkdirSync(BRONZE_BUCKET_DIR, { recursive: true });
    console.log(`[Storage]: Created local fallback directory: ${BRONZE_BUCKET_DIR}`);
}

/**
 * Interface for the Bronze Storage layer.
 * This abstraction allows you to easily switch between local disk, S3, GCS, etc.,
 * without changing the FileReceiver logic.
 */
export interface IStorageService {
    /**
     * Stores a file and returns its unique identifier/path.
     * @param file The file object provided by the upload middleware (Multer).
     * @returns A Promise resolving to the final file name in storage.
     */
    storeFile(file: File): Promise<string>;
}

/**
 * MinIO implementation of the Bronze Storage Service.
 * This class connects to the MinIO instance and uploads the file buffer.
 */
export class MinIOStorage implements IStorageService {

    private minioConfig: IMinioConfig;
    private minioClient: Minio.Client;

    constructor(minioConfig: IMinioConfig) {
        this.minioConfig = minioConfig;

        // 1. Initialize the MinIO Client using the configuration retrieved from .env
        this.minioClient = new Minio.Client({
            endPoint: minioConfig.endpoint,
            port: minioConfig.port,
            useSSL: minioConfig.useSSL || false, // Default to false if not specified
            accessKey: minioConfig.accessKey,
            secretKey: minioConfig.secretKey
        });

        console.log(`[Storage]: MinIO Bronze Storage initialized for Bucket: ${this.minioConfig.bucketName}`);
        console.log(`[Storage]: MinIO Endpoint: ${this.minioConfig.endpoint}:${this.minioConfig.port}`);

        // Optionally, check if the bucket exists and create it if it doesn't
        this.ensureBucketExists(minioConfig.bucketName).catch(error => {
            console.error('[MinIO Init Error]: Failed to ensure bucket existence:', error.message);
            // In a production environment, you might want to stop the server here
        });
    }

    /**
     * Helper function to check and create the bucket if necessary.
     */
    private async ensureBucketExists(bucketName: string): Promise<void> {
        const exists = await this.minioClient.bucketExists(bucketName);
        if (!exists) {
            console.log(`[MinIO]: Bucket '${bucketName}' not found. Creating bucket...`);
            await this.minioClient.makeBucket(bucketName, 'us-east-1'); // Region is often required
            console.log(`[MinIO]: Bucket '${bucketName}' created successfully.`);
        } else {
            console.log(`[MinIO]: Bucket '${bucketName}' already exists.`);
        }
    }


    /**
     * Uploads the file buffer directly to the configured MinIO bucket.
     * @param file The file object containing buffer data (from Multer's memoryStorage).
     * @returns The final object name (filename) used in the bucket.
     */
    async storeFile(file: File): Promise<string> {
        // Generate a unique object name (filename in the bucket)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const objectName = uniqueSuffix + '-' + file.originalname;

        // Ensure the file has a buffer property 
        const fileBuffer: Buffer = file.buffer;

        if (!fileBuffer) {
            throw new Error('File buffer is missing. Check Multer memory storage configuration.');
        }

        try {
            // 2. Use minioClient.putObject to stream/upload the buffer
            console.log(`[MinIO]: Uploading ${file.originalname} as ${objectName} to bucket ${this.minioConfig.bucketName}...`);

            // The putObject method handles buffer uploads
            await this.minioClient.putObject(
                this.minioConfig.bucketName,
                objectName,
                fileBuffer,
                file.size, // Size is required for progress/validation
                { 'Content-Type': file.mimetype } // Optional: set content type metadata
            );

            console.log(`[MinIO]: Successfully uploaded object ${objectName}.`);
            return objectName;

        } catch (error) {
            console.error(`[Storage Error]: Failed to upload file ${objectName} to MinIO.`, error);
            // Re-throw a generic error to be caught by the router's error handler
            throw new Error('Failed to save file to MinIO storage.');
        }
    }
}