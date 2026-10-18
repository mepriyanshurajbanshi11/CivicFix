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

const adminOverviewButton =
    document.getElementById('adminOverviewButton');

const communityButton =
    document.getElementById('communityButton');

const cityMapButton =
    document.getElementById('cityMapButton');

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

const totalCount =
    document.getElementById('totalCount');

let allAdminIssues = [];

// =========================
// PROFILE & SIDEBAR
// =========================

const adminInitial = user.name ? user.name.charAt(0).toUpperCase() : 'A';
const adminNameStr = user.name || 'Admin';
const adminRoleStr = user.role || 'ADMIN';

profileInitial.textContent = adminInitial;
profileName.textContent = adminNameStr;
profileEmail.textContent = user.email || '';
profileRole.textContent = adminRoleStr;

const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserRole = document.getElementById('sidebarUserRole');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

if (sidebarUserAvatar) sidebarUserAvatar.textContent = adminInitial;
if (sidebarUserName) sidebarUserName.textContent = adminNameStr;
if (sidebarUserRole) sidebarUserRole.textContent = adminRoleStr;

if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('civic_token');
        localStorage.removeItem('civic_user');
        window.location.href = '/';
    });
}


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

if (adminOverviewButton) {
    adminOverviewButton.addEventListener('click', () => {
        window.location.href = '/admin.html';
    });
}

if (communityButton) {
    communityButton.addEventListener('click', () => {
        window.location.href = '/issues.html';
    });
}

if (cityMapButton) {
    cityMapButton.addEventListener('click', () => {
        window.location.href = '/issues.html?view=map';
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('civic_token');
        localStorage.removeItem('civic_user');
        window.location.href = '/';
    });
}

if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        loadAdminDashboard();
    });
}


// =========================
// MESSAGE TOAST NOTIFICATION
// =========================

