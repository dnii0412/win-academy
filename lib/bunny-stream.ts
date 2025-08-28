interface BunnyVideo {
    id: string
    title: string
    description?: string
    thumbnailUrl?: string
    videoUrl: string
    duration: number
    size: number
    status: 'encoding' | 'ready' | 'error'
    createdAt: string
    updatedAt: string
}

interface UploadResponse {
    success: boolean
    videoId?: string
    error?: string
}

interface StreamResponse {
    success: boolean
    streamUrl?: string
    error?: string
}

class BunnyStreamService {
    private apiKey: string
    private libraryId: string
    private baseUrl: string

    constructor() {
        this.apiKey = process.env.BUNNY_API_KEY!
        this.libraryId = process.env.BUNNY_VIDEO_LIBRARY_ID!
        this.baseUrl = 'https://video.bunnycdn.com'

        if (!this.apiKey || !this.libraryId) {
            throw new Error('Bunny.net API credentials not configured')
        }
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`

        const response = await fetch(url, {
            ...options,
            headers: {
                'AccessKey': this.apiKey,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        if (!response.ok) {
            throw new Error(`Bunny.net API error: ${response.status} ${response.statusText}`)
        }

        return response
    }

    // Get video library information
    async getLibraryInfo(): Promise<any> {
        try {
            const response = await this.makeRequest(`/library/${this.libraryId}`)
            return await response.json()
        } catch (error) {
            console.error('Failed to get library info:', error)
            throw error
        }
    }

    // Get all videos in the library
    async getVideos(): Promise<BunnyVideo[]> {
        try {
            const response = await this.makeRequest(`/library/${this.libraryId}/videos`)
            const data = await response.json()

            return data.data?.map((video: any) => ({
                id: video.guid,
                title: video.title || 'Untitled',
                description: video.description,
                thumbnailUrl: video.thumbnailUrl,
                videoUrl: video.videoUrl,
                duration: video.duration || 0,
                size: video.size || 0,
                status: video.status || 'encoding',
                createdAt: video.dateCreated,
                updatedAt: video.dateUpdated,
            })) || []
        } catch (error) {
            console.error('Failed to get videos:', error)
            throw error
        }
    }

    // Get a specific video by ID
    async getVideo(videoId: string): Promise<BunnyVideo | null> {
        try {
            const response = await this.makeRequest(`/library/${this.libraryId}/videos/${videoId}`)
            const video = await response.json()

            if (!video) return null

            return {
                id: video.guid,
                title: video.title || 'Untitled',
                description: video.description,
                thumbnailUrl: video.thumbnailUrl,
                videoUrl: video.videoUrl,
                duration: video.duration || 0,
                size: video.size || 0,
                status: video.status || 'encoding',
                createdAt: video.dateCreated,
                updatedAt: video.dateUpdated,
            }
        } catch (error) {
            console.error('Failed to get video:', error)
            throw error
        }
    }

    // Create a new video entry (for direct uploads)
    async createVideo(title: string, description?: string): Promise<UploadResponse> {
        try {
            const response = await this.makeRequest(`/library/${this.libraryId}/videos`, {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                }),
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    videoId: data.guid,
                }
            } else {
                return {
                    success: false,
                    error: data.message || 'Failed to create video',
                }
            }
        } catch (error: any) {
            console.error('Failed to create video:', error)
            return {
                success: false,
                error: error.message || 'Failed to create video',
            }
        }
    }

    // Get upload URL for a video
    async getUploadUrl(videoId: string): Promise<string | null> {
        try {
            const response = await this.makeRequest(`/library/${this.libraryId}/videos/${videoId}/upload`)
            const data = await response.json()

            return data.uploadUrl || null
        } catch (error) {
            console.error('Failed to get upload URL:', error)
            return null
        }
    }

    // Delete a video
    async deleteVideo(videoId: string): Promise<boolean> {
        try {
            await this.makeRequest(`/library/${this.libraryId}/videos/${videoId}`, {
                method: 'DELETE',
            })
            return true
        } catch (error) {
            console.error('Failed to delete video:', error)
            return false
        }
    }

    // Get streaming URL for a video
    async getStreamUrl(videoId: string): Promise<StreamResponse> {
        try {
            const video = await this.getVideo(videoId)

            if (!video) {
                return {
                    success: false,
                    error: 'Video not found',
                }
            }

            if (video.status !== 'ready') {
                return {
                    success: false,
                    error: `Video is not ready for streaming. Status: ${video.status}`,
                }
            }

            // Construct streaming URL
            const streamUrl = `${this.baseUrl}/stream/${this.libraryId}/${videoId}/play.mp4`

            return {
                success: true,
                streamUrl,
            }
        } catch (error: any) {
            console.error('Failed to get stream URL:', error)
            return {
                success: false,
                error: error.message || 'Failed to get stream URL',
            }
        }
    }

    // Get thumbnail URL for a video
    getThumbnailUrl(videoId: string): string {
        return `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}/thumbnail.jpg`
    }

    // Get video preview URL
    getPreviewUrl(videoId: string): string {
        return `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}/preview.mp4`
    }
}

// Export singleton instance
export const bunnyStream = new BunnyStreamService()
export type { BunnyVideo, UploadResponse, StreamResponse }
