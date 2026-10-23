#!/usr/bin/env bash
set -e

# Change directory to the documentation folder
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "Compiling Employee Operations Hub Documentation (main.tex)..."

if command -v latexmk >/dev/null 2>&1; then
    latexmk -pdf -interaction=nonstopmode main.tex
elif command -v pdflatex >/dev/null 2>&1; then
    pdflatex -interaction=nonstopmode main.tex
    pdflatex -interaction=nonstopmode main.tex
else
    echo "Error: Neither 'latexmk' nor 'pdflatex' was found in PATH." >&2
    exit 1
fi

echo "Compilation successful! Generated: $DIR/main.pdf"
