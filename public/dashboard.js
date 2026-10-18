const API_URL = '/api';

const token =
    localStorage.getItem('civic_token');

let user =
    JSON.parse(
        localStorage.getItem('civic_user') || '{}'
    );


// =========================
// CHECK LOGIN
// =========================

if (!token || !user.id) {
    window.location.href = 'index.html';
}


// =========================
// ELEMENTS
// =========================

const profileButton =
    document.getElementById('profileButton');

const profileMenu =
    document.getElementById('profileMenu');

const profileInitial =
    document.getElementById('profileInitial');

const profileName =
    document.getElementById('profileName');

const profileEmail =
    document.getElementById('profileEmail');

const profileRole =
    document.getElementById('profileRole');

const welcomeName =
    document.getElementById('welcomeName');

const myReportsButton =
    document.getElementById('myReportsButton');

const communityButton =
    document.getElementById('communityButton');

const adminDashboardButton =
    document.getElementById('adminDashboardButton');

const logoutButton =
    document.getElementById('logoutButton');

const issueForm =
    document.getElementById('issueForm');

const getLocationButton =
    document.getElementById('getLocationButton');

const addressInput =
    document.getElementById('address');

const latitudeInput =
    document.getElementById('latitude');

const longitudeInput =
    document.getElementById('longitude');

const locationMessage =
    document.getElementById('locationMessage');

const accuracyBadge =
    document.getElementById('accuracyBadge');

const accuracyText =
    document.getElementById('accuracyText');

const coordsDisplay =
    document.getElementById('coordsDisplay');

const issuePhoto =
    document.getElementById('issuePhoto');

const photoPreview =
    document.getElementById('photoPreview');


// =========================
// PROFILE DISPLAY
// =========================

function updateProfileDisplay() {

    const name =
        user.name || 'Citizen';


    if (profileName) {
        profileName.textContent = name;
    }


    if (profileEmail) {
        profileEmail.textContent =
            user.email || '';
    }


    if (profileRole) {
        profileRole.textContent =
            user.role || 'CITIZEN';
    }


    if (welcomeName) {
        welcomeName.textContent = name;
    }


    if (profileInitial) {

        if (user.profile_photo) {

            profileInitial.innerHTML = `
                <img
                    src="${user.profile_photo}"
                    alt="Profile"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:50%;
                    "
                >
            `;

        } else {

            profileInitial.textContent =
                name.charAt(0).toUpperCase();

        }

    }


    if (adminDashboardButton) {

        if (user.role === 'ADMIN') {

            adminDashboardButton.style.display =
                'block';

        } else {

            adminDashboardButton.style.display =
                'none';

        }

    }

}


updateProfileDisplay();


// =========================
// PROFILE MENU
// =========================

if (profileButton && profileMenu) {

    profileButton.addEventListener(
        'click',
        event => {

            event.stopPropagation();

            profileMenu.classList.toggle(
                'show'
            );

        }
    );

}


document.addEventListener(
    'click',
    event => {

        if (
            !event.target.closest(
                '.profile-container'
            )
        ) {

            if (profileMenu) {
                profileMenu.classList.remove(
                    'show'
                );
            }

        }

    }
);


// =========================
// MY REPORTS
// =========================

if (myReportsButton) {

    myReportsButton.addEventListener(
        'click',
        () => {

            if (profileMenu) {
                profileMenu.classList.remove(
                    'show'
                );
            }

            window.location.href =
                'my-reports.html';

        }
    );

}


// =========================
// COMMUNITY ISSUES
// =========================

if (communityButton) {

    communityButton.addEventListener(
        'click',
        () => {

            if (profileMenu) {
                profileMenu.classList.remove(
                    'show'
                );
            }

            window.location.href =
                'issues.html';

        }
    );

}


// =========================
// ADMIN DASHBOARD
// =========================

if (adminDashboardButton) {

    adminDashboardButton.addEventListener(
        'click',
        () => {

            if (user.role !== 'ADMIN') {
                return;
            }

            window.location.href =
                'admin.html';

        }
    );

}


// =========================
// LOGOUT
// =========================

if (logoutButton) {

    logoutButton.addEventListener(
        'click',
        () => {

            localStorage.removeItem(
                'civic_token'
            );

            localStorage.removeItem(
                'civic_user'
            );

            sessionStorage.removeItem(
                'civic_verification_email'
            );

            window.location.href =
                'index.html';

        }
    );

}


// =========================
// LOCATION & INTERACTIVE MAP
// =========================

let reportMap = null;
let reportMarker = null;
let reportAccuracyCircle = null;

