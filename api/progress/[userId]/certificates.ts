import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllUserCertificates } from '../../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/progress/:userId/certificates - Get all certificates for a user
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const certificates = await getAllUserCertificates(userId);
      res.json(certificates);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User certificates error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch user certificates';
    res.status(500).json({ error: message });
  }
}
