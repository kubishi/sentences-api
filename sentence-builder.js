/**
 * Owens Valley Paiute Sentence Builder Logic
 * Ported from Python yaduha library
 */

export const NOUNS = {
  "isha'": "coyote",
  "isha'pugu": "dog",
  "kidi'": "cat",
  "pugu": "horse",
  "wai": "rice",
  "tüba": "pinenuts",
  "maishibü": "corn",
  "paya": "water",
  "payahuupü": "river",
  "katünu": "chair",
  "toyabi": "mountain",
  "tuunapi": "food",
  "pasohobü": "tree",
  "nobi": "house",
  "toni": "wickiup",
  "apo": "cup",
  "küna": "wood",
  "tübbi": "rock",
  "tabuutsi'": "cottontail",
  "kamü": "jackrabbit",
  "aaponu'": "apple",
  "tüsüga": "weasle",
  "mukita": "lizard",
  "wo'ada": "mosquito",
  "wükada": "bird snake",
  "wo'abi": "worm",
  "aingwü": "squirrel",
  "tsiipa": "bird",
  "tüwoobü": "earth",
  "koopi'": "coffee",
  "pahabichi": "bear",
  "pagwi": "fish",
  "kwadzi": "tail",
};

export const POSSESSIVE_PRONOUNS = {
  'i': 'my',
  'u': 'his/her/its (distal)',
  'ui': 'their (distal)',
  'ma': 'his/her/its (proximal)',
  'mai': 'their (proximal)',
  'a': 'his/her/its (proximal)',
  'ai': 'their (proximal)',
  'ni': 'our (plural, exclusive)',
  'tei': 'our (plural, inclusive)',
  'ta': 'our (dual), you and I',
  'ü': 'your (singular)',
  'üi': 'your (plural), you all',
  'tü': 'his/her/its own',
  'tüi': 'their own',
};

export const Subject = {
  SUFFIXES: {
    'ii': 'proximal',
    'uu': 'distal',
  },
  PRONOUNS: {
    "nüü": "I",
    "uhu": "he/she/it",
    "uhuw̃a": "they",
    "mahu": "he/she/it",
    "mahuw̃a": "they",
    "ihi": "this",
    "ihiw̃a": "these",
    "taa": "you and I",
    "nüügwa": "we (exclusive)",
    "taagwa": "we (inclusive)",
    "üü": "you",
    "üügwa": "you (plural)",
  }
};

export const Verb = {
  TENSES: {
    'ku': 'completive (past)',
    'ti': 'present ongoing (-ing)',
    'dü': 'present',
    'wei': 'future (will)',
    'gaa-wei': 'future (going to)',
    'pü': 'have x-ed, am x-ed',
  },
  NOMINALIZER_TENSES: {
    'dü': 'present',
    'weidü': 'future (will)',
  },
  TRANSITIVE_VERBS: {
    'tüka': 'eat',
    'puni': 'see',
    'hibi': 'drink',
    'naka': 'hear',
    'kwana': 'smell',
    'kwati': 'hit',
    'yadohi': 'talk to',
    'naki': 'chase',
    'tsibui': 'climb',
    'sawa': 'cook',
    "tama'i": 'find',
    'nia': 'read',
    'mui': 'write',
    'nobini': 'visit',
  },
  INTRANSITIVE_VERBS: {
    'katü': 'sit',
    'üwi': 'sleep',
    "kwisha'i": 'sneeze',
    'poyoha': 'run',
    'mia': 'go',
    'hukaw̃ia': 'walk',
    'wünü': 'stand',
    'habi': 'lie down',
    'yadoha': 'talk',
    "kwatsa'i": 'fall',
    'waakü': 'work',
    'wükihaa': 'smile',
    'hubiadu': 'sing',
    "nishua'i": 'laugh',
    'tsibui': 'climb',
    'tübinohi': 'play',
    'yotsi': 'fly',
    'nüga': 'dance',
    'pahabi': 'swim',
    'tünia': 'read',
    'tümui': 'write',
    "tsiipe'i": 'chirp',
  }
};