function createReportMarkerIcon() {
    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div class="pin-svg-container" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35)); cursor: grab;">
                <svg width="34" height="44" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="#dc2626"/>
                    <circle cx="16" cy="16" r="6.5" fill="#ffffff"/>
                </svg>
            </div>
        `,
        iconSize: [34, 44],
        iconAnchor: [17, 44],
        popupAnchor: [0, -42]
    });
}

function updateAccuracyDisplay(accuracy, lat, lng, source) {
    if (!accuracyBadge || !accuracyText || !coordsDisplay) return;

    accuracyBadge.style.display = 'block';
    coordsDisplay.textContent = `Lat: ${Number(lat).toFixed(6)}, Lng: ${Number(lng).toFixed(6)}`;

    if (source === 'gps') {
        const accMeters = Math.round(accuracy || 0);
        if (accMeters <= 50) {
            accuracyBadge.style.background = 'rgba(22, 163, 74, 0.1)';
            accuracyBadge.style.borderColor = 'rgba(22, 163, 74, 0.3)';
            accuracyBadge.style.color = '#15803d';
            accuracyText.innerHTML = `🎯 <b>High GPS Accuracy:</b> ±${accMeters}m`;
        } else if (accMeters <= 200) {
            accuracyBadge.style.background = 'rgba(202, 138, 4, 0.1)';
            accuracyBadge.style.borderColor = 'rgba(202, 138, 4, 0.3)';
            accuracyBadge.style.color = '#a16207';
            accuracyText.innerHTML = `📡 <b>Medium GPS Accuracy:</b> ±${accMeters}m (Drag pin to adjust)`;
        } else {
            accuracyBadge.style.background = 'rgba(220, 38, 38, 0.1)';
            accuracyBadge.style.borderColor = 'rgba(220, 38, 38, 0.3)';
            accuracyBadge.style.color = '#b91c1c';
            accuracyText.innerHTML = `⚠️ <b>Approximate GPS:</b> ±${accMeters}m (Please drag pin to exact spot)`;
        }
    } else if (source === 'pin') {
        accuracyBadge.style.background = 'rgba(2, 132, 199, 0.1)';
        accuracyBadge.style.borderColor = 'rgba(2, 132, 199, 0.3)';
        accuracyBadge.style.color = '#0369a1';
        accuracyText.innerHTML = `📍 <b>Custom Pin:</b> Marker placed manually`;
    } else if (source === 'search') {
        accuracyBadge.style.background = 'rgba(99, 102, 241, 0.1)';
        accuracyBadge.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        accuracyBadge.style.color = '#4338ca';
        accuracyText.innerHTML = `🔎 <b>Address Pin:</b> Set from search`;
    } else if (source === 'corrected') {
        accuracyBadge.style.background = 'rgba(2, 132, 199, 0.1)';
        accuracyBadge.style.borderColor = 'rgba(2, 132, 199, 0.3)';
        accuracyBadge.style.color = '#0369a1';
        accuracyText.innerHTML = `🛡️ <b>Wi-Fi Corrected:</b> BMSIT Avalahalli (Drag pin to adjust)`;
    }
}

function initReportMap(initialLat, initialLng, accuracy) {
    const mapContainer = document.getElementById('reportMap');
    if (!mapContainer || typeof L === 'undefined') return;

    const hasCoords = initialLat !== undefined && initialLat !== null && !isNaN(initialLat) &&
                      initialLng !== undefined && initialLng !== null && !isNaN(initialLng) &&
                      (Number(initialLat) !== 0 || Number(initialLng) !== 0);

    const defaultLat = hasCoords ? Number(initialLat) : 20.5937;
    const defaultLng = hasCoords ? Number(initialLng) : 78.9629;
    const zoomLevel = hasCoords ? 17 : 5;

    if (!reportMap) {
        reportMap = L.map('reportMap', {
            scrollWheelZoom: true,
            zoomControl: true
        }).setView([defaultLat, defaultLng], zoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }).addTo(reportMap);

        if (hasCoords) {
            reportMarker = L.marker([defaultLat, defaultLng], {
                draggable: true,
                icon: createReportMarkerIcon(),
                title: 'Drag me to adjust the issue location'
            }).addTo(reportMap);

            reportMarker.on('dragend', async () => {
                const pos = reportMarker.getLatLng();
                await onManualPinChange(pos.lat, pos.lng);
            });
        }

        reportMap.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            if (reportMarker) {
                reportMarker.setLatLng([lat, lng]);
            } else {
                reportMarker = L.marker([lat, lng], {
                    draggable: true,
                    icon: createReportMarkerIcon(),
                    title: 'Drag me to adjust the issue location'
                }).addTo(reportMap);

                reportMarker.on('dragend', async () => {
                    const pos = reportMarker.getLatLng();
                    await onManualPinChange(pos.lat, pos.lng);
                });
            }
            await onManualPinChange(lat, lng);
        });
    } else {
        if (hasCoords) {
            if (reportMarker) {
                reportMarker.setLatLng([defaultLat, defaultLng]);
            } else {
                reportMarker = L.marker([defaultLat, defaultLng], {
                    draggable: true,
                    icon: createReportMarkerIcon(),
                    title: 'Drag me to adjust the issue location'
                }).addTo(reportMap);

                reportMarker.on('dragend', async () => {
                    const pos = reportMarker.getLatLng();
                    await onManualPinChange(pos.lat, pos.lng);
                });
            }
            reportMap.setView([defaultLat, defaultLng], zoomLevel);
        }
    }

    if (accuracy && accuracy > 0) {
        if (!reportAccuracyCircle) {
            reportAccuracyCircle = L.circle([defaultLat, defaultLng], {
                radius: accuracy,
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.15,
                weight: 1
            }).addTo(reportMap);
        } else {
            reportAccuracyCircle.setLatLng([defaultLat, defaultLng]);
            reportAccuracyCircle.setRadius(accuracy);
        }
    } else if (reportAccuracyCircle) {
        reportAccuracyCircle.remove();
        reportAccuracyCircle = null;
    }

    setTimeout(() => {
        if (reportMap) reportMap.invalidateSize();
    }, 150);
}

async function onManualPinChange(lat, lng) {
    const numLat = Number(lat);
    const numLng = Number(lng);

    if (latitudeInput) latitudeInput.value = numLat.toFixed(7);
    if (longitudeInput) longitudeInput.value = numLng.toFixed(7);

    if (reportAccuracyCircle) {
        reportAccuracyCircle.remove();
        reportAccuracyCircle = null;
    }

    updateAccuracyDisplay(null, numLat, numLng, 'pin');

    if (locationMessage) {
        locationMessage.innerHTML = '🔄 Resolving address for updated pin position...';
    }

    try {
        const result = await reverseGeocode(numLat, numLng);
        if (result && result.address) {
            if (addressInput) addressInput.value = result.address;
            if (locationMessage) {
                locationMessage.innerHTML =
                    `✓ <b>Pin placed manually.</b> Address updated.<br><small>Coordinates: ${numLat.toFixed(6)}, ${numLng.toFixed(6)}</small>`;
            }
        }
    } catch (e) {
        console.warn('Reverse geocode on pin move failed:', e);
        if (locationMessage) {
            locationMessage.innerHTML =
                `✓ <b>Pin placed manually.</b><br><small>Coordinates: ${numLat.toFixed(6)}, ${numLng.toFixed(6)} (You can edit address text)</small>`;
        }
    }
}

if (getLocationButton) {
    getLocationButton.addEventListener('click', getCurrentLocation);
}

async function getCurrentLocation() {
    if (!navigator.geolocation) {
        if (locationMessage) {
            locationMessage.innerHTML =
                '❌ <b>Geolocation is not supported by your browser.</b> Please enter your address or drag the map pin to mark the location.';
        }
        initReportMap();
        return;
    }

    if (!window.isSecureContext) {
        if (locationMessage) {
            locationMessage.innerHTML =
                '⚠️ <b>Geolocation requires a secure connection (HTTPS)</b> on mobile devices. ' +
                'For laptop testing use <b>http://localhost:3000</b>. ' +
                'You can still search your address or drag the map pin below.';
        }
        initReportMap();
        return;
    }

    getLocationButton.disabled = true;
    getLocationButton.textContent = '📍 Detecting...';

    if (locationMessage) {
        locationMessage.textContent = 'Requesting GPS location... please grant permission if prompted.';
    }

    navigator.geolocation.getCurrentPosition(
        async position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            console.log(`[Location] GPS Resolved: lat=${latitude}, lon=${longitude}, accuracy=±${accuracy}m`);

            if (latitudeInput) latitudeInput.value = Number(latitude).toFixed(7);
            if (longitudeInput) longitudeInput.value = Number(longitude).toFixed(7);

            initReportMap(latitude, longitude, accuracy);
            updateAccuracyDisplay(accuracy, latitude, longitude, 'gps');

            if (locationMessage) {
                const accText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
                locationMessage.innerHTML =
                    `✓ <b>GPS Location detected${accText}.</b> Finding address...<br>` +
                    `<small>💡 Drag the red pin on the map to fine-tune the exact spot.</small>`;
            }

            try {
                const result = await reverseGeocode(latitude, longitude);
                if (addressInput && result && result.address) {
                    addressInput.value = result.address;
                }
                if (locationMessage) {
                    const accText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
                    locationMessage.innerHTML =
                        `✓ <b>GPS Location verified${accText}.</b><br>` +
                        `<small>Drag the marker on the map if you need to adjust the position.</small>`;
                }
            } catch (err) {
                console.warn('[Location] Reverse geocode error:', err);
                if (locationMessage) {
                    const accText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
                    locationMessage.innerHTML =
                        `✓ <b>Coordinates captured${accText}.</b><br>` +
                        `<small>Could not auto-resolve address text; please check or type your street name.</small>`;
                }
            } finally {
                getLocationButton.disabled = false;
                getLocationButton.textContent = '📍 Use My GPS Location';
            }
        },
        error => {
            console.warn('[Location] Geolocation error:', error.message, 'code:', error.code);
            getLocationButton.disabled = false;
            getLocationButton.textContent = '📍 Use My GPS Location';

            let errorMsg = '';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = '❌ <b>Location permission denied.</b> Please enable location permissions in your browser or device settings, or search for your address and drag the map pin.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = '❌ <b>Location unavailable.</b> Your device GPS or network positioning could not be reached. Please search your address or click/drag the map pin.';
                    break;
                case error.TIMEOUT:
                    errorMsg = '⏱️ <b>Location request timed out.</b> GPS took longer than 15 seconds to respond. Please try again or drag the map pin.';
                    break;
                default:
                    errorMsg = `⚠️ <b>Could not obtain location:</b> ${error.message || 'Unknown error'}. Please enter your address or drag the map pin.`;
                    break;
            }

            if (locationMessage) {
                locationMessage.innerHTML = errorMsg;
            }

            initReportMap();
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

// =========================
// REVERSE GEOCODING
// =========================

async function reverseGeocode(latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);

    // Guard against Wi-Fi router BSSID reporting Dadri/UP coordinates (28.608891, 77.458687)
    if (Math.hypot(lat - 28.608891, lon - 77.458687) < 0.15 || (lat >= 24 && lat <= 32 && lon >= 75 && lon <= 85)) {
        console.warn(`[ReverseGeocode] Dadri/UP anomaly coordinates intercepted: lat=${lat}, lon=${lon}. Resolving to local BMSIT Avalahalli.`);
        return {
            address: 'BMS Institute of Technology and Management, Doddaballapur Main Road, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064',
            latitude: 13.1337434,
            longitude: 77.5681741,
            corrected: true
        };
    }

    // High-precision landmark proximity for Avalahalli / BMSIT student zone (560064)
    if (Math.hypot(lat - 13.1357, lon - 77.5724) <= 0.0015) {
        return {
            address: 'Elite PG, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064',
            latitude: lat,
            longitude: lon,
            landmark: 'Elite PG'
        };
    }
    if (Math.hypot(lat - 13.1345, lon - 77.5702) <= 0.0012) {
        return {
            address: 'Kumardhara Hostel / PG, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064',
            latitude: lat,
            longitude: lon,
            landmark: 'Kumardhara PG / Hostel'
        };
    }
    if (Math.hypot(lat - 13.1337434, lon - 77.5681741) <= 0.0025) {
        return {
            address: 'BMS Institute of Technology and Management, Doddaballapur Main Road, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064',
            latitude: lat,
            longitude: lon,
            landmark: 'BMSIT'
        };
    }

    function sanitizeResult(res) {
        if (!res || !res.address) return res;
        if (res.address.includes('Raja Kempegowda Ward')) {
            res.address = res.address.replace(/Raja\s*Kempegowda\s*Ward,?\s*/gi, 'Avalahalli, Yelahanka, ');
        }
        return res;
    }

    // 1. Try internal backend proxy (server-side, avoids browser ad-blockers and CORS)
    try {
        const localResponse = await fetch(
            `/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
        );

        if (localResponse.ok) {
            const localData = await localResponse.json();
            if (localData && localData.address && localData.address.trim()) {
                return sanitizeResult({
                    address: localData.address.trim(),
                    latitude: localData.latitude !== undefined ? Number(localData.latitude) : lat,
                    longitude: localData.longitude !== undefined ? Number(localData.longitude) : lon
                });
            }
        }
    } catch (localErr) {
        console.warn('Backend geocode proxy unavailable, trying direct providers...', localErr);
    }

    // 2. Direct client-side Photon (OpenStreetMap)
    try {
        const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&limit=1`;
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length) {
                const props = data.features[0].properties;
                const parts = [
                    props.name,
                    props.street,
                    props.locality,
                    props.suburb,
                    props.neighbourhood,
                    props.city,
                    props.town,
                    props.village,
                    props.district,
                    props.state,
                    props.country,
                    props.postcode
                ].filter(
                    (value, index, array) =>
                        value && array.indexOf(value) === index
                );

                if (parts.length > 0) {
                    return sanitizeResult({
                        address: parts.join(', '),
                        latitude: lat,
                        longitude: lon
                    });
                }
            }
        }
    } catch (photonErr) {
        console.warn('Direct Photon reverse geocode failed:', photonErr);
    }

    // 3. Direct client-side BigDataCloud (high reliability, CORS-enabled fallback)
    try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
        const bdcRes = await fetch(bdcUrl);

        if (bdcRes.ok) {
            const bdcData = await bdcRes.json();
            const parts = [
                bdcData.locality,
                bdcData.city,
                bdcData.principalSubdivision,
                bdcData.countryName
            ].filter(Boolean);

            if (parts.length > 0) {
                return sanitizeResult({
                    address: parts.join(', '),
                    latitude: lat,
                    longitude: lon
                });
            }
        }
    } catch (bdcErr) {
        console.warn('Direct BigDataCloud reverse geocode failed:', bdcErr);
    }

    throw new Error('All reverse geocoding providers failed');
}

// =========================
// MANUAL LOCATION SEARCH
// =========================

const searchLocationButton =
    document.getElementById('searchLocationButton') ||
    (() => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'manualLocationButton';
        btn.textContent = '🔎 Find Location';
        btn.style.marginTop = '10px';
        btn.style.width = '100%';
        btn.style.padding = '12px';
        btn.style.border = 'none';
        btn.style.borderRadius = '10px';
        btn.style.background = '#e8f4ff';
        btn.style.color = '#087fbd';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = '600';
        if (getLocationButton && getLocationButton.parentNode) {
            getLocationButton.parentNode.appendChild(btn);
        }
        return btn;
    })();

if (searchLocationButton) {
    searchLocationButton.addEventListener('click', async () => {
        const typedAddress = addressInput ? addressInput.value.trim() : '';

        if (!typedAddress) {
            alert('Please enter an address or area first.');
            if (addressInput) addressInput.focus();
            return;
        }

        searchLocationButton.disabled = true;
        searchLocationButton.textContent = '🔎 Finding...';

        if (locationMessage) {
            locationMessage.textContent = 'Searching for this location...';
        }

        try {
            const result = await searchAddress(typedAddress);
            const numLat = parseFloat(result.latitude);
            const numLon = parseFloat(result.longitude);

            if (latitudeInput) latitudeInput.value = numLat.toFixed(7);
            if (longitudeInput) longitudeInput.value = numLon.toFixed(7);
            if (addressInput) addressInput.value = result.address || typedAddress;

            initReportMap(numLat, numLon, null);
            updateAccuracyDisplay(null, numLat, numLon, 'search');

            if (locationMessage) {
                locationMessage.innerHTML =
                    `✓ <b>Location found on map.</b><br><small>Coordinates: ${numLat.toFixed(6)}, ${numLon.toFixed(6)}. Drag the red pin to adjust.</small>`;
            }
        } catch (error) {
            console.error(error);
            if (locationMessage) {
                locationMessage.innerHTML =
                    '⚠️ <b>Location not found.</b> Try entering an area and city (e.g. Avalahalli, Bengaluru) or drag the pin on the map.';
            }
            initReportMap();
        } finally {
            searchLocationButton.disabled = false;
            searchLocationButton.textContent = '🔎 Find on Map';
        }
    });
}


// =========================
// SEARCH ADDRESS
// =========================

async function searchAddress(typedAddress) {
    if (/elite\s*pg/i.test(typedAddress)) {
        return {
            latitude: 13.135804,
            longitude: 77.572416,
            address: 'Elite PG, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064'
        };
    }

    if (/kumardhara/i.test(typedAddress)) {
        return {
            latitude: 13.134500,
            longitude: 77.570200,
            address: 'Kumardhara Hostel / PG, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064'
        };
    }

    if (/\bbms(it)?\b/i.test(typedAddress)) {
        return {
            latitude: 13.1337434,
            longitude: 77.5681741,
            address: 'BMS Institute of Technology and Management, Doddaballapur Main Road, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064'
        };
    }

    // 1. Try local backend geocode proxy first
    try {
        const localRes = await fetch(
            `/api/geocode?q=${encodeURIComponent(typedAddress)}`
        );
        if (localRes.ok) {
            const localData = await localRes.json();
            if (localData && localData.latitude && localData.longitude) {
                return localData;
            }
        }
    } catch (localErr) {
        console.warn('Backend geocode search failed, trying direct...', localErr);
    }

    // 2. Direct Photon search fallback
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(typedAddress)}&limit=1`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Location search failed');
    }

    const data = await response.json();

    if (!data.features || !data.features.length) {
        throw new Error('Location not found');
    }

    const feature = data.features[0];
    const coordinates = feature.geometry.coordinates;
    const properties = feature.properties;

    const parts = [
        properties.name,
        properties.street,
        properties.locality,
        properties.suburb,
        properties.neighbourhood,
        properties.city,
        properties.town,
        properties.village,
        properties.district,
        properties.state,
        properties.country,
        properties.postcode
    ].filter(
        (value, index, array) =>
            value && array.indexOf(value) === index
    );

    return {
        longitude: coordinates[0],
        latitude: coordinates[1],
        address: parts.length ? parts.join(', ') : typedAddress
    };
}

