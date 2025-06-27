import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllUserProgress } from '../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/progress/:userId - Get all user progress for all modules
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const progress = await getAllUserProgress(userId);
      res.json(progress);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User progress error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch user progress';
    res.status(500).json({ error: message });
  }
}
