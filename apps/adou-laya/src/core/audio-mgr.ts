// AudioMgr — sound & music playback.
//
// Faithful reconstruction of the original bundle's `$` class
// (reconstruction/reference/bundle.pretty.js lines ~4032-4095). Plays the
// ORIGINAL resources/sound/*.mp3 (and the one .wav) and resources/music/*.mp3
// through Laya.SoundManager. Referenced everywhere as the audio singleton.
//
// Original member -> name:
//   playingSounds=po  soundIdSeq=yo  musicVolume=fo  soundVolume=do
//   volumeApplied=Lo  currentMusic=mo  musicPausedForAd=wo  drumRef=vo
//   stopDrum=ko  pauseMusicForAd=_o  resumeMusicAfterAd=xo

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Singleton } from "./singleton";

interface SoundHandle {
  id: number;
  channel: any;
}

export class AudioMgr extends Singleton {
  private playingSounds = new Map<number, string>();
  private soundIdSeq = 0;
  private musicVolume = 1;
  private soundVolume = 1;
  private volumeApplied = false;
  private currentMusic: string | null = null;
  private musicPausedForAd = false;
  private drumRef: SoundHandle | null = null;

  init(musicVolume: number, soundVolume: number): void {
    this.musicVolume = musicVolume;
    this.soundVolume = soundVolume;
  }

  setSoundVolume(v: number): void {
    Laya.SoundManager.soundVolume = v;
  }

  setMusicVolume(v: number): void {
    Laya.SoundManager.musicVolume = v;
  }

  /**
   * Play a one-shot (or looping) sound by base name. De-dupes a name that is
   * already playing within the last 50ms. (`zhaoYun_voice_entrance` is .wav.)
   */
  playSound(name: string, loop = false): SoundHandle | undefined {
    for (const [, playingName] of this.playingSounds) {
      if (playingName === name) return;
    }
    const id = (this.soundIdSeq += 1);
    const ext = name === "zhaoYun_voice_entrance" ? ".wav" : ".mp3";
    const url = "resources/sound/" + name + ext;
    const channel = Laya.SoundManager.playSound(url, loop ? 0 : 1);
    this.playingSounds.set(id, name);
    Laya.timer.once(50, this, () => {
      this.playingSounds.delete(id);
    });
    const handle: SoundHandle = { id, channel };
    if (name === "match_drum") this.drumRef = handle;
    return handle;
  }

  stopSound(handle: SoundHandle): void {
    handle.channel.stop();
    this.playingSounds.delete(handle.id);
  }

  /** Stop the looping match drum if it is playing. (`ko`) */
  stopDrum(): void {
    if (this.drumRef != null) this.stopSound(this.drumRef);
  }

  /** Play looping background music by base name; applies stored volumes once. */
  playMusic(name: string): void {
    this.currentMusic = name;
    const url = "resources/music/" + name + ".mp3";
    Laya.SoundManager.playMusic(url, 0);
    if (!this.volumeApplied) {
      this.volumeApplied = true;
      this.setMusicVolume(this.musicVolume);
      this.setSoundVolume(this.soundVolume);
    }
  }

  /** Pause music while an ad plays. (`_o`) */
  pauseMusicForAd(): void {
    if (this.currentMusic) {
      this.musicPausedForAd = true;
      Laya.SoundManager.stopMusic();
    }
  }

  /** Resume music after an ad finishes. (`xo`) */
  resumeMusicAfterAd(): void {
    if (this.musicPausedForAd) {
      this.musicPausedForAd = false;
      if (this.currentMusic != null) this.playMusic(this.currentMusic);
    }
  }
}
