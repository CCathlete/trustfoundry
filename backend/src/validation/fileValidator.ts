//src/validation/fileValidator.ts
import { File, IFileValidator } from '../declarations/typesAndInterfaces.js';

/**
 * Default list of MIME types allowed to be uploaded to the data lake (Bronze Layer).
 * This list is commonly used for documents and data files.
 */
const DEFAULT_ALLOWED_MIME_TYPES: string[] = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/json',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

/**
 * Implements file validation focusing on checking the file's MIME type.
 * Ensures that files are of an expected and safe type.
 */
export class MimeTypeValidator implements IFileValidator {

    private allowedTypes: Set<string>;

    /**
     * Initializes the validator with a set of allowed MIME types.
     * @param allowedTypes An array of MIME type strings (defaults to DEFAULT_ALLOWED_MIME_TYPES).
     */
    constructor(allowedTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES) {
        // Using a Set for O(1) average time complexity lookup, which is more efficient for checks.
        this.allowedTypes = new Set(allowedTypes);
        console.log(`[Validator]: Initialized with ${allowedTypes.length} allowed MIME types.`);
    }

    /**
     * Checks if all files in the array have an allowed MIME type.
     * @param files The array of File objects to validate.
     * @throws {Error} Throws an error if any file type is not allowed.
     */
    public isOkToUpload(files: File[]): void {
        console.log(`[Validator]: Starting MIME type validation for ${files.length} files.`);

        for (const file of files) {
            const mimeType = file.mimetype;

            if (!this.allowedTypes.has(mimeType)) {
                // Throw an error with specific details about the disallowed file
                throw new Error(
                    `Disallowed MIME type detected for file "${file.originalname}". ` +
                    `Type found: ${mimeType}. Allowed types: ${Array.from(this.allowedTypes).join(', ')}`
                );
            }
        }

        console.log(`[Validator]: All ${files.length} files passed MIME type validation.`);
        // If the loop completes without throwing, validation is successful.
    }
}