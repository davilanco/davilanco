# Music assets

Place the audio files and their cover images directly in this folder, for example:

- `felo-me.mp3`
- `felo-me.png`

Then add each track to `manifest.json` in this format:

```json
[
  {
    "id": "felo-me",
    "title": "FELO ME",
    "description": "Street Anthem",
    "audio": "felo-me.mp3",
    "image": "felo-me.png",
    "downloadName": "Davilanco - FELO ME.mp3"
  }
]
```

The music page uses this manifest because a static website cannot automatically list the contents of a folder in the visitor's browser. The media files themselves are served directly from this `music/` folder; no audio upload service or R2 bucket is required.
