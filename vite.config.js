import { fileURLToPath } from 'node:url'

const root = (p) => fileURLToPath(new URL(p, import.meta.url))

export default {
  base: './',
  build: {
    rollupOptions: {
      input: { main: root('./index.html'), site: root('./site/index.html') },
    },
  },
}
