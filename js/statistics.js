const API_BASE_URL = 'https://backend.6love.ch/api/statistics';
let banners = []; // Array, um die Banner zu speichern


async function fetchStatsData(endpoint) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) throw new Error(`Fehler beim Abrufen der Daten: ${response.statusText}`);
    return response.json();
}

async function fetchBanners() {
    const response = await fetch('https://backend.6love.ch/api/banners-with-impressions/?limit=5');
    if (!response.ok) throw new Error(`Fehler beim Abrufen der Banner: ${response.statusText}`);
    banners = await response.json(); // Speichere die Banner im Array
}


function insertBanner(bannerIndex, elementId) {
    if (banners[bannerIndex]) {
        const banner = banners[bannerIndex];
        const bannerElement = document.getElementById(elementId);
        bannerElement.innerHTML = `
            <a href="${banner.link}" target="_blank" rel="nofollow noopener">
              <img src="${banner.image.full}" alt="${banner.name}" width="300" height="250">
            </a>`;
    }
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
        tableBody.innerHTML = data.map(item => `
            <tr>
                <td>
                    <img src="https://bucket.6love.ch/flags/1x1/${item.country_code.toLowerCase()}.svg" 
                         alt="${item.country}" 
                         width="20" 
                         height="15" 
                         style="margin-right: 10px;">
                    ${item.country}
                </td>
                <td>${item.total_sessions}</td>
            </tr>
        `).join('');

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
        tableBody.innerHTML = data.map(item => `
            <tr>
                <td>
                    <img src="https://bucket.6love.ch/flags/1x1/${item.country_code.toLowerCase()}.svg" 
                         alt="${item.country}" 
                         width="20" 
                         height="15" 
                         style="margin-right: 10px;">
                    ${item.country}
                </td>
                <td>${item.active_users}</td>
            </tr>
        `).join('');
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
document.addEventListener('DOMContentLoaded', async () => {
    loadCharts();
    loadRealtimeData();
    await fetchBanners();
    // Dynamische Banner-Platzierung
    for (let i = 0; i < banners.length; i++) {
        const elementId = `banner-${i + 1}`; // Dynamische ID (banner-1, banner-2, ...)
        insertBanner(i, elementId);
    }
});


