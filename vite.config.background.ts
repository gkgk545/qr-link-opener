import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                background: path.resolve(__dirname, 'src/background/index.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                format: 'es',
            },
        },
        outDir: 'dist',
        emptyOutDir: true, // Clear dist first
    },
});
