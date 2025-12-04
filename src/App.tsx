import React, { useState } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2, Files } from 'lucide-react';

// 10 MiB.
const FILE_UPLOAD_LIMIT_BYTES: number = 10 * 1024 * 1024;
const API_URL: string = 'http://localhost:1020/upload';


/**
 * An upload response from the backend server.
 */
interface UploadStatus {
    id: string;
    fileNames: string[];
    totalSize: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    message: string;
};


const createFileGroups = (files: File[]): File[][] => {

    const sortedFiles: File[] = [...files].sort((a: File, b: File): number => {
        return b.size - a.size;
    });

    /**
     * We want to keep track of the files to add retry attempts in the future.
     */
    const fileGroups: File[][] = [];
    let currentGroup: File[] = [];
    let currentSize: number = 0;

    sortedFiles.forEach((file: File): void => {
        // If the file is over the cap by itself it becomes it's own group.
        if (file.size > FILE_UPLOAD_LIMIT_BYTES) {
            fileGroups.push([file]);

            // Else, if we can't chunk it with the existing group
            // it means the current group is full and we create a new group and
            // append the file to it.
        } else if (currentSize + file.size > FILE_UPLOAD_LIMIT_BYTES) {
            fileGroups.push(currentGroup);
            currentGroup = [file];
            currentSize = file.size;

            // Else, we try to chink it together in the existing group.
        } else {
            currentGroup.push(file);
            currentSize += file.size;
        };
    });

    // If we were out of files before we completely filled the last group.
    if (currentGroup.length > 0) {
        fileGroups.push(currentGroup);
    };

    return fileGroups;
}

async const uploadFiles = (group: File[], updateStatus: (status: UploadStatus) => void): Promise<void> => { }