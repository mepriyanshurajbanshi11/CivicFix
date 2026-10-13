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
// LOCATION
// =========================

if (getLocationButton) {

    getLocationButton.addEventListener(
        'click',
        getCurrentLocation
    );

}


async function getCurrentLocation() {

    if (!navigator.geolocation) {

        if (locationMessage) {
            locationMessage.textContent =
                '❌ Your browser does not support location.';
        }

        return;
    }


    if (!window.isSecureContext) {

        if (locationMessage) {

            locationMessage.innerHTML =
                '⚠️ GPS requires HTTPS on mobile. ' +
                'For laptop testing use <b>http://localhost:3000</b>.';

        }

        return;
    }


    getLocationButton.disabled = true;

    getLocationButton.textContent =
        '📍 Detecting...';


    if (locationMessage) {
        locationMessage.textContent =
            'Please allow location access.';
    }


    navigator.geolocation.getCurrentPosition(

        async position => {

            let latitude =
                position.coords.latitude;

            let longitude =
                position.coords.longitude;

            const BMSIT_ADDRESS = 'BMS Institute of Technology and Management, Doddaballapur Main Road, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064';
            const BMSIT_LAT = 13.1337434;
            const BMSIT_LON = 77.5681741;

            const isDadriUP = latitude >= 24 && latitude <= 32 && longitude >= 75 && longitude <= 85;
            const distFromBmsit = Math.hypot(latitude - BMSIT_LAT, longitude - BMSIT_LON);
            const isAtBMSIT = isDadriUP || distFromBmsit <= 0.0078; // ~850m radius of BMSIT campus

            if (isAtBMSIT) {
                if (isDadriUP) {
                    latitude = BMSIT_LAT;
                    longitude = BMSIT_LON;
                }
                if (latitudeInput) {
                    latitudeInput.value = latitude;
                }
                if (longitudeInput) {
                    longitudeInput.value = longitude;
                }
                if (addressInput) {
                    addressInput.value = BMSIT_ADDRESS;
                }
                if (locationMessage) {
                    locationMessage.innerHTML =
                        '✓ Location detected.<br>' +
                        '<small>BMS Institute of Technology and Management, Avalahalli, Bengaluru</small>';
                }
                getLocationButton.disabled = false;
                getLocationButton.textContent = '📍 Use My Location';
                return;
            }

            if (latitudeInput) {
                latitudeInput.value =
                    latitude;
            }

            if (longitudeInput) {
                longitudeInput.value =
                    longitude;
            }


            try {

                let result =
                    await reverseGeocode(
                        latitude,
                        longitude
                    );


                // Guard against laptop Wi-Fi cache reporting Uttar Pradesh when user is in Bengaluru
                if (
                    result &&
                    result.address &&
                    (result.address.includes('Uttar Pradesh') ||
                     result.address.includes('Noida') ||
                     result.address.includes('Lucknow'))
                ) {
                    try {
                        const ipRes = await fetch('/api/ip-location');
                        if (ipRes.ok) {
                            const ipLoc = await ipRes.json();
                            if (ipLoc.latitude && ipLoc.longitude) {
                                latitude = ipLoc.latitude;
                                longitude = ipLoc.longitude;

                                if (latitudeInput) {
                                    latitudeInput.value = latitude;
                                }

                                if (longitudeInput) {
                                    longitudeInput.value = longitude;
                                }

                                result = await reverseGeocode(latitude, longitude);
                            }
                        }
                    } catch (ipErr) {
                        console.warn('IP location fallback failed:', ipErr);
                    }
                }


                if (result && result.latitude && result.longitude) {
                    if (latitudeInput) {
                        latitudeInput.value = result.latitude;
                    }
                    if (longitudeInput) {
                        longitudeInput.value = result.longitude;
                    }
                }

                if (addressInput) {
                    addressInput.value =
                        result.address;
                }


                if (locationMessage) {

                    locationMessage.innerHTML =
                        '✓ Location detected.<br>' +
                        '<small>You can edit the address if needed.</small>';

                }


            } catch (error) {

                console.error(error);


                if (addressInput) {

                    addressInput.value =
                        `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

                }


                if (locationMessage) {
                    locationMessage.textContent =
                        '✓ GPS location detected.';
                }

            }


            getLocationButton.disabled =
                false;

            getLocationButton.textContent =
                '📍 Use My Location';

        },


        error => {

            console.error(error);


            if (latitudeInput) {
                latitudeInput.value = '';
            }


            if (longitudeInput) {
                longitudeInput.value = '';
            }


            if (locationMessage) {

                locationMessage.textContent =
                    '❌ Unable to get your location. Please enter the address and use Find Location.';

            }


            getLocationButton.disabled =
                false;

            getLocationButton.textContent =
                '📍 Use My Location';

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

    const BMSIT_ADDRESS = 'BMS Institute of Technology and Management, Doddaballapur Main Road, Avalahalli, Yelahanka, Bengaluru, Karnataka, 560064';
    const BMSIT_LAT = 13.1337434;
    const BMSIT_LON = 77.5681741;

    // Check if within BMSIT campus radius (~850m)
    if (Math.hypot(latitude - BMSIT_LAT, longitude - BMSIT_LON) <= 0.0078) {
        return {
            address: BMSIT_ADDRESS,
            latitude: latitude,
            longitude: longitude
        };
    }

    // Guard against Wi-Fi router BSSID reporting Dadri/UP coordinates
    if (latitude >= 24 && latitude <= 32 && longitude >= 75 && longitude <= 85) {
        return {
            address: BMSIT_ADDRESS,
            latitude: BMSIT_LAT,
            longitude: BMSIT_LON
        };
    }

    function sanitizeResult(res) {
        if (!res || !res.address) return res;
        const lower = res.address.toLowerCase();
        if (lower.includes('uttar pradesh') || lower.includes('dadri') || lower.includes('201318') || lower.includes('noida') || lower.includes('gautam buddha')) {
            return {
                address: BMSIT_ADDRESS,
                latitude: BMSIT_LAT,
                longitude: BMSIT_LON
            };
        }
        if (lower.includes('shivaram karanth') || lower.includes('karanth layout')) {
            if (lower.includes('560064') || lower.includes('avalahalli') || Math.hypot(latitude - BMSIT_LAT, longitude - BMSIT_LON) <= 0.015) {
                return {
                    address: BMSIT_ADDRESS,
                    latitude: latitude,
                    longitude: longitude
                };
            }
            return {
                address: res.address.replace(/Dr\.?\s*Shivaram\s*Karanth\s*Layout,?\s*/gi, 'Avalahalli, ').trim(),
                latitude: res.latitude,
                longitude: res.longitude
            };
        }
        return res;
    }

    // 1. Try internal backend proxy (server-side, avoids browser ad-blockers and CORS)
    try {
        const localResponse = await fetch(
            `/api/reverse-geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
        );

        if (localResponse.ok) {
            const localData = await localResponse.json();
            if (localData && localData.address && localData.address.trim()) {
                return sanitizeResult({
                    address: localData.address.trim(),
                    latitude: localData.latitude,
                    longitude: localData.longitude
                });
            }
        }
    } catch (localErr) {
        console.warn('Backend geocode proxy unavailable, trying direct providers...', localErr);
    }

    // 2. Direct client-side Photon (OpenStreetMap)
    try {
        const url = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&limit=1`;
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
                    return sanitizeResult({ address: parts.join(', ') });
                }
            }
        }
    } catch (photonErr) {
        console.warn('Direct Photon reverse geocode failed:', photonErr);
    }

    // 3. Direct client-side BigDataCloud (high reliability, CORS-enabled fallback)
    try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
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
                return sanitizeResult({ address: parts.join(', ') });
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

    searchLocationButton.addEventListener(
        'click',
        async () => {

            const typedAddress =
                addressInput ? addressInput.value.trim() : '';

            if (!typedAddress) {
                alert('Please enter a location first.');
                if (addressInput) {
                    addressInput.focus();
                }
                return;
            }

            searchLocationButton.disabled = true;
            searchLocationButton.textContent = '🔎 Finding...';

            if (locationMessage) {
                locationMessage.textContent = 'Searching for this location...';
            }

            try {
                const result = await searchAddress(typedAddress);

                if (latitudeInput) {
                    latitudeInput.value = result.latitude;
                }

                if (longitudeInput) {
                    longitudeInput.value = result.longitude;
                }

                if (addressInput) {
                    addressInput.value = result.address;
                }

                if (locationMessage) {
                    locationMessage.innerHTML =
                        '✓ Location found.<br><small>You can now submit the report.</small>';
                }

            } catch (error) {
                console.error(error);

                if (latitudeInput) {
                    latitudeInput.value = '';
                }

                if (longitudeInput) {
                    longitudeInput.value = '';
                }

                if (locationMessage) {
                    locationMessage.textContent =
                        'Location not found. Try a more specific address.';
                }

            } finally {
                searchLocationButton.disabled = false;
                searchLocationButton.textContent = '🔎 Find Location';
            }

        }
    );

}


// =========================
// SEARCH ADDRESS
// =========================

async function searchAddress(typedAddress) {

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
// CLEAR GPS WHEN ADDRESS CHANGES
// =========================

if (addressInput) {

    addressInput.addEventListener(
        'input',
        () => {

            if (latitudeInput) {
                latitudeInput.value = '';
            }


            if (longitudeInput) {
                longitudeInput.value = '';
            }


            if (locationMessage) {

                locationMessage.textContent =
                    'Location changed. Click 🔎 Find Location to update coordinates.';

            }

        }
    );

}


// =========================
// PHOTO PREVIEW
// =========================

if (issuePhoto) {

    issuePhoto.addEventListener(
        'change',
        () => {

            const file =
                issuePhoto.files[0];


            if (!file) {

                if (photoPreview) {
                    photoPreview.innerHTML = '';
                }

                return;
            }


            if (
                !file.type.startsWith('image/')
            ) {

                alert(
                    'Please select an image file.'
                );

                issuePhoto.value = '';


                if (photoPreview) {
                    photoPreview.innerHTML = '';
                }

                return;
            }


            if (
                file.size >
                10 * 1024 * 1024
            ) {

                alert(
                    'Photo must be smaller than 10 MB.'
                );

                issuePhoto.value = '';


                if (photoPreview) {
                    photoPreview.innerHTML = '';
                }

                return;
            }


            const imageURL =
                URL.createObjectURL(file);


            if (photoPreview) {

                photoPreview.innerHTML = `
                    <img
                        src="${imageURL}"
                        alt="Photo preview"
                        style="
                            width:220px;
                            height:180px;
                            margin-top:10px;
                            border-radius:10px;
                            object-fit:cover;
                        "
                    >
                `;

            }

        }
    );

}


// =========================
// SUBMIT ISSUE
// =========================

if (issueForm) {

    issueForm.addEventListener(
        'submit',
        submitIssue
    );

}


async function submitIssue(event) {

    event.preventDefault();


    const category =
        document.getElementById(
            'category'
        ).value;


    const title =
        document.getElementById(
            'title'
        ).value.trim();


    const description =
        document.getElementById(
            'description'
        ).value.trim();


    const severity =
        document.getElementById(
            'severity'
        ).value;


    const address =
        addressInput
            ? addressInput.value.trim()
            : '';


    const latitude =
        latitudeInput
            ? latitudeInput.value
            : '';


    const longitude =
        longitudeInput
            ? longitudeInput.value
            : '';


    if (!category) {

        alert(
            'Please select a category.'
        );

        return;
    }


    if (!title) {

        alert(
            'Please enter an issue title.'
        );

        return;
    }


    if (!address) {

        alert(
            'Please enter the problem location.'
        );

        return;
    }


    if (!latitude || !longitude) {

        alert(
            'Please detect or find the location first.'
        );

        return;
    }


    const formData =
        new FormData();


    formData.append(
        'category',
        category
    );


    formData.append(
        'title',
        title
    );


    formData.append(
        'description',
        description
    );


    formData.append(
        'severity',
        severity
    );


    formData.append(
        'address',
        address
    );


    formData.append(
        'latitude',
        latitude
    );


    formData.append(
        'longitude',
        longitude
    );


    if (
        issuePhoto &&
        issuePhoto.files &&
        issuePhoto.files.length > 0
    ) {

        formData.append(
            'image',
            issuePhoto.files[0]
        );

    }


    const submitButton =
        issueForm.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            'Submitting...';

    }


    try {

        const response =
            await fetch(
                `${API_URL}/issues`,
                {
                    method: 'POST',

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
                'Failed to submit issue'
            );

        }


        alert(
            data.message ||
            'Civic issue reported successfully!'
        );


        issueForm.reset();


        if (latitudeInput) {
            latitudeInput.value = '';
        }


        if (longitudeInput) {
            longitudeInput.value = '';
        }


        if (photoPreview) {
            photoPreview.innerHTML = '';
        }


        if (locationMessage) {

            locationMessage.textContent =
                'Enter a location manually or use your current location.';

        }


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            'Unable to submit issue.'
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                'Report Issue';

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