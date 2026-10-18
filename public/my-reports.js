const token =
    localStorage.getItem('civic_token');

const user =
    JSON.parse(
        localStorage.getItem('civic_user') || '{}'
    );


if (!token) {
    window.location.href = '/';
}

if (user && user.role === 'ADMIN') {
    window.location.href = '/admin.html';
}


// =========================
// PROFILE
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


if (profileName) {
    profileName.textContent =
        user.name || 'Citizen';
}


if (profileEmail) {
    profileEmail.textContent =
        user.email || '';
}


if (profileRole) {
    profileRole.textContent =
        user.role || 'CITIZEN';
}


if (profileInitial) {
    profileInitial.textContent =
        (user.name || 'C')
            .charAt(0)
            .toUpperCase();
}

const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserRole = document.getElementById('sidebarUserRole');
const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
const sidebarAdminLink = document.getElementById('sidebarAdminLink');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

if (sidebarUserName) sidebarUserName.textContent = user.name || 'Citizen';
if (sidebarUserRole) sidebarUserRole.textContent = user.role || 'CITIZEN';
if (sidebarUserAvatar) sidebarUserAvatar.textContent = (user.name || 'C').charAt(0).toUpperCase();

if (user.role === 'ADMIN' && sidebarAdminLink) {
    sidebarAdminLink.style.display = 'flex';
}

if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('civic_token');
        localStorage.removeItem('civic_user');
        window.location.href = '/';
    });
}


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

            profileMenu?.classList.remove(
                'show'
            );

        }

    }
);


// =========================
// NAVIGATION
// =========================

document
    .getElementById('dashboardButton')
    ?.addEventListener(
        'click',
        () => {

            window.location.href =
                '/dashboard.html';

        }
    );


document
    .getElementById('communityButton')
    ?.addEventListener(
        'click',
        () => {

            window.location.href =
                '/issues.html';

        }
    );


document
    .getElementById('myReportsButton')
    ?.addEventListener(
        'click',
        () => {

            window.location.href =
                '/my-reports.html';

        }
    );


document
    .getElementById('adminDashboardButton')
    ?.addEventListener(
        'click',
        () => {

            if (
                user.role === 'ADMIN'
            ) {

                window.location.href =
                    '/admin.html';

            }

        }
    );


document
    .getElementById('logoutButton')
    ?.addEventListener(
        'click',
        () => {

            localStorage.removeItem(
                'civic_token'
            );

            localStorage.removeItem(
                'civic_user'
            );

            window.location.href =
                '/';

        }
    );


document
    .getElementById('reportNewButton')
    ?.addEventListener(
        'click',
        () => {

            window.location.href =
                '/dashboard.html';

        }
    );


// =========================
// ADMIN MENU
// =========================

const adminButton =
    document.getElementById(
        'adminDashboardButton'
    );


if (
    adminButton &&
    user.role === 'ADMIN'
) {

    adminButton.style.display =
        'block';

}


// =========================
// LOAD REPORTS
// =========================

loadMyReports();


