declare module '*.css' {
    // Although the content is ignored by TypeScript, this satisfies the compiler.
    const content: Record<string, string>;
    export default content;
}

interface ImportMetaEnv {
    // Readonly is good practice for environment variables
    readonly VITE_BACKEND_SERVER_PORT: number;
    readonly PROD: boolean;
    readonly VITE_IS_PROD: boolean;

    // Add any other custom VITE_ variables you use
    // readonly VITE_OTHER_VAR: string; 
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Optional: If you use other file types (like images) and get similar errors, 
// you can add declarations for them here too:
// declare module '*.svg' {
//   const content: string;
//   export default content;
// }
// declare module '*.png' {
//   const content: string;
//   export default content;
// }