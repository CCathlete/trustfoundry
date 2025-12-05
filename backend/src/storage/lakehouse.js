"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinIOStorage = void 0;
var Minio = require("minio");
/**
 * MinIO implementation of the Bronze Storage Service.
 * This class connects to the MinIO instance and uploads the file buffer.
 */
var MinIOStorage = /** @class */ (function () {
    function MinIOStorage(minioConfig) {
        this.minioConfig = minioConfig;
        // 1. Initialize the MinIO Client using the configuration retrieved from .env
        this.minioClient = new Minio.Client({
            endPoint: minioConfig.endpoint,
            port: minioConfig.port,
            useSSL: minioConfig.useSSL || false, // Default to false if not specified
            accessKey: minioConfig.accessKey,
            secretKey: minioConfig.secretKey
        });
        console.log("[Storage]: MinIO Bronze Storage initialized for Bucket: ".concat(this.minioConfig.bucketName));
        console.log("[Storage]: MinIO Endpoint: ".concat(this.minioConfig.endpoint, ":").concat(this.minioConfig.port));
        // Ensure the bucket exists on initialization
        this.ensureBucketExists(minioConfig.bucketName).catch(function (error) {
            console.error('[MinIO Init Error]: Failed to ensure bucket existence:', error instanceof Error ? error.message : String(error));
            // In a production environment, you might want to stop the server here
        });
    }
    /**
     * Helper function to check and create the bucket if necessary.
     */
    MinIOStorage.prototype.ensureBucketExists = function (bucketName) {
        return __awaiter(this, void 0, void 0, function () {
            var exists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.minioClient.bucketExists(bucketName)];
                    case 1:
                        exists = _a.sent();
                        if (!!exists) return [3 /*break*/, 3];
                        console.log("[MinIO]: Bucket '".concat(bucketName, "' not found. Creating bucket..."));
                        return [4 /*yield*/, this.minioClient.makeBucket(bucketName, 'us-east-1')];
                    case 2:
                        _a.sent(); // Region is often required
                        console.log("[MinIO]: Bucket '".concat(bucketName, "' created successfully."));
                        return [3 /*break*/, 4];
                    case 3:
                        console.log("[MinIO]: Bucket '".concat(bucketName, "' already exists."));
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Uploads the file buffer directly to the configured MinIO bucket.
     * @param file The file object containing buffer data (from Multer's memoryStorage).
     * @returns The final object name (filename) used in the bucket.
     */
    MinIOStorage.prototype.storeFile = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var uniqueSuffix, objectName, fileBuffer, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                        objectName = uniqueSuffix + '-' + file.originalname;
                        fileBuffer = file.buffer;
                        if (!fileBuffer) {
                            throw new Error('File buffer is missing. Check Multer memory storage configuration.');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Use minioClient.putObject to stream/upload the buffer to the S3-compatible storage
                        console.log("[MinIO]: Uploading ".concat(file.originalname, " as ").concat(objectName, " to bucket ").concat(this.minioConfig.bucketName, "..."));
                        return [4 /*yield*/, this.minioClient.putObject(this.minioConfig.bucketName, objectName, fileBuffer, file.size, // Size is required for progress/validation
                            { 'Content-Type': file.mimetype } // Optional: set content type metadata
                            )];
                    case 2:
                        _a.sent();
                        console.log("[MinIO]: Successfully uploaded object ".concat(objectName, "."));
                        return [2 /*return*/, objectName];
                    case 3:
                        error_1 = _a.sent();
                        console.error("[Storage Error]: Failed to upload file ".concat(objectName, " to MinIO."), error_1);
                        // Re-throw a generic error to be caught by the router's error handler
                        throw new Error('Failed to save file to MinIO storage.');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return MinIOStorage;
}());
exports.MinIOStorage = MinIOStorage;
