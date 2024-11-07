const API_BASE_URL = 'https://backend.6love.ch/api/statistics';

async function fetchStatsData(endpoint) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) throw new Error(`Fehler beim Abrufen der Daten: ${response.statusText}`);
    return response.json();
}

function renderChart(elementId, data, label, labelKey) {
    const ctx = document.getElementById(elementId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item[labelKey]),
            datasets: [{
                label: label,
                data: data.map(item => item.total_sessions),
                borderColor: '#1e88e5',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const selectedLabel = data[index][labelKey];
                    showDetailView(labelKey, selectedLabel);
                }
            },
            plugins: {
                tooltip: { enabled: true, mode: 'index', intersect: false },
            },
            scales: { x: { beginAtZero: false }, y: { beginAtZero: true } }
        }
    });
}

async function loadCharts() {
    try {
        const dailyData = await fetchStatsData('daily-totals/');
        const monthlyData = await fetchStatsData('monthly-totals/');
        const yearlyData = await fetchStatsData('yearly-totals/');
        renderChart('daily-chart', dailyData, 'Täglich', 'date');
        renderChart('monthly-chart', monthlyData, 'Monatlich', 'month');
        renderChart('yearly-chart', yearlyData, 'Jährlich', 'year');
    } catch (error) {
        console.error("Fehler beim Laden der Diagramme:", error);
    }
}

async function showDetailView(period, selectedLabel) {
    let endpoint, title;
    if (period === 'date') {
        endpoint = `daily-country-totals/${selectedLabel.replace(/-/g, '')}`;
        title = `Details für ${selectedLabel} (Täglich)`;
    } else if (period === 'month') {
        endpoint = `monthly-country-totals/${selectedLabel.slice(0, 7).replace('-', '')}`;
        title = `Details für ${selectedLabel} (Monatlich)`;
    } else if (period === 'year') {
        endpoint = `yearly-country-totals/${selectedLabel.split('-')[0]}`;
        title = `Details für ${selectedLabel} (Jährlich)`;
    }

    try {
        const data = await fetchStatsData(endpoint);
        document.getElementById("modal-title").textContent = title;
        const tableBody = document.getElementById("detail-table-body");
        tableBody.innerHTML = data.map(item => `<tr><td>${item.country}</td><td>${item.total_sessions}</td></tr>`).join('');
        document.getElementById("detailModal").style.display = "flex";
    } catch (error) {
        console.error("Fehler beim Laden der Detailansicht:", error);
    }
}

// Echtzeitdaten laden
async function loadRealtimeData() {
    try {
        const data = await fetchStatsData('realtime');
        const tableBody = document.getElementById("realtime-table-body");
        tableBody.innerHTML = data.map(item => `<tr><td><span class="flag-icon fi fi-${item.country_code.toLowerCase()}"></span> ${item.country}</td><td>${item.active_users}</td></tr>`).join('');
    } catch (error) {
        console.error("Fehler beim Laden der Echtzeitdaten:", error);
    }
}

// Modal-Schließfunktion
function closeModal() {
    document.getElementById("detailModal").style.display = "none";
}

// Events zum Schließen des Modals bei ESC oder Klick außerhalb
document.addEventListener('click', (event) => {
    if (event.target.classList.contains("dialog-overlay")) closeModal();
});
document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") closeModal();
});

// Ladeinitalisierungen
document.addEventListener('DOMContentLoaded', () => {
    loadCharts();
    loadRealtimeData();
});
