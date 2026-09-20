# Resgate dos artigos do analises.letabuild.com — 20/set/2026

HTML dos 10 artigos que estavam **no ar** em `analises.letabuild.com`,
baixados do site publicado.

O analises roda em **Vercel** (Next.js), não na Cloudflare.

## Por que existe esta pasta

O repositório `CaioLeta21/analises-letabuild` está **defasado** em relação ao
que está publicado. Último commit: 27/abr/2026.

| Artigo no ar | Fonte no repo analises? |
|---|---|
| `/bandeiras` | sim |
| `/btcprague` | **não** |
| `/confisco` | **não** |
| `/confisco-silencioso` | sim |
| `/divida-ia-bitcoin` | **não** |
| `/dividaamericana` | sim, mas é **outro artigo** hoje (ver abaixo) |
| `/emprestimos-bitcoin` | **não** |
| `/hormuz` | **não** |
| `/strc` | sim |
| `/topo-fundo-adocao` | **não** |

Cinco artigos publicados **não têm fonte em nenhum commit ou branch** do repo
do analises. Mesmo padrão que causou a perda da página `/node/`.

## Dois casos que saíram do ar

- **`/airgap`** — existe no repo (`app/airgap/page.tsx`), mas responde **404**
  no site. Foi despublicado.
- **`/saas`** — estava listado na home antiga do repo, responde **404**. Não há
  fonte em lugar nenhum. Perdido, salvo cópia externa.

## `/dividaamericana` trocou de conteúdo

O repo tem, em `/dividaamericana`, o artigo *"A Inteligência Artificial pode
salvar os EUA da espiral de dívida?"*.

No ar, essa URL hoje serve **outro artigo**: *"Quando a dívida cresce mais
rápido que a economia"*. O artigo da IA foi movido para `/divida-ia-bitcoin`,
com texto revisado.

Quem converter a partir do repo pega a versão velha. Use os HTML desta pasta.

## Como foi feito

Simples `curl`/`urlopen` no site publicado — os artigos estavam acessíveis.
Não foi preciso recorrer a deploy antigo, ao contrário do caso `/node/`
(ver `../LEIA-ME.md`).
