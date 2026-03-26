import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: './',
    server: {
        port: 3000,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            input: 'index.html',
        },
    },
});
