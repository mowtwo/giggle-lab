"use client";

import {
  playSfx,
  unlockAudio as unlockAudioCore,
} from "@/lib/audio/state";

export function unlockAudio() {
  void unlockAudioCore();
}

export function playPour() {
  void playSfx("pour");
}

export function playComplete() {
  void playSfx("complete");
}

export function playWin() {
  void playSfx("win");
}
