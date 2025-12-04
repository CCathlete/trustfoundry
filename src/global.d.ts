declare module '*.css' {
    // Although the content is ignored by TypeScript, this satisfies the compiler.
    const content: Record<string, string>;
    export default content;
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