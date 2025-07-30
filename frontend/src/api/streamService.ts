import type { Prediction } from '@/types'

interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  error?: string
  data?: T
}

interface StreamSettings {
  confidence_threshold: number
  zoom_factor: number
}

interface StreamStatus {
  streaming: boolean
  current_detections: number
  model_type: string
  settings: StreamSettings
  camera_info?: {
    running: boolean
    has_frame: boolean
    thread_alive: boolean
    width?: number
    height?: number
    fps?: number
  }
}
// nothing
class StreamService {
  private baseUrl: string

  // update env
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    }

    try {
      const response = await fetch(url, defaultOptions)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle different response types
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return await response.json()
      } else if (contentType?.includes('image')) {
        return response.blob() as T
      } else {
        return response.text() as T
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Stream Control
  async startStream(): Promise<{ message: string; settings?: StreamSettings }> {
    return this.request('/start_stream', {
      method: 'POST',
    })
  }

  async stopStream(): Promise<{ message: string }> {
    return this.request('/stop_stream', {
      method: 'POST',
    })
  }

  // Video Feed
  async getVideoFrame(): Promise<Blob> {
    return this.request<Blob>('/video_feed')
  }

  // Predictions
  async getPredictions(): Promise<Prediction | { message: string }> {
    return this.request('/predictions')
  }

  // Settings
  async setConfidenceThreshold(threshold: number): Promise<{ success: boolean; message: string; error?: string; current_settings?: StreamSettings }> {
    return this.request('/threshold', {
      method: 'POST',
      body: JSON.stringify({ threshold }),
    })
  }

  async setZoomFactor(zoom_factor: number): Promise<{ success: boolean; message: string; error?: string; current_settings?: StreamSettings }> {
    return this.request('/zoom', {
      method: 'POST',
      body: JSON.stringify({ zoom_factor }),
    })
  }

  // Status
  async getStatus(): Promise<StreamStatus> {
    return this.request('/status')
  }

  async getCameraInfo(): Promise<any> {
    return this.request('/camera/info')
  }

  async healthCheck(): Promise<{ status: string; detector_loaded: boolean; camera_available: boolean; streaming: boolean }> {
    return this.request('/health')
  }
}

// Export singleton instance
export const streamService = new StreamService()
export type { StreamSettings, StreamStatus } 