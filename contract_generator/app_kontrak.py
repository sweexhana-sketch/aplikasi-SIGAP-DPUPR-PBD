"""Secure in-memory contract generator for Streamlit."""
from __future__ import annotations

import io
import re
import zipfile
from pathlib import Path

import pandas as pd
import streamlit as st
from docxtpl import DocxTemplate

MAX_DATA_BYTES = 10 * 1024 * 1024
MAX_TEMPLATE_BYTES = 10 * 1024 * 1024
MAX_ROWS = 500
MAX_ZIP_BYTES = 50 * 1024 * 1024
REQUIRED_COLUMNS = {
    "URAIAN/KEGIATAN/PAKET PEKERJAAN",
    "NAMA PENYEDIA/ PELAKSANA",
    "NILAI KONTRAK",
    "LOKASI PEKERJAAN",
    "NOMOR DAN TANGGAL KONTRAK/SPK",
    "NOMOR DAN TANGGAL SPMK",
    "JANGKA WAKTU PELAKSANAAN ",
}


def terbilang(n: int) -> str:
    angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]
    n = int(n)
    if n < 0:
        return "Minus" + terbilang(-n)
    if n < 12:
        return " " + angka[n]
    if n < 20:
        return terbilang(n - 10) + " Belas"
    if n < 100:
        return terbilang(n // 10) + " Puluh" + terbilang(n % 10)
    if n < 200:
        return " Seratus" + terbilang(n - 100)
    if n < 1000:
        return terbilang(n // 100) + " Ratus" + terbilang(n % 100)
    if n < 1_000_000:
        return terbilang(n // 1000) + " Ribu" + terbilang(n % 1000)
    if n < 1_000_000_000:
        return terbilang(n // 1_000_000) + " Juta" + terbilang(n % 1_000_000)
    if n < 1_000_000_000_000:
        return terbilang(n // 1_000_000_000) + " Miliar" + terbilang(n % 1_000_000_000)
    return "Angka Terlalu Besar"


def format_rupiah_text(nilai: int) -> str:
    return f"{terbilang(nilai).strip()} Rupiah" if nilai else "Nol Rupiah"


def safe_filename(value: object, fallback: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", str(value or "")).strip("._-")
    return (name[:100] or fallback) + ".docx"


def read_upload(uploaded_file, max_bytes: int) -> bytes:
    data = uploaded_file.getvalue()
    if not data or len(data) > max_bytes:
        raise ValueError("Ukuran file tidak valid atau melebihi batas keamanan.")
    return data


def parse_data(uploaded_file) -> pd.DataFrame:
    data = read_upload(uploaded_file, MAX_DATA_BYTES)
    stream = io.BytesIO(data)
    if uploaded_file.name.lower().endswith(".csv"):
        frame = pd.read_csv(stream, header=16)
    else:
        frame = pd.read_excel(stream, sheet_name="DATA KONTRAK", header=16, engine="openpyxl")
    missing = REQUIRED_COLUMNS - set(frame.columns)
    if missing:
        raise ValueError("Kolom wajib tidak ditemukan: " + ", ".join(sorted(missing)))
    frame = frame.dropna(subset=["URAIAN/KEGIATAN/PAKET PEKERJAAN"])
    frame = frame[frame["URAIAN/KEGIATAN/PAKET PEKERJAAN"].astype(str).str.upper().ne("TOTAL")]
    if len(frame) == 0 or len(frame) > MAX_ROWS:
        raise ValueError(f"Jumlah data harus antara 1 dan {MAX_ROWS} baris.")
    return frame.reset_index(drop=True)


def parse_amount(value: object) -> int:
    cleaned = re.sub(r"[^0-9-]", "", str(value or ""))
    try:
        amount = int(cleaned or "0")
    except ValueError:
        return 0
    if amount < 0 or amount > 10**15:
        raise ValueError("Nilai kontrak berada di luar batas yang didukung.")
    return amount


def main() -> None:
    st.set_page_config(page_title="Generator Kontrak PUPR", page_icon="📝")
    st.title("📝 Generator Kontrak Otomatis")
    st.markdown("Upload data **Laporan PPK (Excel/CSV)** dan **Template Word**, lalu download hasilnya.")

    col1, col2 = st.columns(2)
    with col1:
        uploaded_data = st.file_uploader("Upload File Data (Excel/CSV)", type=["xlsx", "csv"])
    with col2:
        uploaded_template = st.file_uploader("Upload Template Kontrak (.docx)", type=["docx"])

    if not uploaded_data or not uploaded_template:
        st.info("Silakan upload file Data dan Template untuk memulai.")
        return

    try:
        template_bytes = read_upload(uploaded_template, MAX_TEMPLATE_BYTES)
        if not zipfile.is_zipfile(io.BytesIO(template_bytes)):
            raise ValueError("Template DOCX tidak valid.")
        df_clean = parse_data(uploaded_data)
        preview_columns = [
            "URAIAN/KEGIATAN/PAKET PEKERJAAN",
            "NAMA PENYEDIA/ PELAKSANA",
            "NILAI KONTRAK",
        ]
        st.subheader("✅ Preview Data yang akan Diproses")
        st.dataframe(df_clean[preview_columns].head())
        st.info(f"Ditemukan **{len(df_clean)}** data paket pekerjaan.")

        if not st.button("🚀 Buat Kontrak Sekarang"):
            return

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            progress_bar = st.progress(0)
            for index, row in df_clean.iterrows():
                nilai_int = parse_amount(row["NILAI KONTRAK"])
                context = {
                    "nama_paket": str(row["URAIAN/KEGIATAN/PAKET PEKERJAAN"]),
                    "lokasi": str(row["LOKASI PEKERJAAN"]),
                    "nama_penyedia": str(row["NAMA PENYEDIA/ PELAKSANA"]),
                    "nilai_kontrak": f"Rp {nilai_int:,.0f}".replace(",", "."),
                    "terbilang": format_rupiah_text(nilai_int),
                    "no_kontrak": str(row["NOMOR DAN TANGGAL KONTRAK/SPK"]),
                    "tgl_kontrak": str(row.get("Unnamed: 12", "-")),
                    "no_spmk": str(row["NOMOR DAN TANGGAL SPMK"]),
                    "tgl_spmk": str(row.get("Unnamed: 14", "-")),
                    "waktu": str(row["JANGKA WAKTU PELAKSANAAN "]),
                }
                doc = DocxTemplate(io.BytesIO(template_bytes))
                doc.render(context)
                output_io = io.BytesIO()
                doc.save(output_io)
                zip_file.writestr(safe_filename(row["NAMA PENYEDIA/ PELAKSANA"], f"kontrak_{index + 1}"), output_io.getvalue())
                if zip_buffer.tell() > MAX_ZIP_BYTES:
                    raise ValueError("Ukuran hasil melebihi batas keamanan.")
                progress_bar.progress((index + 1) / len(df_clean))

        st.success("🎉 Selesai! Semua kontrak berhasil dibuat.")
        st.download_button("📥 Download Semua Kontrak (.zip)", zip_buffer.getvalue(), "Hasil_Kontrak_PUPR.zip", "application/zip")
    except Exception:
        st.error("Terjadi kesalahan saat memproses file. Periksa format dan isi input.")


if __name__ == "__main__":
    main()
