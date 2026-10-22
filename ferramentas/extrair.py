#!/usr/bin/env python3
"""Converte uma pagina publicada do analises.letabuild.com (Next.js SSR) em markdown.

Le o HTML renderizado, nao o fonte React: e o que garante fidelidade ao que
esta no ar. Usado por montar.py.
"""
import re
import sys
from html.parser import HTMLParser

SKIP = {"script", "style", "svg", "noscript", "head", "nav"}


class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.skip_depth = 0
        self.stack = []
        self.in_table = False
        self.row = []
        self.cell = []
        self.in_cell = False
        self.rows = []
        self.href = None
        self.link_text = []
        self.enf = {"b": 0, "i": 0, "c": 0}  # evita marcacao aninhada

    # -- marcacao -------------------------------------------------------
    def _abrir(self, k, marca):
        if self.enf[k] == 0:
            self._emit(marca)
        self.enf[k] += 1

    def _fechar(self, k, marca):
        if self.enf[k] > 0:
            self.enf[k] -= 1
            if self.enf[k] == 0:
                self._emit(marca)

    # -- parser ---------------------------------------------------------
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in SKIP:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        self.stack.append(tag)
        if tag == "table":
            self.in_table = True
            self.rows = []
        elif tag == "tr" and self.in_table:
            self.row = []
        elif tag in ("td", "th") and self.in_table:
            self.in_cell = True
            self.cell = []
        elif tag == "a":
            self.href = a.get("href")
            self.link_text = []
        elif tag == "br":
            self._emit("\n")
        elif tag == "span":
            # spans adjacentes viram rotulo+valor colados sem isto
            self._emit(" ")
        elif tag in ("h1", "h2", "h3", "h4"):
            self._emit("\n\n@@H%s@@ " % tag[1])
        elif tag == "li":
            self._emit("\n@@LI@@ ")
        elif tag in ("p", "div", "section"):
            self._emit("\n\n")
        elif tag in ("strong", "b"):
            self._abrir("b", "@@B@@")
        elif tag in ("em", "i"):
            self._abrir("i", "@@I@@")
        elif tag == "code":
            self._abrir("c", "@@C@@")

    def handle_endtag(self, tag):
        if tag in SKIP:
            self.skip_depth = max(0, self.skip_depth - 1)
            return
        if self.skip_depth:
            return
        if self.stack and tag in self.stack:
            while self.stack and self.stack.pop() != tag:
                pass
        if tag == "table":
            self.in_table = False
            self._emit_table()
        elif tag == "tr" and self.in_table:
            if self.row:
                self.rows.append(self.row)
            self.row = []
        elif tag in ("td", "th") and self.in_table:
            self.in_cell = False
            self.row.append(" ".join("".join(self.cell).split()))
            self.cell = []
        elif tag == "a":
            txt = "".join(self.link_text)
            h = self.href
            self.href = None
            self.link_text = []
            if h and h.startswith("http") and txt.strip():
                self._emit("[%s](%s)" % (txt.strip(), h))
            else:
                self._emit(txt)
        elif tag in ("strong", "b"):
            self._fechar("b", "@@B@@")
        elif tag in ("em", "i"):
            self._fechar("i", "@@I@@")
        elif tag == "code":
            self._fechar("c", "@@C@@")
        elif tag in ("h1", "h2", "h3", "h4"):
            self._emit("\n\n")
        elif tag == "span":
            self._emit(" ")

    def handle_data(self, d):
        if self.skip_depth:
            return
        self._emit(d)

    # -- saida ----------------------------------------------------------
    def _emit(self, s):
        if self.href is not None:
            self.link_text.append(s)
        elif self.in_cell:
            self.cell.append(s)
        else:
            self.out.append(s)

    def _emit_table(self):
        rows = [r for r in self.rows if any(c.strip() for c in r)]
        if not rows:
            return
        width = max(len(r) for r in rows)
        rows = [r + [""] * (width - len(r)) for r in rows]
        linhas = ["", ""]
        linhas.append("| " + " | ".join(rows[0]) + " |")
        linhas.append("|" + "---|" * width)
        for r in rows[1:]:
            linhas.append("| " + " | ".join(r) + " |")
        linhas.append("")
        self.out.append("\n".join(linhas))
        self.rows = []


def extract(path):
    raw = open(path, encoding="utf-8").read()
    m = re.search(r"<main[^>]*>(.*?)</main>", raw, re.S)
    body = m.group(1) if m else raw
    p = Extractor()
    p.feed(body)
    t = "".join(p.out)
    t = t.replace("@@B@@", "**").replace("@@I@@", "*").replace("@@C@@", "`")
    for n in (1, 2, 3, 4):
        t = t.replace("@@H%d@@" % n, "#" * n)
    t = t.replace("@@LI@@", "-")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r" *\n *", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


if __name__ == "__main__":
    print(extract(sys.argv[1]))
