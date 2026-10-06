# English PDF Reader

Read English PDFs in the browser. Select a word or phrase and get its **Brazilian Portuguese translation**, an **approximate pronunciation** and **audio**, without leaving the page.

No backend: everything runs in the browser and talks directly to [OpenRouter](https://openrouter.ai).

## Features

- Open and read a PDF in the browser
- Select a word or phrase and tap **Traduzir**
- Translation that uses the surrounding text as context
- Portuguese-style pronunciation guide (e.g. `equal` → `Í-cuol`)
- Audio playback of the selected English text
- Local cache of translations (up to 500 entries)
- Configurable OpenRouter API key and model
- Responsive layout, light and dark themes

## Quick start

Requirements: Node.js, npm and an [OpenRouter API key](https://openrouter.ai/keys).

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> and:

1. Click **Configurar chave** and paste your API key (optionally change the model).
2. Click **Abrir PDF** and choose a file.
3. Select some text and click **Traduzir**.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run typecheck` | Type-checks the project |
| `npm run build` | Creates the production build |
| `npm start` | Serves the production build |

`npm install` also copies the PDF.js worker to `public/` (via `postinstall`), so you don't need to do it by hand.

## How it works

```text
Open PDF → Select text → "Traduzir"
        → selected text + nearby context sent to OpenRouter
        → translation + pronunciation shown
        → optional audio
```

**Context-aware translation.** Besides the selected text, the app sends a short excerpt around it, so words with several meanings are translated correctly:

```text
Selected text:  "charge"
Context:        "The hotel will charge your card when you check in."
```

**Audio.** The app uses the browser's English voice when one is available. If there is none (common on Linux) or it fails, it falls back to OpenRouter's text-to-speech with the same API key.

**Cache.** Translations are stored in `localStorage` so repeated words don't trigger new requests. Only the 500 most recent entries are kept.

**Limits.** Selections longer than 300 characters are ignored.

## API key and privacy

The key is stored in your browser's `localStorage` and sent only to OpenRouter. Translations and settings never leave your browser except for the requests to OpenRouter.

> **Security note:** because there is no backend, the key lives on the client. This is fine for personal or local use, but it is not equivalent to keeping credentials on a server.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| PDF | PDF.js |
| Translation and fallback audio | OpenRouter |
| Local audio | Web Speech API |
| Persistence | `localStorage` |

## Project structure

```text
src/
├── app/            routes and layout
├── components/     interface only
│   ├── layout/       header
│   ├── reader/       PDF reader and pages
│   ├── settings/     API key and model dialog
│   ├── translation/  "Traduzir" button and result popover
│   └── ui/           reusable pieces (Button, SpeakerIcon)
├── hooks/          React state and behavior
├── lib/            logic and integrations, no React
│   ├── openrouter/   translation and text-to-speech requests
│   ├── pdf/          PDF.js loading and text positioning
│   ├── selection/    reads the selection and its context
│   ├── speech/       local and remote audio playback
│   └── storage/      safe localStorage and translation cache
├── constants/      fixed values
└── types/          shared types
```

Dependencies flow in one direction:

```text
components → hooks → lib → browser APIs / OpenRouter / PDF.js
```

| Folder | Rule |
| --- | --- |
| `components/` | Rendering only. No API calls or storage access. |
| `hooks/` | One behavior per hook (`usePdfDocument`, `useTextSelection`, `useTranslation`, `useSpeech`, `useSettings`). |
| `lib/` | Plain functions and integrations. Never imports React. |

Conventions: code and names in English, interface text in Brazilian Portuguese.

## Roadmap

- Personal vocabulary list and favorites
- Translation history
- Additional languages
- Reading and vocabulary statistics
- Syncing between devices
- Server-side API key handling for production deployments

The modular structure is meant to make these additions small and local.

## License

For educational and portfolio purposes.
