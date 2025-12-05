// validation_schemas.ts

import { z } from 'zod';

/**
 * List of file extensions (mime types) that are strictly forbidden.
 */
const FORBIDDEN_MIME_TYPES = [
    'application/x-msdownload',              // .exe, .dll
    'application/x-sh',                      // .sh
    'application/x-elf',                     // ELF executables
    'text/html',                             // Potential for malicious script injection
    'application/vnd.microsoft.portable-executable'
];



// --- Base Schema for a File Object ---

/**
 * Defines the expected properties for a standard File object.
 */
const FileSchema = z.object({
    name: z.string().min(1),
    size: z.number().nonnegative(),
    type: z.string().min(1),
});

/**
 * Defines the TypeScript type inferred from the base Zod schema.
 */
type ValidatedFileType = z.infer<typeof FileSchema>;


// --- Forbidden File Validation Schema Factory ---

/**
 * Creates the validation schema, allowing the max size to be dynamically set.
 * @param maxSizeInBytes The maximum size allowed for a file.
 */
const createForbiddenFileSchema = (maxSizeInBytes: number) => {

    const maxSizeInMB = maxSizeInBytes / (1024 * 1024);

    return FileSchema
        .refine(
            (file) => file.size <= maxSizeInBytes,
            {
                // Use the calculated MB value in the message
                message: `File size must be less than ${maxSizeInMB} MB. (Max ${maxSizeInMB} MB)`,
                path: ['size'],
            }
        )
        .refine(
            // file is of type FileValidationType here
            (file) => !FORBIDDEN_MIME_TYPES.includes(file.type.toLowerCase()),
            {
                message: 'Forbidden file type detected.',
                path: ['type'],
            }
        );
};

// In case we would want to reconfigure the size limit.
const ForbiddenFileSchema = createForbiddenFileSchema(10 * 1024 * 1024)


// --- Exports ---
export {
    FORBIDDEN_MIME_TYPES,
    ForbiddenFileSchema,
    type ValidatedFileType
};