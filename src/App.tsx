import React from 'react';

// Define the type for the change event from a file input
const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // The event.target is the <input type="file"> element.
    const inputElement: EventTarget & HTMLInputElement = event.target;

    // files will be FileList or null
    const files: FileList | null = inputElement.files;

    if (files && files.length > 0) {
        console.log(`--- Processing ${files.length} files ---`);

        Array.from(files).forEach((uploadedFile: File) => {
            // Process each individual file here
            console.log("File Name:", uploadedFile.name);
            console.log("File Type:", uploadedFile.type);
            console.log("File Size:", uploadedFile.size, "bytes");
            console.log("------------------------");
        });

        // TODO: Add actual file processing logic here (e.g., uploading each file).
    }
};

function App() {
    return (
        <div>
            <h1>File Upload Example (Multiple Files)</h1>
            <input
                type="file"
                onChange={handleUpload}
                multiple
            />
        </div>
    );
}

export default App;