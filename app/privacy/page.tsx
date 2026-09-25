import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi Pempek Domino — bagaimana data pemesan dikumpulkan, digunakan, dan dilindungi.',
};

const SECTIONS: Array<{ heading: string; paragraphs: string[] }> = [
  {
    heading: '1. Informasi yang kami kumpulkan',
    paragraphs: [
      'Kami hanya mengumpulkan data yang Anda berikan sendiri saat bertransaksi atau masuk ke akun:',
      '• Data pesanan: nama, nomor WhatsApp, metode pengiriman, alamat (jika dikirim), dan catatan.',
      '• Data pembayaran: metode yang dipilih serta gambar bukti pembayaran yang Anda unggah. Kami tidak pernah menerima atau menyimpan nomor kartu, PIN, atau password bank.',
      '• Data akun: bila Anda memilih masuk dengan Google, kami menerima nama, alamat email, dan foto profil dari akun Google tersebut. Jika Anda tidak masuk, proses pemesanan tetap dapat dilakukan tanpa akun.',
    ],
  },
  {
    heading: '2. Tujuan penggunaan data',
    paragraphs: [
      'Data digunakan untuk kebutuhan layanan: memproses pesanan, menghubungi Anda terkait pesanan dan pengiriman, mengirim instruksi pembayaran, serta memahami kebutuhan operasional toko.',
    ],
  },
  {
    heading: '3. Penyimpanan dan keamanan',
    paragraphs: [
      'Data disimpan pada layanan Google Firebase (Firestore untuk database, Cloud Storage untuk gambar bukti pembayaran, dan Firebase Authentication untuk akun). Seluruh lalu lintas data terenkripsi melalui HTTPS. Akses internal dibatasi untuk pihak yang terlibat dalam operasional pesanan.',
    ],
  },
  {
    heading: '4. Berbagi data',
    paragraphs: [
      'Kami tidak menjual, menyewakan, atau mengomersilkan data Anda.',
      'Data hanya dibagikan kepada pihak yang diperlukan untuk menjalankan pesanan, yaitu penyedia autentikasi Google (bila Anda masuk dengan Google) dan WhatsApp (untuk konfirmasi serta pengiriman pesanan).',
      'Kami juga dapat menyerahkan data apabila diwajibkan oleh hukum yang berlaku.',
    ],
  },
  {
    heading: '5. Retensi data',
    paragraphs: [
      'Data pesanan disimpan selama diperlukan untuk penyelesaian pesanan, penanganan sengketa, dan kewajiban pembukuan.',
      'Data yang tidak lagi diperlukan dapat dihapus atas permintaan Anda.',
    ],
  },
  {
    heading: '6. Hak Anda sebagai pengguna',
    paragraphs: [
      'Anda berhak meminta salinan data, memperbarui data yang tidak akurat, serta meminta penghapusan data.',
      'Untuk setiap permintaan, hubungi kami melalui kontak yang tercantum di bawah.',
      'Anda juga dapat berhenti menggunakan login Google kapan saja. Hal ini tidak memengaruhi pesanan yang sudah Anda buat.',
    ],
  },
  {
    heading: '7. Cookie dan penyimpanan lokal',
    paragraphs: [
      'Situs ini menggunakan cookie autentikasi admin, localStorage untuk menyimpan nomor pesanan agar mudah dicek ulang, dan cache Service Worker agar situs tetap dapat dibuka saat jaringan buruk.',
      'Cookie tersebut tidak digunakan untuk melacak perilaku Anda untuk keperluan iklan.',
    ],
  },
  {
    heading: '8. Perubahan kebijakan',
    paragraphs: [
      'Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan material akan kami informasikan melalui halaman ini. Tanggal pembaruan terakhir tercantum di bawah.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-cream pt-safe-top pb-nav-safe animate-page-in">
      <header className="bg-white border-b border-neutral-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/order"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Kembali ke menu
          </Link>
          <h1 className="font-display font-bold text-2xl text-brown mt-3">Kebijakan Privasi</h1>
          <p className="text-sm text-brown/60 mt-1">Terakhir diperbarui: 25 September 2026</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <p className="text-sm text-brown/60 leading-relaxed">
          Kebijakan ini menjelaskan bagaimana Pempek Domino mengumpulkan, menggunakan, dan melindungi
          data pribadi Anda saat Anda memesan atau menggunakan situs ini.
        </p>

        {SECTIONS.map((section) => (
          <section
            key={section.heading}
            className="bg-white rounded-card border border-neutral-100 shadow-card p-5"
          >
            <h2 className="font-display font-semibold text-base text-brown mb-2">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-sm text-brown/60 leading-relaxed mt-2 first:mt-0">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="bg-white rounded-card border border-neutral-100 shadow-card p-5">
          <h2 className="font-display font-semibold text-base text-brown mb-2">Kontak</h2>
          <p className="text-sm text-brown/60 leading-relaxed">
            Pempek Domino
            <br />
            Email: aldinoaja@gmail.com
            <br />
            {/* GANTI: alamat outlet dan kota sebelum halaman ini dipakai secara resmi. */}
            <span className="text-brown/40">Alamat outlet: [lengkapi alamat lengkap dan kota]</span>
          </p>
        </section>
      </div>
    </main>
  );
}
