export default function HowToPlay({ onBack }) {
  return (
    <div className="paper-content">

      <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>
        Kertas Lipat adalah game menyusun kalimat di mana kamu tidak akan tahu apa yang ditulis pemain lain sampai cerita akhirnya dibuka!
      </p>

      <h3 style={{ marginBottom: '10px' }}>📜 Cara Bermain:</h3>
      <ol style={{ paddingLeft: '20px', lineHeight: '2' }}>
        <li>Buat room baru atau bergabunglah ke room yang sudah ada menggunakan kode unik. Game ini bisa dimainkan oleh 3 orang atau lebih.</li>
        <li>Game ini dibagi menjadi beberapa bagian. Di setiap bagian, semua pemain akan diminta menulis satu hal spesifik sesuai instruksi yang muncul di layar (Misalnya: Nama Orang, Tempat, atau Kata Kerja).</li>
        <li>Setelah kamu klik "Lipat & Oper Kertas", tulisanmu akan otomatis "dilipat" (disembunyikan). Kertas milikmu akan dioper secara otomatis ke pemain lain, dan kamu akan menerima kertas milik temanmu.</li>
        <li>Di setiap bagian, kamu akan menerima kertas yang berbeda. Tugasmu adalah menulis bagian selanjutnya dari kalimat tersebut sesuai instruksi di layar. Kamu tidak bisa melihat apa yang sudah ditulis temanmu di bagian sebelumnya.</li>
        <li>Proses oper-operan ini berlanjut sampai semua bagian kalimat terisi lengkap. Setiap kertas akan berisi gabungan tulisan dari orang yang berbeda-beda.</li>
        <li>Setelah bagian terakhir selesai, setiap pemain akan memegang satu "kertas" yang berisi kalimat utuh. Bacakan hasil kalimat yang kamu pegang ke teman-temanmu. Siap-siap tertawa karena gabungan katanya pasti di luar nalar!</li>
      </ol>

      <h3 style={{ marginTop: '25px', marginBottom: '10px' }}>💡 Tips Biar Makin Seru:</h3>
      <ol style={{ paddingLeft: '20px', lineHeight: '2' }}>
        <li>Gunakan <strong>Inside Jokes</strong> — tulis nama teman yang sedang main atau orang yang kalian semua kenal supaya hasilnya lebih personal dan lucu.</li>
        <li>Jangan terpaku pada hal-hal normal. Masukkan tempat-tempat aneh atau kejadian absurd!</li>
        <li><strong>Jangan Mengintip</strong> — serunya game ini adalah efek kejutannya!</li>
      </ol>

      <div style={{ marginTop: '30px' }}>
        <button onClick={onBack}>← Kembali</button>
      </div>
    </div>
  );
}
