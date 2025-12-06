
// --- Type Definition Import ---
import { File, IMinioConfig } from '../declarations/typesAndInterfaces.js';


/**
 * Interface for the Bronze Storage layer.
 * This abstraction allows you to easily switch between storage providers (S3, GCS, etc.),
 * without changing the application's core logic.
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
    private minioClient!: import('minio').Client; // note the definite assignment
    private bucketName!: string;


    private constructor() { }

    public static async initialize(minioConfig: IMinioConfig) {
        const { Client } = await import('minio'); // dynamic import inside async function
        const instance = new MinIOStorage();
        instance.minioClient = new Client({
            endPoint: minioConfig.endpoint,
            port: minioConfig.port,
            useSSL: minioConfig.useSSL || false,
            accessKey: minioConfig.accessKey,
            secretKey: minioConfig.secretKey,
        });

        instance.bucketName = minioConfig.bucketName;

        return instance;
    }

    private async ensureBucketExists(bucketName: string) {
        const exists = await this.minioClient.bucketExists(bucketName);
        if (!exists) {
            // TODO: change.
            await this.minioClient.makeBucket(bucketName, 'us-east-1');
        }
    }

    async storeFile(file: File) {

        await this.ensureBucketExists(this.bucketName);
        const objectName = Date.now() + '-' + file.originalname;
        await this.minioClient.putObject(this.bucketName, objectName, file.buffer, file.size);
        return objectName;
    }
}
