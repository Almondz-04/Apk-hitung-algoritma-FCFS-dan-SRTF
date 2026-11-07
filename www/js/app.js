// Container utama tempat render seluruh tampilan HTML
const app = document.getElementById("app");

// --- STATE APLIKASI ---
let selectedAlgorithm = "FCFS"; // Algoritma aktif: 'FCFS', 'SRTF', atau 'Comparison'
let processes = [              // Data input proses awal
    { id: "P1", arrival: 0, burst: 0 },
    { id: "P2", arrival: 1, burst: 0 },
    { id: "P3", arrival: 2, burst: 0 },
    { id: "P4", arrival: 3, burst: 0 }
];

let lastResult = null;          // Menyimpan hasil kalkulasi simulasi terakhir
let viewingHistory = false;     // Mode lihat detail riwayat
let comparisonResult = null;    // Menyimpan hasil kalkulasi perbandingan (FCFS vs SRTF)

let historySearchQuery = "";    // Keyword pencarian di halaman riwayat
let historyFilterAlgo = "Semua"; // Filter algoritma di halaman riwayat ('Semua', 'FCFS', 'SRTF', 'Bandingkan')

const HISTORY_KEY = "avira_simulation_history"; // Key LocalStorage untuk riwayat

// 1. Utility & Storage Function (LocalStorage Riwayat)

// Mengambil data riwayat simulasi dari LocalStorage
function getSimulationHistory() {
    try {
        const history = localStorage.getItem(HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error("Gagal memuat riwayat:", error);
        return [];
    }
}

// Menyimpan array riwayat ke LocalStorage
function saveSimulationHistory(history) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        return true;
    } catch (error) {
        console.error("Gagal menyimpan riwayat:", error);
        alert("Gagal menyimpan riwayat simulasi.");
        return false;
    }
}

// Menyimpan 1 sesi simulasi baru ke daftar riwayat
function saveSimulation(algorithm, processData, resultData) {
    const history = getSimulationHistory();
    const newRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        algorithm: algorithm,
        date: new Date().toISOString(),
        processes: JSON.parse(JSON.stringify(processData)),
        result: JSON.parse(JSON.stringify(resultData))
    };
    history.unshift(newRecord); // Tambahkan ke paling atas
    saveSimulationHistory(history);
}

// 2. Navigation Bar (Navigasi bawah)

// Componen untuk merender menu navigasi (Beranda, Riwayat, Tentang)
function renderNavigation(activePage) {
    return `
        <nav class="bottom-nav">
            <button class="nav-item ${activePage === "home" ? "active" : ""}" onclick="navigate('home')">
                <span>⌂</span>
                <small>Beranda</small>
            </button>
            <button class="nav-item ${activePage === "history" ? "active" : ""}" onclick="navigate('history')">
                <span>◷</span>
                <small>Riwayat</small>
            </button>
            <button class="nav-item ${activePage === "about" ? "active" : ""}" onclick="navigate('about')">
                <span>ⓘ</span>
                <small>Tentang</small>
            </button>
        </nav>
    `;
}

// Router sederhana untuk perpindahan halaman
function navigate(page) {
    if (page === "home") renderHome();
    else if (page === "history") renderHistory();
    else if (page === "about") renderAbout();
}

// 3. Beranda
function renderHome() {
    app.innerHTML = `
        <header class="welcome">
            <div class="logo-small">
                 <img src="assets/avira-logo.png" alt="Logo AVIRA" style="max-height: 50px;">
            </div>
            <p class="greeting">Halo,</p>
            <h1>Selamat Datang<br>di AVIRA</h1>
            <p class="description">
                Simulasi algoritma penjadwalan proses CPU
                dengan mudah dan interaktif.
            </p>
        </header>

        <!-- Daftar Pilihan Kartu Algoritma Sesuai Warna Figma -->
        <section class="algorithm-list">
            <!-- Kartu FCFS -->
            <button class="algorithm-card fcfs" onclick="openAlgorithm('FCFS')">
                <div class="algorithm-icon fcfs-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                </div>
                <div class="algorithm-info">
                    <h2>FCFS</h2>
                    <p>First Come First Served</p>
                </div>
                <span class="arrow">›</span>
            </button>

            <!-- Kartu SRTF -->
            <button class="algorithm-card srtf" onclick="openAlgorithm('SRTF')">
                <div class="algorithm-icon srtf-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                </div>
                <div class="algorithm-info">
                    <h2>SRTF</h2>
                    <p>Shortest Remaining Time First</p>
                </div>
                <span class="arrow">›</span>
            </button>

            <!-- Kartu Bandingkan Algoritma -->
            <button class="algorithm-card comparison" onclick="openAlgorithm('Comparison')">
                <div class="algorithm-icon comparison-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                </div>
                <div class="algorithm-info">
                    <h2>Bandingkan Algoritma</h2>
                    <p>Lihat perbedaan hasil FCFS dan SRTF</p>
                </div>
                <span class="arrow">›</span>
            </button>
        </section>

        ${renderNavigation("home")}
    `;
}

