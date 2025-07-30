import { useState, useEffect, useCallback, useRef } from 'react'
import { streamService } from '@/api/streamService'
import { API_CONFIG } from '@/api/config'
import { toast } from 'sonner'
import type { Prediction } from '@/types'
import type { StreamSettings } from '@/api/streamService'

interface UseStreamManagerReturn {
  // Stream state
  isDetecting: boolean
  isLoading: boolean
  currentFrame: string | null
  
  // Predictions
  currentPrediction: Prediction | null
  predictionHistory: Prediction[]
  
  // Settings
  settings: StreamSettings
  
  // Actions
  startDetection: () => Promise<void>
  stopDetection: () => Promise<void>
  updateConfidence: (confidence: number) => Promise<void>
  updateZoom: (zoom: number) => Promise<void>
  
  // Status
  streamStatus: any
}

export function useStreamManager(): UseStreamManagerReturn {
  // Stream state
  const [isDetecting, setIsDetecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentFrame, setCurrentFrame] = useState<string | null>(null)
  
  // Predictions
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null)
  const [predictionHistory, setPredictionHistory] = useState<Prediction[]>([])
  
  // Settings
  const [settings, setSettings] = useState<StreamSettings>({
    confidence_threshold: 0.5,
    zoom_factor: 1.0,
  })
  
  // Status
  const [streamStatus, setStreamStatus] = useState<any>(null)
  
  // Refs for cleanup
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const predictionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Fetch video frames
  const fetchFrame = useCallback(async () => {
    if (!isDetecting) return

    try {
      const blob = await streamService.getVideoFrame()
      const imageUrl = URL.createObjectURL(blob)
      
      // Clean up previous frame URL
      setCurrentFrame(prevFrame => {
        if (prevFrame) {
          URL.revokeObjectURL(prevFrame)
        }
        return imageUrl
      })
    } catch (error) {
      console.error('Error fetching frame:', error)
    }
  }, [isDetecting])

  // Fetch predictions
  const fetchPredictions = useCallback(async () => {
    if (!isDetecting) return

    try {
      setIsLoading(true)
      const data = await streamService.getPredictions()

      if ('sign' in data && data.confidence !== undefined) {
        const newPrediction: Prediction = {
          sign: data.sign,
          confidence: data.confidence,
          timestamp: new Date().toISOString(),
        }

        setCurrentPrediction(newPrediction)

        // Add to history if it's a new sign or significantly different confidence
        setPredictionHistory(prev => {
          const lastPrediction = prev[0]
          if (
            !lastPrediction ||
            lastPrediction.sign !== newPrediction.sign ||
            Math.abs(lastPrediction.confidence - newPrediction.confidence) > 0.1
          ) {
            return [newPrediction, ...prev].slice(0, 20)
          }
          return prev
        })
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isDetecting])

  // Start detection
  const startDetection = useCallback(async () => {
    try {
      const response = await streamService.startStream()
      
      if (response.message) {
        setIsDetecting(true)
        
        // Update settings from response if available
        if (response.settings) {
          setSettings(response.settings)
        }
        
        toast.success('ASL detection started')
      } else {
        toast.error('Failed to start detection')
      }
    } catch (error) {
      console.error('Error starting detection:', error)
      toast.error('Failed to start detection')
    }
  }, [])

  // Stop detection
  const stopDetection = useCallback(async () => {
    try {
      const response = await streamService.stopStream()
      
      if (response.message) {
        setIsDetecting(false)
        setCurrentPrediction(null)
        
        // Clean up current frame
        setCurrentFrame(prevFrame => {
          if (prevFrame) {
            URL.revokeObjectURL(prevFrame)
          }
          return null
        })
        
        toast.success('ASL detection stopped')
      } else {
        toast.error('Failed to stop detection')
      }
    } catch (error) {
      console.error('Error stopping detection:', error)
      toast.error('Failed to stop detection')
    }
  }, [])

  // Update confidence threshold
  const updateConfidence = useCallback(async (confidence: number) => {
    try {
      const response = await streamService.setConfidenceThreshold(confidence)
      
      if (response.success && response.current_settings) {
        setSettings(response.current_settings)
        toast.success(`Confidence threshold set to ${confidence}`)
      } else {
        toast.error(response.error || 'Failed to update confidence threshold')
      }
    } catch (error) {
      console.error('Error updating confidence:', error)
      toast.error('Failed to update confidence threshold')
    }
  }, [])

  // Update zoom factor
  const updateZoom = useCallback(async (zoom: number) => {
    try {
      const response = await streamService.setZoomFactor(zoom)
      
      if (response.success && response.current_settings) {
        setSettings(response.current_settings)
        toast.success(`Zoom factor set to ${zoom}x`)
      } else {
        toast.error(response.error || 'Failed to update zoom factor')
      }
    } catch (error) {
      console.error('Error updating zoom:', error)
      toast.error('Failed to update zoom factor')
    }
  }, [])

  // Fetch status periodically
  const fetchStatus = useCallback(async () => {
    try {
      const status = await streamService.getStatus()
      setStreamStatus(status)
      
      // Update settings from status
      if (status.settings) {
        setSettings(status.settings)
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    }
  }, [])

  // Set up polling intervals
  useEffect(() => {
    if (isDetecting) {
      // Start frame polling
      frameIntervalRef.current = setInterval(fetchFrame, API_CONFIG.POLLING.FRAME_INTERVAL)
      
      // Start prediction polling
      predictionIntervalRef.current = setInterval(fetchPredictions, API_CONFIG.POLLING.PREDICTION_INTERVAL)
    } else {
      // Clean up intervals
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
        frameIntervalRef.current = null
      }
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current)
        predictionIntervalRef.current = null
      }
    }

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
      if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current)
    }
  }, [isDetecting, fetchFrame, fetchPredictions])

  // Fetch initial status
  useEffect(() => {
    fetchStatus()
    
    // Set up status polling
    const statusInterval = setInterval(fetchStatus, 5000) // Every 5 seconds
    
    return () => clearInterval(statusInterval)
  }, [fetchStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentFrame) {
        URL.revokeObjectURL(currentFrame)
      }
    }
  }, [])

  return {
    // Stream state
    isDetecting,
    isLoading,
    currentFrame,
    
    // Predictions
    currentPrediction,
    predictionHistory,
    
    // Settings
    settings,
    
    // Actions
    startDetection,
    stopDetection,
    updateConfidence,
    updateZoom,
    
    // Status
    streamStatus,
  }
} 