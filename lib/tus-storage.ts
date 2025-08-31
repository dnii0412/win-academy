// Shared TUS storage for uploads
export interface TusUpload {
  id: string
  videoId: string
  filename: string
  contentType: string
  fileSize: number
  uploadedSize: number
  chunks: Buffer[]
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  createdAt: Date
  updatedAt: Date
  retryCount: number
  lastChunkTime: Date
}

class TusStorageManager {
  private uploads = new Map<string, TusUpload>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired uploads every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredUploads()
    }, 30 * 60 * 1000)
  }

  create(upload: Omit<TusUpload, 'uploadedSize' | 'chunks' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount' | 'lastChunkTime'>): TusUpload {
    const newUpload: TusUpload = {
      ...upload,
      uploadedSize: 0,
      chunks: [],
      status: 'uploading',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      lastChunkTime: new Date()
    }
    
    this.uploads.set(upload.id, newUpload)
    console.log(`📁 TUS upload created: ${upload.id} for video ${upload.videoId}`)
    return newUpload
  }

  get(uploadId: string): TusUpload | undefined {
    return this.uploads.get(uploadId)
  }

  update(uploadId: string, updates: Partial<TusUpload>): TusUpload | undefined {
    const upload = this.uploads.get(uploadId)
    if (!upload) return undefined

    const updatedUpload = {
      ...upload,
      ...updates,
      updatedAt: new Date()
    }
    
    this.uploads.set(uploadId, updatedUpload)
    return updatedUpload
  }

  delete(uploadId: string): boolean {
    const upload = this.uploads.get(uploadId)
    if (upload) {
      // Clean up chunks to free memory
      upload.chunks = []
      this.uploads.delete(uploadId)
      console.log(`🗑️ TUS upload deleted: ${uploadId}`)
      return true
    }
    return false
  }

  appendChunk(uploadId: string, chunk: Buffer): boolean {
    const upload = this.uploads.get(uploadId)
    if (!upload) return false

    try {
      upload.chunks.push(chunk)
      upload.lastChunkTime = new Date()
      upload.uploadedSize += chunk.length
      upload.updatedAt = new Date()
      
      console.log(`📦 Chunk appended to ${uploadId}: ${chunk.length} bytes, total: ${upload.uploadedSize}/${upload.fileSize}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to append chunk to ${uploadId}:`, error)
      return false
    }
  }

  getUpload(uploadId: string): TusUpload | undefined {
    return this.uploads.get(uploadId)
  }

  updateUpload(uploadId: string, updates: Partial<TusUpload>): TusUpload | undefined {
    return this.update(uploadId, updates)
  }

  deleteUpload(uploadId: string): boolean {
    return this.delete(uploadId)
  }

  // Enhanced methods for better TUS handling
  markAsProcessing(uploadId: string): boolean {
    return this.update(uploadId, { status: 'processing' }) !== undefined
  }

  markAsCompleted(uploadId: string): boolean {
    return this.update(uploadId, { status: 'completed' }) !== undefined
  }

  markAsError(uploadId: string, error: string): boolean {
    return this.update(uploadId, { status: 'error', error }) !== undefined
  }

  incrementRetryCount(uploadId: string): boolean {
    const upload = this.uploads.get(uploadId)
    if (!upload) return false
    
    upload.retryCount++
    upload.updatedAt = new Date()
    return true
  }

  isExpired(uploadId: string, maxAgeMinutes: number = 60): boolean {
    const upload = this.uploads.get(uploadId)
    if (!upload) return true
    
    const ageInMinutes = (Date.now() - upload.createdAt.getTime()) / (1000 * 60)
    return ageInMinutes > maxAgeMinutes
  }

  private cleanupExpiredUploads(): void {
    const expiredUploads: string[] = []
    
    for (const [uploadId, upload] of this.uploads.entries()) {
      if (this.isExpired(uploadId, 60)) { // 1 hour
        expiredUploads.push(uploadId)
      }
    }
    
    if (expiredUploads.length > 0) {
      console.log(`🧹 Cleaning up ${expiredUploads.length} expired TUS uploads`)
      expiredUploads.forEach(uploadId => this.delete(uploadId))
    }
  }

  // Get upload statistics
  getStats() {
    const total = this.uploads.size
    const uploading = Array.from(this.uploads.values()).filter(u => u.status === 'uploading').length
    const processing = Array.from(this.uploads.values()).filter(u => u.status === 'processing').length
    const completed = Array.from(this.uploads.values()).filter(u => u.status === 'completed').length
    const error = Array.from(this.uploads.values()).filter(u => u.status === 'error').length
    
    return { total, uploading, processing, completed, error }
  }

  // Cleanup on process exit
  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.uploads.clear()
  }
}

export const tusStorage = new TusStorageManager()

// Cleanup on process exit
process.on('exit', () => tusStorage.cleanup())
process.on('SIGINT', () => tusStorage.cleanup())
process.on('SIGTERM', () => tusStorage.cleanup())
