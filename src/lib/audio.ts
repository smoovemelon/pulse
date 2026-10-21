import type { FeedbackKind } from '../types'

let audioCtx: AudioContext | null = null

export function triggerSensoryFeedback(type: FeedbackKind, soundEnabled: boolean) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      if (type === 'click') navigator.vibrate(10)
      else if (type === 'earn') navigator.vibrate([15, 40, 25])
      else if (type === 'spend') navigator.vibrate([30, 20])
      else navigator.vibrate([40, 60, 40])
    } catch {
      /* haptics are optional */
    }
  }

  if (!soundEnabled) return

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    if (!audioCtx) audioCtx = new AudioCtx()
    if (audioCtx.state === 'suspended') void audioCtx.resume()

    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)

    if (type === 'click') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      osc.start()
      osc.stop(now + 0.045)
    } else if (type === 'earn') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.start()
      osc.stop(now + 0.26)
    } else if (type === 'spend') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(500, now)
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.15)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.start()
      osc.stop(now + 0.16)
    } else {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(140, now + 0.15)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.start()
      osc.stop(now + 0.16)
    }
  } catch {
    /* audio is optional */
  }
}
