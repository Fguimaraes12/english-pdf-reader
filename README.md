# Leitor de inglês

Leia livros em PDF e traduza palavras ou frases selecionadas (tradução + pronúncia aportuguesada) usando a OpenRouter.

## Rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000, clique em **Configurar chave**, cole sua chave da OpenRouter e abra um PDF.

## Estrutura

```
src/
  app/                 rotas e layout (Next.js App Router)
  components/
    layout/            cabeçalho
    reader/            leitor de PDF (documento, página, camada de texto)
    settings/          diálogo de configuração
    translation/       menu "Traduzir" e popover de resultado
    ui/                componentes genéricos (Button)
  hooks/               lógica de estado reutilizável
  lib/
    openrouter/        chamada e prompt da tradução
    pdf/               carregamento do pdf.js e posicionamento do texto
    selection/         leitura da seleção e do contexto
    storage/           localStorage seguro e cache de traduções
  constants/           valores fixos
  types/               tipos compartilhados
```

A chave e as traduções ficam só no navegador; a chave é enviada apenas à OpenRouter.
