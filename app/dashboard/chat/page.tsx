'use client'
import { useState, useRef, useEffect } from 'react'
import { useDash } from '../layout'

type Msg = { role:'user'|'assistant'; content:string; model?:string }

const MODEL_OPTIONS = [
  { key:'ghostall', label:'👻 GhostAll',  desc:'All free models synthesized', free:true  },
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
  const { groqKey, ghostRef } = useDash()
  const [msgs,    setMsgs]    = useState<Msg[]>([{
    role:'assistant',
    content:"Hello. I'm GhostWrite — invisible craft, visible results. GhostAll synthesizes responses from Llama 3.3, Mixtral, and Gemma simultaneously for the strongest answer. Add an OpenRouter key to unlock GPT-4o, Claude, and Gemini. What would you like to write?",
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

    // Optimistic placeholder
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

      setMsgs(m => [...m.slice(0,-1), {
        role: 'assistant',
        content: data.reply,
        model: data.model,
      }])
      ghostRef.current?.setState('success')
      setTimeout(() => ghostRef.current?.setState('idle'), 1800)
    } catch(e: any) {
      setMsgs(m => [...m.slice(0,-1), {
        role:'assistant',
        content:`Error: ${e.message}`,
        model: activeModel,
      }])
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
    }
    setBusy(false)
  }

  const modelCfg = MODEL_OPTIONS.find(m => m.key === activeModel)
  const needsOR  = modelCfg && !modelCfg.free && !openrouterKey

  return (
    <div className="flex flex-col h-full animate-fade-up" style={{ maxHeight:'calc(100vh - 130px)' }}>

      {/* Model selector */}
      <div className="flex gap-2 flex-wrap mb-3 shrink-0">
        {MODEL_OPTIONS.map(m => (
          <button key={m.key} onClick={() => setActiveModel(m.key)}
            title={m.desc}
            className={`px-3 py-1.5 rounded-full font-label font-semibold text-[11px] border transition-all
              ${activeModel === m.key
                ? 'bg-fl/10 border-pp/30 text-fl'
                : m.free
                  ? 'bg-white/4 border-white/8 text-gg2 hover:border-white/15 hover:text-gg'
                  : 'bg-white/3 border-white/6 text-gg3 hover:border-white/12 hover:text-gg2'}`}>
            {m.label}
            {!m.free && <span className="ml-1 text-[9px] opacity-60">OR</span>}
          </button>
        ))}
        <button onClick={() => setShowKeyInput(!showKeyInput)}
          className={`px-3 py-1.5 rounded-full font-label font-semibold text-[11px] border transition-all ml-auto
            ${openrouterKey
              ? 'bg-bg/10 border-bg/25 text-bg'
              : 'bg-white/4 border-white/8 text-gg2 hover:bg-white/8'}`}>
          {openrouterKey ? '🔑 OR Connected' : '🔑 Add OpenRouter key'}
        </button>
      </div>

      {/* OpenRouter key input */}
      {showKeyInput && (
        <div className="flex gap-2 mb-3 shrink-0 animate-fade-up">
          <input
            defaultValue={openrouterKey}
            placeholder="sk-or-xxxxxxxxxxxxxxxx — get free key at openrouter.ai"
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2
              text-sw text-[12.5px] outline-none focus:border-pp transition-all placeholder:text-gg3 font-body"
            id="or-key-inp"
          />
          <button
            onClick={() => {
              const v = (document.getElementById('or-key-inp') as HTMLInputElement).value.trim()
              if (v) saveOpenRouterKey(v)
            }}
            className="px-5 py-2 rounded-full font-label font-bold text-[12px] text-white
              bg-pp hover:bg-pp2 transition-all shadow-[0_3px_10px_rgba(124,92,252,0.28)]">
            Save
          </button>
          <button onClick={() => setShowKeyInput(false)}
            className="px-4 py-2 rounded-full font-label font-semibold text-[12px]
              text-gg bg-white/5 border border-white/8 hover:bg-white/10">
            Cancel
          </button>
        </div>
      )}

      {/* OpenRouter warning */}
      {needsOR && (
        <div className="px-4 py-3 rounded-xl bg-wa/8 border border-wa/25 text-wa text-[13px]
          font-label mb-3 shrink-0 flex items-center justify-between gap-3">
          <span>{modelCfg.label} requires an OpenRouter key. Add one above, or switch to a free model.</span>
          <button onClick={() => setActiveModel('ghostall')}
            className="text-[11px] font-bold whitespace-nowrap bg-wa/10 border border-wa/25
              px-3 py-1.5 rounded-full hover:bg-wa/20 transition-all">
            Use GhostAll
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="glass rounded-xl flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">Conversation</span>
            <span className="px-2 py-0.5 rounded-full font-label font-semibold text-[9.5px]
              bg-pp/10 border border-pp/25 text-pp2">
              {modelCfg?.label || 'GhostAll'}
            </span>
          </div>
          <button
            onClick={() => setMsgs([{ role:'assistant', content:'Chat cleared. Ready.' }])}
            className="px-3 py-1 rounded-full text-[11px] font-label font-semibold
              text-gg bg-white/5 border border-white/8 hover:bg-white/10 transition-all">
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2.5 items-end animate-fade-up ${m.role==='user'?'flex-row-reverse':''}`}>
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center
                font-label font-bold text-[10px] text-white
                ${m.role==='user'
                  ? 'bg-gradient-to-br from-ae to-[#8B4513]'
                  : 'bg-gradient-to-br from-pp to-pp3 shadow-[0_2px_8px_rgba(124,92,252,0.28)]'}`}>
                {m.role==='user' ? 'ZM' : 'GW'}
              </div>
              <div className="flex flex-col gap-1 max-w-[78%]">
                {m.role==='assistant' && m.model && m.content && (
                  <span className="text-[9.5px] font-label text-gg3 px-1">
                    {MODEL_OPTIONS.find(o=>o.key===m.model)?.label || m.model}
                  </span>
                )}
                <div className={`px-3.5 py-2.5 text-[13px] leading-[1.65] border rounded-2xl
                  ${m.role==='user'
                    ? 'bg-fl/5 border-pp/20 text-sw rounded-tr-sm'
                    : 'bg-white/5 border-white/8 text-sw rounded-tl-sm'}`}>
                  {m.content
                    ? m.content
                    : busy && i === msgs.length-1
                      ? <span className="flex items-center gap-2 text-gg">
                          <span className="w-3 h-3 border-2 border-gg/30 border-t-gg rounded-full animate-spin"/>
                          {activeModel==='ghostall' ? 'Synthesizing 3 models…' : `${modelCfg?.label} thinking…`}
                        </span>
                      : null}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2.5 px-4 py-3 border-t border-white/6 bg-vb2/50 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
            placeholder={
              needsOR
                ? `Add OpenRouter key to use ${modelCfg?.label}…`
                : "Write anything — your ideas, amplified invisibly…"
            }
            disabled={!!needsOR}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5
              text-sw text-[13.5px] outline-none focus:border-pp transition-all
              placeholder:text-gg3 font-body disabled:opacity-40"
          />
          <button onClick={send} disabled={busy || !input.trim() || !!needsOR}
            className="px-5 py-2.5 rounded-full font-label font-bold text-[13px] text-white
              bg-pp hover:bg-pp2 transition-all shadow-[0_3px_10px_rgba(124,92,252,0.30)]
              disabled:opacity-40 whitespace-nowrap">
            Send →
          </button>
        </div>
      </div>
    </div>
  )
}
