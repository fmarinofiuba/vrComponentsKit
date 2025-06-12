import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import { resolve } from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
	server: {
		port: 10001, // Personaliza el puerto aquí
		index: true, // Muestra el índice de archivos
		open: true, // Abre el navegador con el archivo índice
	},
 	build: {
        outDir: 'dist', // Personaliza la carpeta de salida del build aquí
        sourcemap: true, // Habilita los source maps
        rollupOptions: {
            input: {
                controllersExample: resolve(__dirname, 'src/kit/controllersExample.js'),
				debugToolsExample: resolve(__dirname, 'src/kit/debugToolsExample.js'),
				grabbableObjectsExample: resolve(__dirname, 'src/kit/grabbableObjectsExample.js'),
				helloVRExample: resolve(__dirname, 'src/kit/helloVrExample.js'),
				htmlVrMenuExample: resolve(__dirname, 'src/kit/htmlVrMenuExample.js'),
				uilVRMenuExample: resolve(__dirname, 'src/kit/uilVRMenuExample.js'),
				navigationExample: resolve(__dirname, 'src/kit/navigationExample.js'),
				selectableObjectsExample: resolve(__dirname, 'src/kit/selectableObjectsExample.js'),
                // Agrega aquí más entradas para cada aplicación en /kit/
                // ejemplo: otraApp: resolve(__dirname, 'src/kit/otraApp.js'),
            },
			output: {
                entryFileNames: '[name].js', // Elimina el sufijo aleatorio
                chunkFileNames: '[name].js', // Opcional: elimina el sufijo de los chunks
                assetFileNames: '[name].[ext]', // Opcional: elimina el sufijo de los assets
            },
        },
    },
	base: './', // Personaliza el directorio base de los links del HTML aquí
	plugins: [glsl(),

		 
	],
});
