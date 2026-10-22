#!/usr/bin/env python3
"""Gera os .md de src/content/textos a partir do HTML em resgate/analises.

Rode a partir da raiz do repositorio:

    python3 ferramentas/montar.py

Para atualizar o HTML de origem antes, use ferramentas/baixar.py.

A lista ARTIGOS no fim do arquivo e a fonte da verdade: o nome do arquivo
de destino e mantido mesmo quando o titulo muda na origem, para nao
quebrar URLs ja publicadas.
"""
import html as H
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extrair import extract  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(RAIZ, "resgate", "analises") + os.sep
DEST = os.path.join(RAIZ, "src", "content", "textos") + os.sep

MES = {
    "jan": "01", "fev": "02", "mar": "03", "abr": "04", "mai": "05", "jun": "06",
    "jul": "07", "ago": "08", "set": "09", "out": "10", "nov": "11", "dez": "12",
}

TAG_DIV = re.compile(r"<(/?)div\b")


# -- utilitarios de HTML ------------------------------------------------
def _div_bloco(h, ini):
    """Conteudo e fim da div que abre em `ini`, casando profundidade."""
    j = h.index(">", ini) + 1
    prof, k = 1, j
    while prof and k < len(h):
        m = TAG_DIV.search(h, k)
        if not m:
            return h[j:], len(h)
        prof += -1 if m.group(1) else 1
        k = m.end()
        if prof == 0:
            return h[j : m.start()], h.index(">", m.start()) + 1
    return h[j:], len(h)


def _filhos_div(bloco):
    out, k = [], 0
    while True:
        m = re.compile(r"<div\b").search(bloco, k)
        if not m:
            return out
        conteudo, fim = _div_bloco(bloco, m.start())
        out.append(conteudo)
        k = fim


def _pedacos(fragmento):
    t = re.sub(r"<[^>]+>", "\x00", fragmento)
    return [" ".join(H.unescape(p).split()) for p in t.split("\x00") if p.strip()]


def _norm(s):
    return re.sub(r"[\s*_`]+", "", s).lower()


# -- blocos especiais ---------------------------------------------------
def titulos_callout(main):
    """Titulos das caixas de destaque (div com border-left colorida)."""
    out = []
    for m in re.finditer(r'<div style="border-left:3px solid', main):
        bloco, _ = _div_bloco(main, m.start())
        filhos = _filhos_div(bloco)
        if filhos:
            t = " ".join(_pedacos(filhos[0]))
            if t and len(t) < 80:
                out.append(t)
    return out


def cartoes(main):
    """Cartoes de metrica (div.grid-2col) viram uma linha unica."""
    i = main.find('class="grid-2col"')
    if i < 0:
        return None, ""
    bloco, _ = _div_bloco(main, main.rfind("<div", 0, i))
    itens = []
    for card in _filhos_div(bloco):
        p = _pedacos(card)
        if len(p) >= 2:
            resto = " ".join(p[2:])
            itens.append("**%s:** %s%s" % (p[0], p[1], " — %s" % resto if resto else ""))
    return (" · ".join(itens) if itens else None), " ".join(_pedacos(bloco))


# -- montagem -----------------------------------------------------------
def meta(slug):
    raw = open(RES + slug + ".html", encoding="utf-8").read()
    main = re.search(r"<main.*?</main>", raw, re.S).group(0)

    titulo = H.unescape(re.search(r"<title>(.*?)</title>", raw).group(1))
    titulo = titulo.replace(" · Leta Build", "").strip()

    d = re.search(r'name="description" content="(.*?)"', raw)
    desc = re.sub(r"<[^>]+>", "", H.unescape(d.group(1))).strip() if d else ""

    tags = re.findall(r'border:1px solid rgba\(224,138,58,0\.2\)">([^<]+)</span>', main)
    tags = [H.unescape(t).strip() for t in tags][:6]

    s = re.search(r"<h1[^>]*>.*?</h1><p[^>]*>(.*?)</p>", main, re.S)
    # mantem a marcacao do subtitulo: vira markdown no corpo
    sub_html = s.group(1).strip() if s else ""
    sub = re.sub(r"<[^>]+>", "", H.unescape(sub_html)).strip() if sub_html else desc

    # alguns artigos trazem "(atualizado ...)" junto, entao cai no padrao solto
    dt = re.search(
        r"<span>(\d{1,2}) (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez) (\d{4})",
        main,
    ) or re.search(
        r"(\d{1,2}) (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez) (\d{4})", main
    )
    data = "%s-%s-%02d" % (dt.group(3), MES[dt.group(2)], int(dt.group(1))) if dt else ""

    return titulo, desc or sub, tags, data, sub, sub_html


