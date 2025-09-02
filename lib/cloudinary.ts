interface CloudinaryResponse {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
  bytes: number
  resource_type: string
}

interface CloudinaryUploadOptions {
  folder?: string
  transformation?: string
  quality?: string
  format?: string
}

class CloudinaryService {
  private cloudName: string
  private uploadPreset: string

  constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
    this.uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET!
    
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Cloudinary configuration missing. Please check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET environment variables.')
    }
  }

  async uploadImage(file: File, options: CloudinaryUploadOptions = {}): Promise<CloudinaryResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', this.uploadPreset)
    formData.append('cloud_name', this.cloudName)

    // Add optional parameters
    if (options.folder) {
      formData.append('folder', options.folder)
    }
    if (options.transformation) {
      formData.append('transformation', options.transformation)
    }
    if (options.quality) {
      formData.append('quality', options.quality)
    }
    if (options.format) {
      formData.append('format', options.format)
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary')
      }

      const data = await response.json()
      return {
        secure_url: data.secure_url,
        public_id: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
        resource_type: data.resource_type,
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw new Error(error instanceof Error ? error.message : 'Image upload failed')
    }
  }

  getOptimizedUrl(publicId: string, options: {
    width?: number
    height?: number
    quality?: number
    format?: string
  } = {}) {
    const { width, height, quality = 'auto', format = 'auto' } = options
    
    let url = `https://res.cloudinary.com/${this.cloudName}/image/upload`
    
    if (width || height || quality !== 'auto' || format !== 'auto') {
      url += '/f_auto,q_auto'
      if (width) url += `,w_${width}`
      if (height) url += `,h_${height}`
      if (quality !== 'auto') url += `,q_${quality}`
      if (format !== 'auto') url += `,f_${format}`
    }
    
    url += `/${publicId}`
    return url
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/cloudinary/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      })

      return response.ok
    } catch (error) {
      console.error('Failed to delete image:', error)
      return false
    }
  }
}

export const cloudinary = new CloudinaryService()
export type { CloudinaryResponse }
