import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateLessonProgress, getLessonProgress } from '../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      // POST /api/progress/lesson - Update lesson progress
      const { userId, moduleId, lessonId, completed, timeSpent, quizScore } = req.body;

      if (
        !userId ||
        !moduleId ||
        !lessonId ||
        completed === undefined ||
        timeSpent === undefined
      ) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Store time in seconds (no conversion needed)
      await updateLessonProgress(
        userId,
        moduleId,
        lessonId,
        completed,
        timeSpent,
        quizScore
      );

      // Return the updated lesson progress data
      const updatedProgress = await getLessonProgress(userId, moduleId, lessonId);
      res.json(updatedProgress);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Lesson progress error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update lesson progress';
    res.status(500).json({ error: message });
  }
}