export const ObjectDef = {
  SUFFIXES: {
    'eika': 'proximal',
    'oka': 'distal',
  },
  PRONOUNS: {
    'i': 'me',
    'u': 'him/her/it (distal)',
    'ui': 'them (distal)',
    'ma': 'him/her/it (proximal)',
    'mai': 'them (proximal)',
    'a': 'him/her/it (proximal)',
    'ai': 'them (proximal)',
    'ni': 'us (plural, exclusive)',
    'tei': 'us (plural, inclusive)',
    'ta': 'us (dual), you and I',
    'ü': 'you (singular)',
    'üi': 'you (plural), you all',
  }
};

const LENIS_MAP = {
  'p': 'b',
  't': 'd',
  'k': 'g',
  's': 'z',
  'm': 'w̃'
};

function toLenis(word) {
  if (!word) return word;
  const firstLetter = word[0];
  if (LENIS_MAP[firstLetter]) {
    return LENIS_MAP[firstLetter] + word.slice(1);
  }
  return word;
}

function isTransitive(verbStem) {
  return !isIntransitive(verbStem);
}

function isIntransitive(verbStem) {
  return verbStem in Verb.INTRANSITIVE_VERBS && !(verbStem in Verb.TRANSITIVE_VERBS);
}

export function getMatchingSuffix(objectPronoun) {
  if (!objectPronoun) return null;
  const def = ObjectDef.PRONOUNS[objectPronoun];
  if (!def) return null;
  if (def.includes('proximal')) return 'eika';
  if (def.includes('distal')) return 'oka';
  return null;
}

export function getMatchingThirdPersonPronouns(objectSuffix) {
  const proximalPronouns = Object.keys(ObjectDef.PRONOUNS).filter(
    p => ObjectDef.PRONOUNS[p].includes('proximal')
  );
  const distalPronouns = Object.keys(ObjectDef.PRONOUNS).filter(
    p => ObjectDef.PRONOUNS[p].includes('distal')
  );
  const thirdPersonPronouns = [...proximalPronouns, ...distalPronouns];

  if (!objectSuffix) return thirdPersonPronouns;
  if (objectSuffix === 'eika') return proximalPronouns;
  if (objectSuffix === 'oka') return distalPronouns;
  return thirdPersonPronouns;
}

