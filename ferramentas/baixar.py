#!/usr/bin/env python3
"""Baixa o HTML publicado dos artigos do analises.letabuild.com.

    python3 ferramentas/baixar.py

Guarda em resgate/analises/. Usa curl porque o Python desta maquina nao
tem o bundle de certificados.

Um artigo que some do ar (404) NAO sobrescreve a copia ja guardada: em
varios casos esse arquivo e o unico registro restante do texto.
"""
import os
import re
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(RAIZ, "resgate", "analises") + os.sep
BASE = "https://analises.letabuild.com/"

SLUGS = [
    "topo-fundo-adocao",
    "divida-ia-bitcoin",
    "dividaamericana",
    "emprestimos-bitcoin",
    "bandeiras",
    "confisco-silencioso",
    "confisco",
    "hormuz",
    "saas",
    "strc",
    # fora do ar, mantidos como registro
    "btcprague",
    "airgap",
]


def baixar(slug):
    tmp = DEST + slug + ".novo"
    r = subprocess.run(
        ["curl", "-s", "-m", "40", "-o", tmp, "-w", "%{http_code}", BASE + slug],
        capture_output=True,
        text=True,
    )
    code = r.stdout.strip()
    if code != "200":
        if os.path.exists(tmp):
            os.remove(tmp)
        return code, None
    h = open(tmp, encoding="utf-8", errors="ignore").read()
    os.replace(tmp, DEST + slug + ".html")
    t = re.search(r"<title>(.*?)</title>", h)
    return code, (t.group(1).replace(" · Leta Build", "") if t else "")


if __name__ == "__main__":
    os.makedirs(DEST, exist_ok=True)
    alvos = sys.argv[1:] or SLUGS
    for slug in alvos:
        code, titulo = baixar(slug)
        if titulo is None:
            print("%-22s %s  (copia existente preservada)" % (slug, code))
        else:
            print("%-22s %s  %s" % (slug, code, titulo[:56]))
