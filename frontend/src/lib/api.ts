// API service for interacting with the ASL detection backend

export async function setThreshold(value: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`http://localhost:8081/threshold/${value}`, {
        method: "POST",
      })
  
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to set threshold")
      }
  
      return await response.json()
    } catch (error) {
      console.error("Error setting threshold:", error)
      throw error
    }
  }
  
  export async function setZoom(factor: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`http://localhost:8081/zoom/${factor}`, {
        method: "POST",
      })
  
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to set zoom")
      }
  
      return await response.json()
    } catch (error) {
      console.error("Error setting zoom:", error)
      throw error
    }
  }
  
  export async function getPredictions(): Promise<any> {
    try {
      const response = await fetch("http://localhost:8081/predictions")
  
      if (response.status === 204) {
        return null // No predictions available yet
      }
  
      if (!response.ok) {
        throw new Error("Failed to fetch predictions")
      }
  
      return await response.json()
    } catch (error) {
      console.error("Error fetching predictions:", error)
      throw error
    }
  }

  export async function pauseVideo(): Promise<any> {
    try {
      const response = await fetch("http://localhost:8081/pause")
  
      if (!response.ok) {
        throw new Error("Failed to pause video")
      }
  
      return await response.json()
    } catch (error) {
      console.error("Error pausing video", error)
      throw error
    }
  }
  
  // Video stream URL
  export const VIDEO_STREAM_URL = "http://localhost:8081/video"
  
  