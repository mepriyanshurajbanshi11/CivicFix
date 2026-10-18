const token = localStorage.getItem('civic_token');
const user = JSON.parse(localStorage.getItem('civic_user') || 'null');

const isPublicPage = window.location.pathname.includes('public.html') || !!document.getElementById('publicIssuesList');
if (!isPublicPage && (!token || !user)) {
    window.location.href = '/';
}

const issuesList = document.getElementById('issuesList') || document.getElementById('publicIssuesList');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const refreshButton = document.getElementById('refreshButton') || document.getElementById('refreshIssuesButton');

const profileButton = document.getElementById('profileButton');
const profileMenu = document.getElementById('profileMenu');
const profileInitial = document.getElementById('profileInitial');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');

const dashboardButton = document.getElementById('dashboardButton');
const myReportsButton = document.getElementById('myReportsButton');
const adminDashboardButton = document.getElementById('adminDashboardButton');
const logoutButton = document.getElementById('logoutButton') || document.getElementById('publicLogoutButton');

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

    if (profileName) profileName.textContent = name;
    if (profileEmail) profileEmail.textContent = user.email || '';
    if (profileRole) profileRole.textContent = user.role || 'CITIZEN';
    if (profileInitial) profileInitial.textContent = name.charAt(0).toUpperCase();

    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarAdminLink = document.getElementById('sidebarAdminLink');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

    if (sidebarUserName) sidebarUserName.textContent = name;
    if (sidebarUserRole) sidebarUserRole.textContent = user.role || 'CITIZEN';
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = name.charAt(0).toUpperCase();

    if (user.role === 'ADMIN') {
        if (adminDashboardButton) adminDashboardButton.style.display = 'block';
        if (sidebarAdminLink) sidebarAdminLink.style.display = 'flex';

        // Hide citizen "Report Issue" buttons and "My Reports" from Admins
        document.querySelectorAll('.btn-report-header, .mobile-fab').forEach(el => el.style.display = 'none');
        document.querySelectorAll('a[href="my-reports.html"]').forEach(el => el.style.display = 'none');
        if (myReportsButton) myReportsButton.style.display = 'none';

        // Redirect citizen dashboard links to admin overview
        document.querySelectorAll('a[href="dashboard.html"]').forEach(el => el.setAttribute('href', 'admin.html'));
        if (dashboardButton) {
            dashboardButton.textContent = '🛠️ Admin Overview';
        }
    }

    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('civic_token');
            localStorage.removeItem('civic_user');
            window.location.href = '/';
        });
    }
}

if (profileButton) {
    profileButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (profileMenu) profileMenu.classList.toggle('show');
    });
}

document.addEventListener('click', (event) => {
    if (profileMenu && profileButton &&
        !profileMenu.contains(event.target) &&
        !profileButton.contains(event.target)) {

        profileMenu.classList.remove('show');
    }
});

if (dashboardButton) {
    dashboardButton.addEventListener('click', () => {
        window.location.href = user && user.role === 'ADMIN' ? '/admin.html' : '/dashboard.html';
    });
}

if (myReportsButton) {
    myReportsButton.addEventListener('click', () => {
        window.location.href = '/my-reports.html';
    });
}

if (adminDashboardButton) {
    adminDashboardButton.addEventListener('click', () => {
        window.location.href = '/admin.html';
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('civic_token');
        localStorage.removeItem('civic_user');

        window.location.href = '/';
    });
}


// Messages

