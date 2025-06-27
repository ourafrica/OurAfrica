import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveModule } from '../../lib/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      // POST /api/modules/upload - Upload module from JSON file
      const { moduleData } = req.body;

      if (!moduleData) {
        return res.status(400).json({ error: 'No module data provided' });
      }

      // Validate module structure
      if (!moduleData.title || !moduleData.description || !moduleData.content) {
        return res.status(400).json({ error: 'Invalid module structure' });
      }

      const savedModule = await saveModule(moduleData);
      res.status(201).json({ 
        id: savedModule.id, 
        message: 'Module uploaded successfully',
        module: savedModule
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Module upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload module';
    res.status(500).json({ error: message });
  }
}
