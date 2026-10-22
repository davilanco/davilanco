# Music assets

Put public audio files and matching cover images directly in this folder. No manifest file is required.

Supported audio extensions: `.mp3`, `.m4a`, `.aac`, `.ogg`, `.oga`, `.wav`, `.flac`, and `.opus`.

Supported image extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, and `.avif`.

Example files:
- `felo-me.mp3`
- `felo-me.png`

The music page automatically discovers audio files through this repository's `/api/music` Cloudflare Pages Function. When a cover image has the same base filename as its audio file, it is displayed automatically. For example, `felo-me.mp3` pairs with `felo-me.png`.

After adding or removing files, commit the changes to the repository. The page refreshes its list from the folder; you do not need to edit a JSON manifest or JavaScript for each track.

The account, login/signup, and music-comments APIs live in this repository under `functions/api/` and use a Cloudflare D1 binding named `DB`. The `DB` binding must point to the same D1 database as the Store account system, and `SESSION_SECRET` (or `AE_APP_SECRET`) must match the Store project's session secret for existing account tokens to work.
