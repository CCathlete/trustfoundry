import { File, IMinioConfig } from '../declarations/typesAndInterfaces.js';

export interface IStorageService {
    storeFile(file: File): Promise<string>;
}

export class MinIOStorage implements IStorageService {
    private readonly minioClient: import('minio').Client;
    private readonly bucketName: string;

    private constructor(client: import('minio').Client, bucketName: string) {
        this.minioClient = client;
        this.bucketName = bucketName;
    }

    static async initialize(cfg: IMinioConfig): Promise<MinIOStorage> {
        const { Client } = await import('minio');

        const client = new Client({
            endPoint: cfg.endpoint,
            port: cfg.port,
            useSSL: cfg.useSSL ?? false,
            accessKey: cfg.accessKey,
            secretKey: cfg.secretKey
        });

        const instance = new MinIOStorage(client, cfg.bucketName);
        await instance.ensureBucketExists();
        return instance;
    }

    private async ensureBucketExists(): Promise<void> {
        const exists = await this.minioClient.bucketExists(this.bucketName);
        if (!exists) {
            await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        }
    }

    async storeFile(file: File): Promise<string> {
        const objectName = `${Date.now()}-${file.originalname}`;
        await this.minioClient.putObject(
            this.bucketName,
            objectName,
            file.buffer,
            file.size
        );
        return objectName;
    }
}
