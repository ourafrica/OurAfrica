import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllLessonProgress } from '../../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/progress/:userId/lessons - Get all lesson progress for user
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const lessonProgress = await getAllLessonProgress(userId);
      res.json(lessonProgress);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Lesson progress error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch lesson progress';
    res.status(500).json({ error: message });
  }
}
