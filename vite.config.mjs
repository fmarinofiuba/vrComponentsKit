import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
	server: {
		port: 10001, // Personaliza el puerto aquí
		index: true, // Muestra el índice de archivos
		open: true, // Abre el navegador con el archivo índice
	},
	build: {
		outDir: 'dist', // Personaliza la carpeta de salida del build aquí
		sourcemap: true, // Habilita los source maps
	},
	base: './', // Personaliza el directorio base de los links del HTML aquí
	plugins: [glsl()],
});
