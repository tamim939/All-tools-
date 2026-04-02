import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for video downloading
  app.post('/api/fetch-video', async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const isMock = !rapidApiKey || rapidApiKey === 'MY_RAPIDAPI_KEY' || rapidApiKey === '';

    // If no API key, use mock data for preview
    if (isMock) {
      console.warn('RAPIDAPI_KEY is missing or default. Using mock data.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let platform = 'video';
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) platform = 'youtube';
      else if (lowerUrl.includes('tiktok')) platform = 'tiktok';
      else if (lowerUrl.includes('instagram')) platform = 'instagram';
      else if (lowerUrl.includes('facebook') || lowerUrl.includes('fb.watch')) platform = 'facebook';

      return res.json({
        success: true,
        isMock: true,
        data: {
          title: `[DEMO] ${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
          thumbnail: `https://picsum.photos/seed/${platform}/800/450`,
          source: platform,
          medias: [
            { url: '#', quality: '720p (HD)', extension: 'mp4', size: '12MB' },
            { url: '#', quality: '360p (SD)', extension: 'mp4', size: '5MB' }
          ]
        }
      });
    }

    try {
      console.log('Fetching video with real API Key...');
      // Using 'social-download-all-in-one' API from RapidAPI
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
      
      console.log('API Response received successfully');

      // Map API response to our app's format with better title detection
      const mappedData = {
        title: data.title || data.description || data.caption || data.text || `${data.source || 'Video'} Download`,
        thumbnail: data.thumbnail || data.picture || data.cover || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
        source: data.source || 'video',
        duration: data.duration || '',
        medias: (data.medias || []).map((m: any) => ({
          url: m.url,
          quality: m.quality || 'HD',
          extension: m.extension || 'mp4',
          size: m.formattedSize || m.size || ''
        }))
      };

      if (mappedData.medias.length === 0) {
        return res.status(404).json({ error: 'No download links found. The video might be private or deleted.' });
      }

      res.json({ success: true, isMock: false, data: mappedData });
    } catch (error: any) {
      console.error('API Error Details:', error.response?.data || error.message);
      const message = error.response?.data?.message || error.message || 'Failed to fetch video. Please check the link.';
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

// For Vercel Serverless Functions
let app: any;
export default async (req: any, res: any) => {
  if (!app) {
    app = await startServer();
  }
  return app(req, res);
};