export function getAllChoices({
  subject_noun = null,
  subject_noun_nominalizer = null,
  subject_suffix = null,
  subject_possessive_pronoun = null,
  verb = null,
  verb_tense = null,
  object_pronoun = null,
  object_noun = null,
  object_noun_nominalizer = null,
  object_suffix = null,
  object_possessive_pronoun = null
} = {}) {
  const isVerbWild = verb && verb.startsWith('[') && verb.endsWith(']');
  const isSubjectNounWild = subject_noun && subject_noun.startsWith('[') && subject_noun.endsWith(']');
  const isObjectNounWild = object_noun && object_noun.startsWith('[') && object_noun.endsWith(']');

  const allNouns = { ...Subject.PRONOUNS, ...NOUNS, ...Verb.TRANSITIVE_VERBS, ...Verb.INTRANSITIVE_VERBS };

  // Validate inputs
  if (subject_noun && !(subject_noun in allNouns) && !isSubjectNounWild) {
    subject_noun = null;
  }
  if (subject_noun_nominalizer && !(subject_noun_nominalizer in Verb.NOMINALIZER_TENSES)) {
    subject_noun_nominalizer = null;
  }
  if (subject_suffix && !(subject_suffix in Subject.SUFFIXES)) {
    subject_suffix = null;
  }
  const allVerbs = { ...Verb.TRANSITIVE_VERBS, ...Verb.INTRANSITIVE_VERBS };
  if (verb && !(verb in allVerbs) && !isVerbWild) {
    verb = null;
  }
  if (verb_tense && !(verb_tense in Verb.TENSES)) {
    verb_tense = null;
  }
  if (object_pronoun && !(object_pronoun in ObjectDef.PRONOUNS)) {
    object_pronoun = null;
  }
  const objectNouns = { ...NOUNS, ...Verb.TRANSITIVE_VERBS, ...Verb.INTRANSITIVE_VERBS };
  if (object_noun && !(object_noun in objectNouns) && !isObjectNounWild) {
    object_noun = null;
  }
  if (object_suffix && !(object_suffix in ObjectDef.SUFFIXES)) {
    object_suffix = null;
  }
  if (object_noun_nominalizer && !(object_noun_nominalizer in Verb.NOMINALIZER_TENSES)) {
    object_noun_nominalizer = null;
  }

  // Check object_pronoun and object_suffix match
  if (object_pronoun && object_suffix) {
    if (!getMatchingThirdPersonPronouns(object_suffix).includes(object_pronoun)) {
      object_suffix = null;
    }
  }

  const choices = {};

  // Subject noun
  const subjectNouns = { ...NOUNS, ...Subject.PRONOUNS };
  choices.subject_noun = {
    choices: subjectNouns,
    value: subject_noun,
    requirement: "required"
  };

  // Subject suffix
  if (!subject_noun || subject_noun in Subject.PRONOUNS) {
    choices.subject_suffix = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
    subject_suffix = null;
    choices.subject_possessive_pronoun = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
  } else {
    choices.subject_suffix = {
      choices: Subject.SUFFIXES,
      value: subject_suffix,
      requirement: "required"
    };
    choices.subject_possessive_pronoun = {
      choices: POSSESSIVE_PRONOUNS,
      value: subject_possessive_pronoun,
      requirement: "optional"
    };
  }

  // Subject noun nominalizer
  if (subject_noun in Verb.TRANSITIVE_VERBS || subject_noun in Verb.INTRANSITIVE_VERBS) {
    choices.subject_noun_nominalizer = {
      choices: Verb.NOMINALIZER_TENSES,
      value: subject_noun_nominalizer,
      requirement: "required"
    };
  } else {
    choices.subject_noun_nominalizer = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
    subject_noun_nominalizer = null;
  }

  // Verb
  if (object_noun) {
    if (!isTransitive(verb)) {
      verb = null;
    }
    choices.verb = {
      choices: Verb.TRANSITIVE_VERBS,
      value: isTransitive(verb) ? verb : null,
      requirement: "required"
    };
  } else {
    choices.verb = {
      choices: { ...Verb.TRANSITIVE_VERBS, ...Verb.INTRANSITIVE_VERBS },
      value: verb,
      requirement: "required"
    };
  }

  // Verb tense
  if (!verb) {
    choices.verb_tense = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
    verb_tense = null;
  } else {
    choices.verb_tense = {
      choices: Verb.TENSES,
      value: verb_tense,
      requirement: "required"
    };
  }

  // Object pronoun
  if (!verb || isIntransitive(verb)) {
    choices.object_pronoun = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
    object_pronoun = null;
  } else if (object_noun) {
    const matchingPronouns = {};
    for (const p of getMatchingThirdPersonPronouns(object_suffix)) {
      matchingPronouns[p] = ObjectDef.PRONOUNS[p];
    }
    choices.object_pronoun = {
      choices: matchingPronouns,
      value: object_pronoun,
      requirement: "required"
    };
  } else {
    choices.object_pronoun = {
      choices: ObjectDef.PRONOUNS,
      value: object_pronoun,
      requirement: "optional"
    };
  }

  // Object noun
  const thirdPersonPronouns = getMatchingThirdPersonPronouns(null);
  if ((verb && isIntransitive(verb)) || (object_pronoun && !thirdPersonPronouns.includes(object_pronoun))) {
    choices.object_noun = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
    object_noun = null;
  } else {
    choices.object_noun = {
      choices: NOUNS,
      value: object_noun,
      requirement: "optional"
    };
  }

  // Object noun nominalizer
  if (object_noun in Verb.TRANSITIVE_VERBS || object_noun in Verb.INTRANSITIVE_VERBS) {
    choices.object_noun_nominalizer = {
      choices: Verb.NOMINALIZER_TENSES,
      value: object_noun_nominalizer,
      requirement: "required"
    };
  } else {
    choices.object_noun_nominalizer = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
    object_noun_nominalizer = null;
  }

  // Object suffix
  if (!object_noun) {
    choices.object_suffix = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
    object_suffix = null;
  } else if (object_pronoun) {
    const matchingSuffix = getMatchingSuffix(object_pronoun);
    choices.object_suffix = {
      choices: matchingSuffix ? { [matchingSuffix]: ObjectDef.SUFFIXES[matchingSuffix] } : {},
      value: object_suffix !== getMatchingSuffix(object_pronoun) ? null : object_suffix,
      requirement: "required"
    };
  } else {
    choices.object_suffix = {
      choices: ObjectDef.SUFFIXES,
      value: object_suffix,
      requirement: "required"
    };
  }

  // Object possessive pronoun
  if (!object_noun) {
    choices.object_possessive_pronoun = {
      choices: {},
      value: null,
      requirement: "disabled"
    };
  } else {
    choices.object_possessive_pronoun = {
      choices: POSSESSIVE_PRONOUNS,
      value: object_possessive_pronoun,
      requirement: "optional"
    };
  }

  return choices;
}

