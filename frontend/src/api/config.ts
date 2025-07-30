// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    START_STREAM: '/start_stream',
    STOP_STREAM: '/stop_stream',
    VIDEO_FEED: '/video_feed',
    PREDICTIONS: '/predictions',
    THRESHOLD: '/threshold',
    ZOOM: '/zoom',
    STATUS: '/status',
    CAMERA_INFO: '/camera/info',
    HEALTH: '/health',
  },
  POLLING: {
    FRAME_INTERVAL: 100, // ms - 10 FPS
    PREDICTION_INTERVAL: 1000, // ms - 1 Hz
  },
  REQUEST_TIMEOUT: 5000, // ms
} as const

export type ApiEndpoint = typeof API_CONFIG.ENDPOINTS[keyof typeof API_CONFIG.ENDPOINTS] 