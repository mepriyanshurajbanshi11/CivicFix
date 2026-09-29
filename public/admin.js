const token = localStorage.getItem('civic_token');
const user = JSON.parse(localStorage.getItem('civic_user') || 'null');


// =========================
// CHECK ADMIN
// =========================

if (!token || !user) {
    window.location.href = '/';
}

if (user && user.role !== 'ADMIN') {
    window.location.href = '/dashboard.html';
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

const dashboardButton =
    document.getElementById('dashboardButton');

const communityButton =
    document.getElementById('communityButton');

const myReportsButton =
    document.getElementById('myReportsButton');

const logoutButton =
    document.getElementById('logoutButton');

const refreshButton =
    document.getElementById('refreshButton');

const adminIssuesList =
    document.getElementById('adminIssuesList');

const openCount =
    document.getElementById('openCount');

const progressCount =
    document.getElementById('progressCount');

const resolvedCount =
    document.getElementById('resolvedCount');


// =========================
// PROFILE
// =========================

profileInitial.textContent =
    user.name
        ? user.name.charAt(0).toUpperCase()
        : 'A';

profileName.textContent =
    user.name || 'Admin';

profileEmail.textContent =
    user.email || '';

profileRole.textContent =
    user.role || 'ADMIN';


profileButton.addEventListener('click', () => {

    profileMenu.classList.toggle('show');

});


document.addEventListener('click', (event) => {

    if (
        !profileButton.contains(event.target) &&
        !profileMenu.contains(event.target)
    ) {

        profileMenu.classList.remove('show');

    }

});


// =========================
// NAVIGATION
// =========================

dashboardButton.addEventListener('click', () => {

    window.location.href =
        '/dashboard.html';

});


communityButton.addEventListener('click', () => {

    window.location.href =
        '/issues.html';

});


myReportsButton.addEventListener('click', () => {

    window.location.href =
        '/my-reports.html';

});


logoutButton.addEventListener('click', () => {

    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');

    window.location.href = '/';

});


refreshButton.addEventListener('click', () => {

    loadAdminDashboard();

});


// =========================
// MESSAGE
// =========================

function showMessage(message, type = 'success') {

    const oldMessage =
        document.querySelector('.page-message');

    if (oldMessage) {
        oldMessage.remove();
    }

    const messageBox =
        document.createElement('div');

    messageBox.className =
        `page-message ${type}`;

    messageBox.textContent =
        message;

    const container =
        document.querySelector('.container');

    container.prepend(messageBox);

    setTimeout(() => {

        messageBox.remove();

    }, 4000);
}


// =========================
// LOAD ADMIN DATA
// =========================

async function loadAdminDashboard() {

    refreshButton.disabled = true;
    refreshButton.textContent = 'Loading...';

    adminIssuesList.innerHTML = `
        <div class="empty-state">
            <p>Loading reports...</p>
        </div>
    `;

    try {

        // Load statistics

        const statsResponse =
            await fetch('/api/admin/stats', {
                headers: {
                    'Authorization':
                        `Bearer ${token}`
                }
            });


        const stats =
            await statsResponse.json();


        if (!statsResponse.ok) {

            throw new Error(
                stats.error ||
                'Failed to load statistics'
            );

        }


        openCount.textContent =
            stats.OPEN || 0;

        progressCount.textContent =
            stats.IN_PROGRESS || 0;

        resolvedCount.textContent =
            stats.RESOLVED || 0;


        // Load all reports

        const issuesResponse =
            await fetch('/api/issues');


        const issues =
            await issuesResponse.json();


        if (!issuesResponse.ok) {

            throw new Error(
                issues.error ||
                'Failed to load reports'
            );

        }


        renderIssues(issues);


    } catch (error) {

        adminIssuesList.innerHTML = `
            <div class="empty-state">

                <h3>
                    Unable to load reports
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>
        `;

    } finally {

        refreshButton.disabled = false;
        refreshButton.textContent = '🔄 Refresh';

    }
}


// =========================
// RENDER REPORTS
// =========================

function renderIssues(issues) {

    if (!issues.length) {

        adminIssuesList.innerHTML = `
            <div class="empty-state">

                <h3>
                    No reports yet
                </h3>

                <p>
                    There are no civic issue reports.
                </p>

            </div>
        `;

        return;
    }


    adminIssuesList.innerHTML =
        issues.map(issue => {

            const image =
                issue.image_path
                    ? `
                        <img
                            src="${getImageUrl(issue.image_path)}"
                            alt="Issue photo"
                            class="issue-card-image">
                    `
                    : '';


            return `
                <article class="issue-card">

                    ${image}

                    <div class="issue-content">

                        <div class="issue-top">

                            <span class="issue-category">
                                ${escapeHtml(
                                    issue.category
                                )}
                            </span>

                            <span
                                class="status-badge status-${issue.status}">
                                ${formatStatus(
                                    issue.status
                                )}
                            </span>

                        </div>


                        <h3 class="issue-title">
                            ${escapeHtml(
                                issue.title
                            )}
                        </h3>


                        <p class="issue-description">
                            ${escapeHtml(
                                issue.description ||
                                'No description provided.'
                            )}
                        </p>


                        <p class="issue-location">
                            📍
                            ${escapeHtml(
                                issue.address ||
                                'Location not provided'
                            )}
                        </p>


                        <p class="issue-date">
                            👤 Reported by:
                            ${escapeHtml(
                                issue.reporter_name ||
                                'Citizen'
                            )}
                        </p>


                        <p class="issue-date">
                            👍
                            ${issue.upvote_count || 0}
                            Upvotes
                        </p>


                        <p class="issue-date">
                            ${formatDate(
                                issue.created_at
                            )}
                        </p>


                        <div
                            class="admin-action-buttons">


                            ${
                                issue.status !==
                                'IN_PROGRESS'
                                    ? `
                                        <button
                                            type="button"
                                            class="auth-button"
                                            onclick="updateStatus(
                                                ${issue.id},
                                                'IN_PROGRESS',
                                                this
                                            )">

                                            Mark In Progress

                                        </button>
                                    `
                                    : ''
                            }


                            ${
                                issue.status !==
                                'RESOLVED'
                                    ? `
                                        <button
                                            type="button"
                                            class="auth-button"
                                            onclick="updateStatus(
                                                ${issue.id},
                                                'RESOLVED',
                                                this
                                            )">

                                            Mark Resolved

                                        </button>
                                    `
                                    : ''
                            }


                            ${
                                issue.status ===
                                'RESOLVED'
                                    ? `
                                        <button
                                            type="button"
                                            class="auth-button"
                                            onclick="updateStatus(
                                                ${issue.id},
                                                'OPEN',
                                                this
                                            )">

                                            Reopen Issue

                                        </button>
                                    `
                                    : ''
                            }

                        </div>

                    </div>

                </article>
            `;

        }).join('');
}


// =========================
// UPDATE STATUS
// =========================

async function updateStatus(
    issueId,
    status,
    button
) {

    const originalText =
        button.textContent;

    button.disabled = true;
    button.textContent = 'Updating...';


    try {

        const response =
            await fetch(
                `/api/admin/issues/${issueId}/status`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
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

            throw new Error(
                data.error ||
                'Failed to update status'
            );

        }


        showMessage(
            `Issue status changed to ${formatStatus(status)}.`,
            'success'
        );


        await loadAdminDashboard();


    } catch (error) {

        button.disabled = false;
        button.textContent = originalText;

        showMessage(
            error.message ||
            'Failed to update status.',
            'error'
        );

    }
}


// =========================
// HELPERS
// =========================

function formatStatus(status) {

    return status
        .replace('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


function formatDate(date) {

    return new Date(date)
        .toLocaleString();

}


function getImageUrl(path) {

    if (!path) {
        return '';
    }

    return path.startsWith('/')
        ? path
        : `/${path}`;

}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// =========================
// START
// =========================

loadAdminDashboard();