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

## Como o CSS foi recuperado — 20/set/2026

O HTML sozinho não bastava: os estilos (`nt-*`) estavam em
`/_astro/node.Bmd8HngS.css`, que já retornava **404** no site publicado.

O que não funcionou:

- **Internet Archive** — nada arquivado (`/node/` e `/_astro/*` ausentes do CDX).
- **Baixar do site no ar** — o deploy atual não tem mais o arquivo.

O que funcionou: **URL de preview da versão antiga do Worker**. A Cloudflare
mantém cada versão publicada acessível num host próprio, servindo os assets
daquela versão:

```
https://<prefixo-da-versao>-<worker>.<subdominio>.workers.dev
```

No caso, a versão `d121bc06` (a última publicada à mão, de ~abr/2026):

```
https://d121bc06-caio-leta-site.caioleta.workers.dev/_astro/node.Bmd8HngS.css
https://d121bc06-caio-leta-site.caioleta.workers.dev/node/
```

O HTML vindo dali é **byte a byte idêntico** ao que estava em `live-node.html`,
o que confirma que o resgate por cache era autêntico.

Guarde essa técnica: enquanto a versão existir no histórico do Worker, ela
continua servível, mesmo que o domínio já sirva outra coisa.

## Estado: resolvido

`src/pages/node.astro` foi reconstruído e a página voltou ao repositório.
Verificação contra o original:

| Item | Resultado |
|---|---|
| Corpo do HTML renderizado | idêntico, 30.781 caracteres |
| CSS | idêntico (mesmo SHA-256 e mesmo hash de build) |
| JavaScript | reescrito legível, comportamento equivalente |

O CSS entrou como `<style is:global>` porque o original não usava seletores
com escopo. O build gera `node.Bmd8HngS.css` — o mesmo nome do arquivo
original, já que o Astro deriva o hash do conteúdo.

Os arquivos `node-publicado.html` e `node-original.css` ficam aqui como
referência do que estava no ar.
