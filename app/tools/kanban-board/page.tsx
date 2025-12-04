"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  X,
  GripVertical,
  Tag,
} from "lucide-react";

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  color?: string;
  createdAt: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
}

const defaultBoard: KanbanBoard = {
  id: "default",
  name: "Mon Tableau",
  columns: [
    { id: "todo", title: "À faire", cards: [] },
    { id: "in-progress", title: "En cours", cards: [] },
    { id: "done", title: "Terminé", cards: [] },
  ],
};

const cardColors = [
  { name: "Aucune", value: "" },
  { name: "Rouge", value: "border-l-red-500" },
  { name: "Orange", value: "border-l-orange-500" },
  { name: "Jaune", value: "border-l-yellow-500" },
  { name: "Vert", value: "border-l-green-500" },
  { name: "Bleu", value: "border-l-blue-500" },
  { name: "Violet", value: "border-l-purple-500" },
];

export default function KanbanBoardPage() {
  const [board, setBoard] = useState<KanbanBoard>(defaultBoard);
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; columnId: string } | null>(null);
  const [editingCard, setEditingCard] = useState<{ columnId: string; card: KanbanCard } | null>(null);
  const [newCardColumn, setNewCardColumn] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("kanban-board");
    if (saved) {
      setBoard(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("kanban-board", JSON.stringify(board));
  }, [board]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addCard = (columnId: string) => {
    if (!newCardTitle.trim()) return;

    const newCard: KanbanCard = {
      id: generateId(),
      title: newCardTitle.trim(),
      createdAt: new Date().toISOString(),
    };

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      ),
    }));

    setNewCardTitle("");
    setNewCardColumn(null);
  };

  const updateCard = (columnId: string, cardId: string, updates: Partial<KanbanCard>) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: col.cards.map((card) =>
                card.id === cardId ? { ...card, ...updates } : card
              ),
            }
          : col
      ),
    }));
  };

  const deleteCard = (columnId: string, cardId: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
          : col
      ),
    }));
  };

  const addColumn = () => {
    const newColumn: KanbanColumn = {
      id: generateId(),
      title: "Nouvelle colonne",
      cards: [],
    };

    setBoard((prev) => ({
      ...prev,
      columns: [...prev.columns, newColumn],
    }));

    setEditingColumnId(newColumn.id);
    setEditingColumnTitle(newColumn.title);
  };

  const updateColumnTitle = (columnId: string) => {
    if (!editingColumnTitle.trim()) return;

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId ? { ...col, title: editingColumnTitle.trim() } : col
      ),
    }));

    setEditingColumnId(null);
    setEditingColumnTitle("");
  };

  const deleteColumn = (columnId: string) => {
    if (!confirm("Supprimer cette colonne et toutes ses cartes ?")) return;

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.filter((col) => col.id !== columnId),
    }));
  };

  const handleDragStart = (e: React.DragEvent, cardId: string, columnId: string) => {
    setDraggedCard({ cardId, columnId });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string, targetIndex?: number) => {
    e.preventDefault();

    if (!draggedCard) return;

    const { cardId, columnId: sourceColumnId } = draggedCard;

    if (sourceColumnId === targetColumnId && targetIndex === undefined) {
      setDraggedCard(null);
      return;
    }

    setBoard((prev) => {
      const newColumns = [...prev.columns];
      const sourceColumn = newColumns.find((col) => col.id === sourceColumnId);
      const targetColumn = newColumns.find((col) => col.id === targetColumnId);

      if (!sourceColumn || !targetColumn) return prev;

      const cardIndex = sourceColumn.cards.findIndex((card) => card.id === cardId);
      if (cardIndex === -1) return prev;

      const [movedCard] = sourceColumn.cards.splice(cardIndex, 1);

      if (targetIndex !== undefined) {
        targetColumn.cards.splice(targetIndex, 0, movedCard);
      } else {
        targetColumn.cards.push(movedCard);
      }

      return { ...prev, columns: newColumns };
    });

    setDraggedCard(null);
  };

  const resetBoard = () => {
    if (confirm("Réinitialiser le tableau ?")) {
      setBoard(defaultBoard);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-lg font-semibold">{board.name}</h1>
        <button
          onClick={resetBoard}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Réinitialiser
        </button>
      </header>

      <main className="flex flex-1 gap-4 overflow-x-auto p-4">
        {board.columns.map((column) => (
          <div
            key={column.id}
            className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-border p-3">
              {editingColumnId === column.id ? (
                <input
                  type="text"
                  value={editingColumnTitle}
                  onChange={(e) => setEditingColumnTitle(e.target.value)}
                  onBlur={() => updateColumnTitle(column.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateColumnTitle(column.id);
                    if (e.key === "Escape") setEditingColumnId(null);
                  }}
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm font-medium"
                  autoFocus
                />
              ) : (
                <h3
                  className="flex-1 cursor-pointer font-medium"
                  onClick={() => {
                    setEditingColumnId(column.id);
                    setEditingColumnTitle(column.title);
                  }}
                >
                  {column.title}
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({column.cards.length})
                  </span>
                </h3>
              )}
              <button
                onClick={() => deleteColumn(column.id)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {column.cards.map((card, index) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id, column.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(e, column.id, index);
                  }}
                  className={`group cursor-grab rounded-lg border border-border bg-background p-3 active:cursor-grabbing ${
                    card.color ? `border-l-4 ${card.color}` : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{card.title}</p>
                      {card.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {card.description}
                        </p>
                      )}
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setEditingCard({ columnId: column.id, card })}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteCard(column.id, card.id)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add card form */}
              {newCardColumn === column.id ? (
                <div className="rounded-lg border border-border bg-background p-2">
                  <textarea
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    placeholder="Titre de la carte..."
                    className="w-full resize-none rounded border-0 bg-transparent p-1 text-sm focus:outline-none"
                    rows={2}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addCard(column.id);
                      }
                      if (e.key === "Escape") {
                        setNewCardColumn(null);
                        setNewCardTitle("");
                      }
                    }}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => addCard(column.id)}
                      className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => {
                        setNewCardColumn(null);
                        setNewCardTitle("");
                      }}
                      className="rounded px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setNewCardColumn(column.id)}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une carte
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add column button */}
        <button
          onClick={addColumn}
          className="flex h-fit w-72 shrink-0 items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-muted-foreground hover:border-primary hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Ajouter une colonne
        </button>
      </main>

      {/* Edit card modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Modifier la carte</h2>
              <button
                onClick={() => setEditingCard(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Titre</label>
                <input
                  type="text"
                  value={editingCard.card.title}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, title: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={editingCard.card.description || ""}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      card: { ...editingCard.card, description: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {cardColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        setEditingCard({
                          ...editingCard,
                          card: { ...editingCard.card, color: color.value },
                        })
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        editingCard.card.color === color.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      } ${color.value ? `border-l-4 ${color.value}` : ""}`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  updateCard(editingCard.columnId, editingCard.card.id, editingCard.card);
                  setEditingCard(null);
                }}
                className="flex-1 rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setEditingCard(null)}
                className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
