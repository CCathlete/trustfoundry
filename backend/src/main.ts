import * as dotenv from 'dotenv';
import express, { Request, Response, Router } from 'express';
import cors from 'cors';

// Import necessary internal types and concrete implementations
import { IMinioConfig, IFileValidator } from './declarations/typesAndInterfaces';
import { MinIOStorage, IStorageService } from './storage/lakehouse';
import { MimeTypeValidator } from './validation/fileValidator';

// Import the router factory function
import { createRouter } from './router/httpRouter';

dotenv.config();

const PORT = process.env.SERVER_PORT || 1020;

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

    if (!endpoint || !accessKey || !secretKey || !bucketName || !portStr) {
        throw new Error(
            "Configuration Error: Missing required MinIO environment variables. " +
            "Ensure MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET_NAME are set."
        );
    }

    const port = parseInt(portStr, 10);
    if (isNaN(port)) {
        throw new Error(`Configuration Error: MINIO_PORT environment variable is not a valid number: ${portStr}`);
    }

    const useSSL = useSslStr ? useSslStr.toLowerCase() === 'true' : false;

    return {
        endpoint,
        port,
        accessKey,
        secretKey,
        bucketName,
        useSSL,
    };
}


/**
 * The main application bootstrap function.
 * This is the application's single entry point, responsible for:
 * 1. Initializing all services.
 * 2. Wiring up the dependencies into the router.
 * 3. Starting the Express server.
 */
async function bootstrapAndRun() {
    console.log("--- Data Lake Ingestion Service Initializing ---");

    // --- 1. CONFIGURATION AND SERVICE INITIALIZATION ---
    let minioConfig: IMinioConfig;
    try {
        minioConfig = loadMinioConfig();
        console.log("Configuration loaded successfully from environment.");
    } catch (error) {
        if (error instanceof Error) {
            console.error(`\nInitialization Failed: ${error.message}`);
            return;
        }
        console.error("\nAn unknown error occurred during configuration loading.");
        return;
    }

    // Initialize concrete service instances (Composition Root)
    const fileValidator: IFileValidator = new MimeTypeValidator();
    console.log("File Validator initialized.");

    const storageService: IStorageService = new MinIOStorage(minioConfig);
    console.log("MinIO Storage Service initialized.");

    const servicesReady = !!fileValidator && !!storageService;

    // --- 2. EXPRESS APPLICATION SETUP ---
    const app = express();
    let mainRouter: Router | null = null;

    if (servicesReady) {
        // Inject the initialized services into the router factory
        mainRouter = createRouter(fileValidator, storageService);
        console.log("Router initialized with injected dependencies.");
    }

    // Middleware Setup
    app.use(cors({
        origin: '*',
        methods: 'GET,POST',
        allowedHeaders: 'Content-Type,Authorization',
    }));
    app.use(express.json());

    // --- 3. ROUTE WIRING AND FALLBACKS ---
    if (mainRouter) {
        // The main router is mounted at the root path '/'.
        app.use('/', mainRouter);
    } else {
        // Fallback route if dependencies failed to initialize
        app.use('*', (req, res) => {
            res.status(503).json({
                status: 'error',
                message: 'Server starting up. Core services are unavailable.',
            });
        });
    }

    // Health check route
    app.get('/health', (req: Request, res: Response) => {
        res.status(200).json({
            status: servicesReady ? 'ok' : 'pending',
            message: servicesReady ? 'Server and core services are running.' : 'Services initializing.',
        });
    });

    // --- 4. START SERVER ---
    app.listen(PORT, () => {
        console.log(`\nExpress server running on port ${PORT}`);
        console.log(`API Endpoint: http://localhost:${PORT}/upload`);
    });
}

// Execute the main function
bootstrapAndRun();