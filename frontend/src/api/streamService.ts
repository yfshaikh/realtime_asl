import { API_CONFIG } from './config'
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

class StreamService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
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
    return this.request(API_CONFIG.ENDPOINTS.START_STREAM, {
      method: 'POST',
    })
  }

  async stopStream(): Promise<{ message: string }> {
    return this.request(API_CONFIG.ENDPOINTS.STOP_STREAM, {
      method: 'POST',
    })
  }

  // Video Feed
  async getVideoFrame(): Promise<Blob> {
    return this.request<Blob>(API_CONFIG.ENDPOINTS.VIDEO_FEED)
  }

  // Predictions
  async getPredictions(): Promise<Prediction | { message: string }> {
    return this.request(API_CONFIG.ENDPOINTS.PREDICTIONS)
  }

  // Settings
  async setConfidenceThreshold(threshold: number): Promise<{ success: boolean; message: string; error?: string; current_settings?: StreamSettings }> {
    return this.request(API_CONFIG.ENDPOINTS.THRESHOLD, {
      method: 'POST',
      body: JSON.stringify({ threshold }),
    })
  }

  async setZoomFactor(zoom_factor: number): Promise<{ success: boolean; message: string; error?: string; current_settings?: StreamSettings }> {
    return this.request(API_CONFIG.ENDPOINTS.ZOOM, {
      method: 'POST',
      body: JSON.stringify({ zoom_factor }),
    })
  }

  // Status
  async getStatus(): Promise<StreamStatus> {
    return this.request(API_CONFIG.ENDPOINTS.STATUS)
  }

  async getCameraInfo(): Promise<any> {
    return this.request(API_CONFIG.ENDPOINTS.CAMERA_INFO)
  }

  async healthCheck(): Promise<{ status: string; detector_loaded: boolean; camera_available: boolean; streaming: boolean }> {
    return this.request(API_CONFIG.ENDPOINTS.HEALTH)
  }
}

// Export singleton instance
export const streamService = new StreamService()
export type { StreamSettings, StreamStatus } 