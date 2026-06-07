'use client'
import { useRef, useState } from 'react'

export default function DemoSection() {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  function togglePlay() {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
      setPlaying(false)
    } else {
      videoRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <div className="w-full py-10">

      {/* Header text */}
      <div className="text-center mb-8">
        <h2 className="text-white text-3xl font-bold tracking-tight">
          See DECKARC Tracker in action.
        </h2>
        <p className="text-gray-400 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
          In this demo you will see how DECKARC Tracker manages projects, tracks
          daily progress, fires alerts, and generates AI-powered updates for
          your team and clients — all in one place.
        </p>
      </div>

      {/* Video player */}
      <div className="max-w-3xl mx-auto">
        <div
          onClick={togglePlay}
          className="relative rounded-2xl overflow-hidden cursor-pointer"
          style={{
            background: '#0d1117',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            aspectRatio: '16/9',
          }}
        >
          {/* Actual video — hidden until file exists */}
          <video
            ref={videoRef}
            src="/demo.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            onEnded={() => setPlaying(false)}
            onError={() => {}}
          />

          {/* Overlay — shown when not playing */}
          {!playing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">

              {/* Play button */}
              <div className="w-16 h-16 rounded-full bg-gray-700/80 hover:bg-gray-600/90 border border-gray-600 flex items-center justify-center transition mb-4">
                <svg
                  className="w-6 h-6 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              {/* Placeholder text — remove once video is added */}
              <p className="text-gray-300 text-sm font-medium">
                Demo video
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Click to play
              </p>

            </div>
          )}

          {/* Pause button — shown when playing */}
          {playing && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}