import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getModuleProgressDetailed } from '../../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/progress/:userId/:moduleId - Get user progress for a module
      const userId = parseInt(req.query.userId as string);
      const moduleId = parseInt(req.query.moduleId as string);
      
      if (isNaN(userId) || isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid user ID or module ID' });
      }

      const progress = await getModuleProgressDetailed(userId, moduleId);
      res.json(progress);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Module progress error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch progress';
    res.status(500).json({ error: message });
  }
}
