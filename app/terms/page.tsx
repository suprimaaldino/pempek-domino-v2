import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Syarat dan ketentuan pemesanan di Pempek Domino — pemesanan, pembayaran, pengiriman, dan pembatalan.',
};

const SECTIONS: Array<{ heading: string; paragraphs: string[] }> = [
  {
    heading: '1. Penerimaan pesanan',
    paragraphs: [
      'Pesanan dianggap diterima setelah Anda menyelesaikan proses pemesanan dan menerima nomor pesanan.',
      'Jika menu yang Anda pilih sedang tidak tersedia, kami akan menghubungi Anda melalui WhatsApp. Pesanan yang tidak dapat kami penuhi akan dibatalkan dan pembayaran dikembalikan melalui metode semula.',
    ],
  },
  {
    heading: '2. Produk, harga, dan ketersediaan',
    paragraphs: [
      'Harga dan ketersediaan menu ditentukan oleh sistem dan dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.',
      'Harga yang berlaku adalah harga yang tertera pada saat pesanan dibuat.',
    ],
  },
  {
    heading: '3. Pembayaran',
    paragraphs: [
      'Pembayaran dilakukan melalui metode yang tersedia di halaman pemesanan, yaitu QRIS, dompet digital, atau transfer bank.',
      'Pesanan hanya diproses setelah bukti pembayaran diterima dan diverifikasi. Bila bukti pembayaran tidak dapat diverifikasi, pesanan dapat dibatalkan.',
      'Kami tidak meminta dan tidak akan meminta PIN, OTP, atau password bank Anda.',
    ],
  },
  {
    heading: '4. Pengambilan dan pengiriman',
    paragraphs: [
      'Ambil sendiri (pickup) dan dikirim dapat dipilih sesuai ketersediaan layanan kami.',
      'Untuk pesanan yang dikirim, mohon cantumkan alamat lengkap dan nomor WhatsApp yang aktif agar pengantaran dapat tepat sasaran.',
      'Perkiraan waktu penyiapan dan pengantaran bergantung pada jarak, kondisi lalu lintas, dan antrean pesanan, serta tidak merupakan jaminan waktu.',
    ],
  },
  {
    heading: '5. Pembatalan dan perubahan pesanan',
    paragraphs: [
      'Pembatalan dapat dilakukan sebelum pesanan masuk tahap pemrosesan. Setelah pesanan diproses, pembatalan tidak dapat lagi dilakukan.',
      'Permubahan jumlah, varian, atau jadwal pesanan dapat dilakukan dengan menghubungi kami melalui WhatsApp, bergantung pada ketersediaan.',
    ],
  },
  {
    heading: '6. Keluhan',
    paragraphs: [
      'Bila Anda menemukan kendala pada pesanan Anda, segera laporkan melalui WhatsApp atau email agar dapat kami tangani selagi pesanan masih dapat diperbaiki.',
    ],
  },
  {
    heading: '7. Gangguan di luar kendali kami',
    paragraphs: [
      'Kami tidak bertanggung jawab atas keterlambatan atau kegagalan layanan yang disebabkan oleh hal di luar kendali kami, seperti gangguan jaringan, cuaca ekstrem, keputusan pemerintah, atau keadaan kahar.',
    ],
  },
  {
    heading: '8. Penggunaan layanan',
    paragraphs: [
      'Anda bertanggung jawab menjaga keamanan akun Google yang digunakan untuk masuk, serta memberikan data yang benar dan tidak menyalahgunakan layanan.',
      'Kami berhak menolak atau membatalkan pesanan yang terindikasi sebagai kecurangan, penyalahgunaan layanan, atau pelanggaran ketentuan ini.',
    ],
  },
  {
    heading: '9. Perubahan ketentuan',
    paragraphs: [
      'Syarat dan ketentuan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini dan berlaku sejak tanggal yang tercantum di bawah.',
    ],
  },
];

export default function TermsPage() {
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
          <h1 className="font-display font-bold text-2xl text-brown mt-3">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-sm text-brown/60 mt-1">Berlaku sejak: 25 September 2026</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <p className="text-sm text-brown/60 leading-relaxed">
          Dengan memesan melalui situs ini, Anda menyetujui syarat dan ketentuan berikut.
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
            Pasanggahan Kasuari A5, Ponegaran, Jambidan, Banguntapan, Bantul, DI Yogyakarta 55194
          </p>
        </section>
      </div>
    </main>
  );
}
