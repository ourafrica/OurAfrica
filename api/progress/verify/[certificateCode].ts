import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyCertificate } from '../../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/progress/verify/:certificateCode - Verify certificate
      const certificateCode = req.query.certificateCode as string;

      if (!certificateCode) {
        return res.status(400).json({ error: 'Certificate code is required' });
      }

      const certificate = await verifyCertificate(certificateCode);
      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found or invalid' });
      }

      res.json(certificate);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Certificate verification error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify certificate';
    res.status(500).json({ error: message });
  }
}
