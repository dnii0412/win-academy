import fs from 'fs'
import path from 'path'
import os from 'os'

// Shared TUS storage for uploads
export interface TusUpload {
  id: string
  videoId: string
  filename: string
  contentType: string
  fileSize: number
  uploadedSize: number
  offset?: number
  chunks: Buffer[]
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  createdAt: Date
  updatedAt: Date
  retryCount: number
  lastChunkTime: Date
  completed?: boolean
}

// File-based storage for persistence across requests
const STORAGE_DIR = path.join(os.tmpdir(), 'tus-uploads')

class TusStorageManager {
  public uploads = new Map<string, TusUpload>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Ensure storage directory exists
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true })
    }
    
    // Load existing uploads from disk
    this.loadFromDisk()
    
    // Clean up expired uploads every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredUploads()
    }, 30 * 60 * 1000)
  }

  private loadFromDisk() {
    try {
      console.log(`🔍 Loading TUS uploads from: ${STORAGE_DIR}`)
      if (!fs.existsSync(STORAGE_DIR)) {
        console.log('📁 Storage directory does not exist, creating it...')
        fs.mkdirSync(STORAGE_DIR, { recursive: true })
        return
      }
      
      const files = fs.readdirSync(STORAGE_DIR)
      console.log(`📁 Found ${files.length} files in storage directory:`, files)
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const uploadId = file.replace('.json', '')
          const filePath = path.join(STORAGE_DIR, file)
          console.log(`📄 Loading upload: ${uploadId} from ${filePath}`)
          
          const data = fs.readFileSync(filePath, 'utf8')
          const upload = JSON.parse(data)
          
          // Convert date strings back to Date objects
          upload.createdAt = new Date(upload.createdAt)
          upload.updatedAt = new Date(upload.updatedAt)
          upload.lastChunkTime = new Date(upload.lastChunkTime)
          
          // Initialize empty chunks array (we don't persist chunk data)
          upload.chunks = []
          
          this.uploads.set(uploadId, upload)
          console.log(`✅ Loaded upload: ${uploadId}`)
        }
      }
      console.log(`📁 Loaded ${this.uploads.size} TUS uploads from disk`)
    } catch (error) {
      console.log('⚠️ Could not load TUS uploads from disk:', error)
    }
  }

  private saveToDisk(uploadId: string, upload: TusUpload) {
    try {
      const filePath = path.join(STORAGE_DIR, `${uploadId}.json`)
      console.log(`💾 Saving TUS upload ${uploadId} to: ${filePath}`)
      
      // Save only metadata, not the actual chunk data (too large for JSON)
      const data = {
        id: upload.id,
        videoId: upload.videoId,
        filename: upload.filename,
        contentType: upload.contentType,
        fileSize: upload.fileSize,
        uploadedSize: upload.uploadedSize,
        offset: upload.offset,
        status: upload.status,
        error: upload.error,
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt,
        retryCount: upload.retryCount,
        lastChunkTime: upload.lastChunkTime,
        completed: upload.completed,
        chunkCount: upload.chunks.length // Track number of chunks instead of actual data
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      console.log(`✅ Saved TUS upload ${uploadId} to disk`)
    } catch (error) {
      console.error(`❌ Failed to save TUS upload ${uploadId} to disk:`, error)
    }
  }

  private deleteFromDisk(uploadId: string) {
    try {
      const filePath = path.join(STORAGE_DIR, `${uploadId}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error(`❌ Failed to delete TUS upload ${uploadId} from disk:`, error)
    }
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
    this.saveToDisk(upload.id, newUpload)
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
    this.saveToDisk(uploadId, updatedUpload)
    return updatedUpload
  }

  delete(uploadId: string): boolean {
    const upload = this.uploads.get(uploadId)
    if (upload) {
      // Clean up chunks to free memory
      upload.chunks = []
      this.uploads.delete(uploadId)
      this.deleteFromDisk(uploadId)
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
      
      this.saveToDisk(uploadId, upload)
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

  // Update upload offset (for TUS protocol)
  updateOffset(uploadId: string, offset: number): boolean {
    const upload = this.uploads.get(uploadId)
    if (!upload) return false
    
    upload.uploadedSize = offset
    upload.offset = offset
    upload.updatedAt = new Date()
    upload.lastChunkTime = new Date()
    
    this.saveToDisk(uploadId, upload)
    console.log(`📊 Updated offset for ${uploadId}: ${offset}/${upload.fileSize}`)
    return true
  }

  // Mark upload as completed
  complete(uploadId: string): boolean {
    const upload = this.uploads.get(uploadId)
    if (!upload) return false
    
    upload.status = 'completed'
    upload.uploadedSize = upload.fileSize
    upload.offset = upload.fileSize
    upload.completed = true
    upload.updatedAt = new Date()
    
    this.saveToDisk(uploadId, upload)
    console.log(`✅ Upload completed: ${uploadId}`)
    return true
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