function showMessage(message, type = 'success') {
    if (!pageMessage) {
        return;
    }
    pageMessage.textContent = message;
    pageMessage.className = `page-message show ${type}`;

    setTimeout(() => {
        if (pageMessage) {
            pageMessage.className = 'page-message';
        }
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
    if (!issuesList) {
        return;
    }

    issuesList.innerHTML = Array.from({ length: 6 }, () => `
        <div class="community-issue-card skeleton-card">
            <div class="skeleton-photo skeleton-box"></div>
            <div class="community-issue-content">
                <div class="skeleton-line skeleton-box" style="width: 45%; height: 14px; margin-bottom: 12px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 85%; height: 20px; margin-bottom: 10px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 100%; height: 14px; margin-bottom: 6px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 65%; height: 14px; margin-bottom: 16px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 40%; height: 14px;"></div>
            </div>
        </div>
    `).join('');

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
            leafletMap.invalidateSize();
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
    if (!issuesList) {
        return;
    }

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

if (categoryFilter) {
    categoryFilter.addEventListener('change', loadIssues);
}
if (statusFilter) {
    statusFilter.addEventListener('change', loadIssues);
}


// Refresh

if (refreshButton) {
    refreshButton.addEventListener('click', async () => {

        refreshButton.disabled = true;
        refreshButton.textContent = '🔄 Loading...';

        await loadIssues();

        refreshButton.disabled = false;
        refreshButton.textContent = '🔄 Refresh';
    });
}


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
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
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
        leafletMap.invalidateSize();
        if (markerBounds.length === 1) {
            leafletMap.setView(markerBounds[0], 15);
        } else {
            leafletMap.fitBounds(L.latLngBounds(markerBounds), {
                padding: [50, 50],
                maxZoom: 15
            });
        }
    }
}

let userLocationMarker = null;

function locateUserOnMap() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }
    const locateBtn = document.getElementById('locateUserBtn');
    if (locateBtn) {
        locateBtn.textContent = '📍 Locating...';
        locateBtn.disabled = true;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            if (!leafletMap) initMap();

            if (userLocationMarker) {
                userLocationMarker.setLatLng([lat, lng]);
            } else {
                const userIcon = L.divIcon({
                    className: 'user-pulse-marker',
                    html: `
                        <div style="width: 22px; height: 22px; background: #0284c7; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 6px rgba(2, 132, 199, 0.45); cursor: pointer;"></div>
                    `,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                userLocationMarker = L.marker([lat, lng], {
                    icon: userIcon,
                    title: 'Your Location'
                }).bindPopup('<b>📍 You are here</b><br><small>Your current GPS position</small>').addTo(leafletMap);
            }

            leafletMap.flyTo([lat, lng], 14, { duration: 1.2 });
            userLocationMarker.openPopup();

            if (locateBtn) {
                locateBtn.textContent = '📍 My Location';
                locateBtn.disabled = false;
            }
        },
        error => {
            console.warn('Geolocation error on City Map:', error);
            if (locateBtn) {
                locateBtn.textContent = '📍 My Location';
                locateBtn.disabled = false;
            }
            alert('Could not determine your exact location. Please verify that your device/browser location permission is enabled.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
}

const locateUserBtn = document.getElementById('locateUserBtn');
if (locateUserBtn) {
    locateUserBtn.addEventListener('click', locateUserOnMap);
}

function switchViewMode(mode) {
    currentViewMode = mode;

    if (mode === 'map') {
        if (cardViewBtn) cardViewBtn.classList.remove('active');
        if (mapViewBtn) mapViewBtn.classList.add('active');
        if (issuesList) issuesList.style.display = 'none';
        if (mapViewSection) mapViewSection.style.display = 'block';

        initMap();

        [50, 150, 350, 600].forEach(delay => {
            setTimeout(() => {
                if (leafletMap) {
                    leafletMap.invalidateSize();
                    updateMapMarkers(currentIssuesData);
                }
            }, delay);
        });
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

// URL params and Topbar Search
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('view') === 'map') {
    switchViewMode('map');
}

const topbarSearch = document.getElementById('topbarSearchInput');
if (topbarSearch) {
    const searchParam = urlParams.get('search');
    if (searchParam) {
        topbarSearch.value = searchParam;
        setTimeout(() => {
            const query = searchParam.toLowerCase().trim();
            const filtered = currentIssuesData.filter(i => {
                return (i.title || '').toLowerCase().includes(query) ||
                       (i.category || '').toLowerCase().includes(query) ||
                       (i.address || '').toLowerCase().includes(query);
            });
            if (filtered.length > 0) renderIssues(filtered);
        }, 300);
    }

    topbarSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            renderIssues(currentIssuesData);
            return;
        }
        const filtered = currentIssuesData.filter(i => {
            return (i.title || '').toLowerCase().includes(query) ||
                   (i.category || '').toLowerCase().includes(query) ||
                   (i.address || '').toLowerCase().includes(query);
        });
        renderIssues(filtered);
    });
}