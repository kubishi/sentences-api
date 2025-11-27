import { translateBuilderToEnglish } from '../../translator.js';

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

    const translation = await translateBuilderToEnglish({
      subject_noun: data.subject_noun || null,
      subject_noun_nominalizer: data.subject_noun_nominalizer || null,
      subject_suffix: data.subject_suffix || null,
      verb: data.verb || null,
      verb_tense: data.verb_tense || null,
      object_pronoun: data.object_pronoun || null,
      object_noun: data.object_noun || null,
      object_noun_nominalizer: data.object_noun_nominalizer || null,
      object_suffix: data.object_suffix || null
    }, 'gpt-3.5-turbo');

    return res.status(200).json({ translation });
  } catch (error) {
    console.error('Error in translate endpoint:', error);
    return res.status(500).json({ error: error.message });
  }
}
