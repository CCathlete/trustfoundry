import { z } from 'zod';

/**
 * List of file extensions (mime types) that are strictly forbidden.
 */
export const FORBIDDEN_MIME_TYPES = [
    'application/x-msdownload',       // .exe, .dll
    'application/x-sh',              // .sh
    'application/x-elf',             // ELF executables
    'text/html',                     // Potential for malicious script injection
    'application/vnd.microsoft.portable-executable'
];

/**
 * Maximum allowed file size in bytes (e.g., 5 MB).
 * NOTE: This limit is enforced by Zod, not the FILE_UPLOAD_LIMIT_BYTES constant in App.tsx.
 * 1 MB = 1024 * 1024 bytes
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Megabytes

// --- Base Schema for a File Object ---

/**
 * Defines the expected properties for a standard File object.
 */
export const FileSchema = z.object({
    name: z.string().min(1),
    size: z.number().nonnegative(),
    type: z.string().min(1),
});

// --- Forbidden File Validation Schema (Refined Schema) ---

/**
 * Extends the basic FileSchema with the forbidden type and size logic.
 * This is the schema you use for validation in App.tsx.
 */
export const ForbiddenFileSchema = FileSchema
    .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        {
            message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)} MB. (Max 5 MB)`,
            path: ['size'],
        }
    )
    .refine(
        (file) => !FORBIDDEN_MIME_TYPES.includes(file.type.toLowerCase()),
        {
            message: 'Forbidden file type detected.',
            path: ['type'],
        }
    );

// Exported types for type safety in other files
export type FileValidationType = z.infer<typeof FileSchema>;
export type ValidatedFileType = z.infer<typeof ForbiddenFileSchema>;