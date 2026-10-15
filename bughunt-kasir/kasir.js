/*
 * Kasir Kantin STEAM: logika perhitungan
 *
 * File ini berisi seluruh aturan bisnis kasir (menu, keranjang, diskon,
 * PPN, total, dan kembalian). Tampilan ada di app.js.
 * Fungsi-fungsi di sini bisa diuji langsung dengan Node.js (lihat folder tes/).
 */

const MENU = [
  { kode: "K01", nama: "Nasi Goreng", harga: 15000 },
  { kode: "K02", nama: "Mie Ayam", harga: 13500 },
  { kode: "K03", nama: "Soto Ayam", harga: 14000 },
  { kode: "K04", nama: "Es Teh", harga: 4000 },
  { kode: "K05", nama: "Jus Jeruk", harga: 8500 },
  { kode: "K06", nama: "Roti Bakar", harga: 10500 },
  { kode: "K07", nama: "Air Mineral", harga: 3500 },
];

function cariProduk(kode) {
  return MENU.find((p) => p.kode === kode);
}

//Perbaikan Bug 
const QTY_MIN = 1;
const QTY_MAX = 99;
// Mengubah jumlah dari kolom isian (bisa berupa teks) menjadi bilangan bulat
// 1..99. Jumlah kosong, nol, negatif, pecahan, atau bukan angka ditolak.
function validasiQty(qty) {
  let angka;
  if (typeof qty === "number") {
    angka = qty;
  } else if (typeof qty === "string" && /^[+-]?\d+(\.\d+)?$/.test(qty.trim())) {
    angka = Number(qty.trim());
  } else {
    angka = NaN;
  }
  if (!Number.isInteger(angka) || angka < QTY_MIN || angka > QTY_MAX) {
    throw new Error(
      "Jumlah harus bilangan bulat dari " + QTY_MIN + " sampai " + QTY_MAX
    );
  }
  return angka;
}
// Menambahkan produk ke keranjang.
// Jika produk sudah ada di keranjang, jumlahnya ditambahkan.
function tambahItem(keranjang, kode, qty) {
  const produk = cariProduk(kode);
  if (!produk) {
    throw new Error("Produk tidak ditemukan");
  }
  // Jika ada yang ditolak, keranjang tidak diubah sama sekali.
   const jumlah = validasiQty(qty);
  
  const itemLama = keranjang.find((i) => i.kode === kode);
  if (itemLama) {
    if (itemLama.qty + jumlah > QTY_MAX) {
      throw new Error(
        "Total jumlah per produk tidak boleh lebih dari " + QTY_MAX
        );
  itemLama.qty += jumlah;
    } else {
    keranjang.push({
      kode: produk.kode,
      nama: produk.nama,
      harga: produk.harga,
      qty: qty,
    });
  }
  return keranjang;
}

function hapusItem(keranjang, kode) {
  return keranjang.filter((i) => i.kode !== kode);
}

function hitungSubtotal(keranjang) {
  let subtotal = 0;
  for (const item of keranjang) {
    subtotal += item.harga * item.qty;
  }
  return subtotal;
}
// Persentase dari nilai rupiah bulat, dibulatkan ke rupiah terdekat
// (0,5 ke atas naik). Memakai hitungan bilangan bulat agar tidak terkena
// kesalahan pecahan desimal.
function persenBulat(nilai, persen) {
  return Math.floor((nilai * persen + 50) / 100);
}
// Diskon belanja dan diskon member.
function hitungDiskon(subtotal, member) {
  let diskon = 0;
  if (subtotal > 100000) {
    diskon += (subtotal * 5) / 100;
  }
  if (member) {
    diskon += (subtotal * 10) / 100;
  }
  return Math.round(diskon);
}

// PPN 11% dari dasar pengenaan pajak (subtotal setelah diskon).
function hitungPPN(dasar) {
  return persenBulat //bugMath.floor
  (dasar, 11) //bug / 100);
}

function hitungRingkasan(keranjang, member) {
  const subtotal = hitungSubtotal(keranjang);
  const diskon = hitungDiskon(subtotal, member);
  const dasarPajak = subtotal - diskon;
  const ppn = hitungPPN(dasarPajak);
  const total = dasarPajak + ppn;
  return { subtotal, diskon, ppn, total };
}

function hitungKembalian(total, bayar) {
  //Bug 
   if (!Number.isFinite(bayar)) {
    throw new Error("Uang pembayaran tidak valid");
  }
  if (bayar < total) {
    throw new Error("Uang pembayaran kurang");
  }
  return bayar - total;
}

// Agar bisa dipakai di Node.js untuk pengujian.
if (typeof module !== "undefined") {
  module.exports = {
    MENU,
    cariProduk,
    tambahItem,
    hapusItem,
    hitungSubtotal,
    hitungDiskon,
    hitungPPN,
    hitungRingkasan,
    hitungKembalian,
  };
}
