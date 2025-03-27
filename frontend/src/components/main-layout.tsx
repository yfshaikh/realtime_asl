"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { VideoFeed } from "@/components/video-feed"
import { CurrentDetection } from "@/components/current-detection"
import { ControlPanel } from "@/components/control-panel"
import { DetectionResults } from "@/components/detection-results"
import { InfoPanel } from "@/components/info-panel"
import type { Prediction } from "@/types"

interface MainLayoutProps {
  isDetecting: boolean
  isLoading: boolean
  confidence: number
  setConfidence: (value: number) => void
  zoom: number
  setZoom: (value: number) => void
  setIsDetecting: (value: boolean) => void
  currentPrediction: Prediction | null
  predictionHistory: Prediction[]
}

export function MainLayout({
  isDetecting,
  isLoading,
  confidence,
  setConfidence,
  zoom,
  setZoom,
  setIsDetecting,
  currentPrediction,
  predictionHistory,
}: MainLayoutProps) {
  return (
    <main className="container py-6">
      <div className="grid gap-6 md:grid-cols-5 lg:grid-cols-6 min-h-[calc(100vh-4rem)]">
        <div className="md:col-span-3 lg:col-span-4 space-y-6">
          <Card className="border-border/40 overflow-hidden">
            <CardContent className="p-0">
              <VideoFeed isActive={isDetecting} zoom={zoom} />
            </CardContent>
          </Card>

          <CurrentDetection isDetecting={isDetecting} isLoading={isLoading} prediction={currentPrediction} />
        </div>

        <div className="md:col-span-2 lg:col-span-2 flex flex-col h-full">
          <Tabs defaultValue="controls" className="flex flex-col flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
            <div className="flex-1 mt-4">
              <TabsContent value="controls" className="h-full m-0">
                <ControlPanel
                  confidence={confidence}
                  setConfidence={setConfidence}
                  zoom={zoom}
                  setZoom={setZoom}
                  isDetecting={isDetecting}
                  setIsDetecting={setIsDetecting}
                />
              </TabsContent>
              <TabsContent value="history" className="h-full m-0">
                <DetectionResults detections={predictionHistory} />
              </TabsContent>
              <TabsContent value="info" className="h-full m-0">
                <InfoPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