async function loadMyReports() {

    const container =
        document.getElementById(
            'myIssues'
        );


    container.innerHTML = Array.from({ length: 3 }, () => `
        <div class="community-issue-card skeleton-card" style="margin-bottom: 16px;">
            <div class="skeleton-photo skeleton-box" style="height: 180px;"></div>
            <div class="community-issue-content">
                <div class="skeleton-line skeleton-box" style="width: 45%; height: 14px; margin-bottom: 12px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 80%; height: 20px; margin-bottom: 10px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 95%; height: 14px; margin-bottom: 16px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 40%; height: 14px;"></div>
            </div>
        </div>
    `).join('');


    try {

        const response =
            await fetch(
                '/api/my-issues',
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem(
                'civic_token'
            );

            localStorage.removeItem(
                'civic_user'
            );

            window.location.href =
                '/';

            return;

        }


        const issues =
            await response.json();


        if (!response.ok) {

            throw new Error(
                issues.error ||
                'Failed to load reports'
            );

        }


        if (!issues.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <h3>
                        No reports yet
                    </h3>

                    <p>
                        You have not reported any civic issues.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            issues
                .map(
                    createIssueCard
                )
                .join('');


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty-state">

                <p>
                    Unable to load your reports.
                </p>

                <button
                    type="button"
                    class="refresh-btn"
                    onclick="loadMyReports()"
                >
                    Try Again
                </button>

            </div>
        `;

    }

}


// =========================
// ISSUE CARD
// =========================

function createIssueCard(issue) {

    const status =
        issue.status || 'OPEN';


    const statusText =
        status.replace(
            '_',
            ' '
        );


    let actionButtons = '';


    if (
        status === 'OPEN'
    ) {

        actionButtons = `
            <button
                type="button"
                class="auth-button"
                onclick="markInProgress(${issue.id})"
            >
                Mark In Progress
            </button>

            <button
                type="button"
                class="resolve-button"
                onclick="markResolved(${issue.id})"
            >
                Mark Resolved
            </button>
        `;

    } else if (
        status === 'IN_PROGRESS'
    ) {

        actionButtons = `
            <button
                type="button"
                class="resolve-button"
                onclick="markResolved(${issue.id})"
            >
                Mark Resolved
            </button>
        `;

    } else if (
        status === 'RESOLVED'
    ) {

        // Resolved issues can only be reopened.
        actionButtons = `
            <button
                type="button"
                class="auth-button"
                onclick="reopenIssue(${issue.id})"
            >
                Reopen Issue
            </button>
        `;

    }


    const imageHTML =
        issue.image_path
            ? `
                <div class="issue-detail-photo">
                    <img
                        src="${escapeHTML(issue.image_path)}"
                        alt="Issue photo"
                    >
                </div>
            `
            : '';


    return `
        <div class="issue-card">

            ${imageHTML}

            <div class="issue-top">

                <span class="issue-category">
                    ${escapeHTML(
                        issue.category
                    )}
                </span>

                <span
                    class="badge status-${status}"
                >
                    ${escapeHTML(
                        statusText
                    )}
                </span>

            </div>


            <h3 class="issue-title">
                ${escapeHTML(
                    issue.title
                )}
            </h3>


            <p class="issue-description">
                ${escapeHTML(
                    issue.description ||
                    'No description'
                )}
            </p>


            <p class="issue-location">
                📍
                ${escapeHTML(
                    issue.address ||
                    'Location not available'
                )}
            </p>


            <p class="issue-date">
                Reported:
                ${formatDate(
                    issue.created_at
                )}
            </p>


            <div class="issue-actions">

                ${actionButtons}

                <button
                    type="button"
                    class="delete-button"
                    onclick="deleteIssue(${issue.id})"
                >
                    Delete
                </button>

            </div>


            <div
                class="view-details-link"
                onclick="viewIssue(${issue.id})"
            >
                Click to view complete details →
            </div>

        </div>
    `;
}


// =========================
// VIEW ISSUE
// =========================

function viewIssue(id) {

    window.location.href =
        `/issue.html?id=${id}`;

}


// =========================
// MARK IN PROGRESS
// =========================

async function markInProgress(id) {

    await changeStatus(
        id,
        'IN_PROGRESS'
    );

}


// =========================
// MARK RESOLVED
// =========================

async function markResolved(id) {

    const confirmed =
        confirm(
            'Mark this issue as resolved?'
        );


    if (!confirmed) {
        return;
    }


    await changeStatus(
        id,
        'RESOLVED'
    );

}


// =========================
// REOPEN ISSUE
// =========================

async function reopenIssue(id) {

    const confirmed =
        confirm(
            'Is this problem still not solved? Reopen this issue?'
        );


    if (!confirmed) {
        return;
    }


    await changeStatus(
        id,
        'OPEN'
    );

}


// =========================
// CHANGE STATUS
// =========================

async function changeStatus(
    id,
    status
) {

    try {

        const response =
            await fetch(
                `/api/issues/${id}/status`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        status
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                'Unable to update status'
            );

            return;

        }


        await loadMyReports();


    } catch (error) {

        console.error(error);

        alert(
            'Unable to connect to server.'
        );

    }

}


// =========================
// DELETE
// =========================

async function deleteIssue(id) {

    const confirmed =
        confirm(
            'Are you sure you want to delete this report?'
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/issues/${id}`,
                {
                    method: 'DELETE',

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                'Unable to delete report'
            );

            return;

        }


        await loadMyReports();


    } catch (error) {

        console.error(error);

        alert(
            'Unable to connect to server.'
        );

    }

}


// =========================
// HELPERS
// =========================

function formatDate(date) {

    if (!date) {
        return 'Unknown';
    }

    return new Date(date)
        .toLocaleString();

}


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