function showMessage(message, type = 'success') {
    const oldMessages = document.querySelectorAll('.page-message-toast');
    oldMessages.forEach(el => el.remove());

    const messageBox = document.createElement('div');
    messageBox.className = `page-message-toast ${type}`;
    messageBox.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999;
        padding: 14px 22px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
        background: ${type === 'success' ? '#16a34a' : '#dc2626'};
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 420px;
        transition: opacity 0.3s ease;
    `;

    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.style.opacity = '0';
        setTimeout(() => messageBox.remove(), 300);
    }, 4000);
}


// =========================
// LOAD ADMIN DATA
// =========================

async function loadAdminDashboard() {

    refreshButton.disabled = true;
    refreshButton.textContent = 'Loading...';

    adminIssuesList.innerHTML = Array.from({ length: 4 }, () => `
        <div class="community-issue-card skeleton-card" style="margin-bottom: 16px;">
            <div class="skeleton-photo skeleton-box" style="height: 180px;"></div>
            <div class="community-issue-content">
                <div class="skeleton-line skeleton-box" style="width: 40%; height: 14px; margin-bottom: 12px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 80%; height: 20px; margin-bottom: 10px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 95%; height: 14px; margin-bottom: 16px;"></div>
                <div class="skeleton-line skeleton-box" style="width: 50%; height: 14px;"></div>
            </div>
        </div>
    `).join('');

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


        const openVal = Number(stats.OPEN || 0);
        const progVal = Number(stats.IN_PROGRESS || 0);
        const resVal = Number(stats.RESOLVED || 0);
        const totalVal = openVal + progVal + resVal;

        openCount.textContent = openVal;
        progressCount.textContent = progVal;
        resolvedCount.textContent = resVal;
        if (totalCount) totalCount.textContent = totalVal;

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

        allAdminIssues = Array.isArray(issues) ? issues : [];
        updateCategoryProgressBars(allAdminIssues);
        renderIssues(allAdminIssues);


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
// CATEGORY PROGRESS BARS
// =========================

function updateCategoryProgressBars(issues) {
    if (!Array.isArray(issues) || issues.length === 0) return;

    const total = issues.length;
    const roadCount = issues.filter(i => i.category === 'ROAD_DAMAGE' || i.category === 'POTHOLE').length;
    const lightCount = issues.filter(i => i.category === 'STREETLIGHT').length;
    const garbageCount = issues.filter(i => i.category === 'GARBAGE').length;
    const waterCount = issues.filter(i => i.category === 'WATER_LEAK' || i.category === 'DRAINAGE').length;

    const roadPct = Math.round((roadCount / total) * 100);
    const lightPct = Math.round((lightCount / total) * 100);
    const garbagePct = Math.round((garbageCount / total) * 100);
    const waterPct = Math.round((waterCount / total) * 100);

    const catRoadPct = document.getElementById('catRoadPct');
    const catRoadBar = document.getElementById('catRoadBar');
    const catLightPct = document.getElementById('catLightPct');
    const catLightBar = document.getElementById('catLightBar');
    const catGarbagePct = document.getElementById('catGarbagePct');
    const catGarbageBar = document.getElementById('catGarbageBar');
    const catWaterPct = document.getElementById('catWaterPct');
    const catWaterBar = document.getElementById('catWaterBar');

    if (catRoadPct) catRoadPct.textContent = `${roadPct}% (${roadCount})`;
    if (catRoadBar) catRoadBar.style.width = `${roadPct}%`;
    if (catLightPct) catLightPct.textContent = `${lightPct}% (${lightCount})`;
    if (catLightBar) catLightBar.style.width = `${lightPct}%`;
    if (catGarbagePct) catGarbagePct.textContent = `${garbagePct}% (${garbageCount})`;
    if (catGarbageBar) catGarbageBar.style.width = `${garbagePct}%`;
    if (catWaterPct) catWaterPct.textContent = `${waterPct}% (${waterCount})`;
    if (catWaterBar) catWaterBar.style.width = `${waterPct}%`;
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
                            class="issue-card-image"
                            onerror="this.style.display='none'">
                    `
                    : '';

            const isResolved = issue.status === 'RESOLVED';
            const isInProgress = issue.status === 'IN_PROGRESS';

            return `
                <article class="issue-card">

                    ${image}

                    <div class="issue-content">

                        <div class="issue-top">

                            <span class="issue-category">
                                ${escapeHtml(
                                    formatCategory(issue.category)
                                )}
                            </span>

                            <span
                                class="status-badge status-${(issue.status || 'open').toLowerCase().replace('_', '-')}">
                                ${formatStatus(
                                    issue.status || 'OPEN'
                                )}
                            </span>

                        </div>


                        <h3 class="issue-title">
                            <a href="/issue.html?id=${issue.id}" style="color: inherit; text-decoration: none;">
                                ${escapeHtml(issue.title)}
                            </a>
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
                            👍 ${issue.upvote_count || 0} Upvotes &bull; ⚠️ Severity: ${escapeHtml(issue.severity || 'MEDIUM')}
                        </p>


                        <p class="issue-date">
                            📅 ${formatDate(issue.created_at)}
                        </p>

                        <div style="margin-top: 10px; margin-bottom: 8px;">
                            <a href="/issue.html?id=${issue.id}" style="color: var(--primary, #0284c7); font-size: 13.5px; font-weight: 700; text-decoration: none;">
                                🔍 View Details & Community Timeline &rarr;
                            </a>
                        </div>


                        <div
                            class="admin-action-buttons">

                            ${
                                !isInProgress
                                    ? `
                                        <button
                                            type="button"
                                            class="auth-button"
                                            style="background: #f59e0b; border-color: #f59e0b; color: white;"
                                            onclick="updateStatus(
                                                ${issue.id},
                                                'IN_PROGRESS',
                                                this
                                            )">
                                            ⏳ Mark In Progress
                                        </button>
                                    `
                                    : ''
                            }


                            ${
                                !isResolved
                                    ? `
                                        <button
                                            type="button"
                                            class="auth-button"
                                            style="background: #16a34a; border-color: #16a34a; color: white;"
                                            onclick="updateStatus(
                                                ${issue.id},
                                                'RESOLVED',
                                                this
                                            )">
                                            ✅ Mark Resolved
                                        </button>
                                    `
                                    : ''
                            }


                            ${
                                isResolved
                                    ? `
                                        <button
                                            type="button"
                                            class="auth-button"
                                            style="background: #0284c7; border-color: #0284c7; color: white;"
                                            onclick="updateStatus(
                                                ${issue.id},
                                                'OPEN',
                                                this
                                            )">
                                            🔄 Reopen Issue
                                        </button>
                                    `
                                    : ''
                            }

                            <button
                                type="button"
                                class="delete-button"
                                style="padding: 9px 14px; font-size: 14px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; cursor: pointer; font-weight: 600;"
                                onclick="deleteIssueByAdmin(${issue.id}, this)">
                                🗑️ Delete
                            </button>

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
        button ? button.textContent : '';

    if (button) {
        button.disabled = true;
        button.textContent = 'Updating...';
    }


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
            `✓ Issue #${issueId} status changed to ${formatStatus(status)}.`,
            'success'
        );


        await loadAdminDashboard();


    } catch (error) {

        console.error('Update status error:', error);
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }

        showMessage(
            error.message ||
            'Failed to update status.',
            'error'
        );

    }
}
window.updateStatus = updateStatus;


