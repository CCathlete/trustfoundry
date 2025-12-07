import React, { useState } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2, Files } from 'lucide-react';
import { ZodError } from 'zod';
// Import the schema and constants from the dedicated file
import { ForbiddenFileSchema, FORBIDDEN_MIME_TYPES } from './validation_schemas';

// Constants
const BACKEND_SERVER_PORT: number = import.meta.env.VITE_BACKEND_SERVER_PORT;
const FILE_UPLOAD_LIMIT_BYTES: number = 10 * 1024 * 1024; // 10 MiB (Used for grouping)
const API_URL: string = `http://localhost:${BACKEND_SERVER_PORT}/upload`;
const UPLOAD_COOLDOWN_MS: number = 3000; // 3 seconds cool-down period

/**
 * An upload response from the backend server.
 */
interface UploadStatus {
    id: string;
    fileNames: string[];
    totalSize: number;
    status: 'pending' | 'uploading' | 'success' | 'error' | 'validation-error';
    message: string;
}

interface ZodIssueStructure {
    path: (string | number)[];
    message: string;
}

/**
 * Group files to units by their size acccording to size cap 
 */
const createFileGroups = (files: File[]): File[][] => {

    const sortedFiles: File[] =
        [...files].sort((a: File, b: File) => b.size - a.size);

    const fileGroups: File[][] = [];
    let currentGroup: File[] = [];
    let currentSize: number = 0;

    sortedFiles.forEach((file: File) => {
        if (file.size > FILE_UPLOAD_LIMIT_BYTES) {
            fileGroups.push([file]);
        } else if (currentSize + file.size > FILE_UPLOAD_LIMIT_BYTES) {
            fileGroups.push(currentGroup);
            currentGroup = [file];
            currentSize = file.size;
        } else {
            currentGroup.push(file);
            currentSize += file.size;
        }
    });

    if (currentGroup.length > 0) {
        fileGroups.push(currentGroup);
    }

    return fileGroups;
}

const uploadFiles = async (
    group: File[],
    updateStatus: (s: UploadStatus) => void,
): Promise<void> => {

    const groupTotalSize: number = group.reduce((sum: number, file: File) => sum + file.size, 0);
    const groupNames: string[] = group.map((f: File) => f.name);
    const groupId: string = groupNames.join('|');

    updateStatus({ id: groupId, fileNames: groupNames, totalSize: groupTotalSize, status: 'uploading', message: `Sending ${group.length} files...` });

    const formData: FormData = new FormData();

    group.forEach((file: File) => {
        formData.append('files', file);
    });

    try {
        const response: Response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText: string = await response.text();
            throw new Error(`API failed with status ${response.status}: ${errorText || response.statusText}`);
        }

        const result: { message?: string } = await response.json();

        updateStatus({ id: groupId, fileNames: groupNames, totalSize: groupTotalSize, status: 'success', message: `Upload finished. Backend response: ${result.message || 'OK'}` });

    } catch (error: unknown) {
        const errorMessage: string = error instanceof Error ? error.message : 'Unknown upload error.';
        updateStatus({ id: groupId, fileNames: groupNames, totalSize: groupTotalSize, status: 'error', message: `Upload failed: ${errorMessage}` });
        // The error is resolved in updateStatus and the promise is rejected.
    }
}


