// mockStorage.ts

import { File, IMinioConfig } from '../declarations/typesAndInterfaces.js';
import { IStorageService } from './lakehouse.js';

/**
 * A mock implementation of IStorageService for testing or debugging 
 * application flow without connecting to MinIO.
 */
export class MockStorage implements IStorageService {
    private isInitialized: boolean = false;
    private readonly mockBucketName: string;

    private constructor(bucketName: string) {
        this.mockBucketName = bucketName;
        console.log(`[Mock] Storage Service created for bucket: ${this.mockBucketName}`);
    }

    /**
     * Mocks the asynchronous initialization process.
     * It simulates configuration loading and a successful connection check, 
     * but does not throw errors.
     * @param cfg - The MinIO configuration (not actually used).
     * @returns A promise that resolves to a MockStorage instance.
     */
    static async initialize(cfg: IMinioConfig): Promise<MockStorage> {
        console.log(`[Mock] Initializing storage with config for endpoint: ${cfg.endpoint}`);

        // Simulate an asynchronous operation delay
        await new Promise(resolve => setTimeout(resolve, 50));

        const instance = new MockStorage(cfg.bucketName);
        instance.isInitialized = true;

        console.log(`[Mock] Storage Service successfully initialized.`);
        return instance;
    }

    /**
     * Mocks storing a file.
     * It simulates file operations and generates a mock object name.
     * @param file - The file object to "store".
     * @returns A promise that resolves to the generated object name.
     */
    async storeFile(file: File): Promise<string> {
        if (!this.isInitialized) {
            // Throwing an error here simulates a potential runtime state issue
            throw new Error("[Mock] Attempted to use uninitialized storage service.");
        }

        // Simulate a unique object name based on time and original name
        const objectName = `mock-${Date.now()}-${file.originalname.replace(/[^a-z0-9.]/gi, '_')}`;

        console.log(`[Mock] Storing file: ${file.originalname} (${file.size} bytes) as ${objectName}`);

        // Simulate network delay for putObject
        await new Promise(resolve => setTimeout(resolve, 20));

        return objectName;
    }
}