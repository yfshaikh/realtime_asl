"use client"

import { useEffect, useState } from "react"
import { ZoomIn, ZoomOut, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { streamService } from "@/api"


interface ControlPanelProps {
  confidence: number
  setConfidence: (value: number) => void
  zoom: number
  setZoom: (value: number) => void
  isDetecting: boolean
  setIsDetecting: (value: boolean) => void
}

export function ControlPanel({
  confidence,
  setConfidence,
  zoom,
  setZoom,
  isDetecting,
  setIsDetecting,
}: ControlPanelProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [localConfidence, setLocalConfidence] = useState(confidence)
  const [localZoom, setLocalZoom] = useState(zoom)

  // Update local state when props change
  useEffect(() => {
    setLocalConfidence(confidence)
    setLocalZoom(zoom)
  }, [confidence, zoom])

  // Handle confidence change
  const handleConfidenceChange = (value: number[]) => {
    setLocalConfidence(value[0])
  }

  // Handle zoom change
  const handleZoomChange = (value: number[]) => {
    setLocalZoom(value[0])
  }

  // Save settings to the API
  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Only update if values have changed
      if (localConfidence !== confidence) {
        await streamService.setConfidenceThreshold(localConfidence)
        setConfidence(localConfidence)
      }

      if (localZoom !== zoom) {
        await streamService.setZoomFactor(localZoom)
        setZoom(localZoom)
      }

      toast.success("Your detection settings have been updated")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Reset settings to defaults
  const handleResetSettings = async () => {
    setIsResetting(true)
    try {
      const defaultConfidence = 0.7
      const defaultZoom = 1.0

      await streamService.setConfidenceThreshold(defaultConfidence)
      await streamService.setZoomFactor(defaultZoom)

      setLocalConfidence(defaultConfidence)
      setLocalZoom(defaultZoom)
      setConfidence(defaultConfidence)
      setZoom(defaultZoom)

      toast.success("Detection settings have been reset to defaults")
    } catch (error) {
      console.error("Error resetting settings:", error)
      toast.error("Failed to reset settings")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Detection Controls</CardTitle>
        <CardDescription>Adjust settings for optimal detection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="detection-toggle">Detection</Label>
            <Switch id="detection-toggle" checked={isDetecting} onCheckedChange={setIsDetecting} />
          </div>
          <p className="text-xs text-muted-foreground">Toggle real-time ASL detection</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="confidence-threshold">Confidence Threshold: {Math.round(localConfidence * 100)}%</Label>
          <Slider
            id="confidence-threshold"
            min={0.1}
            max={1}
            step={0.05}
            value={[localConfidence]}
            onValueChange={handleConfidenceChange}
          />
          <p className="text-xs text-muted-foreground">Adjust the minimum confidence level required for detection</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="zoom-level">Zoom Level: {localZoom.toFixed(1)}x</Label>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocalZoom(Math.max(1, localZoom - 0.1))}
                disabled={localZoom <= 1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocalZoom(Math.min(2, localZoom + 0.1))}
                disabled={localZoom >= 2}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Slider id="zoom-level" min={1} max={2} step={0.1} value={[localZoom]} onValueChange={handleZoomChange} />
          <p className="text-xs text-muted-foreground">Adjust camera zoom level for better framing</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between mt-auto">
        <Button variant="outline" size="sm" onClick={handleResetSettings} disabled={isResetting || isSaving}>
          {isResetting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </>
          )}
        </Button>
        <Button
          size="sm"
          onClick={handleSaveSettings}
          disabled={isSaving || isResetting || (localConfidence === confidence && localZoom === zoom)}
        >
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

