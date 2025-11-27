/**
 * Owens Valley Paiute Translator Logic
 * Uses OpenAI for translation pipeline
 */

import OpenAI from 'openai';
import {
  NOUNS, Subject, Verb, ObjectDef, POSSESSIVE_PRONOUNS,
  formatSentence, getMatchingSuffix
} from './sentence-builder.js';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Reverse lookups for translation
const R_TRANSITIVE_VERBS = Object.fromEntries(
  Object.entries(Verb.TRANSITIVE_VERBS).map(([k, v]) => [v, k])
);
const R_INTRANSITIVE_VERBS = Object.fromEntries(
  Object.entries(Verb.INTRANSITIVE_VERBS).map(([k, v]) => [v, k])
);
const R_NOUNS = Object.fromEntries(
  Object.entries(NOUNS).map(([k, v]) => [v, k])
);

// Tense mappings
const R_VERB_TENSES = {
  present: {
    continuous: "ti",
    completive: "ti",
    simple: "dü",
    perfect: "pü"
  },
  past: {
    continuous: "ti",
    completive: "ku",
    simple: "ti",
    perfect: "pü"
  },
  future: {
    continuous: "wei",
    completive: "wei",
    simple: "wei",
    perfect: "wei"
  }
};

// Object pronoun mapping
const OBJECT_PRONOUN_MAP = {
  'i': { person: ['first'], plurality: ['singular'] },
  'ü': { person: ['second'], plurality: ['singular'] },
  'u': { person: ['third'], plurality: ['singular'], proximity: ['distal'] },
  'a': { person: ['third'], plurality: ['singular'], proximity: ['proximal'] },
  'ma': { person: ['third'], plurality: ['singular'], proximity: ['proximal'] },
  'ui': { person: ['third'], plurality: ['plural', 'dual'], proximity: ['distal'] },
  'ai': { person: ['third'], plurality: ['plural', 'dual'], proximity: ['proximal'] },
  'mai': { person: ['third'], plurality: ['plural', 'dual'], proximity: ['proximal'] },
  'ni': { person: ['first'], plurality: ['plural', 'dual'], inclusivity: ['exclusive'] },
  'tei': { person: ['first'], plurality: ['plural'], inclusivity: ['inclusive'] },
  'ta': { person: ['first'], plurality: ['dual'], inclusivity: ['inclusive'] },
  'üi': { person: ['second'], plurality: ['plural', 'dual'] },
};

// Subject pronoun mapping
const SUBJECT_PRONOUN_MAP = {
  'nüü': { person: ['first'], plurality: ['singular'] },
  'üü': { person: ['second'], plurality: ['singular'] },
  'uhu': { person: ['third'], plurality: ['singular'], proximity: ['distal'] },
  'mahu': { person: ['third'], plurality: ['singular'], proximity: ['proximal'] },
  'uhuw̃a': { person: ['third'], plurality: ['plural', 'dual'], proximity: ['distal'] },
  'mahuw̃a': { person: ['third'], plurality: ['plural', 'dual'], proximity: ['proximal'] },
  'nüügwa': { person: ['first'], plurality: ['plural', 'dual'], inclusivity: ['exclusive'] },
  'taagwa': { person: ['first'], plurality: ['plural'], inclusivity: ['inclusive'] },
  'taa': { person: ['first'], plurality: ['dual'], inclusivity: ['inclusive'] },
  'üügwa': { person: ['second'], plurality: ['plural', 'dual'] }
};

// Example sentences for few-shot prompting
const EXAMPLE_SENTENCES = [
  {
    sentence: "I am sitting in a chair.",
    response: {
      sentences: [{
        subject: { type: "pronoun", person: "first", plurality: "singular", proximity: "proximal", inclusivity: "exclusive", reflexive: false },
        verb: { lemma: "sit", tense: "present", aspect: "continuous" },
        object: null
      }]
    }
  },
  {
    sentence: "The dogs were chasing their tails.",
    response: {
      sentences: [{
        subject: { type: "noun", head: "dog", proximity: "proximal", plurality: "plural" },
        verb: { lemma: "chase", tense: "past", aspect: "continuous" },
        object: { type: "noun", head: "tail", proximity: "proximal", plurality: "plural", possessive: { person: "third", plurality: "plural", proximity: "proximal", reflexive: true } }
      }]
    }
  },
  {
    sentence: "That runner will eat the coyote.",
    response: {
      sentences: [{
        subject: { type: "noun", head: { lemma: "run", tense: "present" }, proximity: "distal", plurality: "singular" },
        verb: { lemma: "eat", tense: "future", aspect: "simple" },
        object: { type: "noun", head: "coyote", proximity: "proximal", plurality: "singular" }
      }]
    }
  }
];

