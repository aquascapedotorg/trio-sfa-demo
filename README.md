# Peta Proses MOFI, SFA, HeBAT

Bahan demo klien yang disusun dari wireframe Figma tiga aplikasi lapangan:

- **MOFI RO App** (Moladin): pengajuan pembiayaan kendaraan oleh Relationship Officer.
- **SFA** (NNA): kunjungan harian sales, stok, penagihan, penjualan, sync ke DMS.
- **HeBAT** (BAT): absensi, rute, dan kunjungan outlet.

Per aplikasi tersedia flowchart, BPMN, siklus status, peta layar, naskah demo, dan daftar hal yang perlu dikonfirmasi ke klien.

## Isi repo

| Path | Isi |
| --- | --- |
| `index.html` | Halaman demo (GitHub Pages) |
| `peta-proses-3-aplikasi.html` | Halaman yang sama tanpa kerangka `<head>` |
| `bpmn/*.bpmn` | BPMN 2.0 dengan diagram, bisa dibuka di Camunda Modeler atau demo.bpmn.io |
| `mermaid/*.mmd` | Sumber flowchart, siklus status, dan peta layar |
| `src/` | Model proses dan generator halaman |

## Membangun ulang

```bash
npm install
node src/build.mjs
```

Ubah alur di `src/content.mjs` (flowchart, status, peta layar) atau `src/models.mjs` (BPMN), lalu jalankan ulang build.

Author: Fahrudin
