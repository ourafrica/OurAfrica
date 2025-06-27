import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getModules, saveModule } from '../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/modules - Get all modules
      const modules = await getModules();
      res.json(modules);
    } else if (req.method === 'POST') {
      // POST /api/modules - Add new module
      const moduleData = req.body;

      // Validate required fields
      if (!moduleData.title || !moduleData.description || !moduleData.content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const savedModule = await saveModule(moduleData);
      res.status(201).json(savedModule);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Modules API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process request';
    res.status(500).json({ error: message });
  }
}