/**
 * Semantic similarity using OpenAI embeddings
 */
async function getEmbedding(text) {
  const response = await getOpenAIClient().embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0].embedding;
}

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function semanticSimilarity(text1, text2) {
  const [emb1, emb2] = await Promise.all([
    getEmbedding(text1),
    getEmbedding(text2)
  ]);
  const similarity = cosineSimilarity(emb1, emb2);
  return (similarity + 1) / 2; // Scale to 0-1 range
}

/**
 * Map pronoun to Paiute string
 */
function mapPronounToString(pronoun, mapping) {
  const matches = [];
  for (const [paiute, attributes] of Object.entries(mapping)) {
    let doesMatch = true;
    for (const attr of ['person', 'plurality', 'inclusivity', 'proximity', 'reflexive']) {
      if (attributes[attr] && pronoun[attr]) {
        if (Array.isArray(attributes[attr])) {
          if (!attributes[attr].includes(pronoun[attr])) {
            doesMatch = false;
            break;
          }
        } else if (attributes[attr] !== pronoun[attr]) {
          doesMatch = false;
          break;
        }
      }
    }
    if (doesMatch) {
      matches.push(paiute);
    }
  }
  if (matches.length === 0) {
    console.warn(`No match found for pronoun:`, pronoun);
    return Object.keys(mapping)[0]; // Fallback
  }
  return matches[Math.floor(Math.random() * matches.length)];
}

function mapSubjectPronounToString(pronoun) {
  return mapPronounToString(pronoun, SUBJECT_PRONOUN_MAP);
}

function mapObjectPronounToString(pronoun) {
  return mapPronounToString(pronoun, OBJECT_PRONOUN_MAP);
}

function mapProximityToSubjectSuffix(proximity) {
  return proximity === 'distal' ? 'uu' : 'ii';
}

function mapProximityToObjectSuffix(proximity) {
  return proximity === 'distal' ? 'oka' : 'eika';
}

function mapTenseToSuffix(tense, aspect) {
  const tenseMap = R_VERB_TENSES[tense] || R_VERB_TENSES.present;
  return tenseMap[aspect] || 'dü';
}

function mapTenseToNominalizer(tense) {
  return tense === 'future' ? 'weidü' : 'dü';
}

/**
 * Split English sentence into simple sentences using OpenAI
 */
