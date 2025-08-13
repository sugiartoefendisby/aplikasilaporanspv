// report.js

// URL Google Apps Script yang telah di-deploy sebagai Web App.
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxcFu98N9gaEU8TEN0OMqDopNbm0xfIfGCoF-R1a6v3JdXA0PbU3m_cfMywU2AVfs9Paw/exec";

document.addEventListener("DOMContentLoaded", () => {
  const spvNameElement = document.getElementById("spvName");
  const jobPackageSectionsContainer =
    document.getElementById("jobPackageSections");
  const reportForm = document.getElementById("reportForm");
  const reportMessage = document.getElementById("reportMessage");
  const logoutBtn = document.getElementById("logoutBtn");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const reportDateInput = document.getElementById("reportDate");
  const reportContent = document.getElementById("reportContent");
  const reportSummary = document.getElementById("reportSummary");

  const loggedInUsername = localStorage.getItem("loggedInUsername");

  if (!loggedInUsername) {
    window.location.href = "index.html";
    return;
  } else {
    spvNameElement.textContent = `Login sebagai: ${loggedInUsername}`;
    // Fetch data saat halaman dimuat
    fetchAndRenderReportSections(loggedInUsername);
  }

  // Fungsi untuk mengambil data paket pekerjaan dari Google Sheet dan merender form
  async function fetchAndRenderReportSections(spvName) {
    reportContent.style.display = "block";
    reportSummary.style.display = "none";
    reportDateInput.value = ""; // Bersihkan input tanggal

    if (loadingIndicator) {
      loadingIndicator.style.display = "flex";
    }

    try {
      const url = `${APPS_SCRIPT_URL}?action=getWorkData&spvName=${spvName}`;
      const response = await fetch(url);
      const packages = await response.json();

      if (packages && packages.length > 0) {
        jobPackageSectionsContainer.innerHTML = "";
        packages.forEach((pkg, index) => {
          const section = document.createElement("div");
          section.classList.add("job-package-section");
          section.dataset.akhirKontrak = pkg.akhirKontrak;
          section.innerHTML = `
            <h3>${pkg.jobPackage || ""}</h3>
            <div class="job-details">
              <p>Penyedia: <span>${pkg.provider || ""}</span></p>
              <p>Nilai: <span>${
                formatNumberWithThousandsSeparator(pkg.nilai) || "Belum diisi"
              }</span></p>
              <p>Periode Tanggal: <span>${formatDateForDisplay(
                pkg.awalKontrak
              )} - ${formatDateForDisplay(pkg.akhirKontrak)}</span></p>
              <p>Sisa Waktu: <span class="remaining-time" id="remainingTime_${index}">-</span></p>
            </div>
            <div class="table-container">
              <table class="job-package-table">
                <thead>
                  <tr>
                    <th>Minggu Lalu</th>
                    <th>Minggu Ini</th>
                    <th>Rencana</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <input type="number" name="lastWeek_${index}" class="last-week-input" step="0.01" />
                    </td>
                    <td>
                      <input type="number" name="thisWeek_${index}" class="this-week-input" data-index="${index}" step="0.01" />
                    </td>
                    <td>
                      <input type="number" name="plan_${index}" class="plan-input" data-index="${index}" step="0.01" />
                    </td>
                  </tr>
                  <tr class="deviasi-row">
                      <th colspan="3">Deviasi</th>
                  </tr>
                  <tr>
                      <td colspan="3" class="deviasi-cell">
                          <span class="deviation-output deviasi-cell-content deviation-positive" id="deviationText_${index}">0.00</span>
                      </td>
                  </tr>
                  <tr>
                      <th colspan="3">Kegiatan</th>
                  </tr>
                  <tr>
                      <td colspan="3">
                          <textarea name="activity_${index}"></textarea>
                      </td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
          jobPackageSectionsContainer.appendChild(section);
        });
      } else {
        jobPackageSectionsContainer.innerHTML =
          "<p>Tidak ada paket pekerjaan untuk SPV ini.</p>";
      }
    } catch (error) {
      console.error("Error fetching work data:", error);
      jobPackageSectionsContainer.innerHTML =
        "<p>Gagal memuat data. Silakan coba refresh halaman.</p>";
    } finally {
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
    }
  }

  // Fungsi untuk memformat angka dengan pemisah ribuan
  function formatNumberWithThousandsSeparator(numberString) {
    if (!numberString) return "";
    const number = parseFloat(numberString);
    if (isNaN(number)) return numberString; // Return original string if not a valid number
    return number.toLocaleString("id-ID"); // Use 'id-ID' for Indonesian locale formatting
  }

  // Fungsi untuk memformat tanggal agar sesuai tampilan DD MMM YYYY
  function formatDateForDisplay(dateString) {
    if (!dateString) return "-";
    // Coba parse sebagai Date object jika sudah dalam format tanggal valid
    let date = new Date(dateString);
    // Jika parsing gagal, mungkin itu string tanggal dari Google Sheets (misal "2025-07-04")
    // Coba parse ulang dengan asumsi format YYYY-MM-DD
    if (
      isNaN(date.getTime()) &&
      typeof dateString === "string" &&
      dateString.includes("-")
    ) {
      const parts = dateString.split("-");
      // Perhatikan bahwa bulan di JavaScript adalah 0-indexed
      date = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2])
      );
    }
    // Jika masih invalid, kembalikan '-'
    if (isNaN(date.getTime())) return "-";

    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agt",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // Menambahkan event listener untuk menghitung deviasi dan sisa waktu
  reportForm.addEventListener("input", (e) => {
    const target = e.target;
    if (
      target.classList.contains("this-week-input") ||
      target.classList.contains("plan-input")
    ) {
      calculateDeviation(target);
    }
  });

  reportDateInput.addEventListener("change", (e) => {
    const reportDateValue = e.target.value;
    calculateRemainingTime(reportDateValue);
  });

  function calculateDeviation(inputElement) {
    const section = inputElement.closest(".job-package-section");
    if (!section) return;

    const thisWeekInput = section.querySelector(".this-week-input");
    const planInput = section.querySelector(".plan-input");
    const deviationOutputSpan = section.querySelector(".deviation-output"); // Menggunakan span

    const thisWeekValue = parseFloat(thisWeekInput.value) || 0;
    const planValue = parseFloat(planInput.value) || 0;

    const deviation = thisWeekValue - planValue;

    // Format deviasi menjadi 2 desimal
    const formattedDeviation = deviation.toFixed(2);

    let deviationText = "";
    if (deviation > 0) {
      deviationText = `+${formattedDeviation} (Pekerjaan Lebih Cepat dari Rencana)`;
      deviationOutputSpan.classList.remove("deviation-negative");
      deviationOutputSpan.classList.add("deviation-positive");
    } else if (deviation < 0) {
      deviationText = `${formattedDeviation} (Pekerjaan Terlambat dari Rencana)`;
      deviationOutputSpan.classList.remove("deviation-positive");
      deviationOutputSpan.classList.add("deviation-negative");
    } else {
      deviationText = `${formattedDeviation}`; // Atau bisa "0.00 (Sesuai Rencana)" jika diinginkan
      deviationOutputSpan.classList.remove("deviation-negative");
      deviationOutputSpan.classList.add("deviation-positive");
    }
    deviationOutputSpan.textContent = deviationText;
  }

  function calculateRemainingTime(reportDateStr) {
    if (!reportDateStr) {
      const sections = jobPackageSectionsContainer.querySelectorAll(
        ".job-package-section"
      );
      sections.forEach((section, index) => {
        const remainingTimeSpan = document.getElementById(
          `remainingTime_${index}`
        );
        remainingTimeSpan.textContent = "-";
        remainingTimeSpan.classList.remove(
          "remaining-negative",
          "remaining-positive"
        );
      });
      return;
    }
    const reportDate = new Date(reportDateStr);
    const sections = jobPackageSectionsContainer.querySelectorAll(
      ".job-package-section"
    );

    sections.forEach((section, index) => {
      const akhirKontrakStr = section.dataset.akhirKontrak;
      const remainingTimeSpan = document.getElementById(
        `remainingTime_${index}`
      );

      if (akhirKontrakStr) {
        let akhirKontrak = new Date(akhirKontrakStr);
        // Tambahan parsing untuk format tanggal dari Google Sheets jika diperlukan
        if (
          isNaN(akhirKontrak.getTime()) &&
          typeof akhirKontrakStr === "string" &&
          akhirKontrakStr.includes("-")
        ) {
          const parts = akhirKontrakStr.split("-");
          akhirKontrak = new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2])
          );
        }

        if (isNaN(akhirKontrak.getTime())) {
          // Jika tanggal akhir kontrak masih tidak valid
          remainingTimeSpan.textContent = "-";
          remainingTimeSpan.classList.remove(
            "remaining-negative",
            "remaining-positive"
          );
          return;
        }

        const timeDiff = akhirKontrak.getTime() - reportDate.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (dayDiff >= 0) {
          remainingTimeSpan.textContent = `${dayDiff} hari`;
          remainingTimeSpan.classList.remove("remaining-negative");
          remainingTimeSpan.classList.add("remaining-positive");
        } else {
          remainingTimeSpan.textContent = `Melebihi Kontrak ${Math.abs(
            dayDiff
          )} hari`;
          remainingTimeSpan.classList.remove("remaining-positive");
          remainingTimeSpan.classList.add("remaining-negative");
        }
      } else {
        remainingTimeSpan.textContent = "-";
      }
    });
  }

  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const reportDate = document.getElementById("reportDate").value;
    if (!reportDate) {
      reportMessage.textContent = "Silakan pilih tanggal laporan.";
      reportMessage.style.color = "#ff6347";
      reportMessage.style.display = "block";
      return;
    }

    if (loadingIndicator) {
      loadingIndicator.style.display = "flex";
    }

    const spvName = loggedInUsername;
    const packages = await fetchWorkData(spvName);
    const sections = jobPackageSectionsContainer.querySelectorAll(
      ".job-package-section"
    );

    const reportData = [];
    sections.forEach((section, index) => {
      const lastWeekInput = section.querySelector(".last-week-input");
      const thisWeekInput = section.querySelector(".this-week-input");
      const planInput = section.querySelector(".plan-input");
      const deviationOutputSpan = section.querySelector(".deviation-output"); // Mengambil span
      const activityTextarea = section.querySelector("textarea");

      // Hanya tambahkan data jika ada setidaknya satu input progres atau kegiatan yang diisi
      const isAnyFieldFilled =
        (lastWeekInput.value !== "" && parseFloat(lastWeekInput.value) !== 0) ||
        (thisWeekInput.value !== "" && parseFloat(thisWeekInput.value) !== 0) ||
        (planInput.value !== "" && parseFloat(planInput.value) !== 0) ||
        activityTextarea.value.trim() !== "";

      if (isAnyFieldFilled) {
        // Ambil nilai deviasi numerik yang sebenarnya untuk disimpan ke sheet
        const deviationValue =
          (parseFloat(thisWeekInput.value) || 0) -
          (parseFloat(planInput.value) || 0);

        reportData.push({
          spv: spvName,
          jobPackage: packages[index].jobPackage,
          provider: packages[index].provider,
          nilai: packages[index].nilai || "",
          reportDate: reportDate,
          lastWeekProgress: lastWeekInput.value || 0,
          thisWeekProgress: thisWeekInput.value || 0,
          plan: planInput.value || 0,
          deviation: deviationValue.toFixed(2), // Simpan nilai numerik deviasi
          activity: activityTextarea.value || "",
        });
      }
    });

    if (reportData.length === 0) {
      reportMessage.textContent =
        "Tidak ada data laporan yang diisi untuk dikirim.";
      reportMessage.style.color = "#ff6347";
      reportMessage.style.display = "block";
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
      setTimeout(() => {
        reportMessage.style.display = "none";
      }, 3000);
      return;
    }

    try {
      // Menambahkan real-time timestamp dari komputer saat ini
      const timestamp = new Date().toLocaleString();
      const payload = {
        action: "saveReport",
        data: reportData.map((item) => ({ ...item, timestamp: timestamp })),
      };

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Tampilkan ringkasan laporan
      displayReportSummary(reportData);
    } catch (error) {
      console.error("Error submitting report:", error);
      reportMessage.textContent = "Gagal mengirim laporan. Silakan coba lagi.";
      reportMessage.style.color = "#ff6347";
      reportMessage.style.display = "block";
    } finally {
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
    }
  });

  // Fungsi untuk menampilkan ringkasan laporan setelah dikirim
  function displayReportSummary(reportData) {
    reportContent.style.display = "none";
    reportSummary.style.display = "block";

    let summaryHtml = `
      <h2>Ringkasan Laporan Berhasil Dikirim</h2>
      <button class="new-report-btn" id="newReportBtn">Buat Laporan Baru</button>
      <div class="summary-details">
        <p>Tanggal Laporan: <span>${new Date(
          reportData[0].reportDate
        ).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}</span></p>
      </div>
    `;

    reportData.forEach((item) => {
      const deviationValue = parseFloat(item.deviation);
      let deviationDisplay = "";
      if (deviationValue > 0) {
        deviationDisplay = `+${item.deviation} (Pekerjaan Lebih Cepat dari Rencana)`;
      } else if (deviationValue < 0) {
        deviationDisplay = `${item.deviation} (Pekerjaan Terlambat dari Rencana)`;
      } else {
        deviationDisplay = `${item.deviation}`;
      }

      summaryHtml += `
        <div class="summary-details">
          <h3>${item.jobPackage}</h3>
          <p>Penyedia: <span>${item.provider}</span></p>
          <p>Nilai: <span>${
            formatNumberWithThousandsSeparator(item.nilai) || "Belum diisi"
          }</span></p>
          <p>Progres Minggu Lalu: <span>${item.lastWeekProgress}%</span></p>
          <p>Progres Minggu Ini: <span>${item.thisWeekProgress}%</span></p>
          <p>Rencana: <span>${item.plan}%</span></p>
          <p>Deviasi: <span class="${
            deviationValue < 0 ? "deviation-negative" : "deviation-positive"
          }">${deviationDisplay}</span></p>
          <p>Kegiatan: <span>${item.activity}</span></p>
        </div>
      `;
    });

    reportSummary.innerHTML = summaryHtml;

    // Tambahkan event listener untuk tombol "Buat Laporan Baru"
    document.getElementById("newReportBtn").addEventListener("click", () => {
      fetchAndRenderReportSections(loggedInUsername);
    });
  }

  // Fungsi helper untuk mengambil data pekerjaan
  async function fetchWorkData(spvName) {
    const url = `${APPS_SCRIPT_URL}?action=getWorkData&spvName=${spvName}`;
    const response = await fetch(url);
    return response.json();
  }

  // Tambahkan event listener untuk tombol Keluar
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUsername");
      window.location.href = "index.html";
    });
  }
});
