/*
 * Pengujian bug hunt untuk kasir.js
 * Jalankan dari folder bughunt-kasir:  node --test
 *
 * Setiap grup test di bawah membuktikan satu bug (lihat catatan-bug.md).
 * Test ini gagal pada kode asli dan lulus pada kode yang sudah diperbaiki.
 */

const test = require("node:test");
const assert = require("node:assert");
const kasir = require("../kasir.js");

// ---------------------------------------------------------------
// Bug 1: jumlah pesanan tidak divalidasi (aturan 1)
// ---------------------------------------------------------------
for (const [label, nilai] of [
  ["kosong", ""],
  ["nol", 0],
  ["nol berupa teks", "0"],
  ["negatif", -1],
  ["pecahan", 1.5],
  ["pecahan berupa teks", "2.5"],
  ["bukan angka", "abc"],
  ["lebih dari 99", 100],
  ["undefined", undefined],
]) {
  test(`bug 1: jumlah ${label} ditolak dan keranjang tidak berubah`, () => {
    const keranjang = [];
    assert.throws(() => kasir.tambahItem(keranjang, "K04", nilai), Error);
    assert.deepStrictEqual(keranjang, []);
  });
}

test("bug 1: batas jumlah 1 dan 99 diterima", () => {
  const a = [];
  kasir.tambahItem(a, "K04", 1);
  assert.strictEqual(a[0].qty, 1);
  const b = [];
  kasir.tambahItem(b, "K04", 99);
  assert.strictEqual(b[0].qty, 99);
});

// ---------------------------------------------------------------
// Bug 2: jumlah dari kolom isian berupa teks, sehingga "2" + "3" = "23";
//        total jumlah per produk juga bisa melewati 99 (aturan 2)
// ---------------------------------------------------------------
test("bug 2: Es Teh 2 lalu tambah 3 menjadi 5 (jumlah berupa angka)", () => {
  const keranjang = [];
  kasir.tambahItem(keranjang, "K04", 2);
  kasir.tambahItem(keranjang, "K04", 3);
  assert.strictEqual(keranjang.length, 1);
  assert.strictEqual(keranjang[0].qty, 5);
});

test("bug 2: jumlah berupa teks dari kolom isian tetap dijumlahkan sebagai angka", () => {
  const keranjang = [];
  kasir.tambahItem(keranjang, "K04", "2");
  kasir.tambahItem(keranjang, "K04", "3");
  assert.strictEqual(keranjang[0].qty, 5);
  assert.strictEqual(typeof keranjang[0].qty, "number");
  assert.strictEqual(kasir.hitungSubtotal(keranjang), 20000);
});

test("bug 2: total jumlah per produk lebih dari 99 ditolak dan keranjang tidak berubah", () => {
  const keranjang = [];
  kasir.tambahItem(keranjang, "K04", 60);
  assert.throws(() => kasir.tambahItem(keranjang, "K04", 40), Error);
  assert.strictEqual(keranjang[0].qty, 60);
});

test("bug 2: total jumlah per produk tepat 99 diterima", () => {
  const keranjang = [];
  kasir.tambahItem(keranjang, "K04", 50);
  kasir.tambahItem(keranjang, "K04", 49);
  assert.strictEqual(keranjang[0].qty, 99);
});

// ---------------------------------------------------------------
// Bug 3: diskon member dan diskon belanja digabung (aturan 4)
// ---------------------------------------------------------------
test("bug 3: member dengan subtotal besar hanya mendapat 10%, tidak digabung 5%", () => {
  assert.strictEqual(kasir.hitungDiskon(200000, true), 20000);
});

test("bug 3: member dengan subtotal kecil mendapat 10%", () => {
  assert.strictEqual(kasir.hitungDiskon(50000, true), 5000);
});

test("bug 3: bukan member dengan subtotal besar mendapat 5%", () => {
  assert.strictEqual(kasir.hitungDiskon(200000, false), 10000);
});

// ---------------------------------------------------------------
// Bug 4: batas diskon 5% memakai ">" padahal harus "minimal" (>=) (aturan 4)
// ---------------------------------------------------------------
test("bug 4: bukan member dengan subtotal tepat Rp100.000 mendapat diskon 5%", () => {
  assert.strictEqual(kasir.hitungDiskon(100000, false), 5000);
});

