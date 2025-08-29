/**
 * Production Vite Configuration
 * Optimized build settings for production deployment
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Optimize React for production
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],
  
  // Build optimization
  build: {
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-tabs', '@radix-ui/react-toast', 'lucide-react'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'date-fns'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Optimize bundle size
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      format: {
        comments: false // Remove comments
      }
    },
    
    // Performance settings
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
    sourcemap: false, // Disable sourcemaps in production for performance
    
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets < 4KB
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'wouter',
      'clsx',
      'tailwind-merge'
    ],
    // Exclude heavy dependencies that should be loaded on demand
    exclude: ['web-vitals']
  },
  
  // CSS optimization
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      css: {
        // Remove unused CSS in production
        charset: false
      }
    }
  },
  
  // Asset optimization
  assetsInclude: ['**/*.woff2', '**/*.woff'], // Include only necessary font formats
  
  // Server configuration for production preview
  preview: {
    port: 4173,
    host: true,
    strictPort: true
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'assets'),
      '@shared': resolve(__dirname, '../shared')
    }
  },
  
  // Environment variables
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  
  // Performance monitoring
  esbuild: {
    // Tree shaking optimization
    treeShaking: true,
    // Remove unused imports
    ignoreAnnotations: false,
    legalComments: 'none'
  }
});