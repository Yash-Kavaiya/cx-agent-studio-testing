import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Bot, User, Plus, Loader2, BookmarkPlus, CheckCircle } from 'lucide-react'
import { useActiveProject } from '../hooks/useActiveProject'
import { sessionsApi, api } from '../services/api'

interface Message {
    role: 'user' | 'agent'
    text: string
    timestamp: Date
    toolCalls?: any[]
}

export default function LiveChat() {
    const { activeProject } = useActiveProject()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [entryAgent, setEntryAgent] = useState('')
    const [savedAsGolden, setSavedAsGolden] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const chatMutation = useMutation({
        mutationFn: (text: string) =>
            sessionsApi.chat(
                activeProject!.id,
                { text, entry_agent: entryAgent || undefined },
                sessionId || undefined
            ),
        onSuccess: (data) => {
            setSessionId(data.session_id)
            const agentTexts = data.outputs
                ?.map((o: any) => o.text || o.payload?.text || JSON.stringify(o))
                .filter(Boolean)
            setMessages((prev) => [
                ...prev,
                {
                    role: 'agent',
                    text: agentTexts?.join('\n') || 'No response',
                    timestamp: new Date(),
                    toolCalls: data.outputs?.flatMap((o: any) => o.toolCalls || []),
                },
            ])
        },
        onError: (error: any) => {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'agent',
                    text: `Error: ${error.response?.data?.detail || error.message}`,
                    timestamp: new Date(),
                },
            ])
        },
    })

    const goldenMutation = useMutation({
        mutationFn: () =>
            api.post(`/test-cases/from-conversation?project_id=${activeProject?.id}`, {
                messages: messages.map(m => ({ role: m.role, text: m.text })),
                session_id: sessionId,
                entry_agent: entryAgent || undefined,
            }).then(r => r.data),
        onSuccess: () => {
            setSavedAsGolden(true)
            setTimeout(() => setSavedAsGolden(false), 4000)
        },
    })

    const handleSend = () => {
        if (!input.trim() || !activeProject) return
        setMessages((prev) => [...prev, { role: 'user', text: input, timestamp: new Date() }])
        chatMutation.mutate(input)
        setInput('')
    }

    const handleNewSession = () => {
        setMessages([])
        setSessionId(null)
        setSavedAsGolden(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const hasConversation = messages.filter(m => m.role === 'agent').length >= 1 && messages.length >= 2

    if (!activeProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
                <Bot className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">No Project Selected</h2>
                <p className="text-gray-500 mt-2">
                    Go to <a href="/settings" className="text-primary-600 font-medium hover:underline">Settings</a> to select an active project, or{' '}
                    <a href="/projects" className="text-primary-600 font-medium hover:underline">create one</a> first.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Agent Chat</h1>
                    <p className="text-gray-500 text-sm">
                        Test your CES agent interactively — {activeProject.name}
                        {sessionId && (
                            <span className="ml-2 text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                                Session: {sessionId.slice(0, 8)}…
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        value={entryAgent}
                        onChange={(e) => setEntryAgent(e.target.value)}
                        placeholder="Entry agent (optional)"
                        className="input text-sm w-48"
                    />
                    {hasConversation && (
                        <button
                            onClick={() => goldenMutation.mutate()}
                            disabled={goldenMutation.isPending || savedAsGolden}
                            className={`btn text-sm flex items-center ${savedAsGolden ? 'btn-success' : 'btn-secondary'
                                }`}
                            title="Convert this conversation into a golden test case"
                        >
                            {savedAsGolden ? (
                                <><CheckCircle className="h-4 w-4 mr-1" /> Saved!</>
                            ) : goldenMutation.isPending ? (
                                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…</>
                            ) : (
                                <><BookmarkPlus className="h-4 w-4 mr-1" /> Save as Golden</>
                            )}
                        </button>
                    )}
                    <button onClick={handleNewSession} className="btn btn-secondary text-sm flex items-center">
                        <Plus className="h-4 w-4 mr-1" /> New Session
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Bot className="h-12 w-12 mb-3" />
                        <p className="font-medium">Start a conversation</p>
                        <p className="text-sm">Type a message below to test your CX agent</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-start gap-2 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-100' : 'bg-gray-100'
                                }`}>
                                {msg.role === 'user' ? (
                                    <User className="h-4 w-4 text-primary-600" />
                                ) : (
                                    <Bot className="h-4 w-4 text-gray-600" />
                                )}
                            </div>
                            <div>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-primary-600 text-white rounded-br-md'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.toolCalls && msg.toolCalls.length > 0 && (
                                    <details className="mt-1">
                                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                                            {msg.toolCalls.length} tool call(s)
                                        </summary>
                                        <pre className="mt-1 text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                                            {JSON.stringify(msg.toolCalls, null, 2)}
                                        </pre>
                                    </details>
                                )}
                                <p className="text-xs text-gray-400 mt-1 px-1">
                                    {msg.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {chatMutation.isPending && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-2xl rounded-bl-md">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                            <span className="text-sm text-gray-500">Agent is thinking…</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t pt-4">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                        className="input flex-1 resize-none h-12 min-h-[3rem] max-h-32"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || chatMutation.isPending}
                        className="btn btn-primary px-4 self-end"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
