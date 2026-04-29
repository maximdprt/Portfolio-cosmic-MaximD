import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('@react-three/fiber') || id.includes('@react-three/drei') || id.includes('@react-three/postprocessing')) return 'r3f'
          if (id.includes('framer-motion') || id.includes('gsap')) return 'motion'
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true,
  },
})
