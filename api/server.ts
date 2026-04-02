import express from 'express';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get(['/api/health', '/.netlify/functions/server/health', '/health'], (req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV });
  });

  // API Route for video downloading
  app.post(['/api/fetch-video', '/.netlify/functions/server/fetch-video', '/fetch-video'], async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const isMock = !rapidApiKey || rapidApiKey === 'MY_RAPIDAPI_KEY' || rapidApiKey === '';

    if (isMock) {
      console.warn('RAPIDAPI_KEY is missing. Using mock data.');
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({
        success: true,
        isMock: true,
        data: {
          title: "Demo Video (API Key Missing)",
          thumbnail: "https://picsum.photos/seed/demo/800/450",
          source: "demo",
          medias: [{ url: '#', quality: '720p', extension: 'mp4', size: '10MB' }]
        }
      });
    }

    try {
      const options = {
        method: 'POST',
        url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
        headers: {
          'x-rapidapi-key': rapidApiKey.trim(),
          'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        data: { url: url }
      };

      const response = await axios.request(options);
      const data = response.data;
      
      const mappedData = {
        title: data.title || data.description || data.caption || `${data.source || 'Video'} Download`,
        thumbnail: data.thumbnail || data.picture || data.cover || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
        source: data.source || 'video',
        medias: (data.medias || []).map((m: any) => ({
          url: m.url,
          quality: m.quality || 'HD',
          extension: m.extension || 'mp4',
          size: m.formattedSize || m.size || ''
        }))
      };

      res.json({ success: true, isMock: false, data: mappedData });
    } catch (error: any) {
      res.status(500).json({ error: error.response?.data?.message || error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } 
  // On Vercel/Netlify, we don't serve static files via Express
  // The platform handles it automatically via the build folder
  else if (!process.env.VERCEL && !process.env.NETLIFY) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not on Vercel or Netlify
  if (!process.env.VERCEL && !process.env.NETLIFY) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

// For Vercel & Netlify Serverless Functions
let cachedApp: any;

export const handler = async (event: any, context: any) => {
  try {
    if (!cachedApp) {
      cachedApp = await startServer();
    }
    
    // Netlify detection (event.httpMethod exists)
    if (event.httpMethod) {
      return await serverless(cachedApp)(event, context);
    }
    
    // Vercel/Express (event is req, context is res)
    return cachedApp(event, context);
  } catch (err: any) {
    console.error('Serverless Handler Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Serverless Function Error', 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      })
    };
  }
};

export default handler;
