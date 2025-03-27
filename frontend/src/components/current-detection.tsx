"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Prediction } from "@/types"

interface CurrentDetectionProps {
  isDetecting: boolean
  isLoading: boolean
  prediction: Prediction | null
}

export function CurrentDetection({ isDetecting, isLoading, prediction }: CurrentDetectionProps) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Current Detection</CardTitle>
          <Badge variant={isDetecting ? "default" : "outline"} className="ml-2">
            {isDetecting ? (isLoading ? "Processing" : "Live") : "Paused"}
          </Badge>
        </div>
        <CardDescription>Real-time ASL sign detection results</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          {prediction ? (
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-2">{prediction.sign}</h2>
              <p className="text-muted-foreground">
                Detected with {Math.round(prediction.confidence * 100)}% confidence
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              {isDetecting ? "Waiting for detection..." : "Detection paused"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