test("bug 4: bukan member dengan subtotal Rp99.999 tidak mendapat diskon", () => {
  assert.strictEqual(kasir.hitungDiskon(99999, false), 0);
});

test("bug 4: tanpa diskon jika bukan member dan subtotal kecil", () => {
  assert.strictEqual(kasir.hitungDiskon(30000, false), 0);
});

test("diskon dibulatkan ke rupiah terdekat (0,5 ke atas naik)", () => {
  assert.strictEqual(kasir.hitungDiskon(10005, true), 1001); // 1000,5
  assert.strictEqual(kasir.hitungDiskon(10004, true), 1000); // 1000,4
  assert.strictEqual(kasir.hitungDiskon(100010, false), 5001); // 5000,5
});

// ---------------------------------------------------------------
// Bug 5: PPN dibulatkan ke bawah (Math.floor), padahal harus ke terdekat (aturan 5)
// ---------------------------------------------------------------
test("bug 5: PPN dibulatkan ke rupiah terdekat", () => {
  assert.strictEqual(kasir.hitungPPN(14), 2); // 1,54 -> 2
  assert.strictEqual(kasir.hitungPPN(50), 6); // 5,5 -> 6 (0,5 naik)
  assert.strictEqual(kasir.hitungPPN(5), 1); // 0,55 -> 1
  assert.strictEqual(kasir.hitungPPN(4), 0); // 0,44 -> 0
  assert.strictEqual(kasir.hitungPPN(0), 0);
});

test("PPN yang sudah bulat tidak berubah", () => {
  assert.strictEqual(kasir.hitungPPN(4500), 495);
  assert.strictEqual(kasir.hitungPPN(100000), 11000);
});

test("bug 5: ringkasan bukan member Rp105.000 (PPN 10.972,5 dibulatkan naik)", () => {
  const keranjang = [];
  kasir.tambahItem(keranjang, "K01", 7); // 7 x 15.000 = 105.000
  const r = kasir.hitungRingkasan(keranjang, false);
  assert.deepStrictEqual(r, {
    subtotal: 105000,
    diskon: 5250,
    ppn: 10973,
    total: 110723,
  });
});

test("bug 3: ringkasan member Rp105.000 hanya diskon 10%", () => {
  const keranjang = [];
  kasir.tambahItem(keranjang, "K01", 7);
  const r = kasir.hitungRingkasan(keranjang, true);
  assert.deepStrictEqual(r, {
    subtotal: 105000,
    diskon: 10500,
    ppn: 10395,
    total: 104895,
  });
});

test("ringkasan keranjang kosong semuanya nol", () => {
  assert.deepStrictEqual(kasir.hitungRingkasan([], false), {
    subtotal: 0,
    diskon: 0,
    ppn: 0,
    total: 0,
  });
});

// ---------------------------------------------------------------
// Bug 6: uang pembayaran kurang tidak ditolak (aturan 7)
// ---------------------------------------------------------------
test("bug 6: uang pembayaran kurang dari total ditolak", () => {
  assert.throws(() => kasir.hitungKembalian(50000, 49999), {
    message: "Uang pembayaran kurang",
  });
  assert.throws(() => kasir.hitungKembalian(50000, 0), {
    message: "Uang pembayaran kurang",
  });
});

test("uang pas menghasilkan kembalian 0", () => {
  assert.strictEqual(kasir.hitungKembalian(50000, 50000), 0);
});

test("uang lebih menghasilkan kembalian = bayar - total", () => {
  assert.strictEqual(kasir.hitungKembalian(50000, 100000), 50000);
});

// ---------------------------------------------------------------
// Fungsi lain yang sudah benar (pengaman agar perbaikan tidak merusaknya)
// ---------------------------------------------------------------
test("produk yang tidak ada ditolak", () => {
  assert.throws(() => kasir.tambahItem([], "XXX", 1), {
    message: "Produk tidak ditemukan",
  });
});

test("hapusItem menghapus produk dari keranjang", () => {
  const keranjang = [];
  kasir.tambahItem(keranjang, "K04", 1);
  kasir.tambahItem(keranjang, "K07", 1);
  assert.deepStrictEqual(
    kasir.hapusItem(keranjang, "K04").map((i) => i.kode),
    ["K07"]
  );
});
