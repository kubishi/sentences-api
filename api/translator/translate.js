import { translatePipeline } from '../../translator.js';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body || {};
    const english = data.english;

    if (!english) {
      return res.status(400).json({ error: 'English text is required' });
    }

    const result = await translatePipeline(english, 'gpt-4o-mini');

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in translator endpoint:', error);
    return res.status(500).json({ error: error.message });
  }
}
