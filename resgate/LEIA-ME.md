# Resgate da página /node/ — 20/set/2026

`node-publicado.html` é o HTML que estava **no ar** em `caioleta.com/node/`,
baixado do site publicado.

## Por que existe este arquivo

A página `/node/` ("Rode seu Node Bitcoin") estava publicada mas **não existia
no repositório nem em nenhum commit do histórico**. O fonte `.astro` dela se
perdeu na formatação do Mac em 29/jul/2026.

Foi descoberta comparando o sitemap publicado (83 URLs) com o que o repo gera
(82 URLs).

### Como ela ficou de fora do Git

O build automático da Cloudflare quebrou em mar/2026 porque a configuração do
Worker (`wrangler.jsonc`) ficou na branch `cloudflare/workers-autoconfig`, que
nunca foi mesclada na `main`. Sem ela, todo push falhava.

O contorno foi publicar à mão com `wrangler deploy` — 5 versões entre mar e
abr/2026, visíveis no painel como *"Manually deployed"*. O que subia vinha de
uma pasta local, não de um commit. Quando o Mac foi formatado, essa pasta foi
junto.

## Conteúdo da página

Guia completo de como rodar um node Bitcoin, ~54 KB, em 6 capítulos:

1. Por que rodar seu próprio node Bitcoin
2. O que faz um node Bitcoin (cartório, completo vs. prunado, hardware)
3. Opção 1: node em notebook velho dedicado
4. Opção 2: node prunado no computador pessoal
5. Opção 3: node no Umbrel (Raspberry Pi / mini PC)
6. Conectando a carteira (Sparrow, Electrum, Tor) + comparação

O `<title>` publicado é `Rode seu Node Bitcoin - letabuild.com`, embora a página
esteja servida em `caioleta.com`.

## Estado

Este HTML é o **único registro** do conteúdo. O fonte `.astro` ainda precisa ser
reconstruído a partir dele e devolvido a `src/pages/`.

Enquanto isso não acontecer, qualquer publicação a partir do repositório
**remove a página do ar**, porque ela não existe no fonte.
