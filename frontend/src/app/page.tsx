"use client"

import { useState, useEffect, useCallback } from "react"
import { MainLayout } from "@/components/main-layout"
import { getPredictions } from "@/lib/api"
import { toast } from "sonner"
import type { Prediction } from "@/types"

export default function ASLDetector() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [confidence, setConfidence] = useState(0.7)
  const [zoom, setZoom] = useState(1.0)
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null)
  const [predictionHistory, setPredictionHistory] = useState<Prediction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Function to fetch predictions from the API
  const fetchPredictions = useCallback(async () => {
    if (!isDetecting) return

    try {
      setIsLoading(true)
      const data = await getPredictions()

      if (data) {
        // Assuming the API returns a prediction object or array
        // If it's a single prediction
        if (!Array.isArray(data)) {
          const newPrediction = {
            sign: data.sign || data.label || "Unknown",
            confidence: data.confidence || 0,
            timestamp: new Date().toISOString(),
          }

          setCurrentPrediction(newPrediction)

          // Add to history if it's a new sign or significantly different confidence
          if (
            !currentPrediction ||
            currentPrediction.sign !== newPrediction.sign ||
            Math.abs(currentPrediction.confidence - newPrediction.confidence) > 0.1
          ) {
            setPredictionHistory((prev) => [newPrediction, ...prev].slice(0, 20))
          }
        }
        // If it's an array of predictions
        else if (Array.isArray(data) && data.length > 0) {
          // Sort by confidence and take the highest
          const sorted = [...data].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

          const newPrediction = {
            sign: sorted[0].sign || sorted[0].label || "Unknown",
            confidence: sorted[0].confidence || 0,
            timestamp: new Date().toISOString(),
          }

          setCurrentPrediction(newPrediction)

          // Add to history if it's a new sign or significantly different confidence
          if (
            !currentPrediction ||
            currentPrediction.sign !== newPrediction.sign ||
            Math.abs(currentPrediction.confidence - newPrediction.confidence) > 0.1
          ) {
            setPredictionHistory((prev) => [newPrediction, ...prev].slice(0, 20))
          }
        }
      }
    } catch (error) {
      console.error("Error fetching predictions:", error)
      toast.error("Failed to fetch predictions")
    } finally {
      setIsLoading(false)
    }
  }, [isDetecting, currentPrediction, toast])

  // Set up polling for predictions
  useEffect(() => {
    if (!isDetecting) return

    // Initial fetch
    fetchPredictions()

    // Set up interval for polling
    const intervalId = setInterval(fetchPredictions, 1000)

    return () => clearInterval(intervalId)
  }, [isDetecting, fetchPredictions])

  // Toggle detection state
  const handleToggleDetection = (value: boolean) => {
    setIsDetecting(value)

    if (!value) {
      // Clear current prediction when stopping detection
      setCurrentPrediction(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainLayout
        isDetecting={isDetecting}
        isLoading={isLoading}
        confidence={confidence}
        setConfidence={setConfidence}
        zoom={zoom}
        setZoom={setZoom}
        setIsDetecting={handleToggleDetection}
        currentPrediction={currentPrediction}
        predictionHistory={predictionHistory}
      />
    </div>
  )
}

