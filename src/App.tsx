import React from 'react';

// Define the type for the change event from a file input
// React.ChangeEvent<HTMLInputElement> is the standard type in React for this.
const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // The event.target is the <input type="file"> element.
    const inputElement = event.target;

    // inputElement.files is a FileList object (which may be null/undefined)
    const files = inputElement.files;

    if (files && files.length > 0) {
        // We are focused on the first file for now, but FileList is iterable.
        const uploadedFile = files[0];

        console.log("File Name:", uploadedFile.name);
        console.log("File Type:", uploadedFile.type);
        console.log("File Size:", uploadedFile.size, "bytes");

        // TODO: Add actual file processing logic here.
    }
};

function App() {
    return (
        <div>
            <h1>File Upload Example (TypeScript)</h1>
            <input
                type="file"
                onChange={handleUpload}
            // Add 'multiple' if you want to allow selecting more than one file:
            // multiple 
            />
        </div>
    );
}

export default App;