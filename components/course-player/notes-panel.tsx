"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit2, Trash2, Clock } from "lucide-react"

interface Note {
  id: string
  timestamp: number
  content: string
  createdAt: Date
}

interface NotesPanelProps {
  lessonId: string
}

export function NotesPanel({ lessonId }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockNotes: Note[] = [
      {
        id: "1",
        timestamp: 120,
        content: "Important concept about color theory - remember the 60-30-10 rule",
        createdAt: new Date("2024-01-15T10:30:00"),
      },
      {
        id: "2",
        timestamp: 300,
        content: "Great example of typography hierarchy. Need to practice this more.",
        createdAt: new Date("2024-01-15T10:35:00"),
      },
    ]
    setNotes(mockNotes)
  }, [lessonId])

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const addNote = () => {
    if (!newNote.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      timestamp: Math.floor(Math.random() * 600), // Mock current video time
      content: newNote.trim(),
      createdAt: new Date(),
    }

    setNotes((prev) => [...prev, note].sort((a, b) => a.timestamp - b.timestamp))
    setNewNote("")
  }

  const startEditing = (note: Note) => {
    setEditingNote(note.id)
    setEditContent(note.content)
  }

  const saveEdit = () => {
    if (!editContent.trim() || !editingNote) return

    setNotes((prev) => prev.map((note) => (note.id === editingNote ? { ...note, content: editContent.trim() } : note)))
    setEditingNote(null)
    setEditContent("")
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setEditContent("")
  }

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }

  const jumpToTimestamp = (timestamp: number) => {
    // In a real implementation, this would seek the video to the timestamp
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">My Notes</h3>
        <p className="text-sm text-gray-600 mt-1">
          {notes.length} {notes.length === 1 ? "note" : "notes"} for this lesson
        </p>
      </div>

      {/* Add Note */}
      <div className="p-4 border-b bg-gray-50">
        <Textarea
          placeholder="Add a note at current timestamp..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="mb-3 resize-none"
          rows={3}
        />
        <Button
          onClick={addNote}
          disabled={!newNote.trim()}
          className="w-full bg-[#FF344A] hover:bg-[#E02A3C] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Edit2 className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No notes yet</p>
              <p className="text-gray-400 text-xs mt-1">Add your first note above</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
                {/* Note Header */}
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => jumpToTimestamp(note.timestamp)}
                    className="text-[#FF344A] hover:text-[#E02A3C] hover:bg-[#FF344A]/10 p-1 h-auto"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimestamp(note.timestamp)}
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(note)}
                      className="p-1 h-auto text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="p-1 h-auto text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Note Content */}
                {editingNote === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="bg-[#FF344A] hover:bg-[#E02A3C] text-white">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-900 mb-2">{note.content}</p>
                    <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
