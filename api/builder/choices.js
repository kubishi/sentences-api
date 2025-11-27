import { getAllChoices, formatChoices, formatSentence } from '../../sentence-builder.js';

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
    const choices = getAllChoices(data);

    let sentence = [];
    try {
      sentence = formatSentence(
        Object.fromEntries(
          Object.entries(choices).map(([k, v]) => [k, v.value])
        )
      );
    } catch (e) {
      // Sentence not complete yet
    }

    return res.status(200).json({
      choices: formatChoices(choices),
      sentence
    });
  } catch (error) {
    console.error('Error in choices endpoint:', error);
    return res.status(500).json({ error: error.message });
  }
}
