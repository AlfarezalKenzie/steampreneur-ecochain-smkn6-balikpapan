import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ShipmentEntryForm } from "@/components/forms/shipment-entry-form";

const SAMARINDA = "Samarinda, Kalimantan Timur (122 km)";

function setup() {
  const user = userEvent.setup();
  render(<ShipmentEntryForm />);
  const ref = () => screen.getByLabelText("Referensi pesanan / nama pelanggan");
  const route = () => screen.getByLabelText("Tujuan pengiriman");
  const weight = () => screen.getByLabelText(/Berat muatan/);
  const mode = () => screen.getByLabelText("Moda transportasi");
  const submit = () => screen.getByRole("button", { name: /Catat pengiriman ini/ });
  return { user, ref, route, weight, mode, submit };
}

describe("Form Catat Pengiriman: validasi (langkah 2 rencana)", () => {
  it("form kosong lalu klik catat menampilkan pesan kesalahan di keempat kolom, dan tidak mencatat", async () => {
    const { user, submit } = setup();
    await user.click(submit());

    const alerts = screen.getAllByRole("alert").map((a) => a.textContent);
    expect(alerts).toEqual([
      "Wajib diisi — untuk menelusuri pengiriman ini nanti.",
      "Pilih tujuan pengiriman.",
      "Berat harus lebih dari 0 kg.",
      "Moda transportasi wajib dipilih — dibutuhkan untuk hitung emisi.",
    ]);
    expect(screen.queryByText(/Tercatat hari ini/)).not.toBeInTheDocument();
  });

  it("pesan kesalahan tidak muncul sebelum tombol diklik", () => {
    setup();
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("berat 0 menampilkan pesan kustom di bawah kolom (bukan gelembung bawaan browser)", async () => {
    const { user, ref, route, weight, mode, submit } = setup();
    await user.type(ref(), "Bpk. Andi");
    await user.selectOptions(route(), SAMARINDA);
    await user.type(weight(), "0");
    await user.selectOptions(mode(), "Truk Diesel");
    await user.click(submit());

    expect(screen.getByRole("alert")).toHaveTextContent("Berat harus lebih dari 0 kg.");
    expect(weight()).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(/Tercatat hari ini/)).not.toBeInTheDocument();
  });

  it("memilih 'Lainnya (isi manual)' memunculkan kolom jarak yang wajib diisi", async () => {
    const { user, ref, route, weight, mode, submit } = setup();
    expect(screen.queryByLabelText("Jarak tempuh (km)")).not.toBeInTheDocument();

    await user.selectOptions(route(), "Lainnya (isi manual)");
    const distance = screen.getByLabelText("Jarak tempuh (km)");

    await user.type(ref(), "Ibu Sari");
    await user.type(weight(), "500");
    await user.selectOptions(mode(), "Kapal Kargo");
    await user.click(submit());
    expect(screen.getByRole("alert")).toHaveTextContent("Masukkan jarak dalam kilometer.");

    await user.type(distance, "250");
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    // 0,5 ton x 250 km x 0,008 = 1 kg
    expect(screen.getByText(/^1,00/)).toBeInTheDocument();
  });
});

describe("Form Catat Pengiriman: estimasi dan ringkasan (langkah 2 rencana)", () => {
  it("Samarinda, 1850 kg, Truk Diesel menampilkan estimasi 24,15 kg CO2e, walau referensi pesanan belum diisi", async () => {
    const { user, route, weight, mode } = setup();
    expect(screen.getByText(/Lengkapi tujuan, berat, dan moda/)).toBeInTheDocument();

    await user.selectOptions(route(), SAMARINDA);
    await user.type(weight(), "1850");
    await user.selectOptions(mode(), "Truk Diesel");

    expect(screen.getByText(/^24,15/)).toBeInTheDocument();
    expect(screen.queryByText(/Lengkapi tujuan, berat, dan moda/)).not.toBeInTheDocument();
  });

  it("estimasi berubah mengikuti moda yang dipilih", async () => {
    const { user, route, weight, mode } = setup();
    await user.selectOptions(route(), SAMARINDA);
    await user.type(weight(), "1850");
    await user.selectOptions(mode(), "Kapal Kargo"); // 1,85 x 122 x 0,008 = 1,8056
    expect(screen.getByText(/^1,81/)).toBeInTheDocument();
  });

  it("panel 'Yang akan dicatat' menampilkan isian saat diketik", async () => {
    const { user, ref, route, weight, mode } = setup();
    const panel = screen.getByText("Yang akan dicatat").parentElement!;
    expect(within(panel).getByText(/Mulai isi form/)).toBeInTheDocument();

    await user.type(ref(), "Bpk. Andi");
    await user.selectOptions(route(), SAMARINDA);
    await user.type(weight(), "1850");
    await user.selectOptions(mode(), "Truk Diesel");

    expect(within(panel).getByText("Bpk. Andi")).toBeInTheDocument();
    expect(within(panel).getByText("Samarinda, Kalimantan Timur")).toBeInTheDocument();
    expect(within(panel).getByText("122 km")).toBeInTheDocument();
    expect(within(panel).getByText("1.850 kg")).toBeInTheDocument();
    expect(within(panel).getByText("Truk Diesel")).toBeInTheDocument();
  });
});

describe("Form Catat Pengiriman: mencatat (langkah 2 rencana)", () => {
  it("isian valid dicatat: muncul di 'Tercatat hari ini' dan form kembali kosong", async () => {
    const { user, ref, route, weight, mode, submit } = setup();
    await user.type(ref(), "Bpk. Andi");
    await user.selectOptions(route(), SAMARINDA);
    await user.type(weight(), "1850");
    await user.selectOptions(mode(), "Truk Diesel");
    await user.click(submit());

    expect(screen.getByText("Tercatat hari ini (1)")).toBeInTheDocument();
    const log = screen.getByText("Tercatat hari ini (1)").parentElement!;
    expect(within(log).getByText(/ORD-1001/)).toBeInTheDocument();
    expect(within(log).getByText("Bpk. Andi")).toBeInTheDocument();
    expect(within(log).getByText("24,15 kg")).toBeInTheDocument();

    expect(ref()).toHaveValue("");
    expect(weight()).toHaveValue(null);
    expect(route()).toHaveValue("");
    expect(mode()).toHaveValue("");
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("entri berikutnya mendapat nomor urut berikutnya dan tampil paling atas", async () => {
    const { user, ref, route, weight, mode, submit } = setup();
    for (const [name, kg] of [["Pertama", "100"], ["Kedua", "200"]] as const) {
      await user.type(ref(), name);
      await user.selectOptions(route(), SAMARINDA);
      await user.type(weight(), kg);
      await user.selectOptions(mode(), "Truk Diesel");
      await user.click(submit());
    }
    const log = screen.getByText("Tercatat hari ini (2)").parentElement!;
    const items = within(log).getAllByText(/ORD-100\d/);
    expect(items[0]).toHaveTextContent("ORD-1002");
    expect(items[1]).toHaveTextContent("ORD-1001");
  });

  it("referensi pesanan tetap wajib untuk mencatat walau estimasi sudah tampil", async () => {
    const { user, route, weight, mode, submit } = setup();
    await user.selectOptions(route(), SAMARINDA);
    await user.type(weight(), "1850");
    await user.selectOptions(mode(), "Truk Diesel");
    await user.click(submit());
    expect(screen.getByRole("alert")).toHaveTextContent("Wajib diisi");
    expect(screen.queryByText(/Tercatat hari ini/)).not.toBeInTheDocument();
  });
});
