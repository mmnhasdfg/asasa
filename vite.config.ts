import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Environment variables to expose to the client
  const envWithProcessPrefix = {
    'process.env': Object.entries(env).reduce(
      (prev, [key, val]) => {
        if (key.startsWith('VITE_')) {
          return {
            ...prev,
            [key]: JSON.stringify(val),
            // For Netlify production build
            ['import.meta.env.' + key]: JSON.stringify(val),
            ['import.meta.env.VITE_' + key.replace(/^VITE_/, '')]: JSON.stringify(val)
          };
        }
        return prev;
      },
      {}
    )
  };

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // Explicitly define global constant replacements
    define: {
      ...envWithProcessPrefix,
      __APP_ENV__: JSON.stringify(env.NODE_ENV || 'development'),
    },
    // Resolver configuration
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // Build configuration
    build: {
      // Ensure environment variables are included in the build
      target: 'esnext',
      sourcemap: true,
      // Ensure environment variables are included in the build output
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});
