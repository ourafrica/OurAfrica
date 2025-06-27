import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateCertificate } from '../../lib/api';

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
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Certificate generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate certificate';
    res.status(400).json({ error: message });
  }
}
