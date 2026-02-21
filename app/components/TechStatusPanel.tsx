"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { TECNOLOGICO_FORM } from "../lib/formConfigs";

export default function TechStatusPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    // Initialize state
    const [questions, setQuestions] = useState(() => {
        return TECNOLOGICO_FORM.questions.map((q, index) => ({
            id: index,
            question: q,
            answer: "",
            status: "pending",
        }));
    });

    const [isLoaded, setIsLoaded] = useState(false);

    // SSE Fetch Stream
    useEffect(() => {
        let abortController = new AbortController();
        let isComponentMounted = true;
        let reconnectTimeout: NodeJS.Timeout;
        let retryAttempt = 0;

        const connectSSE = async () => {
            if (!isComponentMounted) return;

            try {
                // Buffer to prevent race conditions while snapshot loads
                let bufferedEvents: any[] = [];
                let isSnapshotLoaded = false;

                // 1. Connect SSE
                const res = await fetch('/api/tech-status', {
                    signal: abortController.signal,
                    headers: { 'Accept': 'text/event-stream' }
                });

                if (!res.ok || !res.body) {
                    throw new Error("Failed to connect");
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();

                // 2. Fetch snapshot concurrently
                fetch('/api/tech-status/snapshot', { signal: abortController.signal })
                    .then(snapRes => snapRes.json())
                    .then(result => {
                        if (!isComponentMounted) return;
                        // 3. Apply Snapshot
                        if (result.success && result.answers) {
                            const storedAnswers = result.answers;
                            if (Array.isArray(storedAnswers)) {
                                setQuestions(prev => prev.map((q, index) => ({
                                    ...q,
                                    answer: storedAnswers[index] || "",
                                    status: storedAnswers[index] ? "completed" : "pending"
                                })));
                            }
                        }
                        isSnapshotLoaded = true;
                        setIsLoaded(true);

                        // 4. Replay buffered events
                        bufferedEvents.forEach(applyEvent);
                        bufferedEvents = [];
                        retryAttempt = 0; // Reset backoff
                    })
                    .catch(e => { /* Ignore aborts */ });

                const applyEvent = (payload: any) => {
                    const newData = payload.new as any;
                    if (newData && newData.role === 'technical' && newData.answers) {
                        try {
                            const storedAnswers = typeof newData.answers === 'string' ? JSON.parse(newData.answers) : newData.answers;
                            if (Array.isArray(storedAnswers)) {
                                setQuestions(prev => prev.map((q, index) => ({
                                    ...q,
                                    answer: storedAnswers[index] || "",
                                    status: storedAnswers[index] ? "completed" : "pending"
                                })));
                            }
                        } catch (e) { }
                    }
                };

                // Read stream chunks
                let buffer = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() || ""; // Keep incomplete chunk in buffer

                    for (const part of parts) {
                        const line = part.trim();
                        if (!line || line.startsWith(':')) continue; // Skip comments/heartbeats

                        if (line.startsWith('data: ')) {
                            try {
                                const dataStr = line.substring(6); // Remove 'data: '
                                const payload = JSON.parse(dataStr);

                                if (payload.type === 'SESSION_EXPIRED') {
                                    return; // Bounded lifetime reached, do not reconnect
                                }

                                if (!isSnapshotLoaded) {
                                    bufferedEvents.push(payload);
                                } else {
                                    applyEvent(payload);
                                }
                            } catch (e) {
                                // Ignore parse errors of bad chunks
                            }
                        }
                    }
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
            }

            // Exponential Backoff Reconnection
            if (isComponentMounted) {
                const backoff = Math.min(1000 * Math.pow(2, retryAttempt), 30000);
                retryAttempt++;
                reconnectTimeout = setTimeout(connectSSE, backoff);
            }
        };

        connectSSE();

        return () => {
            isComponentMounted = false;
            abortController.abort();
            clearTimeout(reconnectTimeout);
        };

    }, []);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    const completedCount = questions.filter(q => q.status === "completed").length;
    const totalCount = questions.length;
    const progress = (completedCount / totalCount) * 100;

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
        if (editingId === id && expandedId === id) {
            setEditingId(null);
        }
    };

    const handleEditClick = (q: any) => {
        setEditingId(q.id);
        setEditValue(q.answer);
    };

    const handleSave = async (id: number) => {
        const updatedQuestions = questions.map(q =>
            q.id === id
                ? { ...q, answer: editValue, status: 'completed' }
                : q
        );
        setQuestions(updatedQuestions);
        setEditingId(null);

        // Save via our secure API route
        const answersArray = updatedQuestions.map(q => q.answer);
        try {
            await fetch('/api/tech-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: answersArray })
            });
        } catch (err) {
            // Silently handle error
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue("");
    };

    return (
        <div
            className={`fixed inset-y-0 right-0 w-96 bg-slate-50 transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? "translate-x-0" : "translate-x-full"
                }`}
        >
            <div className="flex flex-col h-full p-6 text-slate-900">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Estado Cuestionario Técnico</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2 text-slate-600">
                        <span>Progreso del equipo</span>
                        <span>{completedCount}/{totalCount} completado</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* List of Questions */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {!isLoaded ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                        </div>
                    ) : (
                        questions.map((q) => (
                            <div key={q.id} className="rounded-lg bg-slate-50 overflow-hidden">
                                <button
                                    onClick={() => toggleExpand(q.id)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {q.status === 'completed' ? (
                                            <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                                        ) : (
                                            <ClockIcon className="w-5 h-5 text-yellow-500 shrink-0" />
                                        )}
                                        <span className="text-sm font-medium text-slate-600 line-clamp-1">{q.question.replace(/^\d+\.\s*/, '')}</span>
                                    </div>
                                    {expandedId === q.id ? (
                                        <ChevronUpIcon className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                                    )}
                                </button>

                                {expandedId === q.id && (
                                    <div className="p-4 pt-0 text-sm text-slate-700 bg-slate-50">
                                        <p className="mb-2 font-semibold text-slate-600">{q.question}</p>

                                        {editingId === q.id ? (
                                            <div className="flex flex-col gap-2">
                                                {(() => {
                                                    const selectConfig = TECNOLOGICO_FORM.selectQuestions?.[q.id];

                                                    if (selectConfig) {
                                                        const currentValues = selectConfig.multiple
                                                            ? (editValue ? editValue.split(",").map(s => s.trim()) : [])
                                                            : [editValue];

                                                        return (
                                                            <div className="space-y-2 mt-2">
                                                                {selectConfig.options.map((option) => {
                                                                    const isSelected = currentValues.includes(option.label);
                                                                    return (
                                                                        <label key={option.label} className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                                            <input
                                                                                type={selectConfig.multiple ? "checkbox" : "radio"}
                                                                                name={`question-${q.id}`}
                                                                                checked={isSelected}
                                                                                onChange={() => {
                                                                                    if (selectConfig.multiple) {
                                                                                        let newValues;
                                                                                        if (isSelected) {
                                                                                            newValues = currentValues.filter(v => v !== option.label);
                                                                                        } else {
                                                                                            newValues = [...currentValues, option.label];
                                                                                        }
                                                                                        setEditValue(newValues.join(", "));
                                                                                    } else {
                                                                                        setEditValue(option.label);
                                                                                    }
                                                                                }}
                                                                                className="mt-1 bg-transparent border-slate-300 text-blue-600 focus:ring-blue-500 rounded-sm"
                                                                            />
                                                                            <div className="text-sm">
                                                                                <span className="text-slate-900 font-medium">{option.label}</span>
                                                                                {option.description && (
                                                                                    <p className="text-xs text-slate-500">{option.description}</p>
                                                                                )}
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <textarea
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="w-full bg-slate-50 text-slate-600 placeholder-slate-400 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                            rows={4}
                                                        />
                                                    );
                                                })()}

                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={handleCancel}
                                                        className="px-3 py-1 rounded text-xs text-slate-600 hover:text-slate-900"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => handleSave(q.id)}
                                                        className="px-3 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-500"
                                                    >
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {q.status === 'completed' ? (
                                                    <div className="text-slate-700">
                                                        {TECNOLOGICO_FORM.selectQuestions?.[q.id]?.multiple ? (
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {q.answer.split(",").map((item: string, idx: number) => (
                                                                    <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                                                                        {item.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="italic">"{q.answer}"</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-yellow-700 italic">Esperando respuesta...</p>
                                                )}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(q);
                                                    }}
                                                    className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                                                >
                                                    <PencilSquareIcon className="w-3 h-3" />
                                                    Editar respuesta
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
