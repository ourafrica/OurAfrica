import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLessonProgress } from '../../../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/progress/:userId/:moduleId/:lessonId - Get lesson progress
      const userId = parseInt(req.query.userId as string);
      const moduleId = parseInt(req.query.moduleId as string);
      const lessonId = req.query.lessonId as string;
      
      if (isNaN(userId) || isNaN(moduleId) || !lessonId) {
        return res.status(400).json({ error: 'Invalid user ID, module ID, or lesson ID' });
      }

      const progress = await getLessonProgress(userId, moduleId, lessonId);
      res.json(progress || { completed: false, time_spent: 0 });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Lesson progress error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch lesson progress';
    res.status(500).json({ error: message });
  }
}
