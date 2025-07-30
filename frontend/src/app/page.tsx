"use client"

import { MainLayout } from "@/components/main-layout"
import { useStreamManager } from "@/hooks/useStreamManager"

export default function ASLDetector() {
  const {
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
  } = useStreamManager()

  // Handle detection toggle
  const handleToggleDetection = async (value: boolean) => {
    if (value) {
      await startDetection()
    } else {
      await stopDetection()
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pl-20">
      <MainLayout
        isDetecting={isDetecting}
        isLoading={isLoading}
        confidence={settings.confidence_threshold}
        setConfidence={updateConfidence}
        zoom={settings.zoom_factor}
        setZoom={updateZoom}
        setIsDetecting={handleToggleDetection}
        currentPrediction={currentPrediction}
        predictionHistory={predictionHistory}
        currentFrame={currentFrame}
      />
    </div>
  )
}

