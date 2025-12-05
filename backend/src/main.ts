// --- Application Components ---
import * as dotenv from 'dotenv';
import { MinIOStorage, IStorageService } from './storage/lakehouse';
import { MimeTypeValidator } from './validation/fileValidator';

// --- Types and Interfaces ---
import { IMinioConfig, IFileValidator } from './declarations/typesAndInterfaces';

dotenv.config(); // Load environment variables from .env

// --- Module-Level Service Exports ---
// Declare the services here. They will be initialized in bootstrapAndRun().
// Exporting these allows other files (e.g., your Express app) to import and use them.
export let storageService: IStorageService | null = null;
export let fileValidator: IFileValidator | null = null;


/**
 * Loads and validates configuration settings for the MinIO Storage Service
 * from environment variables.
 * @returns {IMinioConfig} The validated configuration object.
 * @throws {Error} If any required environment variable is missing or invalid.
 */
function loadMinioConfig(): IMinioConfig {
    const endpoint = process.env.MINIO_ENDPOINT;
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    const bucketName = process.env.MINIO_BUCKET_NAME;
    const portStr = process.env.MINIO_PORT;
    const useSslStr = process.env.MINIO_USESSL;

    // 1. Basic validation for required string variables
    if (!endpoint || !accessKey || !secretKey || !bucketName || !portStr) {
        throw new Error(
            "Configuration Error: Missing required MinIO environment variables. " +
            "Ensure MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET_NAME are set."
        );
    }

    // 2. Validate and convert port to number
    // Fix for previous warning: use non-null assertion (!) since we just checked it.
    const port = parseInt(portStr!, 10);
    if (isNaN(port)) {
        throw new Error(`Configuration Error: MINIO_PORT environment variable is not a valid number: ${portStr}`);
    }

    // 3. Convert SSL string ('true'/'false') to boolean, default to false
    const useSSL = useSslStr ? useSslStr.toLowerCase() === 'true' : false;

    return {
        // Fix for previous warning: use non-null assertion (!) since we just checked them.
        endpoint: endpoint!,
        port,
        accessKey: accessKey!,
        secretKey: secretKey!,
        bucketName: bucketName!,
        useSSL,
    };
}


/**
 * The main application bootstrap and execution function.
 * This function initializes the storage and validation services 
 * and prepares them for use by the application's consumer (e.g., an Express router).
 */
export async function bootstrapAndRun() { // Exporting the function might be useful
    console.log("--- Data Lake Ingestion Service Initializing ---");

    let minioConfig: IMinioConfig;
    try {
        // 1. Load configuration from environment variables
        minioConfig = loadMinioConfig();
        console.log("Configuration loaded successfully from environment.");
    } catch (error) {
        if (error instanceof Error) {
            console.error(`\nInitialization Failed: ${error.message}`);
            // Exit the application if configuration is invalid
            return;
        }
        console.error("\nAn unknown error occurred during configuration loading.");
        return;
    }

    // 2. Initialize Validator
    // **FIX:** Assign the newly created instance to the exported module-level variable.
    fileValidator = new MimeTypeValidator();
    console.log("File Validator initialized.");

    // 3. Initialize Storage Service with real configuration
    storageService = new MinIOStorage(minioConfig);

    // --- Readiness Check ---
    console.log("\n--- Services Initialized and Ready ---");
    console.log("The MinIOStorage service is ready to connect to the external MinIO instance.");
    console.log("The MimeTypeValidator is ready to enforce file type policy.");
    console.log("Next step: Implement an HTTP endpoint (e.g., Express) to use these services.");
}

// Execute the main function
bootstrapAndRun();