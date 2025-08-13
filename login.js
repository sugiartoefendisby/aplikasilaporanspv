// login.js

// URL Google Apps Script yang telah di-deploy sebagai Web App.
// Anda harus mengganti URL ini dengan URL milik Anda sendiri setelah mengikuti instruksi di bawah.
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxcFu98N9gaEU8TEN0OMqDopNbm0xfIfGCoF-R1a6v3JdXA0PbU3m_cfMywU2AVfs9Paw/exec";

// Tunggu hingga seluruh konten DOM dimuat
document.addEventListener("DOMContentLoaded", () => {
  // Ambil elemen formulir login dari DOM
  const loginForm = document.getElementById("loginForm");
  const errorMessageDiv = document.getElementById("errorMessage");

  // Tambahkan event listener untuk menangani saat formulir di-submit
  loginForm.addEventListener("submit", async (event) => {
    // Mencegah perilaku default formulir (refresh halaman)
    event.preventDefault();

    // Ambil nilai dari input nama pengguna dan kata sandi
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const username = usernameInput.value.toLowerCase().trim();
    const password = passwordInput.value;

    // Tampilkan pesan loading
    errorMessageDiv.textContent = "Sedang memvalidasi...";
    errorMessageDiv.style.color = "#ffffff";

    try {
      // Buat URL dengan parameter query untuk validasi login
      const url = `${APPS_SCRIPT_URL}?action=validateLogin&username=${username}&password=${password}`;

      // Kirim permintaan GET ke Google Apps Script
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        // Jika login berhasil, simpan nama pengguna ke localStorage
        localStorage.setItem("loggedInUsername", username);

        // Tampilkan pesan sukses dan alihkan
        errorMessageDiv.textContent =
          "Login berhasil! Mengalihkan ke halaman laporan...";
        errorMessageDiv.style.color = "#aaffaa";

        setTimeout(() => {
          window.location.href = "report-form.html";
        }, 1500);
      } else {
        // Jika validasi gagal, tampilkan pesan kesalahan
        errorMessageDiv.textContent = result.message;
        errorMessageDiv.style.color = "#ff6347";
        passwordInput.value = ""; // Atur ulang input kata sandi
      }
    } catch (error) {
      console.error("Error:", error);
      errorMessageDiv.textContent = "Terjadi kesalahan. Silakan coba lagi.";
      errorMessageDiv.style.color = "#ff6347";
    }
  });
});
