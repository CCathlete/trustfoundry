"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimeTypeValidator = void 0;
/**
 * Default list of MIME types allowed to be uploaded to the data lake (Bronze Layer).
 * This list is commonly used for documents and data files.
 */
var DEFAULT_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/json',
];
/**
 * Implements file validation focusing on checking the file's MIME type.
 * Ensures that files are of an expected and safe type.
 */
var MimeTypeValidator = /** @class */ (function () {
    /**
     * Initializes the validator with a set of allowed MIME types.
     * @param allowedTypes An array of MIME type strings (defaults to DEFAULT_ALLOWED_MIME_TYPES).
     */
    function MimeTypeValidator(allowedTypes) {
        if (allowedTypes === void 0) { allowedTypes = DEFAULT_ALLOWED_MIME_TYPES; }
        // Using a Set for O(1) average time complexity lookup, which is more efficient for checks.
        this.allowedTypes = new Set(allowedTypes);
        console.log("[Validator]: Initialized with ".concat(allowedTypes.length, " allowed MIME types."));
    }
    /**
     * Checks if all files in the array have an allowed MIME type.
     * @param files The array of File objects to validate.
     * @throws {Error} Throws an error if any file type is not allowed.
     */
    MimeTypeValidator.prototype.isOkToUpload = function (files) {
        console.log("[Validator]: Starting MIME type validation for ".concat(files.length, " files."));
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var mimeType = file.mimetype;
            if (!this.allowedTypes.has(mimeType)) {
                // Throw an error with specific details about the disallowed file
                throw new Error("Disallowed MIME type detected for file \"".concat(file.originalname, "\". ") +
                    "Type found: ".concat(mimeType, ". Allowed types: ").concat(Array.from(this.allowedTypes).join(', ')));
            }
        }
        console.log("[Validator]: All ".concat(files.length, " files passed MIME type validation."));
        // If the loop completes without throwing, validation is successful.
    };
    return MimeTypeValidator;
}());
exports.MimeTypeValidator = MimeTypeValidator;
