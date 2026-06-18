// Model registry — maps display name to provider config
export type ModelProvider = 'groq' | 'openrouter'

export interface ModelConfig {
  id:         string           // API model ID
  label:      string           // Display name
  provider:   ModelProvider
  free:       boolean          // Available on free tier
  keyEnv:     string           // Which env key to use
}

export const MODELS: Record<string, ModelConfig> = {
  'llama3':  { id:'llama-3.3-70b-versatile',          label:'Llama 3.3',     provider:'groq',        free:true,  keyEnv:'groqKey' },
  'mixtral': { id:'mixtral-8x7b-32768',               label:'Mixtral 8x7B',  provider:'groq',        free:true,  keyEnv:'groqKey' },
  'gemma2':  { id:'gemma2-9b-it',                     label:'Gemma 2',       provider:'groq',        free:true,  keyEnv:'groqKey' },
  'gpt4o':   { id:'openai/gpt-4o',                    label:'GPT-4o',        provider:'openrouter',  free:false, keyEnv:'openrouterKey' },
  'claude':  { id:'anthropic/claude-3.5-sonnet',      label:'Claude 3.5',    provider:'openrouter',  free:false, keyEnv:'openrouterKey' },
  'gemini':  { id:'google/gemini-flash-1.5',          label:'Gemini 1.5',    provider:'openrouter',  free:true,  keyEnv:'openrouterKey' },
  'grok':    { id:'x-ai/grok-beta',                   label:'Grok-2',        provider:'openrouter',  free:false, keyEnv:'openrouterKey' },
  'mistral': { id:'mistralai/mistral-7b-instruct',    label:'Mistral 7B',    provider:'openrouter',  free:true,  keyEnv:'openrouterKey' },
}

// GhostAll — synthesizes best response from multiple models
export const GHOST_ALL_MODELS = ['llama3', 'mixtral', 'gemma2'] // free Groq models for synthesis

export const GROQ_ENDPOINT       = 'https://api.groq.com/openai/v1/chat/completions'
export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
