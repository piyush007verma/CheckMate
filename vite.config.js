import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev only: serves /api/gemini inside `npm run dev` by running api/gemini.js directly,
// so no Vercel is needed. GEMINI_API_KEY is read from .env by this Node process and is never sent
// to the browser (only VITE_* variables reach the frontend). Production builds are unaffected.
function localApi() {
  return {
    name: 'rentnest-local-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const k of ['GEMINI_API_KEY', 'GEMINI_MODEL']) if (env[k] && !process.env[k]) process.env[k] = env[k]

      server.middlewares.use('/api/gemini', async (req, res) => {
        const send = (code, body) => {
          res.statusCode = code
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          req.body = raw ? JSON.parse(raw) : {}
          const mod = await server.ssrLoadModule('/api/gemini.js')
          await mod.default(req, { status: (c) => ({ json: (b) => send(c, b) }) })
        } catch (e) {
          console.error('[local api]', e)
          send(500, { error: 'Local API error' })
        }
      })
    },
  }
}

export default defineConfig({ plugins: [react(), localApi()] })