def md_do_html(frag):
    """Converte um fragmento inline (subtitulo) em markdown."""
    t = H.unescape(frag)
    t = re.sub(r"</?(?:em|i)>", "*", t)
    t = re.sub(r"</?(?:strong|b)>", "**", t)
    t = re.sub(r"<[^>]+>", "", t)
    return " ".join(t.split())


def corpo(slug, titulo, sub):
    raw = open(RES + slug + ".html", encoding="utf-8").read()
    main = re.search(r"<main.*?</main>", raw, re.S).group(0)
    linha_cartoes, texto_cartoes = cartoes(main)

    t = extract(RES + slug + ".html")
    # corta tudo antes do h1 (linha de tags) e o proprio h1
    t = re.sub(r"^.*?\n*# " + re.escape(titulo) + r"\s*", "", t, count=1, flags=re.S)
    # remove a assinatura
    t = re.sub(r"\n?Caio Leta\s*·[^\n]*\n", "\n", t, count=1)

    # troca a sequencia de cartoes soltos por uma linha unica
    if linha_cartoes:
        alvo = _norm(texto_cartoes)
        blocos = t.split("\n\n")
        for ini in range(len(blocos)):
            acc = ""
            for fim in range(ini, min(ini + 14, len(blocos))):
                acc += _norm(blocos[fim])
                if acc == alvo:
                    blocos[ini : fim + 1] = [linha_cartoes]
                    break
                if not alvo.startswith(acc):
                    break
            if acc == alvo:
                break
        t = "\n\n".join(blocos)

    # subtitulo repetido no corpo
    if sub:
        alvo = _norm(sub)
        blocos = t.split("\n\n")
        for i, b in enumerate(blocos[:4]):
            if _norm(b) == alvo:
                blocos.pop(i)
                break
        t = "\n\n".join(blocos)

    # titulo de caixa de destaque vira negrito na frente do proprio paragrafo
    for rotulo in titulos_callout(main):
        t = re.sub(
            r"\n[ \t]*" + re.escape(rotulo) + r"[ \t]*\n+",
            "\n\n**%s:** " % rotulo.rstrip(":"),
            t,
            count=1,
        )

    # numero da secao colado no titulo: "## 1O Boom" -> "## 1. O Boom"
    t = re.sub(r"(?m)^(#{2,4}) (\d+(?:\.\d+)?)\.? ?(?=[A-ZÀ-Ú])", r"\1 \2. ", t)

    # a origem tem tags escapadas no meio do texto, inclusive dentro de
    # URLs, onde quebram o link
    t = re.sub(r"\]\(([^)]*)\)", lambda m: "](%s)" % re.sub(r"</?\w+>", "", m.group(1)), t)
    t = re.sub(r"</?(?:em|i)>", "*", t)
    t = re.sub(r"</?(?:strong|b)>", "**", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


def montar(slug, arquivo):
    titulo, desc, tags, data, sub, sub_html = meta(slug)
    body = corpo(slug, titulo, sub)
    fm = [
        "---",
        'titulo: "%s"' % titulo.replace('"', "'"),
        # descricao vira meta description: texto puro de proposito
        'descricao: "%s"' % desc.replace('"', "'"),
        'data: "%s"' % data,
        "tags: [%s]" % ", ".join('"%s"' % x for x in tags),
        'publicadoEm: "Leta Build"',
        'linkOriginal: "https://analises.letabuild.com/%s"' % slug,
        "---",
        "",
        md_do_html(sub_html) or sub,
        "",
        "---",
        "",
        body,
        "",
    ]
    open(DEST + arquivo, "w", encoding="utf-8").write("\n".join(fm))
    return titulo, data, len(body)


# slug na origem -> arquivo de destino (nome fixo para preservar a URL)
ARTIGOS = [
    ("topo-fundo-adocao", "o-topo-e-especulacao-o-fundo-e-adocao.md"),
    ("divida-ia-bitcoin", "a-ia-pode-salvar-os-eua-da-espiral-da-divida.md"),
    ("dividaamericana", "quando-a-divida-cresce-mais-rapido-que-a-economia.md"),
    ("emprestimos-bitcoin", "nao-venda-seu-bitcoin-use-como-colateral.md"),
    ("bandeiras", "teoria-das-bandeiras.md"),
    ("confisco-silencioso", "o-confisco-que-nao-aparece-no-extrato.md"),
    ("confisco", "o-bitcoin-como-seguro-contra-confisco.md"),
    ("hormuz", "hormuz-stablecoins-e-bitcoin.md"),
    ("saas", "o-modelo-de-saas-morreu.md"),
    ("strc", "strc-e-o-impacto-da-demanda-marginal-no-preco-do-bitcoin.md"),
]


if __name__ == "__main__":
    alvos = sys.argv[1:] or [s for s, _ in ARTIGOS]
    for slug, arq in ARTIGOS:
        if slug in alvos:
            t, d, n = montar(slug, arq)
            print("%-52s %s  %6d chars  %s" % (arq, d, n, t[:46]))
