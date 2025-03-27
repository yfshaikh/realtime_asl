"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function InfoPanel() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>About ASL Detector</CardTitle>
        <CardDescription>How this application works</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <p>This application uses computer vision to detect and interpret American Sign Language (ASL) in real-time.</p>
        <p>
          The model has been trained on thousands of ASL signs and can recognize common words and phrases with high
          accuracy.
        </p>
        <p>For best results, ensure good lighting and position your hands clearly in the frame.</p>
      </CardContent>
    </Card>
  )
}