async function splitSentence(sentence, model = 'gpt-4o-mini') {
  const messages = [
    {
      role: 'system',
      content: `You are an assistant that splits user input sentences into a set of simple SVO or SV sentences.
The set of simple sentences should be as semantically equivalent as possible to the user input sentence.
No adjectives, adverbs, prepositions, or conjunctions should be added to the simple sentences.
Indirect objects and objects of prepositions should not be included in the simple sentences.
Subjects and objects can be verbs (via nominalization).

Return a JSON object with a "sentences" array where each sentence has:
- subject: Either a pronoun object {type:"pronoun", person, plurality, proximity, inclusivity, reflexive} or a noun object {type:"noun", head, proximity, plurality, possessive?}
- verb: {lemma, tense, aspect}
- object: null, pronoun object, or noun object

For nouns, "head" can be a string (noun word) or an object {lemma, tense} for nominalized verbs.
Tense values: "past", "present", "future"
Aspect values: "simple", "continuous", "completive", "perfect"
Person values: "first", "second", "third"
Plurality values: "singular", "dual", "plural"
Proximity values: "proximal", "distal"
Inclusivity values: "inclusive", "exclusive"`
    }
  ];

  // Add examples
  for (const example of EXAMPLE_SENTENCES) {
    messages.push({ role: 'user', content: example.sentence });
    messages.push({ role: 'assistant', content: JSON.stringify(example.response) });
  }

  messages.push({ role: 'user', content: sentence });

  const response = await getOpenAIClient().chat.completions.create({
    model,
    messages,
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Translate a structured simple sentence to Paiute
 */
function translateSimple(sentence) {
  const subj = sentence.subject;
  let subject_noun, subject_noun_nominalizer = null, subject_suffix = null;

  // Handle subject
  if (subj.type === 'pronoun') {
    subject_noun = mapSubjectPronounToString(subj);
  } else {
    const head = subj.head;
    if (typeof head === 'string') {
      subject_noun = R_NOUNS[head.toLowerCase()] || `[${head}]`;
    } else {
      const engLemma = head.lemma.toLowerCase();
      subject_noun = R_INTRANSITIVE_VERBS[engLemma] || R_TRANSITIVE_VERBS[engLemma] || `[${engLemma}]`;
      subject_noun_nominalizer = mapTenseToNominalizer(head.tense);
    }
    subject_suffix = mapProximityToSubjectSuffix(subj.proximity);
  }

  // Handle verb
  const verbInput = sentence.verb;
  const engVerb = verbInput.lemma.toLowerCase();
  let paiuteStem = R_TRANSITIVE_VERBS[engVerb];
  if (!sentence.object) {
    paiuteStem = R_INTRANSITIVE_VERBS[engVerb] || paiuteStem;
  }
  if (!paiuteStem) {
    paiuteStem = `[${engVerb}]`;
  }

  const tense = mapTenseToSuffix(verbInput.tense, verbInput.aspect);
  let object_pronoun = null;
  let object_noun = null, object_noun_nominalizer = null, object_suffix = null;

  // Handle object
  if (sentence.object) {
    const obj = sentence.object;
    if (obj.type === 'pronoun') {
      object_pronoun = mapObjectPronounToString(obj);
    } else {
      const head = obj.head;
      if (typeof head === 'string') {
        object_noun = R_NOUNS[head.toLowerCase()] || `[${head}]`;
      } else {
        const engLemma = head.lemma.toLowerCase();
        object_noun = R_TRANSITIVE_VERBS[engLemma] || R_INTRANSITIVE_VERBS[engLemma] || `[${engLemma}]`;
        object_noun_nominalizer = mapTenseToNominalizer(head.tense);
      }
      object_suffix = mapProximityToObjectSuffix(obj.proximity);

      // Set object pronoun for third person
      object_pronoun = mapObjectPronounToString({
        person: 'third',
        plurality: obj.plurality,
        proximity: obj.proximity
      });
    }
  }

  return {
    subject_noun,
    subject_noun_nominalizer,
    subject_suffix,
    verb: paiuteStem,
    verb_tense: tense,
    object_pronoun,
    object_noun,
    object_noun_nominalizer,
    object_suffix
  };
}

/**
 * Generate natural English from structured sentence using OpenAI
 */
async function makeSentence(sentences, model = 'gpt-4o-mini') {
  const messages = [
    {
      role: 'system',
      content: `You are an assistant that takes structured data and generates simple SVO or SV natural language sentences.
Only add necessary articles and conjugations. Do not add any other words.
When a subject or object is a verb, they are "nominalized" verbs as "past", "present", or "future" (e.g., "run" -> "the runner", "the one who ran", "the one who will run").
Leave words wrapped in square brackets (e.g. [SUBJECT]) as they are.`
    },
    { role: 'user', content: JSON.stringify(sentences) }
  ];

  const response = await getOpenAIClient().chat.completions.create({
    model,
    messages
  });

  return response.choices[0].message.content;
}

/**
 * Translate OVP to English (back translation)
 */
async function translateOvpToEnglish(params, model = 'gpt-3.5-turbo') {
  const { subject_noun, subject_noun_nominalizer, subject_suffix,
    verb, verb_tense, object_pronoun, object_noun, object_noun_nominalizer, object_suffix } = params;

  const structure = [];

  // Subject info
  const subjectInfo = { part_of_speech: 'subject' };
  if (subject_noun_nominalizer) {
    subjectInfo.word = Verb.TRANSITIVE_VERBS[subject_noun] || Verb.INTRANSITIVE_VERBS[subject_noun] || subject_noun;
    subjectInfo.agent_nominalizer = Verb.NOMINALIZER_TENSES[subject_noun_nominalizer];
    subjectInfo.positional = Subject.SUFFIXES[subject_suffix];
  } else if (NOUNS[subject_noun]) {
    subjectInfo.word = NOUNS[subject_noun];
    subjectInfo.positional = Subject.SUFFIXES[subject_suffix];
  } else if (Subject.PRONOUNS[subject_noun]) {
    subjectInfo.word = Subject.PRONOUNS[subject_noun];
  } else {
    subjectInfo.word = subject_noun;
  }
  structure.push(subjectInfo);

  // Object info
  if (object_noun || object_pronoun) {
    const objectInfo = { part_of_speech: 'object' };
    if (object_noun && NOUNS[object_noun]) {
      objectInfo.word = NOUNS[object_noun];
      objectInfo.positional = ObjectDef.SUFFIXES[object_suffix];
    } else if (object_pronoun && !object_noun) {
      objectInfo.word = ObjectDef.PRONOUNS[object_pronoun];
    } else if (object_noun) {
      objectInfo.word = object_noun;
      objectInfo.positional = ObjectDef.SUFFIXES[object_suffix];
    }
    if (objectInfo.word) {
      structure.push(objectInfo);
    }
  }

  // Verb info
  const verbInfo = { part_of_speech: 'verb' };
  verbInfo.word = Verb.TRANSITIVE_VERBS[verb] || Verb.INTRANSITIVE_VERBS[verb] || verb;
  verbInfo.tense = Verb.TENSES[verb_tense];
  structure.push(verbInfo);

  const examples = [
    {
      input: [
        { part_of_speech: 'subject', positional: 'proximal', word: 'wood' },
        { part_of_speech: 'object', positional: 'proximal', word: 'dog', possessive: 'my' },
        { part_of_speech: 'verb', tense: 'present ongoing (-ing)', word: 'see' }
      ],
      output: 'This wood is seeing my dog.'
    },
    {
      input: [
        { part_of_speech: 'subject', positional: 'proximal', word: 'cup', possessive: 'my' },
        { part_of_speech: 'object', positional: 'distal', word: 'cup', plural: true },
        { part_of_speech: 'verb', tense: 'future (will)', word: 'eat' }
      ],
      output: 'My cup will eat those cups.'
    }
  ];

  const messages = [
    {
      role: 'system',
      content: 'You are an assistant for translating structured sentences into natural English sentences.'
    }
  ];

  for (const ex of examples) {
    messages.push({ role: 'user', content: JSON.stringify(ex.input) });
    messages.push({ role: 'assistant', content: ex.output });
  }

  messages.push({ role: 'user', content: JSON.stringify(structure) });

  const response = await getOpenAIClient().chat.completions.create({
    model,
    messages,
    temperature: 0.0
  });

  return response.choices[0].message.content.replace(/[()]/g, '');
}

/**
 * Main pipeline translator
 */
export async function translatePipeline(englishSentence, model = 'gpt-4o-mini') {
  const TRANSLATION_QUALITY_THRESHOLD = 0.8;

  // Split into simple sentences
  const simpleSentences = await splitSentence(englishSentence, model);

  // Translate each simple sentence
  const targetSentences = [];
  const backTranslations = [];

  for (const sentence of simpleSentences.sentences) {
    const translated = translateSimple(sentence);

    // Build Paiute sentence
    try {
      const paiuteParts = formatSentence(translated);
      const paiuteText = paiuteParts.map(p => p.text).join(' ');
      targetSentences.push(paiuteText);
    } catch (e) {
      // If formatSentence fails, construct manually
      let paiuteText = '';
      if (translated.subject_suffix) {
        paiuteText = `${translated.subject_noun}-${translated.subject_suffix}`;
      } else {
        paiuteText = translated.subject_noun;
      }

      if (translated.object_noun && translated.object_suffix) {
        paiuteText += ` ${translated.object_noun}-${translated.object_suffix}`;
      }

      if (translated.object_pronoun) {
        const lenisVerb = toLenis(translated.verb);
        paiuteText += ` ${translated.object_pronoun}-${lenisVerb}-${translated.verb_tense}`;
      } else {
        paiuteText += ` ${translated.verb}-${translated.verb_tense}`;
      }

      targetSentences.push(paiuteText);
    }

    // Back translate
    const backTrans = await translateOvpToEnglish(translated, 'gpt-3.5-turbo');
    backTranslations.push(backTrans.trim().replace(/\.$/, ''));
  }

  // Generate natural English for simple sentences
  const simpleEnglish = await makeSentence(simpleSentences, model);

  // Calculate semantic similarities
  const targetPaiute = targetSentences.join('. ') + '.';
  const backEnglish = backTranslations.join('. ') + '.';

  const [simSimple, simBackwards] = await Promise.all([
    semanticSimilarity(englishSentence, simpleEnglish),
    semanticSimilarity(englishSentence, backEnglish)
  ]);

  // Determine quality message
  let warning = '';
  let message = '';

  if (simSimple < TRANSLATION_QUALITY_THRESHOLD) {
    warning = 'The input sentence is complex, so a lot of meaning may have been lost in breaking it down into simple sentences.';
  } else if (simBackwards < TRANSLATION_QUALITY_THRESHOLD) {
    warning = "The translation doesn't seem to be very accurate.";
  } else {
    message = 'The translation is probably pretty good!';
  }

  return {
    english: backEnglish,
    paiute: targetPaiute,
    message,
    warning
  };
}

// Helper for Lenis conversion (duplicated for this module)
function toLenis(word) {
  if (!word) return word;
  const LENIS_MAP = { 'p': 'b', 't': 'd', 'k': 'g', 's': 'z', 'm': 'w̃' };
  const firstLetter = word[0];
  if (LENIS_MAP[firstLetter]) {
    return LENIS_MAP[firstLetter] + word.slice(1);
  }
  return word;
}

/**
 * Translate builder sentence to English
 */
export async function translateBuilderToEnglish(params, model = 'gpt-3.5-turbo') {
  return await translateOvpToEnglish(params, model);
}
