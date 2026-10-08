const token = localStorage.getItem('civic_token');
const user = JSON.parse(localStorage.getItem('civic_user') || 'null');

if (!token || !user) {
    window.location.href = '/';
}

const issuesList = document.getElementById('issuesList');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const refreshButton = document.getElementById('refreshButton');

const profileButton = document.getElementById('profileButton');
const profileMenu = document.getElementById('profileMenu');
const profileInitial = document.getElementById('profileInitial');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');

const dashboardButton = document.getElementById('dashboardButton');
const myReportsButton = document.getElementById('myReportsButton');
const adminDashboardButton = document.getElementById('adminDashboardButton');
const logoutButton = document.getElementById('logoutButton');

const pageMessage = document.getElementById('pageMessage');

const cardViewBtn = document.getElementById('cardViewBtn');
const mapViewBtn = document.getElementById('mapViewBtn');
const mapViewSection = document.getElementById('mapViewSection');
const issueCountBadge = document.getElementById('issueCountBadge');

let currentIssuesData = [];
let currentViewMode = 'grid';
let leafletMap = null;
let markersLayer = null;


// Profile

if (user) {
    const name = user.name || 'Citizen';

    profileName.textContent = name;
    profileEmail.textContent = user.email || '';
    profileRole.textContent = user.role || 'CITIZEN';
    profileInitial.textContent = name.charAt(0).toUpperCase();

    if (user.role === 'ADMIN') {
        adminDashboardButton.style.display = 'block';
    }
}

profileButton.addEventListener('click', (event) => {
    event.stopPropagation();
    profileMenu.classList.toggle('show');
});

document.addEventListener('click', (event) => {
    if (!profileMenu.contains(event.target) &&
        !profileButton.contains(event.target)) {

        profileMenu.classList.remove('show');
    }
});

dashboardButton.addEventListener('click', () => {
    window.location.href = '/dashboard.html';
});

myReportsButton.addEventListener('click', () => {
    window.location.href = '/my-reports.html';
});

adminDashboardButton.addEventListener('click', () => {
    window.location.href = '/admin.html';
});

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');

    window.location.href = '/';
});


// Messages

function showMessage(message, type = 'success') {
    pageMessage.textContent = message;
    pageMessage.className = `page-message show ${type}`;

    setTimeout(() => {
        pageMessage.className = 'page-message';
    }, 3000);
}


// Escape HTML

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// Format category

function formatCategory(category) {
    if (!category) {
        return 'Other';
    }

    return category
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, letter => letter.toUpperCase());
}


// Format status

function formatStatus(status) {
    if (status === 'IN_PROGRESS') {
        return 'In Progress';
    }

    if (status === 'RESOLVED') {
        return 'Resolved';
    }

    return 'Open';
}


// Format date

