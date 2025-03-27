import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Prediction } from "@/types"

interface Detection {
  sign: string
  confidence: number
  timestamp: string
}

interface DetectionResultsProps {
  detections: Prediction[]
}

export function DetectionResults({ detections }: DetectionResultsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Detection History</CardTitle>
        <CardDescription>Recent ASL signs detected</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 px-6">
        <ScrollArea className="h-[calc(100%-1rem)] pr-4">
          <div className="space-y-4 pt-2 pb-6">
            {detections.length > 0 ? (
              detections.map((detection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0"
                >
                  <div>
                    <h3 className="font-medium">{detection.sign}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(detection.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{Math.round(detection.confidence * 100)}%</div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${detection.confidence * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No detections yet</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

