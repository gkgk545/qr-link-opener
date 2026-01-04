import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                content: path.resolve(__dirname, 'src/content/index.ts'),
            },
            output: {
                assetFileNames: '[name].[ext]',
                entryFileNames: '[name].js',
                format: 'iife',
                name: 'QrLinkOpenerContent' // Required for IIFE
            },
        },
        outDir: 'dist',
        emptyOutDir: false, // Don't wipe dist as background build runs separately
    },
    publicDir: false, // Don't copy public assets, let background build do it
});
