import { SoundCustomization, SoundEventId, SoundPackId } from '../../../shared/types'

class BrowserSoundEngine {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public play(event: SoundEventId, config: SoundCustomization): void {
    if (!config.enabled) return
    const evCfg = config.events[event]
    if (!evCfg || !evCfg.enabled) return

    const finalVolume = Math.max(0, Math.min(1, config.masterVolume * evCfg.volume))
    if (finalVolume <= 0.01) return

    // If user uploaded a custom audio file for this action, play it
    if (evCfg.customAudioDataUrl) {
      const audio = new Audio(evCfg.customAudioDataUrl)
      audio.volume = finalVolume
      audio.play().catch(() => {})
      return
    }

    const ctx = this.getContext()
    if (!ctx) return

    this.synthesizeSound(ctx, event, config.pack, finalVolume)
  }

  private synthesizeSound(
    ctx: AudioContext,
    event: SoundEventId,
    pack: SoundPackId,
    volume: number
  ): void {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Configure waveform & frequency envelope by sound pack & browser action
    const waveformMap: Record<SoundPackId, OscillatorType> = {
      'sci-fi': 'sine',
      mechanical: 'triangle',
      minimal: 'sine',
      retro: 'square'
    }
    osc.type = waveformMap[pack] || 'sine'

    let startFreq = 440
    let endFreq = 580
    let duration = 0.055

    switch (event) {
      case 'click':
        startFreq = pack === 'mechanical' ? 180 : pack === 'retro' ? 520 : 680
        endFreq = pack === 'mechanical' ? 95 : 420
        duration = 0.032
        break
      case 'tabOpen':
        startFreq = 360
        endFreq = 740
        duration = 0.085
        break
      case 'tabClose':
        startFreq = 640
        endFreq = 260
        duration = 0.08
        break
      case 'tabSwitch':
        startFreq = 480
        endFreq = 600
        duration = 0.045
        break
      case 'navigate':
        startFreq = 400
        endFreq = 880
        duration = 0.095
        break
      case 'download':
        startFreq = 520
        endFreq = 1040
        duration = 0.14
        break
    }

    osc.frequency.setValueAtTime(startFreq, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration)

    const scaledGain = pack === 'retro' ? volume * 0.25 : volume * 0.45
    gain.gain.setValueAtTime(scaledGain, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.start(now)
    osc.stop(now + duration)
  }
}

export const soundEngine = new BrowserSoundEngine()