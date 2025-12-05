import { Router, Request, Response } from 'express';
import multer from 'multer';

// Import shared types and interfaces for explicit typing
import { IFileValidator } from '../declarations/typesAndInterfaces';
import { IStorageService } from '../storage/lakehouse';

// Define the maximum number of files to accept in a single request.
const MAX_FILES_PER_REQUEST = 50;

// --- Multer Configuration ---
// Memory storage is used to get the file buffer for MinIO and validation
const storageConfig = multer.memoryStorage();
const upload = multer({
    storage: storageConfig,
    limits: {
        // 10 MB limit (must be consistent with the frontend)
        fileSize: 10 * 1024 * 1024
    },
    // We disable the file filter here and use the batch validator (validator.isOkToUpload) 
    // inside the route handler for more robust error control.
}).array('files', MAX_FILES_PER_REQUEST);


/**
 * Factory function to create and configure the application router.
 * Dependencies (IFileValidator, IStorageService) are injected here.
 * @param validator The service responsible for file validation.
 * @param storage The service responsible for file persistence.
 * @returns An Express Router instance.
 */
export function createRouter(validator: IFileValidator, storage: IStorageService): Router {
    const router = Router();

    /**
     * POST /upload
     * Endpoint to handle file ingestion into the data lake's Bronze layer.
     */
    router.post('/upload', (req: Request, res: Response) => {
        // 1. Process files using Multer middleware
        upload(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    status: 'error',
                    message: `Upload failed due to processing error: ${err.message}`,
                    code: err.code
                });
            }

            if (err) {
                return res.status(400).json({
                    status: 'error',
                    message: err.message || 'Unknown file processing error.'
                });
            }

            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({ status: 'error', message: 'No files uploaded.' });
            }

            // 2. Perform Batch Validation using injected IFileValidator
            try {
                validator.isOkToUpload(files);
            } catch (validationError) {
                console.error('[Router] File Validation Error:', validationError);
                return res.status(400).json({
                    status: 'error',
                    message: validationError instanceof Error ? validationError.message : 'Files failed security validation.'
                });
            }

            console.log(`[Router] Received ${files.length} files. Starting persistence...`);

            // 3. Persist files to MinIO using injected IStorageService
            try {
                const uploadPromises = files.map(file => {
                    return storage.storeFile(file);
                });

                await Promise.all(uploadPromises);

                console.log(`[Router] Successfully persisted ${files.length} files to MinIO.`);

                // 4. Respond to the client
                const fileNames = files.map(f => f.originalname).join(', ');
                return res.status(200).json({
                    status: 'success',
                    message: `Successfully processed and stored ${files.length} files: ${fileNames}`
                });

            } catch (storageError) {
                console.error('[Router] Storage Error:', storageError);
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to store files in the data lake.'
                });
            }
        });
    });


    /**
     * GET /status
     * Example of a future endpoint.
     */
    router.get('/status', (req: Request, res: Response) => {
        res.status(200).json({ status: 'ok', message: 'Data lake router is active.' });
    });

    return router;
}    