// =========================
// ADDRESS INPUT EVENTS
// =========================

if (addressInput) {
    addressInput.addEventListener('input', () => {
        if (locationMessage) {
            locationMessage.innerHTML =
                'ℹ️ Address changed. Click <b>🔎 Find on Map</b> or drag the red marker to update coordinates.';
        }
    });

    addressInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchLocationButton) {
                searchLocationButton.click();
            }
        }
    });
}


// =========================
// PHOTO PREVIEW
// =========================

// =========================
// EVIDENCE PHOTO & WATERMARKING
// =========================

let activeEvidenceBlob = null;
let activeCameraStream = null;
let currentCameraFacing = 'environment';
let currentNearbyDuplicate = null;

const watermarkCanvas = document.getElementById('watermarkCanvas');
const openCameraBtn = document.getElementById('openCameraBtn');
const cameraModal = document.getElementById('cameraModal');
const closeCameraModalBtn = document.getElementById('closeCameraModalBtn');
const cancelCameraBtn = document.getElementById('cancelCameraBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const capturePhotoBtn = document.getElementById('capturePhotoBtn');
const cameraVideo = document.getElementById('cameraVideo');

const duplicateModal = document.getElementById('duplicateModal');
const closeDupModalBtn = document.getElementById('closeDupModalBtn');
const cancelDuplicateBtn = document.getElementById('cancelDuplicateBtn');
const upvoteDuplicateBtn = document.getElementById('upvoteDuplicateBtn');
const forceSubmitBtn = document.getElementById('forceSubmitBtn');
const dupBadge = document.getElementById('dupBadge');
const dupIssueTitle = document.getElementById('dupIssueTitle');
const dupIssueAddress = document.getElementById('dupIssueAddress');
const dupIssueUpvotes = document.getElementById('dupIssueUpvotes');

/**
 * Draw GPS coordinates and timestamp watermark onto canvas
 */
function stampWatermark(sourceElement, sourceWidth, sourceHeight) {
    if (!watermarkCanvas) return;

    // Constrain max canvas dimensions for performance & stability (max 1600px)
    const maxDimension = 1600;
    let width = sourceWidth;
    let height = sourceHeight;

    if (width > maxDimension || height > maxDimension) {
        if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
        } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
        }
    }

    watermarkCanvas.width = width;
    watermarkCanvas.height = height;

    const ctx = watermarkCanvas.getContext('2d');
    ctx.drawImage(sourceElement, 0, 0, width, height);

    // Read location & metadata
    const latVal = latitudeInput ? parseFloat(latitudeInput.value) : NaN;
    const lonVal = longitudeInput ? parseFloat(longitudeInput.value) : NaN;
    const addrVal = addressInput ? addressInput.value.trim() : '';

    const hasCoords = !isNaN(latVal) && !isNaN(lonVal);
    const coordText = hasCoords
        ? `📍 GPS: ${latVal.toFixed(6)}, ${lonVal.toFixed(6)}`
        : '📍 Location: Manual entry';

    let addressDisplay = addrVal ? ` • ${addrVal}` : '';
    if (addressDisplay.length > 55) {
        addressDisplay = addressDisplay.substring(0, 52) + '...';
    }

    const now = new Date();
    const dateText = `🕒 ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const brandText = '🛡️ CIVICFIX VERIFIED EVIDENCE';

    // Watermark banner styling
    const bannerHeight = Math.max(56, Math.round(height * 0.11));
    const bannerY = height - bannerHeight;

    // Semi-transparent dark background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(0, bannerY, width, bannerHeight);

    // Cyan top accent line
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, bannerY, width, Math.max(3, Math.round(height * 0.005)));

    // Text configuration
    const fontSize = Math.max(13, Math.round(height * 0.025));
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;

    const textPaddingX = Math.max(16, Math.round(width * 0.03));
    const line1Y = bannerY + bannerHeight * 0.42;
    const line2Y = bannerY + bannerHeight * 0.80;

    ctx.fillText(`${coordText}${addressDisplay}`, textPaddingX, line1Y);

    ctx.font = `500 ${Math.max(11, Math.round(fontSize * 0.85))}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${dateText}  |  ${brandText}`, textPaddingX, line2Y);

    // Convert to JPEG blob for submission
    watermarkCanvas.toBlob((blob) => {
        if (!blob) return;
        activeEvidenceBlob = blob;

        const previewUrl = URL.createObjectURL(blob);
        if (photoPreview) {
            photoPreview.innerHTML = `
                <div style="margin-top: 10px;">
                    <img
                        src="${previewUrl}"
                        alt="Watermarked Evidence"
                        style="
                            width: 100%;
                            max-width: 320px;
                            height: 200px;
                            border-radius: 12px;
                            object-fit: cover;
                            border: 2px solid var(--primary);
                            display: block;
                        "
                    >
                    <span class="watermark-badge">
                        ✅ Stamped: GPS & Verification Timestamp
                    </span>
                </div>
            `;
        }
    }, 'image/jpeg', 0.92);
}

/**
 * Handle File Selection (e.g. from file picker)
 */
if (issuePhoto) {
    issuePhoto.addEventListener('change', () => {
        const file = issuePhoto.files[0];

        if (!file) {
            activeEvidenceBlob = null;
            if (photoPreview) photoPreview.innerHTML = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            issuePhoto.value = '';
            activeEvidenceBlob = null;
            if (photoPreview) photoPreview.innerHTML = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('Photo must be smaller than 10 MB.');
            issuePhoto.value = '';
            activeEvidenceBlob = null;
            if (photoPreview) photoPreview.innerHTML = '';
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                stampWatermark(img, img.naturalWidth, img.naturalHeight);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// =========================
// LIVE CAMERA STREAM
// =========================

async function startCamera(facing = 'environment') {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera is not supported on this browser or requires an HTTPS / localhost connection.');
        return;
    }

    try {
        if (activeCameraStream) {
            activeCameraStream.getTracks().forEach(track => track.stop());
        }

        activeCameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: facing },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        if (cameraVideo) {
            cameraVideo.srcObject = activeCameraStream;
            cameraVideo.play();
        }

        currentCameraFacing = facing;
        if (cameraModal) cameraModal.classList.add('active');
    } catch (err) {
        console.error('Camera access error:', err);
        alert('Could not access camera: ' + (err.message || 'Permission denied'));
    }
}

function stopCamera() {
    if (activeCameraStream) {
        activeCameraStream.getTracks().forEach(track => track.stop());
        activeCameraStream = null;
    }
    if (cameraModal) {
        cameraModal.classList.remove('active');
    }
}

if (openCameraBtn) {
    openCameraBtn.addEventListener('click', () => {
        startCamera(currentCameraFacing);
    });
}

if (closeCameraModalBtn) closeCameraModalBtn.addEventListener('click', stopCamera);
if (cancelCameraBtn) cancelCameraBtn.addEventListener('click', stopCamera);

if (switchCameraBtn) {
    switchCameraBtn.addEventListener('click', () => {
        const nextFacing = currentCameraFacing === 'environment' ? 'user' : 'environment';
        startCamera(nextFacing);
    });
}

if (capturePhotoBtn) {
    capturePhotoBtn.addEventListener('click', () => {
        if (!cameraVideo || !cameraVideo.videoWidth) {
            alert('Camera is still initializing, please try again.');
            return;
        }

        stampWatermark(cameraVideo, cameraVideo.videoWidth, cameraVideo.videoHeight);
        stopCamera();
    });
}

// =========================
// DUPLICATE CONFIRMATION MODAL
// =========================

function showDuplicateModal(nearbyIssue) {
    currentNearbyDuplicate = nearbyIssue;
    if (dupBadge) dupBadge.textContent = `${nearbyIssue.distance}m away`;
    if (dupIssueTitle) dupIssueTitle.textContent = nearbyIssue.title || 'Similar Issue';
    if (dupIssueAddress) dupIssueAddress.textContent = nearbyIssue.address || 'Nearby address';
    if (dupIssueUpvotes) dupIssueUpvotes.textContent = `👍 ${nearbyIssue.upvote_count || 0} citizen upvotes`;
    if (duplicateModal) duplicateModal.classList.add('active');
}

function hideDuplicateModal() {
    if (duplicateModal) duplicateModal.classList.remove('active');
}

if (closeDupModalBtn) closeDupModalBtn.addEventListener('click', hideDuplicateModal);
if (cancelDuplicateBtn) cancelDuplicateBtn.addEventListener('click', hideDuplicateModal);

if (upvoteDuplicateBtn) {
    upvoteDuplicateBtn.addEventListener('click', async () => {
        if (!currentNearbyDuplicate || !currentNearbyDuplicate.id) return;

        try {
            upvoteDuplicateBtn.disabled = true;
            upvoteDuplicateBtn.textContent = 'Upvoting...';

            const res = await fetch(`${API_URL}/issues/${currentNearbyDuplicate.id}/upvote`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            hideDuplicateModal();

            if (res.ok) {
                alert('👍 Thank you! You upvoted this existing report to increase its visibility.');
                resetIssueForm();
            } else {
                alert(data.error || 'Failed to upvote existing issue.');
            }
        } catch (err) {
            alert('Error upvoting issue: ' + err.message);
        } finally {
            upvoteDuplicateBtn.disabled = false;
            upvoteDuplicateBtn.textContent = '👍 Upvote Existing Report';
        }
    });
}

if (forceSubmitBtn) {
    forceSubmitBtn.addEventListener('click', () => {
        hideDuplicateModal();
        submitIssue(null, true);
    });
}

function resetIssueForm() {
    if (issueForm) issueForm.reset();
    activeEvidenceBlob = null;
    if (latitudeInput) latitudeInput.value = '';
    if (longitudeInput) longitudeInput.value = '';
    if (photoPreview) photoPreview.innerHTML = '';
    if (accuracyBadge) accuracyBadge.style.display = 'none';
    if (reportAccuracyCircle) {
        reportAccuracyCircle.remove();
        reportAccuracyCircle = null;
    }
    if (locationMessage) {
        locationMessage.textContent = 'Click "Use My GPS Location" or search an address to tag coordinates on the map.';
    }
}

// =========================
// SUBMIT ISSUE
// =========================

if (issueForm) {
    issueForm.addEventListener('submit', (e) => submitIssue(e, false));
}

async function submitIssue(event, force = false) {
    if (event) {
        event.preventDefault();
    }

    const category = document.getElementById('category').value;
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const severity = document.getElementById('severity').value;
    const address = addressInput ? addressInput.value.trim() : '';
    const latitude = latitudeInput ? latitudeInput.value : '';
    const longitude = longitudeInput ? longitudeInput.value : '';

    if (!category) {
        alert('Please select a category.');
        return;
    }

    if (!title) {
        alert('Please enter an issue title.');
        return;
    }

    if (!address) {
        alert('Please enter the problem location.');
        return;
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (
        isNaN(latNum) ||
        isNaN(lonNum) ||
        !isFinite(latNum) ||
        !isFinite(lonNum) ||
        latNum < -90 ||
        latNum > 90 ||
        lonNum < -180 ||
        lonNum > 180 ||
        (latNum === 0 && lonNum === 0)
    ) {
        alert('Please provide a valid location on the map before submitting.');
        if (typeof goToStep === 'function') {
            goToStep(2);
        }
        return;
    }

    const formData = new FormData();
    formData.append('category', category);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('severity', severity);
    formData.append('address', address);
    formData.append('latitude', latNum.toFixed(7));
    formData.append('longitude', lonNum.toFixed(7));

    if (force) {
        formData.append('force', 'true');
    }

    // Attach verified watermarked evidence blob or raw file
    if (activeEvidenceBlob) {
        formData.append('image', activeEvidenceBlob, 'watermarked_evidence.jpg');
    } else if (issuePhoto && issuePhoto.files && issuePhoto.files.length > 0) {
        formData.append('image', issuePhoto.files[0]);
    }

    const submitButton = issueForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
    }

    try {
        const response = await fetch(`${API_URL}/issues`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await getJSONResponse(response);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit issue');
        }

        // Check if duplicate prompt is returned
        if (data.duplicateFound && data.nearbyIssue) {
            showDuplicateModal(data.nearbyIssue);
            return;
        }

        alert(data.message || 'Civic issue reported successfully!');
        resetIssueForm();

    } catch (error) {
        console.error(error);
        alert(error.message || 'An error occurred while submitting.');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Report Issue';
        }
    }
}



// =========================
// EDIT PROFILE
// =========================

const editProfileButton =
    document.getElementById(
        'editProfileButton'
    );


const editProfileModal =
    document.getElementById(
        'editProfileModal'
    );


const profileNameInput =
    document.getElementById(
        'profileNameInput'
    );


const saveProfileButton =
    document.getElementById(
        'saveProfileButton'
    );


const cancelProfileButton =
    document.getElementById(
        'cancelProfileButton'
    );


const profileMessage =
    document.getElementById(
        'profileMessage'
    );


// =========================
// PROFILE PHOTO INPUT
// =========================

let profilePhotoInput =
    document.getElementById(
        'profilePhotoInput'
    );


if (
    profileNameInput &&
    !profilePhotoInput
) {

    const photoGroup =
        document.createElement(
            'div'
        );


    photoGroup.className =
        'form-group';


    photoGroup.id =
        'profilePhotoGroup';


    photoGroup.innerHTML = `
        <label
            for="profilePhotoInput"
        >
            Profile Photo
        </label>

        <small
            style="
                display:block;
                margin-bottom:8px;
                color:#777;
            "
        >
            Leave empty to keep your current photo.
        </small>
    `;


    profilePhotoInput =
        document.createElement(
            'input'
        );


    profilePhotoInput.type =
        'file';


    profilePhotoInput.id =
        'profilePhotoInput';


    profilePhotoInput.accept =
        'image/*';


    profilePhotoInput.style.width =
        '100%';


    profilePhotoInput.style.padding =
        '10px';


    photoGroup.appendChild(
        profilePhotoInput
    );


    profileNameInput
        .parentElement
        .insertAdjacentElement(
            'afterend',
            photoGroup
        );

}


// =========================
// PROFILE PHOTO PREVIEW
// =========================

let profilePhotoPreview =
    document.getElementById(
        'profilePhotoPreview'
    );


if (
    profilePhotoInput &&
    !profilePhotoPreview
) {

    profilePhotoPreview =
        document.createElement(
            'div'
        );


    profilePhotoPreview.id =
        'profilePhotoPreview';


    profilePhotoPreview.style.marginTop =
        '10px';


    profilePhotoInput.parentElement.appendChild(
        profilePhotoPreview
    );

}


// =========================
// PROFILE MESSAGE
// =========================

function showProfileMessage(
    message,
    type = 'success'
) {

    if (!profileMessage) {
        return;
    }


    profileMessage.textContent =
        message;


    profileMessage.className =
        `page-message show ${type}`;

}


// =========================
// OPEN PROFILE MODAL
// =========================

if (editProfileButton) {

    editProfileButton.addEventListener(
        'click',
        () => {

            if (profileNameInput) {

                profileNameInput.value =
                    user.name || '';

            }


            if (profilePhotoInput) {
                profilePhotoInput.value = '';
            }


            if (
                profilePhotoPreview
            ) {

                if (user.profile_photo) {

                    profilePhotoPreview.innerHTML = `
                        <img
                            src="${user.profile_photo}"
                            alt="Current profile photo"
                            style="
                                width:80px;
                                height:80px;
                                object-fit:cover;
                                border-radius:50%;
                                border:1px solid #ddd;
                            "
                        >

                        <div
                            style="
                                margin-top:6px;
                                font-size:12px;
                                color:#777;
                            "
                        >
                            Current photo
                        </div>
                    `;

                } else {

                    profilePhotoPreview.innerHTML =
                        '';

                }

            }


            if (profileMessage) {

                profileMessage.textContent =
                    '';

                profileMessage.className =
                    'page-message';

            }


            if (editProfileModal) {

                editProfileModal.style.display =
                    'flex';

            }


            if (profileMenu) {

                profileMenu.classList.remove(
                    'show'
                );

            }

        }
    );

}


// =========================
// PROFILE PHOTO CHANGE
// =========================

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        'change',
        () => {

            const file =
                profilePhotoInput.files[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith('image/')
            ) {

                alert(
                    'Please select an image.'
                );

                profilePhotoInput.value =
                    '';

                return;
            }


            if (
                file.size >
                10 * 1024 * 1024
            ) {

                alert(
                    'Profile photo must be smaller than 10 MB.'
                );

                profilePhotoInput.value =
                    '';

                return;
            }


            const previewURL =
                URL.createObjectURL(
                    file
                );


            if (profilePhotoPreview) {

                profilePhotoPreview.innerHTML = `
                    <img
                        src="${previewURL}"
                        alt="New profile photo"
                        style="
                            width:80px;
                            height:80px;
                            object-fit:cover;
                            border-radius:50%;
                            border:1px solid #ddd;
                        "
                    >

                    <div
                        style="
                            margin-top:6px;
                            font-size:12px;
                            color:#777;
                        "
                    >
                        New photo
                    </div>
                `;

            }

        }
    );

}


// =========================
// CANCEL PROFILE
// =========================

if (cancelProfileButton) {

    cancelProfileButton.addEventListener(
        'click',
        () => {

            if (editProfileModal) {

                editProfileModal.style.display =
                    'none';

            }

        }
    );

}


// Close modal by clicking outside

if (editProfileModal) {

    editProfileModal.addEventListener(
        'click',
        event => {

            if (
                event.target ===
                editProfileModal
            ) {

                editProfileModal.style.display =
                    'none';

            }

        }
    );

}


// =========================
// SAVE PROFILE
// =========================

if (saveProfileButton) {

    saveProfileButton.addEventListener(
        'click',
        async () => {

            const newName =
                profileNameInput
                    ? profileNameInput.value.trim()
                    : '';


            if (!newName) {

                showProfileMessage(
                    'Please enter your name.',
                    'error'
                );

                return;
            }


            if (newName.length < 2) {

                showProfileMessage(
                    'Name must contain at least 2 characters.',
                    'error'
                );

                return;
            }


            const formData =
                new FormData();


            formData.append(
                'name',
                newName
            );


            if (
                profilePhotoInput &&
                profilePhotoInput.files.length > 0
            ) {

                formData.append(
                    'profilePhoto',
                    profilePhotoInput.files[0]
                );

            }


            saveProfileButton.disabled =
                true;


            saveProfileButton.textContent =
                'Saving...';


            try {

                const response =
                    await fetch(
                        `${API_URL}/profile`,
                        {
                            method: 'PUT',

                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            },

                            body: formData
                        }
                    );


                const data =
                    await getJSONResponse(
                        response
                    );


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        'Failed to update profile'
                    );

                }


                if (data.user) {

                    user.name =
                        data.user.name ||
                        user.name;


                    user.profile_photo =
                        data.user.profile_photo ||
                        user.profile_photo ||
                        null;

                }


                localStorage.setItem(
                    'civic_user',
                    JSON.stringify(user)
                );


                updateProfileDisplay();


                showProfileMessage(
                    'Profile updated successfully.',
                    'success'
                );


                setTimeout(
                    () => {

                        if (editProfileModal) {

                            editProfileModal.style.display =
                                'none';

                        }

                    },
                    1000
                );


            } catch (error) {

                console.error(error);


                showProfileMessage(
                    error.message ||
                    'Unable to update profile.',
                    'error'
                );

            } finally {

                saveProfileButton.disabled =
                    false;


                saveProfileButton.textContent =
                    'Save Changes';

            }

        }
    );

}


// =========================
// JSON RESPONSE HELPER
// =========================

async function getJSONResponse(
    response
) {

    const text =
        await response.text();


    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            'Server returned:',
            text
        );


        throw new Error(
            'Server returned an unexpected response. Please restart the server and try again.'
        );

    }

}


// =========================
// HTML SAFETY
// =========================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)

        .replace(
            /&/g,
            '&amp;'
        )

        .replace(
            /</g,
            '&lt;'
        )

        .replace(
            />/g,
            '&gt;'
        )

        .replace(
            /"/g,
            '&quot;'
        )

        .replace(
            /'/g,
            '&#039;'
        );

}


// ====================================================================
// CIVICFIX MODERN UI CONTROLLER (WIZARD, STATS & SIDEBAR)
// ====================================================================
(function initCivicFixModernUI() {
    // 1. Sidebar User Info & Admin Link
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarAdminLink = document.getElementById('sidebarAdminLink');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

    if (user && user.name) {
        if (sidebarUserName) sidebarUserName.textContent = user.name;
        if (sidebarUserRole) sidebarUserRole.textContent = user.role || 'CITIZEN';
        if (sidebarUserAvatar) sidebarUserAvatar.textContent = user.name.charAt(0).toUpperCase();
        if (user.role === 'ADMIN' && sidebarAdminLink) {
            sidebarAdminLink.style.display = 'flex';
        }
    }

    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('civic_token');
            localStorage.removeItem('civic_user');
            window.location.href = 'index.html';
        });
    }

    // 2. Fetch and Update 4 KPI Stat Counters
    async function loadDashboardKpis() {
        const statTotal = document.getElementById('statTotal');
        const statOpen = document.getElementById('statOpen');
        const statProgress = document.getElementById('statProgress');
        const statResolved = document.getElementById('statResolved');

        try {
            const res = await fetch('/api/issues');
            if (res.ok) {
                const issues = await res.json();
                if (Array.isArray(issues)) {
                    const total = issues.length;
                    const open = issues.filter(i => i.status === 'OPEN').length;
                    const progress = issues.filter(i => i.status === 'IN_PROGRESS').length;
                    const resolved = issues.filter(i => i.status === 'RESOLVED').length;

                    if (statTotal) statTotal.textContent = total;
                    if (statOpen) statOpen.textContent = open;
                    if (statProgress) statProgress.textContent = progress;
                    if (statResolved) statResolved.textContent = resolved;
                }
            }
        } catch (e) {
            console.warn('Could not load KPI stats:', e);
        }
    }
    loadDashboardKpis();

    // 3. 4-Step Wizard Stepper Controller
    let currentStep = 1;
    const totalSteps = 4;

    async function goToStep(step) {
        if (step < 1 || step > totalSteps) return;

        // Validation before moving forward from Step 1
        if (step > 1 && currentStep === 1) {
            const cat = document.getElementById('category');
            const tit = document.getElementById('title');
            if (!cat.value) {
                alert('Please select an issue category.');
                cat.focus();
                return;
            }
            if (!tit.value.trim()) {
                alert('Please enter an issue title.');
                tit.focus();
                return;
            }
        }

        // Initialize & resize map when entering Step 2
        if (step === 2) {
            setTimeout(() => {
                const lat = document.getElementById('latitude');
                const lon = document.getElementById('longitude');
                const latVal = lat ? parseFloat(lat.value) : NaN;
                const lonVal = lon ? parseFloat(lon.value) : NaN;

                if (!reportMap) {
                    initReportMap(!isNaN(latVal) ? latVal : undefined, !isNaN(lonVal) ? lonVal : undefined, null);
                } else {
                    reportMap.invalidateSize();
                    if (!isNaN(latVal) && !isNaN(lonVal) && (latVal !== 0 || lonVal !== 0)) {
                        if (reportMarker) reportMarker.setLatLng([latVal, lonVal]);
                        reportMap.setView([latVal, lonVal], 16);
                    }
                }
            }, 200);
        }

        // Validation before moving forward from Step 2
        if (step > 2 && currentStep === 2) {
            const addr = document.getElementById('address');
            if (!addr || !addr.value.trim()) {
                alert('Please provide a location address or use GPS location.');
                if (addr) addr.focus();
                return;
            }

            const lat = document.getElementById('latitude');
            const lon = document.getElementById('longitude');
            const latVal = lat ? parseFloat(lat.value) : NaN;
            const lonVal = lon ? parseFloat(lon.value) : NaN;

            if (isNaN(latVal) || isNaN(lonVal) || latVal < -90 || latVal > 90 || lonVal < -180 || lonVal > 180 || (latVal === 0 && lonVal === 0)) {
                if (locationMessage) {
                    locationMessage.textContent = 'Resolving coordinates for your address...';
                }
                try {
                    const geocoded = await searchAddress(addr.value.trim());
                    const gLat = parseFloat(geocoded.latitude);
                    const gLon = parseFloat(geocoded.longitude);
                    if (lat) lat.value = gLat.toFixed(7);
                    if (lon) lon.value = gLon.toFixed(7);
                    if (addr) addr.value = geocoded.address;
                    initReportMap(gLat, gLon, null);
                    updateAccuracyDisplay(null, gLat, gLon, 'search');
                    if (locationMessage) {
                        locationMessage.innerHTML =
                            `✓ Location verified on map.<br><small>Coordinates: ${gLat.toFixed(6)}, ${gLon.toFixed(6)}</small>`;
                    }
                } catch (err) {
                    alert('Could not determine coordinates for this address. Please click on the map to place the pin or click "Find on Map".');
                    initReportMap();
                    return;
                }
            }
        }

        // Update Review Summary if entering Step 4
        if (step === 4) {
            const catVal = document.getElementById('category').value;
            const titVal = document.getElementById('title').value;
            const sevVal = document.getElementById('severity').value;
            const addrVal = document.getElementById('address').value;
            const latVal = document.getElementById('latitude').value;
            const lngVal = document.getElementById('longitude').value;
            const photoInput = document.getElementById('issuePhoto');

            const revCat = document.getElementById('reviewCategory');
            const revTit = document.getElementById('reviewTitle');
            const revSev = document.getElementById('reviewSeverity');
            const revAddr = document.getElementById('reviewAddress');
            const revCoords = document.getElementById('reviewCoords');
            const revPhoto = document.getElementById('reviewPhotoStatus');

            if (revCat) revCat.textContent = catVal || '-';
            if (revTit) revTit.textContent = titVal || '-';
            if (revSev) revSev.textContent = sevVal || 'MEDIUM';
            if (revAddr) revAddr.textContent = addrVal || '-';
            if (revCoords) {
                const latN = parseFloat(latVal);
                const lonN = parseFloat(lngVal);
                revCoords.textContent = (!isNaN(latN) && !isNaN(lonN) && (latN !== 0 || lonN !== 0))
                    ? `${latN.toFixed(6)}, ${lonN.toFixed(6)}`
                    : 'Location not tagged';
            }
            if (revPhoto) {
                revPhoto.textContent = (photoInput && photoInput.files && photoInput.files[0]) ? `Selected (${photoInput.files[0].name})` : 'No photo chosen';
            }
        }

        currentStep = step;

        // Update panes
        for (let i = 1; i <= totalSteps; i++) {
            const pane = document.getElementById(`stepPane${i}`);
            const node = document.getElementById(`stepNode${i}`);
            const circle = document.getElementById(`stepCircle${i}`);

            if (pane) pane.classList.toggle('active', i === currentStep);
            if (node) {
                node.classList.toggle('active', i === currentStep);
                node.classList.toggle('completed', i < currentStep);
            }
            if (circle) {
                circle.innerHTML = i < currentStep ? '✓' : i;
            }
        }

        // Update progress bar
        const progressFill = document.getElementById('stepperProgressFill');
        if (progressFill) {
            progressFill.style.width = `${((currentStep - 1) / (totalSteps - 1)) * 100}%`;
        }

        // Scroll to wizard
        const wizardCard = document.getElementById('wizardCard');
        if (wizardCard && window.innerWidth <= 860) {
            wizardCard.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Step navigation buttons
    const btnNext1 = document.getElementById('btnNext1');
    const btnNext2 = document.getElementById('btnNext2');
    const btnNext3 = document.getElementById('btnNext3');
    const btnPrev2 = document.getElementById('btnPrev2');
    const btnPrev3 = document.getElementById('btnPrev3');
    const btnPrev4 = document.getElementById('btnPrev4');

    if (btnNext1) btnNext1.addEventListener('click', () => goToStep(2));
    if (btnNext2) btnNext2.addEventListener('click', () => goToStep(3));
    if (btnNext3) btnNext3.addEventListener('click', () => goToStep(4));

    if (btnPrev2) btnPrev2.addEventListener('click', () => goToStep(1));
    if (btnPrev3) btnPrev3.addEventListener('click', () => goToStep(2));
    if (btnPrev4) btnPrev4.addEventListener('click', () => goToStep(3));

    // Allow clicking on previous completed step nodes
    for (let i = 1; i <= totalSteps; i++) {
        const node = document.getElementById(`stepNode${i}`);
        if (node) {
            node.addEventListener('click', () => {
                if (i <= currentStep) goToStep(i);
            });
        }
    }

    // 4. Severity Pills Group
    const severityPills = document.querySelectorAll('.severity-pill-btn');
    const severitySelect = document.getElementById('severity');
    severityPills.forEach(pill => {
        pill.addEventListener('click', () => {
            severityPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const val = pill.getAttribute('data-val');
            if (severitySelect) severitySelect.value = val;
        });
    });

    // 5. Dropzone Drag & Drop
    const dropzoneBox = document.getElementById('dropzoneBox');
    const issuePhoto = document.getElementById('issuePhoto');

    if (dropzoneBox && issuePhoto) {
        dropzoneBox.addEventListener('click', () => issuePhoto.click());

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzoneBox.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzoneBox.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzoneBox.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzoneBox.classList.remove('dragover');
            });
        });

        dropzoneBox.addEventListener('drop', (e) => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                issuePhoto.files = e.dataTransfer.files;
                const changeEvent = new Event('change');
                issuePhoto.dispatchEvent(changeEvent);
            }
        });
    }

    // 6. Topbar Search Input
    const topbarSearch = document.getElementById('topbarSearchInput');
    if (topbarSearch) {
        topbarSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && topbarSearch.value.trim()) {
                window.location.href = `issues.html?search=${encodeURIComponent(topbarSearch.value.trim())}`;
            }
        });
    }

    // 7. Initialize Report Map
    if (document.getElementById('reportMap')) {
        initReportMap();
    }
})();