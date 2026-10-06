# English PDF Reader

A web-based PDF reader focused on learning English through contextual translation and pronunciation.

Select a word or phrase directly from a PDF to get its **Portuguese translation, pronunciation guide, and audio playback** without leaving the document.

## ✨ Features

* 📖 Read PDF documents directly in the browser
* 🔎 Select words or phrases from the PDF
* 🇺🇸 Translate English text to Brazilian Portuguese
* 🗣️ Display an approximate Portuguese pronunciation
* 🔊 Listen to the selected English text
* 🧠 Use surrounding text as context when translating
* 💾 Cache translations locally to avoid unnecessary API requests
* ⚙️ Configure the OpenRouter API key and model
* 📱 Responsive interface
* 🚫 No backend required

## 🖥️ How it works

The application is designed around a simple reading workflow:

```text
Open PDF
   ↓
Select a word or phrase
   ↓
Click "Traduzir"
   ↓
Send selected text + context to OpenRouter
   ↓
Display translation + pronunciation
   ↓
Listen to the pronunciation
```

The translation uses the selected text together with nearby content from the PDF, allowing the model to understand the context in which the word or phrase appears.

## 🛠️ Technologies

* **Next.js** — App Router
* **React**
* **TypeScript**
* **Tailwind CSS**
* **PDF.js** — PDF rendering and text selection
* **OpenRouter** — AI translation
* **Web Speech API** — text-to-speech
* **LocalStorage** — API key, settings, and translation cache

## 📂 Project Structure

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   ├── reader/
│   ├── settings/
│   ├── translation/
│   └── ui/
│
├── hooks/
│
├── lib/
│   ├── openrouter/
│   ├── pdf/
│   ├── selection/
│   ├── speech/
│   └── storage/
│
├── constants/
└── types/
```

### Architecture

The project separates UI, React behavior, and browser/API integrations:

```text
components/
    ↓
hooks/
    ↓
lib/
    ↓
Browser APIs / OpenRouter / PDF.js
```

### `components/`

Contains presentation and interface components.

```text
layout/       → application layout and header
reader/       → PDF reader and pages
settings/     → API/model configuration
translation/  → translation interface
ui/           → reusable UI components
```

### `hooks/`

Contains React-specific state and behavior.

Examples:

* `usePdfDocument` — PDF document lifecycle
* `useTextSelection` — selected text handling
* `useTranslation` — translation state and requests
* `useSpeech` — speech playback
* `useSettings` — application settings

### `lib/`

Contains integrations and logic that does not depend on React.

```text
openrouter/ → AI translation and speech API
pdf/       → PDF.js utilities
selection/ → text selection processing
speech/    → browser speech utilities
storage/   → localStorage and translation cache
```

## 🔑 OpenRouter API Key

The application does not use a backend to proxy requests.

The API key is stored in the browser using `localStorage` and is sent directly to OpenRouter when a translation or speech request is made.

### Configuration

1. Start the application.
2. Click **Configurar chave**.
3. Enter your OpenRouter API key.
4. Select the desired model.
5. Open a PDF and select some text.

> **Security note:** because the application runs entirely in the browser, the API key is stored client-side. This architecture is intended for personal/local use and is not equivalent to keeping API credentials on a server.

## 🚀 Getting Started

### Prerequisites

* Node.js
* npm
* An OpenRouter API key

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/english-pdf-reader.git
cd english-pdf-reader
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Type checking

```bash
npm run typecheck
```

### Production build

```bash
npm run build
```

Run the production server:

```bash
npm start
```

## 🧩 Main Technical Decisions

### Client-side architecture

The application does not require a backend for its current use case. PDF processing, text selection, caching, speech synthesis, and API communication are handled by the browser.

### Context-aware translation

Instead of sending only the selected word, the application also extracts nearby text from the PDF.

For example:

```text
Selected text:
"charge"

Context:
"The hotel will charge your card when you check in."
```

This gives the translation model enough information to determine the meaning of words that can have different translations depending on context.

### Local translation cache

Translations are cached in `localStorage`.

This helps avoid repeating the same request when the user encounters the same word or phrase again.

The cache has a maximum number of stored translations to prevent unbounded growth.

## 📌 Current Scope

The project currently focuses on:

* English → Brazilian Portuguese translation
* PDF reading
* Context-aware translation
* Pronunciation assistance
* Audio playback
* Browser-based configuration

The architecture is intentionally modular so features such as vocabulary lists, translation history, favorites, or additional languages can be added later.

## 🔮 Possible Future Improvements

* 📚 Personal vocabulary list
* ⭐ Favorite words
* 📜 Translation history
* 🌎 Support for additional languages
* 📊 Reading and vocabulary statistics
* 🔄 Synchronization between devices
* 🔐 Server-side API key handling for a production deployment

## 📄 License

This project is intended for educational and portfolio purposes.