// Membuka algoritma terpilih dari Beranda & reset input awal
function openAlgorithm(algorithm) {
    selectedAlgorithm = algorithm;
    processes = [
        { id: "P1", arrival: 0, burst: 0 },
        { id: "P2", arrival: 0, burst: 0 },
        { id: "P3", arrival: 0, burst: 0 },
        { id: "P4", arrival: 0, burst: 0 }
    ];
    comparisonResult = null;
    renderInput();
}

// 4. Halaman Input Proses
function renderInput() {
    let cardBg = "#E2E9EC";
    let iconBg = "#7296A6";
    let title = "FCFS";
    let subtitle = "First Come First Served";
    let iconSvg = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
    `;

    if (selectedAlgorithm === "SRTF") {
        cardBg = "#E2EFE9";
        iconBg = "#5F9E82";
        title = "SRTF";
        subtitle = "Shortest Remaining Time First";
        iconSvg = `
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
        `;
    } else if (selectedAlgorithm === "Comparison") {
        cardBg = "#EFE6DE";
        iconBg = "#A66D4F";
        title = "Bandingkan Algoritma";
        subtitle = "Lihat perbedaan hasil FCFS dan SRTF";
        iconSvg = `
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
        `;
    }

    app.innerHTML = `
        <header class="figma-header">
            <h1 class="figma-title">Input Proses</h1>
        </header>

        <!-- Card Algoritma Terpilih -->
        <div class="selected-algo-card" style="background-color: ${cardBg};">
            <div class="algo-card-icon" style="background-color: ${iconBg};">
                ${iconSvg}
            </div>
            <div class="algo-card-details">
                <h2>${title}</h2>
                <p>${subtitle}</p>
            </div>
        </div>

        <!-- Section Jumlah Proses (+/-) -->
        <div class="figma-section">
            <label class="figma-section-title">Jumlah Proses</label>
            <div class="counter-control">
                <button type="button" class="btn-count-minus" onclick="confirmDecrementProcess()">-</button>
                <input type="number" id="processCountInput" value="${processes.length}" class="counter-number-input" onchange="updateProcessCountFromInput(this.value)">
                <button type="button" class="btn-count-plus" onclick="incrementProcessCount()">+</button>
            </div>
            <p class="counter-hint">Gunakan tombol + / - atau masukkan jumlah secara langsung.</p>
        </div>

        <!-- Section Tabel Data Proses -->
        <div class="figma-section">
            <label class="figma-section-title">Data Proses</label>
            <div class="process-table-container">
                <table class="figma-table">
                    <thead>
                        <tr>
                            <th style="width: 20%;">Proses</th>
                            <th style="width: 40%;">Arrival Time<br>(AT)</th>
                            <th style="width: 40%;">Burst Time<br>(BT)</th>
                        </tr>
                    </thead>
                    <tbody id="figmaProcessTableBody">
                        ${renderFigmaTableRows()}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tombol Hitung Sekarang -->
        <button class="btn-hitung-sekarang" onclick="runSimulation()">
            Hitung Sekarang <span class="arrow-icon">➔</span>
        </button>

        <!-- Modal Pop-up Konfirmasi Hapus Proses -->
        <div id="confirmModal" class="modal-overlay" style="display: none;">
            <div class="modal-card">
                <div class="modal-warning-icon">⚠️</div>
                <h3 class="modal-title">Kurangi jumlah proses?</h3>
                <p class="modal-desc" id="modalDescText">Proses P${processes.length} akan dihapus. Semua data Arrival Time dan Burst Time yang sudah diisi tidak dapat dikembalikan.</p>
                <div class="modal-actions">
                    <button class="btn-modal-cancel" onclick="closeConfirmModal()">Batal</button>
                    <button class="btn-modal-danger" onclick="executeDecrementProcess()">Ya, Kurangi</button>
                </div>
            </div>
        </div>

        ${renderNavigation("")}
    `;
}

// Merender baris input tabel proses
function renderFigmaTableRows() {
    return processes.map((p, index) => `
        <tr>
            <td class="process-name-cell">${p.id}</td>
            <td>
                <input type="number" min="0" class="figma-input-cell" 
                       value="${p.arrival !== undefined && p.arrival !== null ? p.arrival : ''}" 
                       onchange="updateProcess(${index}, 'arrival', this.value)">
            </td>
            <td>
                <input type="number" min="1" class="figma-input-cell" 
                       value="${p.burst !== undefined && p.burst !== null ? p.burst : ''}" 
                       onchange="updateProcess(${index}, 'burst', this.value)">
            </td>
        </tr>
    `).join('');
}

// Memperbarui UI tabel & counter tanpa render ulang seluruh halaman
function updateTableUI() {
    const tableBody = document.getElementById('figmaProcessTableBody');
    const countInput = document.getElementById('processCountInput');
    if (tableBody) tableBody.innerHTML = renderFigmaTableRows();
    if (countInput) countInput.value = processes.length;
}

// Menambah 1 baris proses (+)
function incrementProcessCount() {
    const nextNumber = processes.length + 1;
    processes.push({ id: `P${nextNumber}`, arrival: 0, burst: 1 });
    updateTableUI();
}

// Konfirmasi sebelum mengurangi proses (-)
function confirmDecrementProcess() {
    if (processes.length <= 1) {
        alert("Minimal harus ada 1 proses.");
        return;
    }
    const modalDescText = document.getElementById("modalDescText");
    if (modalDescText) {
        modalDescText.innerText = `Proses P${processes.length} akan dihapus. Semua data Arrival Time dan Burst Time yang sudah diisi tidak dapat dikembalikan.`;
    }
    const modal = document.getElementById("confirmModal");
    if (modal) modal.style.display = "flex";
}

function closeConfirmModal() {
    const modal = document.getElementById("confirmModal");
    if (modal) modal.style.display = "none";
}

function executeDecrementProcess() {
    processes.pop();
    closeConfirmModal();
    updateTableUI();
}

// Mengubah jumlah proses via input angka langsung
function updateProcessCountFromInput(val) {
    const targetCount = parseInt(val, 10);
    if (isNaN(targetCount) || targetCount < 1) {
        updateTableUI();
        return;
    }
    while (processes.length < targetCount) {
        processes.push({ id: `P${processes.length + 1}`, arrival: 0, burst: 1 });
    }
    while (processes.length > targetCount) {
        processes.pop();
    }
    updateTableUI();
}

// Memperbarui nilai Arrival Time / Burst Time di memori
function updateProcess(index, field, value) {
    processes[index][field] = value === "" ? "" : Number(value);
}

// 5. Logika Algoritma Penjadwalan CPU 

function runSimulation() {
    if (processes.length === 0) {
        alert("Tambahkan minimal satu proses.");
        return;
    }

    // Validasi input
    const valid = processes.every(process =>
        Number.isInteger(process.arrival) &&
        process.arrival >= 0 &&
        Number.isInteger(process.burst) &&
        process.burst > 0
    );

    if (!valid) {
        alert("Arrival Time harus bilangan bulat >= 0 dan Burst Time harus bilangan bulat > 0.");
        return;
    }

    viewingHistory = false;

    if (selectedAlgorithm === "Comparison") {
        comparisonResult = {
            fcfs: calculateFCFS(processes),
            srtf: calculateSRTF(processes)
        };
        saveSimulation("Comparison", processes, comparisonResult);
        renderComparison();
        return;
    }

    if (selectedAlgorithm === "FCFS") {
        lastResult = calculateFCFS(processes);
    } else if (selectedAlgorithm === "SRTF") {
        lastResult = calculateSRTF(processes);
    }

    saveSimulation(selectedAlgorithm, processes, lastResult);
    renderResults();
}

// Kalkulasi FCFS (First Come First Served)
function calculateFCFS(input) {
    const sorted = input
        .map((process, index) => ({ ...process, originalIndex: index }))
        .sort((a, b) => a.arrival - b.arrival || a.originalIndex - b.originalIndex);

    let currentTime = 0;
    const results = [];
    const gantt = [];

    sorted.forEach(process => {
        const start = Math.max(currentTime, process.arrival);
        const completion = start + process.burst;

        if (currentTime < process.arrival) {
            gantt.push({ id: "Idle", start: currentTime, end: process.arrival });
        }

        gantt.push({ id: process.id, start, end: completion });

        const turnaround = completion - process.arrival;
        const waiting = turnaround - process.burst;
        const response = start - process.arrival;

        results.push({
            id: process.id,
            arrival: process.arrival,
            burst: process.burst,
            start,
            completion,
            turnaround,
            waiting,
            response
        });

        currentTime = completion;
    });

    const count = results.length;
    return {
        results,
        gantt,
        averageWaiting: results.reduce((sum, p) => sum + p.waiting, 0) / count,
        averageTurnaround: results.reduce((sum, p) => sum + p.turnaround, 0) / count,
        averageResponse: results.reduce((sum, p) => sum + p.response, 0) / count
    };
}

// Kalkulasi SRTF (Shortest Remaining Time First)
function calculateSRTF(input) {
    const jobs = input.map((process, index) => ({
        ...process,
        originalIndex: index,
        remaining: process.burst,
        firstStart: null,
        completion: null
    }));

    const gantt = [];
    let currentTime = 0;
    let completed = 0;

    while (completed < jobs.length) {
        const available = jobs
            .filter(p => p.arrival <= currentTime && p.remaining > 0)
            .sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival || a.originalIndex - b.originalIndex);

        if (available.length === 0) {
            const nextArrival = Math.min(...jobs.filter(p => p.remaining > 0).map(p => p.arrival));
            gantt.push({ id: "Idle", start: currentTime, end: nextArrival });
            currentTime = nextArrival;
            continue;
        }

        const process = available[0];
        if (process.firstStart === null) {
            process.firstStart = currentTime;
        }

        const previous = gantt[gantt.length - 1];
        if (previous && previous.id === process.id) {
            previous.end = currentTime + 1;
        } else {
            gantt.push({ id: process.id, start: currentTime, end: currentTime + 1 });
        }

        process.remaining--;
        currentTime++;

        if (process.remaining === 0) {
            process.completion = currentTime;
            completed++;
        }
    }

    const results = jobs.map(process => {
        const turnaround = process.completion - process.arrival;
        const waiting = turnaround - process.burst;
        const response = process.firstStart - process.arrival;

        return {
            id: process.id,
            arrival: process.arrival,
            burst: process.burst,
            start: process.firstStart,
            completion: process.completion,
            turnaround,
            waiting,
            response
        };
    });

    const count = results.length;
    return {
        results,
        gantt,
        averageWaiting: results.reduce((sum, p) => sum + p.waiting, 0) / count,
        averageTurnaround: results.reduce((sum, p) => sum + p.turnaround, 0) / count,
        averageResponse: results.reduce((sum, p) => sum + p.response, 0) / count
    };
}

// Warna khusus setiap balok proses di Gantt Chart
function getProcessColor(processId) {
    const colors = ["#789BB2", "#82A68E", "#C9875B", "#A58BB5", "#D39A8C", "#9C705B", "#8BA6A0"];
    if (processId === "Idle") return "#A9A19A";
    const processNumber = Number(processId.replace("P", ""));
    return colors[(processNumber - 1) % colors.length];
}

function returnFromResult() {
    if (viewingHistory) {
        viewingHistory = false;
        renderHistory();
    } else {
        renderInput();
    }
}

// 6. Halaman hasil dan simulasi perbandingan

function renderResults() {
    const result = lastResult;
    const isFcfs = selectedAlgorithm === "FCFS";
    const badgeText = isFcfs ? "Non-Preemptive" : "Preemptive";
    const badgeClass = isFcfs ? "badge-fcfs" : "badge-srtf";
    const fullName = isFcfs ? "First Come First Served" : "Shortest Remaining Time First";

    app.innerHTML = `
        <header class="figma-header">
            <h1 class="figma-title">Hasil Simulasi</h1>
        </header>

        <section class="result-head-section">
            <h2 class="result-algo-title">${selectedAlgorithm}</h2>
            <p class="result-algo-sub">${fullName}</p>
            <span class="algo-badge ${badgeClass}">${badgeText}</span>
        </section>

        <!-- Gantt Chart Card -->
        <section class="figma-card-box">
            <h3 class="card-box-title">Gantt Chart</h3>
            ${renderFigmaGanttChart(result.gantt)}
        </section>

        <!-- Statistik Rata-rata -->
        <section class="figma-section">
            <h3 class="section-subtitle-title">Statistik Hasil</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-label">Average Waiting Time</span>
                    <strong class="stat-value">${result.averageWaiting.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Average Turnaround Time</span>
                    <strong class="stat-value">${result.averageTurnaround.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="stat-card full-width">
                    <span class="stat-label">Average Response Time</span>
                    <strong class="stat-value">${result.averageResponse.toFixed(2).replace('.', ',')}</strong>
                </div>
            </div>
        </section>

        <!-- Detail Perhitungan per Proses -->
        <section class="figma-section">
            <h3 class="section-subtitle-title">Detail Proses</h3>
            <div class="table-card-container">
                <table class="figma-detail-table">
                    <thead>
                        <tr>
                            <th>Proses</th>
                            <th>CT</th>
                            <th>TAT</th>
                            <th>WT</th>
                            <th>RT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.results.map(p => `
                            <tr>
                                <td class="process-name-cell">${p.id}</td>
                                <td>${p.completion}</td>
                                <td>${p.turnaround}</td>
                                <td>${p.waiting}</td>
                                <td>${p.response}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="formula-legend">
                <p>CT = Completion Time</p>
                <p>TAT = CT - AT</p>
                <p>WT = TAT - BT</p>
                <p>RT = waktu pertama kali proses dieksekusi - AT</p>
            </div>
        </section>

        <!-- Tombol Aksi di Bawah -->
        <div class="action-buttons-group">
            <button class="btn-action-brown" onclick="renderInput()">Ulangi Simulasi</button>
            <button class="btn-action-brown" onclick="renderHome()">Kembali ke Beranda</button>
        </div>

        ${renderNavigation("")}
    `;
}

// Component Visual Bar Gantt Chart Sesuai Figma
function renderFigmaGanttChart(gantt) {
    const totalTime = gantt[gantt.length - 1].end;
    return `
        <div class="gantt-figma-wrapper">
            <div class="gantt-figma-bar">
                ${gantt.map(item => {
                    const duration = item.end - item.start;
                    const percentage = (duration / totalTime) * 100;
                    return `
                        <div class="gantt-figma-item ${item.id === 'Idle' ? 'idle' : ''}" 
                             style="width: ${percentage}%; background: ${getProcessColor(item.id)};">
                            <span>${item.id}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="gantt-figma-ticks">
                <span>0</span>
                ${gantt.map(item => `<span>${item.end}</span>`).join('')}
            </div>
        </div>
    `;
}

// Halaman Hasil Bandingkan Algoritma (FCFS vs SRTF)
function renderComparison() {
    const fcfs = comparisonResult.fcfs;
    const srtf = comparisonResult.srtf;

    app.innerHTML = `
        <header class="figma-header">
            <h1 class="figma-title">Hasil Simulasi</h1>
        </header>

        <section class="result-head-section">
            <h2 class="result-algo-title">FCFS vs SRTF</h2>
            <p class="result-algo-sub">Analisis berdasarkan ${processes.length} proses yang sama.</p>
        </section>

        <!-- Gantt Charts -->
        <section class="figma-card-box">
            <h4 class="gantt-sub-label">Gantt Chart FCFS</h4>
            ${renderFigmaGanttChart(fcfs.gantt)}

            <h4 class="gantt-sub-label" style="margin-top: 16px;">Gantt Chart SRTF</h4>
            ${renderFigmaGanttChart(srtf.gantt)}
        </section>

        <!-- Tabel Perbandingan Statistik -->
        <section class="figma-section">
            <h3 class="section-subtitle-title">Perbandingan Statistik</h3>
            <div class="table-card-container">
                <table class="figma-comparison-table">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding-left: 16px;">Metrik</th>
                            <th>FCFS</th>
                            <th>SRTF</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="metric-name-cell">Avg. WT</td>
                            <td>${fcfs.averageWaiting.toFixed(2).replace('.', ',')}</td>
                            <td>${srtf.averageWaiting.toFixed(2).replace('.', ',')}</td>
                        </tr>
                        <tr>
                            <td class="metric-name-cell">Avg. TAT</td>
                            <td>${fcfs.averageTurnaround.toFixed(2).replace('.', ',')}</td>
                            <td>${srtf.averageTurnaround.toFixed(2).replace('.', ',')}</td>
                        </tr>
                        <tr>
                            <td class="metric-name-cell">Avg. RT</td>
                            <td>${fcfs.averageResponse.toFixed(2).replace('.', ',')}</td>
                            <td>${srtf.averageResponse.toFixed(2).replace('.', ',')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="formula-legend">
                <p>TAT = CT - AT</p>
                <p>WT = TAT - BT</p>
                <p>RT = waktu pertama kali proses dieksekusi - AT</p>
            </div>
        </section>

        <!-- Kartu Kesimpulan Analisis Hasil (Hijau Pastel) -->
        <section class="analysis-card">
            <div class="analysis-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <h3>Analisis Hasil</h3>
            </div>
            <p>${getComparisonConclusion(fcfs, srtf)}</p>
        </section>

        <!-- Tombol Aksi -->
        <div class="action-buttons-group">
            <button class="btn-action-brown" onclick="renderInput()">Ulangi Simulasi</button>
            <button class="btn-action-brown" onclick="renderHome()">Kembali ke Beranda</button>
        </div>

        ${renderNavigation("")}
    `;
}

function getComparisonConclusion(fcfs, srtf) {
    const fcfsWT = fcfs.averageWaiting;
    const srtfWT = srtf.averageWaiting;
    if (fcfsWT < srtfWT) return "Pada data ini FCFS memiliki rata-rata Waiting Time lebih rendah dibandingkan SRTF.";
    if (srtfWT < fcfsWT) return "Pada data ini SRTF memiliki rata-rata Waiting Time lebih rendah dibandingkan FCFS.";
    return "Pada data ini FCFS dan SRTF memiliki rata-rata Waiting Time yang sama.";
}

/* 7. Riwayat dan detail riwayat */

// Render Halaman Riwayat Simulasi
function renderHistory() {
    const history = getSimulationHistory();

    // Filter berdasarkan search query dan tab filter
    const filteredHistory = history.filter(record => {
        const matchesAlgo = historyFilterAlgo === "Semua" || 
            (historyFilterAlgo === "Bandingkan" ? record.algorithm === "Comparison" : record.algorithm === historyFilterAlgo);
        
        const dateStr = new Date(record.date).toLocaleString("id-ID");
        const matchesSearch = record.algorithm.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
            dateStr.toLowerCase().includes(historySearchQuery.toLowerCase());

        return matchesAlgo && matchesSearch;
    });

    app.innerHTML = `
   <header class="figma-header history-header-aligned">
    <div class="header-spacer"></div>
    <h1 class="figma-title">Riwayat Simulasi</h1>
    
    <div class="header-action-slot">
        ${history.length > 0 ? `
            <button class="btn-clear-history-icon" onclick="confirmClearHistory()" title="Bersihkan Semua Riwayat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                 </svg>
            </button>
        ` : ''}
    </div>
    </header>

        <!-- Search Bar -->
        <div class="search-box-container">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Cari riwayat..." value="${historySearchQuery}" 
                   oninput="onHistorySearch(this.value)" class="search-input">
        </div>

        <!-- Filter Chips (Scroll Tanpa Nampak Bar) -->
        <div class="filter-chips-container no-scrollbar">
            <button class="chip-btn ${historyFilterAlgo === 'Semua' ? 'active' : ''}" onclick="setHistoryFilter('Semua')">Semua</button>
            <button class="chip-btn ${historyFilterAlgo === 'FCFS' ? 'active' : ''}" onclick="setHistoryFilter('FCFS')">FCFS</button>
            <button class="chip-btn ${historyFilterAlgo === 'SRTF' ? 'active' : ''}" onclick="setHistoryFilter('SRTF')">SRTF</button>
            <button class="chip-btn ${historyFilterAlgo === 'Bandingkan' ? 'active' : ''}" onclick="setHistoryFilter('Bandingkan')">Bandingkan</button>
        </div>

        <!-- Daftar Riwayat -->
        <div class="history-cards-list">
            ${filteredHistory.length === 0 ? `
                <div class="empty-history-state">
                    <p>Tidak ada riwayat simulasi ditemukan.</p>
                </div>
            ` : filteredHistory.map(record => {
                let cardIconBg = "#7296A6";
                let algoTitle = record.algorithm;
                let iconSvg = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>`;

                if (record.algorithm === "SRTF") {
                    cardIconBg = "#5F9E82";
                    iconSvg = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>`;
                } else if (record.algorithm === "Comparison") {
                    cardIconBg = "#A66D4F";
                    algoTitle = "Bandingkan";
                    iconSvg = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>`;
                }

                const formattedDate = new Date(record.date).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }).replace(".", ":");

                return `
                    <div class="history-item-card" onclick="viewHistoryRecord('${record.id}')">
                        <div class="history-item-icon" style="background-color: ${cardIconBg};">
                            ${iconSvg}
                        </div>
                        <div class="history-item-info">
                            <h3>${algoTitle}</h3>
                            <p class="history-item-date">${formattedDate}</p>
                            <p class="history-item-count">${record.processes.length} Proses</p>
                        </div>
                        <span class="history-item-arrow">›</span>
                    </div>
                `;
            }).join("")}
        </div>

        <!-- Modal Konfirmasi Hapus Semua Riwayat -->
        <div id="clearHistoryModal" class="modal-overlay" style="display: none;">
            <div class="modal-card">
                <div class="modal-warning-icon">🗑️</div>
                <h3 class="modal-title">Hapus Semua Riwayat?</h3>
                <p class="modal-desc">Apakah kamu yakin ingin membersihkan seluruh riwayat simulasi? Data yang dihapus tidak dapat dikembalikan.</p>
                <div class="modal-actions">
                    <button class="btn-modal-cancel" onclick="closeClearHistoryModal()">Batal</button>
                    <button class="btn-modal-danger" onclick="executeClearHistory()">Ya, Bersihkan</button>
                </div>
            </div>
        </div>

        ${renderNavigation("history")}
    `;
}

// Handler Modal Konfirmasi Hapus Riwayat
function confirmClearHistory() {
    const modal = document.getElementById("clearHistoryModal");
    if (modal) modal.style.display = "flex";
}

function closeClearHistoryModal() {
    const modal = document.getElementById("clearHistoryModal");
    if (modal) modal.style.display = "none";
}

function executeClearHistory() {
    saveSimulationHistory([]);
    closeClearHistoryModal();
    renderHistory();
}

function onHistorySearch(val) {
    historySearchQuery = val;
    renderHistory();
}

function setHistoryFilter(filter) {
    historyFilterAlgo = filter;
    renderHistory();
}

// Halaman Detail Simulasi (Ketika Kartu Riwayat Diklik)
function viewHistoryRecord(id) {
    const history = getSimulationHistory();
    const record = history.find(item => item.id === id);

    if (!record) {
        alert("Riwayat simulasi tidak ditemukan.");
        renderHistory();
        return;
    }

    let cardBg = "#E2E9EC";
    let iconBg = "#7296A6";
    let title = record.algorithm;
    let iconSvg = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>`;

    if (record.algorithm === "SRTF") {
        cardBg = "#E2EFE9";
        iconBg = "#5F9E82";
        iconSvg = `
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>`;
    } else if (record.algorithm === "Comparison") {
        cardBg = "#EFE6DE";
        iconBg = "#A66D4F";
        title = "Bandingkan Algoritma";
        iconSvg = `
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>`;
    }

    const formattedDate = new Date(record.date).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).replace(".", ":");

    const result = record.algorithm === "Comparison" ? record.result.fcfs : record.result;

    app.innerHTML = `
        <header class="figma-header">
            <h1 class="figma-title">Detail Simulasi</h1>
        </header>

        <!-- Header Card Algoritma -->
        <div class="selected-algo-card" style="background-color: ${cardBg};">
            <div class="algo-card-icon" style="background-color: ${iconBg};">
                ${iconSvg}
            </div>
            <div class="algo-card-details">
                <h2>${title}</h2>
                <p style="margin-bottom: 2px;">${formattedDate}</p>
                <p style="font-weight: 700; color: #1a1a1a;">${record.processes.length} Proses</p>
            </div>
        </div>

        <!-- Data Proses Input Awal -->
        <div class="figma-section">
            <label class="figma-section-title">Data Proses</label>
            <div class="process-table-container">
                <table class="figma-table">
                    <thead>
                        <tr>
                            <th style="width: 20%;">Proses</th>
                            <th style="width: 40%;">Arrival Time<br>(AT)</th>
                            <th style="width: 40%;">Burst Time<br>(BT)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${record.processes.map((p, index) => `
                            <tr>
                                <td class="process-name-cell">${p.id || 'P' + (index + 1)}</td>
                                <td><div class="figma-input-cell-view">${p.arrival}</div></td>
                                <td><div class="figma-input-cell-view">${p.burst}</div></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Gantt Chart -->
        <section class="figma-card-box">
            <h3 class="card-box-title">Gantt Chart</h3>
            ${renderFigmaGanttChart(result.gantt)}
        </section>

        <!-- Hasil Perhitungan -->
        <section class="figma-section">
            <h3 class="section-subtitle-title">Hasil Perhitungan</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-label">Average Waiting Time</span>
                    <strong class="stat-value">${result.averageWaiting.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Average Turnaround Time</span>
                    <strong class="stat-value">${result.averageTurnaround.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="stat-card full-width">
                    <span class="stat-label">Average Response Time</span>
                    <strong class="stat-value">${result.averageResponse.toFixed(2).replace('.', ',')}</strong>
                </div>
            </div>
        </section>

        ${renderNavigation("history")}
    `;
}

// 8. Tentang AVIRA

function renderAbout() {
    app.innerHTML = `
        <header class="about-header">
            <h1>Tentang AVIRA</h1>
        </header>
        <section class="about-content">
            <div class="about-brand">
                <img src="assets/avira-logo.png" alt="Logo AVIRA" class="about-logo">
                <p class="about-subtitle">CPU Scheduling<br>Simulator</p>
            </div>
            <p class="about-description">
                Selamat datang di AVIRA. Aplikasi simulasi algoritma penjadwalan proses CPU yang dirancang oleh Kelompok 1 untuk membantu memahami dan menghitung algoritma FCFS dan SRTF secara interaktif.
            </p>
            <section class="team-card">
                <h2>Kelompok 1</h2>
                <ul>
                    <li>Almand Zaky. S (2501020114)</li>
                    <li>Virtuando Jagad Saputrana (2501020106)</li>
                    <li>Fikri Restu Nugraha (2501020109)</li>
                    <li>Raihan Parsa Ahza Hamizan (2501020104)</li>
                    <li>Yazira Sartika (2501020103)</li>
                </ul>
            </section>
        </section>
        ${renderNavigation("about")}
    `;
}

// SplashScreen Timeout

// Render Beranda saat awal aplikasi dibuka
renderHome();

// Menghilangkan splash screen dan mematikan pointer-events agar tidak menghalangi klik
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none'; // Matikan deteksi klik pada splash screen
      
      setTimeout(() => {
        splash.style.display = 'none';
        splash.style.zIndex = '-1'; // Pindahkan ke paling belakang
      }, 500);
    }
  }, 3500);
});