function formatDate(dateValue) {
    if (!dateValue) {
        return 'Unknown date';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleString();
}


// Get correct image URL

function getImageUrl(imagePath) {
    if (!imagePath) {
        return null;
    }

    if (imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')) {

        return imagePath;
    }

    if (imagePath.startsWith('/')) {
        return imagePath;
    }

    return `/${imagePath}`;
}


// Load issues

async function loadIssues() {

    issuesList.innerHTML = `
        <div class="community-message">
            Loading issues...
        </div>
    `;

    try {

        const params = new URLSearchParams();

        if (categoryFilter.value) {
            params.append('category', categoryFilter.value);
        }

        if (statusFilter.value) {
            params.append('status', statusFilter.value);
        }

        const query = params.toString();

        const response = await fetch(
            `/api/issues${query ? `?${query}` : ''}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load issues');
        }

        currentIssuesData = Array.isArray(data) ? data : [];

        if (issueCountBadge) {
            const count = currentIssuesData.length;
            issueCountBadge.textContent = `${count} ${count === 1 ? 'issue' : 'issues'} found`;
        }

        renderIssues(currentIssuesData);

        if (leafletMap) {
            updateMapMarkers(currentIssuesData);
        }

    } catch (error) {

        console.error(error);

        issuesList.innerHTML = `
            <div class="community-message">
                Unable to load issues. Please try again.
            </div>
        `;
    }
}


// Render issues

function renderIssues(issues) {

    if (!Array.isArray(issues) || issues.length === 0) {

        issuesList.innerHTML = `
            <div class="community-message">
                <strong>No issues found</strong>
                <br>
                Try changing the filters or check again later.
            </div>
        `;

        return;
    }

    issuesList.innerHTML = issues.map(issue => {

        const imageUrl = getImageUrl(issue.image_path);

        let photoHtml;

        if (imageUrl) {

            photoHtml = `
                <div class="issue-photo">
                    <img
                        src="${escapeHtml(imageUrl)}"
                        alt="${escapeHtml(issue.title || 'Issue photo')}"
                        loading="lazy"
                        onerror="this.parentElement.innerHTML='<span class=&quot;issue-no-photo&quot;>📷 Photo unavailable</span>'"
                    >
                </div>
            `;

        } else {

            photoHtml = `
                <div class="issue-photo">
                    <span class="issue-no-photo">
                        📷 No photo
                    </span>
                </div>
            `;
        }

        const statusClass = issue.status === 'IN_PROGRESS'
            ? 'in-progress'
            : issue.status === 'RESOLVED'
                ? 'resolved'
                : 'open';

        return `
            <article class="community-issue-card">

                ${photoHtml}

                <div class="community-issue-content">

                    <div class="issue-top-row">

                        <span class="issue-category">
                            ${escapeHtml(formatCategory(issue.category))}
                        </span>

                        <span class="issue-status ${statusClass}">
                            ${escapeHtml(formatStatus(issue.status))}
                        </span>

                    </div>


                    <h3>
                        ${escapeHtml(issue.title)}
                    </h3>


                    <p class="issue-description">
                        ${escapeHtml(issue.description || 'No description provided.')}
                    </p>


                    <div class="issue-info">

                        <div>
                            <strong>📍</strong>
                            <span>
                                ${escapeHtml(issue.address || 'Location not provided')}
                            </span>
                        </div>

                        <div>
                            <strong>⚠️</strong>
                            <span>
                                Severity: ${escapeHtml(issue.severity || 'MEDIUM')}
                            </span>
                        </div>

                        <div>
                            <strong>👤</strong>
                            <span>
                                Reported by: ${escapeHtml(issue.reporter_name || 'Citizen')}
                            </span>
                        </div>

                    </div>


                    <div class="issue-footer">

                        <div class="issue-meta">

                            <span>
                                📅 ${escapeHtml(formatDate(issue.created_at))}
                            </span>

                            <span>
                                👍 ${Number(issue.upvote_count || 0)} Likes
                            </span>

                        </div>


                        <div class="issue-actions">

                            <button
                                type="button"
                                class="like-button"
                                data-id="${issue.id}">

                                👍 Like

                            </button>

                            <button
                                type="button"
                                class="details-button"
                                data-id="${issue.id}">

                                View Details

                            </button>

                        </div>

                    </div>

                </div>

            </article>
        `;

    }).join('');


    document.querySelectorAll('.like-button').forEach(button => {

        button.addEventListener('click', async (event) => {

            event.stopPropagation();

            await upvoteIssue(
                button.dataset.id,
                button
            );

        });

    });


    document.querySelectorAll('.details-button').forEach(button => {

        button.addEventListener('click', (event) => {

            event.stopPropagation();

            window.location.href =
                `/issue.html?id=${button.dataset.id}`;

        });

    });
}


// Upvote issue

async function upvoteIssue(issueId, button) {

    if (button.disabled) {
        return;
    }

    const oldText = button.textContent;

    button.disabled = true;
    button.textContent = 'Liking...';

    try {

        const response = await fetch(
            `/api/issues/${issueId}/upvote`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Unable to like issue');
        }

        button.classList.add('upvoted');
        button.textContent = '✓ Liked';

        showMessage(
            'Issue liked successfully.',
            'success'
        );

        setTimeout(() => {
            loadIssues();
        }, 700);

    } catch (error) {

        console.error(error);

        button.disabled = false;
        button.textContent = oldText;

        showMessage(
            error.message || 'Unable to like issue.',
            'error'
        );
    }
}


// Filters

categoryFilter.addEventListener('change', loadIssues);
statusFilter.addEventListener('change', loadIssues);


// Refresh

refreshButton.addEventListener('click', async () => {

    refreshButton.disabled = true;
    refreshButton.textContent = '🔄 Loading...';

    await loadIssues();

    refreshButton.disabled = false;
    refreshButton.textContent = '🔄 Refresh';
});


// =========================
// MAP VIEW & LEAFLET
// =========================

function initMap() {
    if (leafletMap || typeof L === 'undefined') {
        return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        return;
    }

    leafletMap = L.map('map', {
        scrollWheelZoom: true,
        zoomControl: true
    }).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    markersLayer = L.layerGroup().addTo(leafletMap);
}

function createMarkerIcon(status) {
    let pinColor = '#dc2626'; // Red for Open
    if (status === 'IN_PROGRESS') {
        pinColor = '#d97706'; // Orange for In Progress
    } else if (status === 'RESOLVED') {
        pinColor = '#16a34a'; // Green for Resolved
    }

    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div class="pin-svg-container" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
                <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="${pinColor}"/>
                    <circle cx="16" cy="16" r="6.5" fill="#ffffff"/>
                </svg>
            </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -40]
    });
}

function updateMapMarkers(issues) {
    if (!leafletMap || !markersLayer) {
        initMap();
    }

    if (!markersLayer) {
        return;
    }

    markersLayer.clearLayers();

    const validIssues = (issues || []).filter(issue => {
        const lat = parseFloat(issue.latitude);
        const lng = parseFloat(issue.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    const markerBounds = [];

    validIssues.forEach(issue => {
        const lat = parseFloat(issue.latitude);
        const lng = parseFloat(issue.longitude);
        const latLng = [lat, lng];
        markerBounds.push(latLng);

        const marker = L.marker(latLng, {
            icon: createMarkerIcon(issue.status),
            title: issue.title || 'Civic Issue'
        });

        const imageUrl = getImageUrl(issue.image_path);
        const statusClass = issue.status === 'IN_PROGRESS'
            ? 'in-progress'
            : issue.status === 'RESOLVED'
                ? 'resolved'
                : 'open';

        const popupContent = `
            <div class="map-popup-card">
                ${imageUrl ? `
                    <div class="map-popup-photo">
                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="${escapeHtml(issue.title || 'Issue photo')}"
                            onerror="this.parentElement.style.display='none'"
                        >
                    </div>
                ` : ''}
                <div class="map-popup-content-inner">
                    <div class="map-popup-header">
                        <span class="map-popup-category">${escapeHtml(formatCategory(issue.category))}</span>
                        <span class="map-popup-badge ${statusClass}">${escapeHtml(formatStatus(issue.status))}</span>
                    </div>
                    <h4 class="map-popup-title">${escapeHtml(issue.title || 'Untitled Issue')}</h4>
                    <p class="map-popup-address">📍 ${escapeHtml(issue.address || 'Location on map')}</p>
                    <div class="map-popup-meta">
                        <span>👍 ${Number(issue.upvote_count || 0)} Likes</span>
                        <span>👤 ${escapeHtml(issue.reporter_name || 'Citizen')}</span>
                    </div>
                    <a href="/issue.html?id=${encodeURIComponent(issue.id)}" class="map-popup-btn">
                        View Details &rarr;
                    </a>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, {
            maxWidth: 290,
            className: 'custom-map-popup'
        });

        markersLayer.addLayer(marker);
    });

    if (markerBounds.length > 0 && leafletMap) {
        leafletMap.fitBounds(L.latLngBounds(markerBounds), {
            padding: [50, 50],
            maxZoom: 15
        });
    }
}

function switchViewMode(mode) {
    currentViewMode = mode;

    if (mode === 'map') {
        if (cardViewBtn) cardViewBtn.classList.remove('active');
        if (mapViewBtn) mapViewBtn.classList.add('active');
        if (issuesList) issuesList.style.display = 'none';
        if (mapViewSection) mapViewSection.style.display = 'block';

        initMap();

        setTimeout(() => {
            if (leafletMap) {
                leafletMap.invalidateSize();
                updateMapMarkers(currentIssuesData);
            }
        }, 80);
    } else {
        if (mapViewBtn) mapViewBtn.classList.remove('active');
        if (cardViewBtn) cardViewBtn.classList.add('active');
        if (mapViewSection) mapViewSection.style.display = 'none';
        if (issuesList) issuesList.style.display = 'grid';
    }
}

if (cardViewBtn) {
    cardViewBtn.addEventListener('click', () => switchViewMode('grid'));
}

if (mapViewBtn) {
    mapViewBtn.addEventListener('click', () => switchViewMode('map'));
}


loadIssues();