function buildSubjectText(noun, nominalizer, suffix, possessivePronoun) {
  let text;
  if (suffix === null) {
    text = noun;
  } else if (nominalizer) {
    text = `${noun}-${nominalizer}-${suffix}`;
  } else {
    text = `${noun}-${suffix}`;
  }
  if (possessivePronoun) {
    text = `${possessivePronoun}-${text}`;
  }
  return text;
}

function buildVerbText(verbStem, tense, objectPronounPrefix) {
  if (!objectPronounPrefix) {
    return `${verbStem}-${tense}`;
  } else {
    const lenisVerbStem = toLenis(verbStem);
    return `${objectPronounPrefix}-${lenisVerbStem}-${tense}`;
  }
}

function buildObjectText(noun, nominalizer, suffix, possessivePronoun) {
  let objectSuffix = suffix;
  if (!nominalizer) {
    // Check if noun ends in glottal stop
    if (!noun.slice(-2).includes("'")) {
      if (objectSuffix === 'eika') objectSuffix = 'neika';
      else if (objectSuffix === 'oka') objectSuffix = 'noka';
    }
  } else {
    if (objectSuffix === 'eika') {
      objectSuffix = `${nominalizer.slice(0, -1)}eika`;
    } else if (objectSuffix === 'oka') {
      objectSuffix = `${nominalizer.slice(0, -1)}oka`;
    }
  }
  let text = `${noun}-${objectSuffix}`;
  if (possessivePronoun) {
    text = `${possessivePronoun}-${text}`;
  }
  return text;
}

