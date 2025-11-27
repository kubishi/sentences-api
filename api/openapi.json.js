export default async function handler(req, res) {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Kubishi Sentences API",
      description: "API for the Owens Valley Paiute Sentence Builder and Translator. Build grammatically correct Paiute sentences and translate between English and Owens Valley Paiute.",
      version: "1.0.0",
      contact: {
        name: "Kubishi Research Group",
        url: "https://research.kubishi.com"
      }
    },
    servers: [
      {
        url: "https://api.sentences.kubishi.com",
        description: "Production server"
      }
    ],
    paths: {
      "/healthz": {
        get: {
          summary: "Health check",
          description: "Check if the API is running",
          operationId: "healthCheck",
          tags: ["System"],
          responses: {
            "200": {
              description: "API is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/builder/choices": {
        post: {
          summary: "Get available choices",
          description: "Get available dropdown choices for the sentence builder based on current selections. Returns valid options for each field and indicates which fields are required, optional, or disabled.",
          operationId: "getChoices",
          tags: ["Builder"],
          requestBody: {
            description: "Current selections (all fields optional)",
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BuilderSelections" },
                examples: {
                  empty: {
                    summary: "Empty selections",
                    value: {}
                  },
                  withSubject: {
                    summary: "With subject selected",
                    value: {
                      subject_noun: "isha'pugu",
                      subject_suffix: "ii"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Available choices and current sentence",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ChoicesResponse" }
                }
              }
            }
          }
        }
      },
      "/builder/random": {
        post: {
          summary: "Generate random sentence",
          description: "Generate a random valid Paiute sentence. Can optionally preserve some current selections.",
          operationId: "getRandomSentence",
          tags: ["Builder"],
          requestBody: {
            description: "Current selections to preserve (optional)",
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BuilderSelections" }
              }
            }
          },
          responses: {
            "200": {
              description: "Random sentence with choices",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ChoicesResponse" }
                }
              }
            }
          }
        }
      },
      "/builder/translate": {
        post: {
          summary: "Translate Paiute to English",
          description: "Translate a constructed Paiute sentence to English using GPT. Requires a valid sentence (subject + verb at minimum).",
          operationId: "translateBuilderSentence",
          tags: ["Builder"],
          requestBody: {
            description: "Sentence components",
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BuilderSelections" },
                example: {
                  subject_noun: "isha'pugu",
                  subject_suffix: "ii",
                  verb: "poyoha",
                  verb_tense: "ti"
                }
              }
            }
          },
          responses: {
            "200": {
              description: "English translation",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      translation: {
                        type: "string",
                        description: "English translation of the Paiute sentence",
                        example: "This dog is running."
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            },
            "500": {
              description: "Server error (e.g., missing API key)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        }
      },
      "/translator/translate": {
        post: {
          summary: "Translate English to Paiute",
          description: "Translate an English sentence to Owens Valley Paiute using an LLM-assisted rule-based translation pipeline. The system breaks complex sentences into simple SVO/SV structures, translates each, and validates with back-translation.",
          operationId: "translateEnglishToPaiute",
          tags: ["Translator"],
          requestBody: {
            description: "English text to translate",
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["english"],
                  properties: {
                    english: {
                      type: "string",
                      description: "English sentence to translate",
                      example: "The dog is running."
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Translation result",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TranslationResponse" }
                }
              }
            },
            "400": {
              description: "Invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        BuilderSelections: {
          type: "object",
          description: "Sentence component selections for the builder",
          properties: {
            subject_noun: {
              type: "string",
              description: "Subject noun or pronoun (e.g., 'isha\\'pugu' for dog, 'nüü' for I)",
              example: "isha'pugu"
            },
            subject_suffix: {
              type: "string",
              enum: ["ii", "uu"],
              description: "Subject suffix: 'ii' (proximal/nearby) or 'uu' (distal/far)"
            },
            verb: {
              type: "string",
              description: "Verb stem (e.g., 'poyoha' for run, 'tüka' for eat)",
              example: "poyoha"
            },
            verb_tense: {
              type: "string",
              enum: ["ku", "ti", "dü", "wei", "gaa-wei", "pü"],
              description: "Verb tense suffix"
            },
            object_pronoun: {
              type: "string",
              description: "Object pronoun prefix for transitive verbs"
            },
            object_noun: {
              type: "string",
              description: "Object noun (for transitive verbs)"
            },
            object_suffix: {
              type: "string",
              enum: ["eika", "oka"],
              description: "Object suffix: 'eika' (proximal) or 'oka' (distal)"
            }
          }
        },
        ChoicesResponse: {
          type: "object",
          properties: {
            choices: {
              type: "object",
              description: "Available choices for each field",
              additionalProperties: {
                type: "object",
                properties: {
                  choices: {
                    type: "array",
                    items: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 2,
                      maxItems: 2
                    },
                    description: "Array of [key, label] pairs"
                  },
                  value: {
                    type: "string",
                    nullable: true,
                    description: "Currently selected value"
                  },
                  requirement: {
                    type: "string",
                    enum: ["required", "optional", "disabled"],
                    description: "Whether this field is required, optional, or disabled"
                  }
                }
              }
            },
            sentence: {
              type: "array",
              description: "Formatted sentence parts (empty if sentence is incomplete)",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["subject", "verb", "object"]
                  },
                  text: {
                    type: "string",
                    description: "Formatted text for this word"
                  },
                  parts: {
                    type: "array",
                    description: "Component parts of this word"
                  }
                }
              }
            }
          }
        },
        TranslationResponse: {
          type: "object",
          properties: {
            english: {
              type: "string",
              description: "Back-translated English (what the Paiute means)",
              example: "The dog is running."
            },
            paiute: {
              type: "string",
              description: "Paiute translation",
              example: "Isha'pugu-ii poyoha-ti."
            },
            message: {
              type: "string",
              description: "Success message (if translation is good quality)"
            },
            warning: {
              type: "string",
              description: "Warning message (if translation quality is uncertain)"
            }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message"
            }
          }
        }
      }
    },
    tags: [
      {
        name: "Builder",
        description: "Sentence builder endpoints - construct Paiute sentences interactively"
      },
      {
        name: "Translator",
        description: "Translation endpoints - translate between English and Paiute"
      },
      {
        name: "System",
        description: "System endpoints"
      }
    ]
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(spec);
}
