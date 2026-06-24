'use client'
import { useState, useRef, useEffect } from 'react'
import { Key } from 'iconoir-react'
import { useDash } from '../layout'

type Msg = { role:'user'|'assistant'; content:string; model?:string }

const MODEL_OPTIONS = [
  { key:'ghostall', label:'GhostAll',     desc:'Blends the free Groq models', free:true  },
  { key:'llama3',   label:'Llama 3.3',   desc:'Groq — fast, free',           free:true  },
  { key:'mixtral',  label:'Mixtral 8x7B',desc:'Groq — strong reasoning',     free:true  },
  { key:'gemma2',   label:'Gemma 2',     desc:'Groq — efficient',            free:true  },
  { key:'gpt4o',    label:'GPT-4o',      desc:'OpenRouter key required',     free:false },
  { key:'claude',   label:'Claude 3.5',  desc:'OpenRouter key required',     free:false },
  { key:'gemini',   label:'Gemini 1.5',  desc:'OpenRouter key required',     free:false },
  { key:'grok',     label:'Grok-2',      desc:'OpenRouter key required',     free:false },
  { key:'mistral',  label:'Mistral 7B',  desc:'OpenRouter key required',     free:false },
]

export default function ChatPage() {
  const { groqKey, ghostRef, user } = useDash()
  const initials = user?.name?.split(' ').map((p:string)=>p[0]).join('').toUpperCase().slice(0,2) || 'You'
  const [msgs,    setMsgs]    = useState<Msg[]>([{
    role:'assistant',
    content:"yo, I'm Casper 👻 GhostAll blends answers from Llama 3.3, Mixtral and Gemma — free via your Groq key. Add an OpenRouter key to pull in GPT-4o, Claude and Gemini. what are we cooking today?",
  }])
  const [input,         setInput]         = useState('')
  const [busy,          setBusy]          = useState(false)
  const [activeModel,   setActiveModel]   = useState('ghostall')
  const [openrouterKey, setOpenrouterKey] = useState('')
  const [showKeyInput,  setShowKeyInput]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const k = localStorage.getItem('gw_openrouter_key') || ''
    setOpenrouterKey(k)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs])

  const saveOpenRouterKey = (k: string) => {
    setOpenrouterKey(k)
    localStorage.setItem('gw_openrouter_key', k)
    setShowKeyInput(false)
  }

  const send = async () => {
    const t = input.trim()
    if (!t || busy) return
    if (!groqKey) { ghostRef.current?.setState('error'); setTimeout(()=>ghostRef.current?.setState('idle'),1800); return }

    setInput('')
    const newMsgs: Msg[] = [...msgs, { role:'user', content:t }]
    setMsgs(newMsgs)
    setBusy(true)
    ghostRef.current?.setState('writing')

    setMsgs(m => [...m, { role:'assistant', content:'', model:activeModel }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'Authorization':   `Bearer ${groqKey}`,
          'x-openrouter-key': openrouterKey,
        },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role:m.role, content:m.content })),
          model:    activeModel,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')

      setMsgs(m => [...m.slice(0,-1), { role: 'assistant', content: data.reply, model: data.model }])
      ghostRef.current?.setState('success')
      setTimeout(() => ghostRef.current?.setState('idle'), 1800)
    } catch(e: any) {
      setMsgs(m => [...m.slice(0,-1), { role:'assistant', content:`Error: ${e.message}`, model: activeModel }])
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
    }
    setBusy(false)
  }

  const modelCfg = MODEL_OPTIONS.find(m => m.key === activeModel)
  const needsOR  = modelCfg && !modelCfg.free && !openrouterKey

  return (
    <div className="flex flex-col h-full animate-fade-up max-w-4xl mx-auto w-full" style={{ maxHeight:'calc(100vh - 130px)' }}>

      {/* Model selector */}
      <div className="flex gap-2 flex-wrap mb-3 shrink-0">
        {MODEL_OPTIONS.map(m => (
          <button key={m.key} onClick={() => setActiveModel(m.key)}
            title={m.desc}
            className={`btn px-3 py-1.5 text-[11px] rounded-full border-2 border-ink
              ${activeModel === m.key
                ? 'bg-blue text-white'
                : m.free ? 'bg-paper3 text-ink2 hover:bg-paper2' : 'bg-paper2 text-mute hover:bg-paper3'}`}>
            {m.label}
            {!m.free && <span className="ml-1 text-[9px] opacity-60">OR</span>}
          </button>
        ))}
        <button onClick={() => setShowKeyInput(!showKeyInput)}
          className={`btn inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full border-2 border-ink ml-auto
            ${openrouterKey ? 'bg-mint text-white' : 'bg-paper3 text-ink2 hover:bg-paper2'}`}>
          <Key className="w-3 h-3" aria-hidden />
          {openrouterKey ? 'OR Connected' : 'Add OpenRouter key'}
        </button>
      </div>

      {/* OpenRouter key input */}
      {showKeyInput && (
        <div className="flex gap-2 mb-3 shrink-0 animate-fade-up">
          <input
            defaultValue={openrouterKey}
            placeholder="sk-or-xxxxxxxxxxxxxxxx — get free key at openrouter.ai"
            className="flex-1 bg-paper border-2 border-ink rounded-full px-4 py-2 text-ink text-[12.5px] outline-none focus:bg-paper3 transition-colors placeholder:text-mute font-body"
            id="or-key-inp"
          />
          <button
            onClick={() => { const v = (document.getElementById('or-key-inp') as HTMLInputElement).value.trim(); if (v) saveOpenRouterKey(v) }}
            className="btn btn-primary px-5 py-2 text-[12px] rounded-full">
            Save
          </button>
          <button onClick={() => setShowKeyInput(false)}
            className="btn btn-ghost px-4 py-2 text-[12px] rounded-full border-2 border-ink">
            Cancel
          </button>
        </div>
      )}

      {/* OpenRouter warning */}
      {needsOR && (
        <div className="px-4 py-3 rounded-xl2 bg-sun border-2 border-ink text-ink text-[13px] font-medium mb-3 shrink-0 flex items-center justify-between gap-3">
          <span>{modelCfg.label} requires an OpenRouter key. Add one above, or switch to a free model.</span>
          <button onClick={() => setActiveModel('ghostall')}
            className="btn btn-ink text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full">
            Use GhostAll
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="b-card rounded-xl3 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink shrink-0">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[10px] text-coral">Conversation</span>
            <span className="px-2 py-0.5 rounded-full font-mono font-semibold text-[9.5px] bg-blue text-white border-2 border-ink">
              {modelCfg?.label || 'GhostAll'}
            </span>
          </div>
          <button
            onClick={() => setMsgs([{ role:'assistant', content:'Chat cleared. Ready.' }])}
            className="btn btn-ghost px-3 py-1 text-[11px] rounded-full border-2 border-ink">
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2.5 items-end animate-fade-up ${m.role==='user'?'flex-row-reverse':''}`}>
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border-2 border-ink
                font-mono font-bold text-[10px] text-white ${m.role==='user' ? 'bg-coral' : 'bg-blue'}`}>
                {m.role==='user' ? initials : 'GW'}
              </div>
              <div className="flex flex-col gap-1 max-w-[78%]">
                {m.role==='assistant' && m.model && m.content && (
                  <span className="text-[9.5px] font-mono text-mute px-1">
                    {MODEL_OPTIONS.find(o=>o.key===m.model)?.label || m.model}
                  </span>
                )}
                <div className={`px-3.5 py-2.5 text-[13px] leading-[1.65] border-2 border-ink rounded-xl2
                  ${m.role==='user' ? 'bg-paper2 text-ink rounded-tr-sm' : 'bg-paper3 text-ink rounded-tl-sm'}`}>
                  {m.content
                    ? m.content
                    : busy && i === msgs.length-1
                      ? <span className="flex items-center gap-2 text-ink2">
                          <span className="w-3 h-3 border-2 border-ink/30 border-t-ink rounded-full animate-spin"/>
                          {activeModel==='ghostall' ? 'Synthesizing 3 models…' : `${modelCfg?.label} thinking…`}
                        </span>
                      : null}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2.5 px-4 py-3 border-t-2 border-ink bg-paper2 shrink-0 rounded-b-xl3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
            placeholder={
              needsOR ? `Add OpenRouter key to use ${modelCfg?.label}…` : "Drop your idea — we'll amplify it, lowkey invisibly…"
            }
            disabled={!!needsOR}
            className="flex-1 bg-paper border-2 border-ink rounded-full px-4 py-2.5 text-ink text-[13.5px] outline-none focus:bg-paper3 transition-colors placeholder:text-mute font-body disabled:opacity-40"
          />
          <button onClick={send} disabled={busy || !input.trim() || !!needsOR}
            className="btn btn-primary px-5 py-2.5 text-[13px] rounded-full disabled:opacity-40 whitespace-nowrap">
            Send →
          </button>
        </div>
      </div>
    </div>
  )
}
