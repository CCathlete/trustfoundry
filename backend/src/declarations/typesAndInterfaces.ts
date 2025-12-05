// --- Custom Type Definition for Multer File ---
/**
 * Interface representing the file object provided by Multer's memory storage.
 * This is defined manually and centrally to ensure consistent typing across the application
 * and avoid conflicts with external type libraries (like @types/multer or @types/express).
 */
export interface IMulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer; // Key property when using memory storage
}

/**
 * Type alias for the uploaded file object, simplifying usage across the codebase.
 */
export type File = IMulterFile;

export interface IFileValidator {
    /**
     * Executes the validation logic against a list of files.
     * @param files The array of File objects to validate.
     * @throws {Error} Throws an error if validation fails.
     */
    isOkToUpload(files: File[]): void;
}
