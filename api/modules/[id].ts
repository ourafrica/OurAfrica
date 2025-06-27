import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getModuleById } from '../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/modules/:id - Get specific module
      const moduleId = parseInt(req.query.id as string);
      
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid module ID' });
      }

      const module = await getModuleById(moduleId);

      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }

      res.json(module);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Module API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch module';
    res.status(500).json({ error: message });
  }
}
