import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import useFetchPhotos from './hooks/useFetchPhotos.js'

const FAVORITES_STORAGE_KEY = 'celebrare-favorite-photo-ids'

function initializeFavorites() {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
    const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : []

    if (!Array.isArray(parsedFavorites)) {
      throw new Error('Stored favorites must be an array')
    }

    return {
      ids: new Set(parsedFavorites.filter((id) => typeof id === 'string')),
      storageError: '',
    }
  } catch {
    return {
      ids: new Set(),
      storageError: 'Favorites could not be loaded from this browser.',
    }
  }
}

function favoritesReducer(state, action) {
  switch (action.type) {
    case 'toggle': {
      const ids = new Set(state.ids)

      if (ids.has(action.photoId)) {
        ids.delete(action.photoId)
      } else {
        ids.add(action.photoId)
      }

      return { ...state, ids }
    }
    case 'storage-error':
      return { ...state, storageError: action.message }
    default:
      return state
  }
}

function Gallery() {
  const { photos, loading, error } = useFetchPhotos()
  const [favorites, dispatchFavorites] = useReducer(
    favoritesReducer,
    undefined,
    initializeFavorites,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value)
  }, [])
  const filteredPhotos = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase()
    return photos.filter((photo) =>
      (photo.author || '').toLowerCase().includes(normalizedSearchQuery),
    )
  }, [photos, searchQuery])

  useEffect(() => {
    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify([...favorites.ids]),
      )
      if (favorites.storageError) {
        dispatchFavorites({ type: 'storage-error', message: '' })
      }
    } catch {
      dispatchFavorites({
        type: 'storage-error',
        message: 'Favorites could not be saved in this browser.',
      })
    }
  }, [favorites.ids, favorites.storageError])

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#BDE0FE_0%,#A2D2FF_52%,#FFC8DD_100%)] p-4 text-slate-800 sm:p-8">
      <section className="mx-auto w-full max-w-[1200px] border border-white/60 bg-white/45 p-5 shadow-2xl shadow-slate-700/10 backdrop-blur-xl sm:p-8">
        <header className="mb-8 border-b border-slate-800/10 pb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
            Celebrare
          </p>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] leading-tight font-medium tracking-tight text-slate-900">
            Photo Gallery Web App
          </h1>
        </header>

        {!loading && !error && (
          <div className="mb-6">
            <label className="sr-only" htmlFor="author-search">
              Search photos by author
            </label>
            <div className="flex items-center gap-3 border border-slate-700/15 bg-white/45 px-4 py-3 backdrop-blur-md transition-colors focus-within:border-slate-700/40 focus-within:bg-white/65">
              <svg
                className="h-5 w-5 shrink-0 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                id="author-search"
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search photos by author"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
              />
              {searchQuery && (
                <span className="text-xs tabular-nums text-slate-600">
                  {filteredPhotos.length} results
                </span>
              )}
            </div>
          </div>
        )}

        {favorites.storageError && (
          <p className="mb-4 border-l-2 border-[#A2D2FF] px-3 py-1 text-sm text-slate-700" role="status">
            {favorites.storageError}
          </p>
        )}

        {loading && (
          <div
            className="grid min-h-[220px] place-items-center text-center"
            aria-live="polite"
          >
            <div>
              <div
                className="mx-auto h-[52px] w-[52px] animate-spin rounded-full border-4 border-[#A2D2FF]/50 border-t-[#527da5]"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm text-slate-600">Loading photos...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div
            className="grid min-h-[220px] place-items-center border border-slate-700/10 bg-white/25 px-4 text-center text-slate-700"
            aria-live="assertive"
          >
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredPhotos.map((photo) => (
                <figure
                  key={photo.id}
                  className="overflow-hidden border border-white/70 bg-white/45 transition-colors duration-200 hover:border-white hover:bg-white/70"
                >
                  <img
                    src={photo.download_url}
                    alt={photo.author ? `${photo.author} photo` : 'Random photo'}
                    className="block h-56 w-full object-cover"
                  />
                  <figcaption className="flex items-center justify-between gap-3 border-t border-slate-800/10 px-3 py-2.5 text-sm text-slate-700">
                    <span className="min-w-0 truncate">
                      {photo.author || 'Unknown author'}
                    </span>
                    <button
                      className={`grid h-9 w-9 shrink-0 place-items-center border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 ${
                        favorites.ids.has(photo.id)
                          ? 'border-[#FFC8DD] bg-[#FFC8DD]/50 text-[#8f5268]'
                          : 'border-transparent text-slate-500 hover:border-slate-700/10 hover:bg-white/60 hover:text-slate-800'
                      }`}
                      type="button"
                      aria-label={`${favorites.ids.has(photo.id) ? 'Unlike' : 'Like'} photo by ${photo.author || 'unknown author'}`}
                      aria-pressed={favorites.ids.has(photo.id)}
                      onClick={() =>
                        dispatchFavorites({ type: 'toggle', photoId: photo.id })
                      }
                    >
                      <svg
                        className={`h-5 w-5 stroke-current transition ${
                          favorites.ids.has(photo.id)
                            ? 'fill-current'
                            : 'fill-transparent'
                        }`}
                        viewBox="0 0 24 24"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                      </svg>
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="border border-slate-700/10 bg-white/25 py-12 text-center text-slate-600" role="status">
              No photos found for “{searchQuery}”.
            </p>
          )
        )}
      </section>
    </main>
  )
}

export default Gallery