// =========================
// DELETE ISSUE (ADMIN)
// =========================

async function deleteIssueByAdmin(issueId, button) {
    const confirmed = confirm('Are you sure you want to permanently delete this report? This action cannot be undone.');
    if (!confirmed) return;

    const originalText = button ? button.textContent : '';
    if (button) {
        button.disabled = true;
        button.textContent = 'Deleting...';
    }

    try {
        const response = await fetch(`/api/issues/${issueId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete issue');
        }

        showMessage(`✓ Issue #${issueId} deleted successfully.`, 'success');
        await loadAdminDashboard();
    } catch (error) {
        console.error('Delete issue error:', error);
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
        showMessage(error.message || 'Failed to delete issue.', 'error');
    }
}
window.deleteIssueByAdmin = deleteIssueByAdmin;


// =========================
// HELPERS
// =========================

function formatCategory(category) {
    if (!category) return 'Other';
    return category
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatStatus(status) {
    if (!status) return 'Open';
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


// =========================
// FILTERS, SEARCH & CSV EXPORT
// =========================

function applyAdminFilters() {
    const statusVal = document.getElementById('adminStatusFilter')?.value || '';
    const categoryVal = document.getElementById('adminCategoryFilter')?.value || '';
    const searchVal = (document.getElementById('adminSearchInput')?.value || '').toLowerCase().trim();

    const filtered = allAdminIssues.filter(issue => {
        const matchesStatus = !statusVal || issue.status === statusVal;
        const matchesCategory = !categoryVal || (
            categoryVal === 'ROAD_DAMAGE'
                ? (issue.category === 'ROAD_DAMAGE' || issue.category === 'POTHOLE')
                : (categoryVal === 'WATER_LEAK'
                    ? (issue.category === 'WATER_LEAK' || issue.category === 'DRAINAGE')
                    : issue.category === categoryVal)
        );
        const matchesSearch = !searchVal || (
            (issue.title || '').toLowerCase().includes(searchVal) ||
            (issue.category || '').toLowerCase().includes(searchVal) ||
            (issue.address || '').toLowerCase().includes(searchVal) ||
            (issue.reporter_name || '').toLowerCase().includes(searchVal) ||
            (issue.status || '').toLowerCase().includes(searchVal)
        );
        return matchesStatus && matchesCategory && matchesSearch;
    });

    renderIssues(filtered);
}

const adminStatusFilter = document.getElementById('adminStatusFilter');
const adminCategoryFilter = document.getElementById('adminCategoryFilter');
if (adminStatusFilter) adminStatusFilter.addEventListener('change', applyAdminFilters);
if (adminCategoryFilter) adminCategoryFilter.addEventListener('change', applyAdminFilters);

const adminSearchInput = document.getElementById('adminSearchInput');
if (adminSearchInput) {
    adminSearchInput.addEventListener('input', applyAdminFilters);
}

const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        if (!allAdminIssues || !allAdminIssues.length) {
            alert('No issue data available to export.');
            return;
        }

        const headers = ['ID', 'Title', 'Category', 'Severity', 'Status', 'Upvotes', 'Address', 'Reporter', 'Created At'];
        const csvRows = [headers.join(',')];

        allAdminIssues.forEach(issue => {
            const row = [
                issue.id,
                `"${(issue.title || '').replace(/"/g, '""')}"`,
                `"${(issue.category || '').replace(/"/g, '""')}"`,
                issue.severity || 'MEDIUM',
                issue.status || 'OPEN',
                issue.upvote_count || 0,
                `"${(issue.address || '').replace(/"/g, '""')}"`,
                `"${(issue.reporter_name || '').replace(/"/g, '""')}"`,
                `"${new Date(issue.created_at).toLocaleString()}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `CivicFix_Issues_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}