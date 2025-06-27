import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateCertificate, getCertificate } from '../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      // POST /api/progress/certificate - Generate certificate
      const { userId, moduleId } = req.body;

      if (!userId || !moduleId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const certificateCode = await generateCertificate(userId, moduleId);
      res.json({
        certificateCode,
        message: 'Certificate generated successfully',
      });
    } else if (req.method === 'GET') {
      // GET /api/progress/certificate?userId=X&moduleId=Y - Get specific certificate
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
    console.error('Certificate error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process certificate request';
    res.status(500).json({ error: message });
  }
}
