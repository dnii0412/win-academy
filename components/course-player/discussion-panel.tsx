"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Heart, MessageCircle } from "lucide-react"

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  userRole: "student" | "instructor" | "admin"
  content: string
  timestamp: number
  createdAt: Date
  likes: number
  replies: Comment[]
  isLiked: boolean
}

interface DiscussionPanelProps {
  lessonId: string
}

export function DiscussionPanel({ lessonId }: DiscussionPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockComments: Comment[] = [
      {
        id: "1",
        userId: "1",
        userName: "Sarah Johnson",
        userRole: "instructor",
        content:
          "Great question! The key principle here is to always consider your target audience when choosing colors. What works for a tech startup might not work for a luxury brand.",
        timestamp: 180,
        createdAt: new Date("2024-01-15T10:30:00"),
        likes: 5,
        replies: [
          {
            id: "1-1",
            userId: "2",
            userName: "Alex Chen",
            userRole: "student",
            content: "That makes so much sense! Thank you for the clarification.",
            timestamp: 180,
            createdAt: new Date("2024-01-15T10:35:00"),
            likes: 2,
            replies: [],
            isLiked: false,
          },
        ],
        isLiked: true,
      },
      {
        id: "2",
        userId: "3",
        userName: "Maria Garcia",
        userRole: "student",
        content: "I'm having trouble understanding the color psychology part. Could you provide more examples?",
        timestamp: 240,
        createdAt: new Date("2024-01-15T10:40:00"),
        likes: 3,
        replies: [],
        isLiked: false,
      },
    ]
    setComments(mockComments)
  }, [lessonId])

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const addComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      userId: "current-user",
      userName: "You",
      userRole: "student",
      content: newComment.trim(),
      timestamp: Math.floor(Math.random() * 600), // Mock current video time
      createdAt: new Date(),
      likes: 0,
      replies: [],
      isLiked: false,
    }

    setComments((prev) => [comment, ...prev])
    setNewComment("")
  }

  const addReply = (parentId: string) => {
    if (!replyContent.trim()) return

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      userId: "current-user",
      userName: "You",
      userRole: "student",
      content: replyContent.trim(),
      timestamp: Math.floor(Math.random() * 600),
      createdAt: new Date(),
      likes: 0,
      replies: [],
      isLiked: false,
    }

    setComments((prev) =>
      prev.map((comment) => (comment.id === parentId ? { ...comment, replies: [...comment.replies, reply] } : comment)),
    )
    setReplyingTo(null)
    setReplyContent("")
  }

  const toggleLike = (commentId: string, isReply = false, parentId?: string) => {
    if (isReply && parentId) {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        isLiked: !reply.isLiked,
                        likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                      }
                    : reply,
                ),
              }
            : comment,
        ),
      )
    } else {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              }
            : comment,
        ),
      )
    }
  }

  const jumpToTimestamp = (timestamp: number) => {
    console.log("[v0] Jumping to timestamp:", timestamp)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "instructor":
        return "bg-[#E10600] text-white"
      case "admin":
        return "bg-purple-500 text-white"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const CommentComponent = ({
    comment,
    isReply = false,
    parentId,
  }: {
    comment: Comment
    isReply?: boolean
    parentId?: string
  }) => (
    <div className={`${isReply ? "ml-8 mt-3" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.userAvatar || "/placeholder.svg"} />
          <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">{comment.userName}</span>
            {comment.userRole !== "student" && (
              <Badge className={`text-xs ${getRoleBadgeColor(comment.userRole)}`}>{comment.userRole}</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => jumpToTimestamp(comment.timestamp)}
              className="text-xs text-[#E10600] hover:text-[#C70500] hover:bg-[#E10600]/10 p-1 h-auto"
            >
              {formatTimestamp(comment.timestamp)}
            </Button>
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>

          <p className="text-sm text-gray-900 mb-2">{comment.content}</p>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLike(comment.id, isReply, parentId)}
              className={`p-1 h-auto text-xs ${comment.isLiked ? "text-red-500" : "text-gray-500"} hover:text-red-500`}
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
              {comment.likes}
            </Button>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(comment.id)}
                className="p-1 h-auto text-xs text-gray-500 hover:text-gray-700"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addReply(comment.id)}
                  disabled={!replyContent.trim()}
                  className="bg-[#E10600] hover:bg-[#C70500] text-white"
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentComponent key={reply.id} comment={reply} isReply={true} parentId={comment.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">Discussion</h3>
        <p className="text-sm text-gray-600 mt-1">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </p>
      </div>

      {/* Add Comment */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback>Y</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Ask a question or share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none text-sm"
              rows={3}
            />
            <Button
              onClick={addComment}
              disabled={!newComment.trim()}
              className="bg-[#E10600] hover:bg-[#C70500] text-white"
              size="sm"
            >
              <Send className="w-3 h-3 mr-2" />
              Post Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No comments yet</p>
              <p className="text-gray-400 text-xs mt-1">Be the first to start the discussion</p>
            </div>
          ) : (
            comments.map((comment) => <CommentComponent key={comment.id} comment={comment} />)
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
