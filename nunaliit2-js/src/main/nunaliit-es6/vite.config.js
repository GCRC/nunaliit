import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.js'),
			name: 'n2es6',
			fileName: () => 'n2es6.js',
			formats: ['umd'],
		},
		outDir: resolve(__dirname, 'dist/target'),
		minify: 'esbuild',
		sourcemap: true
	}
})
