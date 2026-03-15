import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import fs from 'fs'
import path from 'path'

// Custom Vite plugin to handle read/writes to teams.json in development
const teamsApiPlugin = () => ({
  name: 'teams-api',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const teamsPath = path.resolve(__dirname, 'src/teams.json');

      if (req.url === '/api/teams' && req.method === 'GET') {
        try {
          const data = fs.readFileSync(teamsPath, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to read teams' }));
        }
        return;
      }

      if (req.url === '/api/teams' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: string) => { body += chunk; });
        req.on('end', () => {
          try {
            // Verify it's valid JSON before saving
            JSON.parse(body);
            fs.writeFileSync(teamsPath, body, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          }
        });
        return;
      }

      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    teamsApiPlugin()
  ],
})
