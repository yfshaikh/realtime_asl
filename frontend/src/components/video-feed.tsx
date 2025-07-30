"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Camera, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VideoFeedProps {
  isActive: boolean
  zoom: number
  frameSource?: string | null
}

export function VideoFeed({ isActive, zoom, frameSource }: VideoFeedProps) {
  const videoRef = useRef<HTMLImageElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set loading based on whether we have an active stream and frames
    if (isActive && frameSource) {
      setLoading(false)
      setError(null)
    } else if (isActive && !frameSource) {
      setLoading(true)
      setError(null)
    } else {
      setLoading(false)
    }
  }, [isActive, frameSource])

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      {/* Live video feed */}
      <div
        className={cn("w-full h-full flex items-center justify-center transition-transform duration-300", {
          "scale-[var(--zoom-level)]": zoom > 1,
        })}
        style={{ "--zoom-level": zoom } as React.CSSProperties}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Initializing camera...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 text-destructive">
            <p>{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : isActive && frameSource ? (
          <img
            ref={videoRef}
            src={frameSource}
            alt="ASL detection video feed"
            className="w-full h-full object-cover"
            onError={() => setError("Failed to load video stream")}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Click Start Detection to begin</p>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {/* {isActive && !error && frameSource && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-medium">Recording</span>
        </div>
      )} */}
    </div>
  )
}

