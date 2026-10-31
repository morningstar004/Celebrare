import { useEffect, useState } from 'react'

const API_URL = 'https://picsum.photos/v2/list?limit=30'

export default function useFetchPhotos() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchPhotos = async () => {
      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error(`Failed to fetch photos: ${response.status}`)
        }

        const data = await response.json()

        if (isMounted) {
          setPhotos(data)
        }
      } catch {
        if (isMounted) {
          setError('Unable to load photos right now. Please try again later.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPhotos()

    return () => {
      isMounted = false
    }
  }, [])

  return { photos, loading, error }
}