const App = (): JSX.Element => {
    const [uploadList, setUploadList] = useState<UploadStatus[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [buttonPressMinAgo, setButtonPressMinAgo] = useState<number>(0);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const files: FileList | null = event.target.files;
        const currentTime = Date.now();

        if (currentTime - buttonPressMinAgo < UPLOAD_COOLDOWN_MS) {
            alert(`Please wait ${UPLOAD_COOLDOWN_MS / 1000} seconds before starting a new upload.`);
            event.target.value = '';
            return;
        }

        if (!files || files.length === 0) return;

        const fileArray: File[] = Array.from(files);

        // --- Zod Validation Logic ---
        const validatedFiles: File[] = [];
        const validationErrorGroups: UploadStatus[] = [];

        fileArray.forEach((file: File, index: number) => {
            try {
                ForbiddenFileSchema.parse(file);
                validatedFiles.push(file);
            } catch (error: unknown) {

                if (error instanceof ZodError ||
                    (typeof error === 'object' && error !== null && 'errors' in error)) {

                    // Now that we've guaranteed 'errors' exists (in the case of ZodError), 
                    // we can safely assert the type.
                    const zodError = error as { errors: ZodIssueStructure[] };

                    const fieldError = zodError.errors[0];

                    validationErrorGroups.push({
                        id: `validation-err-${index}-${Date.now()}`,
                        fileNames: [file.name],
                        totalSize: file.size,
                        status: 'validation-error',
                        message: `File failed validation: [${fieldError.path.join('.')}] - ${fieldError.message}`,
                    });
                } else {
                    // Handle non-Zod errors
                    validationErrorGroups.push({
                        id: `unknown-err-${index}-${Date.now()}`,
                        fileNames: [file.name],
                        totalSize: file.size,
                        status: 'error',
                        message: `An unknown error occurred during file processing.`,
                    });
                }
            }
        });

        if (validatedFiles.length === 0 && validationErrorGroups.length > 0) {
            setUploadList(validationErrorGroups);
            event.target.value = '';
            return;
        } else if (validatedFiles.length === 0) {
            event.target.value = '';
            return;
        }

        const fileGroups: File[][] = createFileGroups(validatedFiles);
        // --- End of Validation Logic ---


        setIsUploading(true);

        const initialList: UploadStatus[] = [
            ...validationErrorGroups,
            ...fileGroups.map(

                (group: File[], index: number): UploadStatus => {

                    const groupUploadStatus: UploadStatus = {
                        id: `group-${index}-${Date.now()}`,
                        fileNames: group.map((f: File) => f.name),
                        totalSize: group.reduce((sum: number, file: File) => sum + file.size, 0),
                        status: 'pending',
                        message: `Queued for upload... (${group.length} files)`
                    };
                    return groupUploadStatus;
                }
            )
        ];

        setUploadList(initialList);

        const updateGroupStatus = (newStatus: UploadStatus): void => {
            setUploadList((currentList: UploadStatus[]) => currentList.map((item: UploadStatus) =>
                item.id === newStatus.id ? newStatus : item
            ));
        };

        const pendingGroups = fileGroups.map((group: File[]) => uploadFiles(group, updateGroupStatus));

        await Promise.all(pendingGroups);
        // isUploading is set to false after a short delay.
        setTimeout(() => {
            setIsUploading(false);
            event.target.value = '';
            setButtonPressMinAgo(Date.now());
        }, 100);
    };

    const getStatusIcon = (status: UploadStatus['status']): JSX.Element | null => {
        switch (status) {
            case 'success':
                return <CheckCircle className="text-green-500 w-5 h-5" />;
            case 'error':
            case 'validation-error':
                return <XCircle className="text-red-500 w-5 h-5" />;
            case 'uploading':
            case 'pending':
                return <Loader2 className="animate-spin text-blue-500 w-5 h-5" />;
            default:
                return null;
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k: number = 1024;
        const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB'];
        const i: number = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-3xl border-t-4 border-indigo-600">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center">
                    <Files className="w-7 h-7 mr-3 text-green-600" />
                    File Uploader for Trustfoundry
                </h1>
                <p className="text-gray-500 mb-6">
                    Groups your files based on a {formatBytes(FILE_UPLOAD_LIMIT_BYTES)} limit and sends them concurrently to our backend API.
                </p>

                <label className={`block w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition duration-150 ${isUploading ? 'bg-gray-100 border-gray-300' : 'hover:border-indigo-500 hover:bg-indigo-50 border-gray-400'
                    }`}>
                    <div className="text-center">
                        <UploadCloud className={`w-8 h-8 mx-auto mb-2 transition duration-150 ${isUploading ? 'text-gray-400' : 'text-indigo-500'}`} />
                        <p className="font-semibold text-gray-700">
                            {isUploading ? "Uploads in Progress..." : "Click to select legal files"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Current Group Limit: {formatBytes(FILE_UPLOAD_LIMIT_BYTES)}. Files are sorted and grouped for efficiency.
                        </p>
                    </div>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                        disabled={isUploading}
                    />
                </label>

                {/* Display Forbidden Types */}
                <div className="mt-4 text-sm text-gray-500 border-t pt-4">
                    <h3 className="font-semibold text-gray-700 mb-1">File Type Restrictions:</h3>
                    <p>The following MIME types are forbidden for security reasons:</p>
                    <div className="flex flex-wrap mt-1">
                        {FORBIDDEN_MIME_TYPES.map(type => (
                            <span key={type} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full mr-2 mb-1">
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                {uploadList.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1">Request Pipeline Status ({uploadList.filter(item => item.status !== 'validation-error').length} groups pending/complete, {uploadList.filter(item => item.status === 'validation-error').length} failed validation)</h2>
                        <ul className="space-y-3">
                            {uploadList.map((item: UploadStatus) => (
                                <li key={item.id} className={`p-4 rounded-lg shadow-md transition duration-150 ${item.status === 'success' ? 'bg-green-50 border border-green-200' :
                                    item.status === 'error' || item.status === 'validation-error' ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
                                    }`}>

                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <div className="mr-3">{getStatusIcon(item.status)}</div>
                                            <p className="font-semibold text-gray-900">
                                                {item.status === 'validation-error' ? 'Validation Failed' : `Request Group (${item.fileNames.length} Files)`}
                                            </p>
                                        </div>
                                        <div className={`text-sm font-mono ${item.status === 'uploading' ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {formatBytes(item.totalSize)}
                                        </div>
                                    </div>

                                    <div className="ml-8">
                                        <p className={`text-xs ${item.status === 'success' ? 'text-green-700' : item.status === 'error' || item.status === 'validation-error' ? 'text-red-700' : 'text-gray-500'}`}>
                                            {item.message}
                                        </p>
                                        <ul className="list-disc list-inside text-xs text-gray-600 mt-1 space-y-0.5">
                                            {item.fileNames.map((name: string) => (
                                                <li key={name} className="truncate">{name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;