export function formatSentence({
  subject_noun,
  subject_noun_nominalizer = null,
  subject_suffix,
  subject_possessive_pronoun = null,
  verb,
  verb_tense,
  object_pronoun = null,
  object_noun = null,
  object_noun_nominalizer = null,
  object_suffix = null,
  object_possessive_pronoun = null
}) {
  // Validate subject
  if (!subject_noun) throw new Error("Subject noun is required");

  const isSubjectPronoun = subject_noun in Subject.PRONOUNS;

  if (isSubjectPronoun && subject_suffix) {
    throw new Error("Subject suffix is not allowed with pronouns");
  }
  if (!isSubjectPronoun && !subject_suffix) {
    throw new Error("Subject suffix is required with non-pronoun subjects");
  }

  // Build subject details
  const subjectText = buildSubjectText(subject_noun, subject_noun_nominalizer, subject_suffix, subject_possessive_pronoun);
  const subjectDetails = {
    type: 'subject',
    text: subjectText,
    parts: []
  };

  if (isSubjectPronoun) {
    subjectDetails.parts.push({
      type: 'pronoun',
      text: subject_noun,
      definition: Subject.PRONOUNS[subject_noun]
    });
  } else {
    subjectDetails.parts.push({
      type: 'noun',
      text: subject_noun,
      definition: NOUNS[subject_noun] || `[${subject_noun}]`
    });
    if (subject_suffix) {
      subjectDetails.parts.push({
        type: 'subject_suffix',
        text: subject_suffix,
        definition: Subject.SUFFIXES[subject_suffix]
      });
    }
  }

  // Build verb details
  if (!verb || !verb_tense) throw new Error("Verb and tense are required");

  const verbText = buildVerbText(verb, verb_tense, object_pronoun);
  const verbDetails = {
    type: 'verb',
    text: verbText,
    parts: []
  };

  if (object_pronoun) {
    verbDetails.parts.push({
      type: 'object_pronoun',
      text: object_pronoun,
      definition: ObjectDef.PRONOUNS[object_pronoun]
    });
  }
  verbDetails.parts.push({
    type: 'verb_stem',
    text: verb,
    definition: Verb.TRANSITIVE_VERBS[verb] || Verb.INTRANSITIVE_VERBS[verb] || `[${verb}]`
  });
  verbDetails.parts.push({
    type: 'tense',
    text: verb_tense,
    definition: Verb.TENSES[verb_tense]
  });

  // Build object details (if present)
  let objectDetails = null;
  if (object_noun && object_suffix) {
    // Check object_pronoun and object_suffix match
    if (object_pronoun && !getMatchingThirdPersonPronouns(object_suffix).includes(object_pronoun)) {
      throw new Error("Object pronoun and suffix do not match");
    }

    const objectText = buildObjectText(object_noun, object_noun_nominalizer, object_suffix, object_possessive_pronoun);
    objectDetails = {
      type: 'object',
      text: objectText,
      parts: []
    };

    objectDetails.parts.push({
      type: 'noun',
      text: object_noun,
      definition: NOUNS[object_noun] || `[${object_noun}]`
    });
    objectDetails.parts.push({
      type: 'object_suffix',
      text: object_suffix,
      definition: ObjectDef.SUFFIXES[object_suffix]
    });
  }

  // Order sentence based on subject type
  if (isSubjectPronoun) {
    if (objectDetails) {
      return [objectDetails, subjectDetails, verbDetails];
    } else {
      return [verbDetails, subjectDetails];
    }
  } else {
    if (objectDetails) {
      return [subjectDetails, objectDetails, verbDetails];
    } else {
      return [subjectDetails, verbDetails];
    }
  }
}

export function getRandomSimpleSentence(currentChoices = {}) {
  let choices = getAllChoices(
    Object.fromEntries(
      Object.entries(currentChoices).map(([k, v]) => [k, v?.value ?? null])
    )
  );

  const nounKeys = Object.keys(NOUNS);
  const allVerbKeys = [...Object.keys(Verb.TRANSITIVE_VERBS), ...Object.keys(Verb.INTRANSITIVE_VERBS)];

  // Pick random subject noun if not set
  if (!choices.subject_noun.value) {
    choices.subject_noun.value = nounKeys[Math.floor(Math.random() * nounKeys.length)];
  }

  // Pick random verb if not set
  if (!choices.verb.value) {
    choices.verb.value = allVerbKeys[Math.floor(Math.random() * allVerbKeys.length)];
  }

  // If verb is transitive, pick random object noun
  if (isTransitive(choices.verb.value)) {
    if (!choices.object_noun.value) {
      choices.object_noun.value = nounKeys[Math.floor(Math.random() * nounKeys.length)];
    }
  }

  // Recalculate choices
  choices = getAllChoices(
    Object.fromEntries(
      Object.entries(choices).map(([k, v]) => [k, v?.value ?? null])
    )
  );

  // Fill in remaining required fields randomly
  for (let i = 0; i < 20; i++) {
    let allFilled = true;
    for (const [key, choice] of Object.entries(choices)) {
      if (choice.requirement === 'required' && !choice.value) {
        const choiceKeys = Object.keys(choice.choices);
        if (choiceKeys.length > 0) {
          choice.value = choiceKeys[Math.floor(Math.random() * choiceKeys.length)];
          choices = getAllChoices(
            Object.fromEntries(
              Object.entries(choices).map(([k, v]) => [k, v?.value ?? null])
            )
          );
          allFilled = false;
          break;
        }
      }
    }
    if (allFilled) break;
  }

  return choices;
}

export function formatChoices(choices) {
  return Object.fromEntries(
    Object.entries(choices).map(([k, v]) => [
      k,
      {
        choices: Object.entries(v.choices).sort((a, b) => a[1].localeCompare(b[1])),
        value: v.value,
        requirement: v.requirement
      }
    ])
  );
}
