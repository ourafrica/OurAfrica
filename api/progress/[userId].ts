import type { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  getAllUserProgress, 
  getAllLessonProgress, 
  getAllUserCertificates 
} from '../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const userId = parseInt(req.query.userId as string);
      const type = req.query.type as string;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Handle different types of user progress data
      switch (type) {
        case 'lessons': {
          // GET /api/progress/:userId?type=lessons - Get all lesson progress for user
          const lessonProgress = await getAllLessonProgress(userId);
          res.json(lessonProgress);
          break;
        }
          
        case 'certificates': {
          // GET /api/progress/:userId?type=certificates - Get all certificates for user
          const certificates = await getAllUserCertificates(userId);
          res.json(certificates);
          break;
        }
          
        default: {
          // GET /api/progress/:userId - Get all user progress for all modules
          const progress = await getAllUserProgress(userId);
          res.json(progress);
          break;
        }
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User progress error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch user progress';
    res.status(500).json({ error: message });
  }
}
