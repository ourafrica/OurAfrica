import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCertificate } from '../../../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/progress/certificate/:userId/:moduleId - Get certificate
      const userId = parseInt(req.query.userId as string);
      const moduleId = parseInt(req.query.moduleId as string);
      
      if (isNaN(userId) || isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid user ID or module ID' });
      }

      const certificate = await getCertificate(userId, moduleId);
      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      res.json(certificate);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Certificate retrieval error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certificate';
    res.status(500).json({ error: message });
  }
}
