"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { TECNOLOGICO_FORM } from "../lib/formConfigs";

export default function TechStatusPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    // Initialize state with default (empty) values for server-side rendering
    const [questions, setQuestions] = useState(() => {
        return TECNOLOGICO_FORM.questions.map((q, index) => ({
            id: index,
            question: q,
            answer: "",
            status: "pending",
        }));
    });

    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on client mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem(TECNOLOGICO_FORM.storageKey);
                if (stored) {
                    const storedAnswers = JSON.parse(stored);
                    setQuestions(prev => prev.map((q, index) => ({
                        ...q,
                        answer: storedAnswers[index] || "",
                        status: storedAnswers[index] ? "completed" : "pending"
                    })));
                }
            } catch (e) {
                console.error("Error loading technical answers", e);
            } finally {
                setIsLoaded(true);
            }
        }
    }, []);

    // Effect to sync changes back to localStorage
    useEffect(() => {
        if (typeof window !== "undefined" && isLoaded) {
            const answersArray = questions.map(q => q.answer);
            localStorage.setItem(TECNOLOGICO_FORM.storageKey, JSON.stringify(answersArray));
        }
    }, [questions, isLoaded]);

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

    const handleSave = (id: number) => {
        setQuestions(questions.map(q =>
            q.id === id
                ? { ...q, answer: editValue, status: 'completed' }
                : q
        ));
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue("");
    };

    return (
        <div
            className={`fixed inset-y-0 right-0 w-96 bg-black/90 backdrop-blur-xl border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? "translate-x-0" : "translate-x-full"
                }`}
        >
            <div className="flex flex-col h-full p-6 text-white">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Estado Cuestionario Técnico</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2 text-white/70">
                        <span>Progreso del equipo</span>
                        <span>{completedCount}/{totalCount} completado</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        questions.map((q) => (
                            <div key={q.id} className="border border-white/10 rounded-lg bg-white/5 overflow-hidden">
                                <button
                                    onClick={() => toggleExpand(q.id)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {q.status === 'completed' ? (
                                            <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0" />
                                        ) : (
                                            <ClockIcon className="w-5 h-5 text-yellow-400 shrink-0" />
                                        )}
                                        <span className="text-sm font-medium text-white/90 line-clamp-1">{q.question.replace(/^\d+\.\s*/, '')}</span>
                                    </div>
                                    {expandedId === q.id ? (
                                        <ChevronUpIcon className="w-4 h-4 text-white/50" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 text-white/50" />
                                    )}
                                </button>

                                {expandedId === q.id && (
                                    <div className="p-4 pt-0 border-t border-white/5 text-sm text-white/70 bg-black/20">
                                        <p className="mb-2 font-semibold text-white/90">{q.question}</p>

                                        {editingId === q.id ? (
                                            <div className="flex flex-col gap-2">
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-full bg-white/10 text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    rows={4}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={handleCancel}
                                                        className="px-3 py-1 rounded text-xs text-white/60 hover:text-white"
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
                                                    <p className="italic text-white/80">"{q.answer}"</p>
                                                ) : (
                                                    <p className="text-yellow-400/80 italic">Esperando respuesta...</p>
                                                )}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(q);
                                                    }}
                                                    className="mt-3 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
