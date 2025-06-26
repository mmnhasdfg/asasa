// Extend ImportMeta to include 'env' property for Vite
interface ImportMetaEnv {
    readonly VITE_OPENROUTER_API_KEY_2?: string;
    readonly VITE_OPENROUTER_API_KEY?: string;
    // add other env variables here if needed
}

declare global {
    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

// Example fix for API key loading
const apiKey2 = import.meta.env.VITE_OPENROUTER_API_KEY_2;
if (!apiKey2) {
    console.warn('No API keys configured for model VITE_OPENROUTER_API_KEY_2, using default keys');
    // ...fallback logic...
}

// Example: Correct way to reference env variables
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
if (!apiKey) {
    console.warn('No API keys configured for model VITE_OPENROUTER_API_KEY, using default keys');
    // ...fallback logic...
}

// ...existing code...

// Example fix for .map usage at line 175
// Suppose 'someArray' is the variable you are calling .map on:
const someArray: any[] = []; // Initialize with an empty array or your actual data
if (Array.isArray(someArray)) {
    someArray.map((value, index, array) => {
        // TODO: implement your mapping logic here
        return value;
    });
} else {
    console.error('Expected an array but got:', someArray);
    // ...handle error or fallback...
}

// At or near line 175, before using .map, add a guard:
if (Array.isArray(someArray)) {
    someArray.map((value, index, array) => {
        // TODO: implement your mapping logic here
        return value;
    });
} else {
    console.error('Cannot read properties of undefined (reading "map") at openrouter.ts:175. Value:', someArray);
    // ...handle error or fallback...
}

// ...existing code...