#!/usr/bin/env bash
set -e

# Change directory to the documentation folder
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

PDF_DIR="$DIR/pdf"
mkdir -p "$PDF_DIR"

echo "=========================================================="
echo "Compiling Employee Operations Hub Documentation Suites"
echo "Output Directory: $PDF_DIR"
echo "=========================================================="

compile_pdf() {
    local src="$1"
    local name="$2"
    echo "--> Compiling $name ($src)..."
    pdflatex -interaction=nonstopmode -output-directory="$PDF_DIR" "$src" > /dev/null
    pdflatex -interaction=nonstopmode -output-directory="$PDF_DIR" "$src" > /dev/null
    echo "    Successfully compiled $name -> $PDF_DIR/$(basename "${src%.tex}.pdf")"
}

if ! command -v pdflatex >/dev/null 2>&1; then
    echo "Error: 'pdflatex' was not found in PATH." >&2
    exit 1
fi

# 1. Master Comprehensive Handbook
compile_pdf "main.tex" "Master Operations Guide"

# 2. Technical Documentation
compile_pdf "technical/technical_documentation.tex" "Technical Architecture & API Reference"

# 3. Non-Technical Documentation
compile_pdf "non-technical/non_technical_documentation.tex" "User & Operations Handbook (Plain English)"

# Clean up intermediate LaTeX files so the pdf/ directory stays clean and contains only PDFs
echo "--> Cleaning up auxiliary build artifacts..."
rm -f "$PDF_DIR"/*.aux "$PDF_DIR"/*.log "$PDF_DIR"/*.out "$PDF_DIR"/*.toc "$PDF_DIR"/*.fls "$PDF_DIR"/*.fdb_latexmk

echo "=========================================================="
echo "All PDFs generated successfully in: $PDF_DIR"
ls -la "$PDF_DIR"/*.pdf
echo "=========================================================="
