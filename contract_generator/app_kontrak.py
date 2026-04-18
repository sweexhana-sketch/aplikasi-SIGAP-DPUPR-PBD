
import streamlit as st
import pandas as pd
from docxtpl import DocxTemplate
import io
import zipfile

# --- KONFIGURASI HALAMAN ---
st.set_page_config(page_title="Generator Kontrak PUPR", page_icon="📝")

# --- FUNGSI TERBILANG ---
def terbilang(n):
    angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]
    n = int(n)
    if n < 12:
        return " " + angka[n]
    elif n < 20:
        return terbilang(n - 10) + " Belas"
    elif n < 100:
        return terbilang(n / 10) + " Puluh" + terbilang(n % 10)
    elif n < 200:
        return " Seratus" + terbilang(n - 100)
    elif n < 1000:
        return terbilang(n / 100) + " Ratus" + terbilang(n % 100)
    elif n < 1000000:
        return terbilang(n / 1000) + " Ribu" + terbilang(n % 1000)
    elif n < 1000000000:
        return terbilang(n / 1000000) + " Juta" + terbilang(n % 1000000)
    elif n < 1000000000000:
        return terbilang(n / 1000000000) + " Miliar" + terbilang(n % 1000000000)
    else:
        return "Angka Terlalu Besar"

def format_rupiah_text(nilai):
    if pd.isna(nilai) or nilai == 0:
        return "Nol Rupiah"
    try:
        teks = terbilang(nilai)
        return f"{teks} Rupiah".strip()
    except:
        return "Nilai Error"

# --- UI APLIKASI ---
st.title("📝 Generator Kontrak Otomatis")
st.markdown("Upload data **Laporan PPK (Excel/CSV)** dan **Template Word**, lalu download hasilnya.")

# 1. Upload File
col1, col2 = st.columns(2)
with col1:
    uploaded_data = st.file_uploader("Upload File Data (Excel/CSV)", type=['xlsx', 'csv'])
with col2:
    uploaded_template = st.file_uploader("Upload Template Kontrak (.docx)", type=['docx'])

if uploaded_data and uploaded_template:
    try:
        # Baca Data (Skip 16 baris untuk melewati Kop Surat)
        if uploaded_data.name.endswith('.csv'):
            df = pd.read_csv(uploaded_data, header=16)
        else:
            df = pd.read_excel(uploaded_data, sheet_name='DATA KONTRAK', header=16)

        # Filter Data Kosong
        df_clean = df.dropna(subset=['URAIAN/KEGIATAN/PAKET PEKERJAAN'])
        df_clean = df_clean[df_clean['URAIAN/KEGIATAN/PAKET PEKERJAAN'] != 'TOTAL']

        st.subheader("✅ Preview Data yang akan Diproses")
        st.dataframe(df_clean[['URAIAN/KEGIATAN/PAKET PEKERJAAN', 'NAMA PENYEDIA/ PELAKSANA', 'NILAI KONTRAK']].head())
        
        total_data = len(df_clean)
        st.info(f"Ditemukan **{total_data}** data paket pekerjaan.")

        # Tombol Generate
        if st.button("🚀 Buat Kontrak Sekarang"):
            # Buffer untuk ZIP file
            zip_buffer = io.BytesIO()

            with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
                progress_bar = st.progress(0)
                
                for index, row in df_clean.iterrows():
                    # Update Progress
                    progress_bar.progress((index + 1) / total_data)

                    # Ambil Data & Bersihkan
                    nama_paket = row['URAIAN/KEGIATAN/PAKET PEKERJAAN']
                    nama_penyedia = row['NAMA PENYEDIA/ PELAKSANA']
                    
                    # Bersihkan Nilai Uang
                    raw_nilai = str(row['NILAI KONTRAK']).replace('Rp','').replace('.','').replace(',','')
                    try:
                        nilai_int = int(float(raw_nilai))
                    except:
                        nilai_int = 0

                    # Mapping Context (Kamus Data)
                    context = {
                        'nama_paket': nama_paket,
                        'lokasi': row['LOKASI PEKERJAAN'],
                        'nama_penyedia': nama_penyedia,
                        'nilai_kontrak': f"Rp {nilai_int:,.0f}".replace(",", "."),
                        'terbilang': format_rupiah_text(nilai_int),
                        'no_kontrak': row['NOMOR DAN TANGGAL KONTRAK/SPK'],
                        # Kolom Unnamed biasanya hasil merge cell di Excel
                        'tgl_kontrak': row.get('Unnamed: 12', '-'), 
                        'no_spmk': row['NOMOR DAN TANGGAL SPMK'],
                        'tgl_spmk': row.get('Unnamed: 14', '-'),
                        'waktu': row['JANGKA WAKTU PELAKSANAAN ']
                    }

                    # Render Template
                    doc = DocxTemplate(uploaded_template)
                    doc.render(context)

                    # Simpan ke Memory (Bukan ke Disk)
                    output_io = io.BytesIO()
                    doc.save(output_io)
                    output_io.seek(0)

                    # Masukkan ke ZIP
                    nama_file = f"Kontrak_{str(nama_penyedia).replace('/','_')}.docx"
                    zip_file.writestr(nama_file, output_io.read())

            st.success("🎉 Selesai! Semua kontrak berhasil dibuat.")
            
            # Tombol Download ZIP
            st.download_button(
                label="📥 Download Semua Kontrak (.zip)",
                data=zip_buffer.getvalue(),
                file_name="Hasil_Kontrak_PUPR.zip",
                mime="application/zip"
            )

    except Exception as e:
        st.error(f"Terjadi kesalahan: {e}")
        st.warning("Pastikan format Excel sesuai dengan lampiran (Header dimulai setelah baris ke-16).")
else:
    st.info("Silakan upload file Data dan Template untuk memulai.")
