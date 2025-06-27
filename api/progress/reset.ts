import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resetModuleProgress } from '../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      // POST /api/progress/reset - Reset all progress and certificates for a user/module
      const { userId, moduleId } = req.body;
      
      if (!userId || !moduleId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      await resetModuleProgress(userId, moduleId);
      res.json({ message: 'Progress reset successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Reset progress error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reset progress';
    res.status(500).json({ error: message });
  }
}
