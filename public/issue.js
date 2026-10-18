const token = localStorage.getItem('civic_token');
const user = JSON.parse(
    localStorage.getItem('civic_user') || '{}'
);

if (!token) {
    window.location.href = '/';
}

const issueDetails =
    document.getElementById('issueDetails');

const commentsList =
    document.getElementById('commentsList');

const commentForm =
    document.getElementById('commentForm');

const commentInput =
    document.getElementById('commentInput');

const profileButton =
    document.getElementById('profileButton');

const profileMenu =
    document.getElementById('profileMenu');

let currentIssue = null;


// =========================
// PROFILE
// =========================

document.getElementById('profileName').textContent =
    user.name || 'Citizen';

document.getElementById('profileEmail').textContent =
    user.email || '';

document.getElementById('profileRole').textContent =
    user.role || 'CITIZEN';

document.getElementById('profileInitial').textContent =
    (user.name || 'C').charAt(0).toUpperCase();

const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserRole = document.getElementById('sidebarUserRole');
const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
const sidebarAdminLink = document.getElementById('sidebarAdminLink');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

if (sidebarUserName) sidebarUserName.textContent = user.name || 'Citizen';
if (sidebarUserRole) sidebarUserRole.textContent = user.role || 'CITIZEN';
if (sidebarUserAvatar) sidebarUserAvatar.textContent = (user.name || 'C').charAt(0).toUpperCase();

if (user.role === 'ADMIN') {
    if (sidebarAdminLink) sidebarAdminLink.style.display = 'flex';

    // Hide citizen "Report Issue" buttons and "My Reports" from Admins
    document.querySelectorAll('.btn-report-header, .mobile-fab').forEach(el => el.style.display = 'none');
    document.querySelectorAll('a[href="my-reports.html"]').forEach(el => el.style.display = 'none');
    const myReportsBtn = document.getElementById('myReportsButton');
    if (myReportsBtn) myReportsBtn.style.display = 'none';

    // Change dashboard links to admin overview
    document.querySelectorAll('a[href="dashboard.html"]').forEach(el => el.setAttribute('href', 'admin.html'));
    const dashBtn = document.getElementById('dashboardButton');
    if (dashBtn) {
        dashBtn.textContent = '🛠️ Admin Overview';
    }
}

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


// =========================
// NAVIGATION
// =========================

document
    .getElementById('dashboardButton')
    .addEventListener('click', () => {
        window.location.href =
            user.role === 'ADMIN' ? '/admin.html' : '/dashboard.html';
    });

document
    .getElementById('communityButton')
    .addEventListener('click', () => {
        window.location.href =
            '/issues.html';
    });

document
    .getElementById('myReportsButton')
    .addEventListener('click', () => {
        window.location.href =
            '/my-reports.html';
    });

document
    .getElementById('backButton')
    .addEventListener('click', () => {
        window.history.back();
    });

document
    .getElementById('logoutButton')
    .addEventListener('click', () => {

        localStorage.removeItem(
            'civic_token'
        );

        localStorage.removeItem(
            'civic_user'
        );

        window.location.href = '/';
    });


// =========================
// ISSUE ID
// =========================

const params =
    new URLSearchParams(
        window.location.search
    );

const issueId =
    params.get('id');

if (!issueId) {

    issueDetails.innerHTML =
        '<p>Issue ID is missing.</p>';

    commentsList.innerHTML =
        '<p>Issue ID is missing.</p>';

} else {

    loadIssue();
    loadComments();
}


// =========================
// LOAD ISSUE
// =========================

async function loadIssue() {

    try {

        const response =
            await fetch(
                `/api/issues/${issueId}`
            );

        if (!response.ok) {
            throw new Error(
                'Issue not found'
            );
        }

        const issue =
            await response.json();

        currentIssue = issue;

        const statusText =
            issue.status.replace(
                '_',
                ' '
            );

        let photoHTML = '';

        if (issue.image_path) {

            photoHTML = `
                <div class="issue-detail-photo">
                    <img
                        src="${issue.image_path}"
                        alt="Issue photo"
                        onerror="
                            this.parentElement.innerHTML =
                            '<p>Photo could not be loaded.</p>'
                        "
                    >
                </div>
            `;

        } else {

            photoHTML = `
                <div class="no-photo">
                    📷 No photo uploaded for this report.
                </div>
            `;
        }

        const isOwner =
            Number(issue.user_id) ===
            Number(user.id);

        issueDetails.innerHTML = `
            ${photoHTML}

            <div class="issue-detail-header">

                <span class="issue-category">
                    ${escapeHTML(issue.category)}
                </span>

                <span class="badge status-${issue.status}">
                    ${escapeHTML(statusText)}
                </span>

            </div>

            <h2>
                ${escapeHTML(issue.title)}
            </h2>

            <p class="issue-detail-description">
                ${escapeHTML(
                    issue.description ||
                    'No description provided.'
                )}
            </p>

            <div class="issue-detail-info">

                <p>
                    <strong>📍 Location</strong><br>
                    ${escapeHTML(
                        issue.address ||
                        'Location not available'
                    )}
                    ${(!isNaN(parseFloat(issue.latitude)) && !isNaN(parseFloat(issue.longitude)) && parseFloat(issue.latitude) !== 0)
                        ? `<br><small style="color: var(--muted); font-family: monospace;">(${parseFloat(issue.latitude).toFixed(6)}, ${parseFloat(issue.longitude).toFixed(6)})</small> • <a href="https://www.google.com/maps?q=${encodeURIComponent(issue.latitude)},${encodeURIComponent(issue.longitude)}" target="_blank" rel="noopener" style="font-size: 12px; color: var(--primary);">View on Map ↗</a>`
                        : ''}
                </p>

                <p>
                    <strong>⚠️ Severity</strong><br>
                    ${escapeHTML(
                        issue.severity ||
                        'MEDIUM'
                    )}
                </p>

                <p>
                    <strong>👍 Upvotes</strong><br>
                    <span id="upvoteCount">
                        ${issue.upvote_count || 0}
                    </span>
                </p>

                <p>
                    <strong>👤 Reported by</strong><br>
                    ${escapeHTML(
                        issue.reporter_name ||
                        'Citizen'
                    )}
                </p>

                <p>
                    <strong>🕒 Reported on</strong><br>
                    ${formatDate(
                        issue.created_at
                    )}
                </p>

            </div>

            <div
                id="issueMessage"
                class="page-message"
                style="display:none;">
            </div>

            <div class="issue-detail-actions">

                <button
                    id="upvoteButton"
                    class="auth-button"
                    type="button">
                    👍 Upvote
                </button>

                ${
                    isOwner
                        ? `
                            <button
                                id="editIssueButton"
                                class="auth-button"
                                type="button">
                                ✏️ Edit
                            </button>

                            <button
                                id="resolveIssueButton"
                                class="auth-button"
                                type="button">
                                ✓ Mark Resolved
                            </button>

                            <button
                                id="deleteIssueButton"
                                class="auth-button"
                                type="button">
                                🗑️ Delete
                            </button>
                        `
                        : ''
                }

                ${
                    user && user.role === 'ADMIN'
                        ? `
                            ${
                                issue.status !== 'IN_PROGRESS'
                                    ? `
                                        <button
                                            id="adminProgressBtn"
                                            class="auth-button"
                                            style="background: #f59e0b; border-color: #f59e0b; color: white;"
                                            type="button">
                                            ⏳ Mark In Progress
                                        </button>
                                    `
                                    : ''
                            }
                            ${
                                issue.status !== 'RESOLVED'
                                    ? `
                                        <button
                                            id="adminResolvedBtn"
                                            class="auth-button"
                                            style="background: #16a34a; border-color: #16a34a; color: white;"
                                            type="button">
                                            ✅ Mark Resolved
                                        </button>
                                    `
                                    : ''
                            }
                            ${
                                issue.status === 'RESOLVED'
                                    ? `
                                        <button
                                            id="adminReopenBtn"
                                            class="auth-button"
                                            style="background: #0284c7; border-color: #0284c7; color: white;"
                                            type="button">
                                            🔄 Reopen Issue
                                        </button>
                                    `
                                    : ''
                            }
                            ${
                                !isOwner
                                    ? `
                                        <button
                                            id="adminDeleteBtn"
                                            class="auth-button"
                                            style="background: #fee2e2; border-color: #fca5a5; color: #dc2626;"
                                            type="button">
                                            🗑️ Delete
                                        </button>
                                    `
                                    : ''
                            }
                        `
                        : ''
                }

            </div>
        `;

        await loadUpvoteStatus();

        document
            .getElementById('upvoteButton')
            .addEventListener(
                'click',
                upvoteIssue
            );

        if (isOwner) {

            document
                .getElementById(
                    'editIssueButton'
                )
                .addEventListener(
                    'click',
                    editIssue
                );

            document
                .getElementById(
                    'resolveIssueButton'
                )
                .addEventListener(
                    'click',
                    markResolved
                );

            document
                .getElementById(
                    'deleteIssueButton'
                )
                .addEventListener(
                    'click',
                    deleteIssue
                );
        }

        if (user && user.role === 'ADMIN') {
            const adminProgressBtn = document.getElementById('adminProgressBtn');
            const adminResolvedBtn = document.getElementById('adminResolvedBtn');
            const adminReopenBtn = document.getElementById('adminReopenBtn');
            const adminDeleteBtn = document.getElementById('adminDeleteBtn');

            if (adminProgressBtn) {
                adminProgressBtn.addEventListener('click', () => adminChangeStatus('IN_PROGRESS', adminProgressBtn));
            }
            if (adminResolvedBtn) {
                adminResolvedBtn.addEventListener('click', () => adminChangeStatus('RESOLVED', adminResolvedBtn));
            }
            if (adminReopenBtn) {
                adminReopenBtn.addEventListener('click', () => adminChangeStatus('OPEN', adminReopenBtn));
            }
            if (adminDeleteBtn) {
                adminDeleteBtn.addEventListener('click', adminDeleteIssue);
            }
        }

    } catch (error) {

        console.error(error);

        issueDetails.innerHTML = `
            <p>
                Unable to load issue details.
            </p>
        `;
    }
}


// =========================
// UPVOTE STATUS
// =========================

async function loadUpvoteStatus() {

    const button =
        document.getElementById(
            'upvoteButton'
        );

    if (!button) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/issues/${issueId}/upvote-status`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        if (data.upvoted) {
            setUpvotedButton();
        }

    } catch (error) {

        console.error(error);
    }
}


function setUpvotedButton() {

    const button =
        document.getElementById(
            'upvoteButton'
        );

    if (!button) {
        return;
    }

    button.textContent =
        '✓ Upvoted';

    button.disabled = true;
}


// =========================
// UPVOTE
// =========================

async function upvoteIssue() {

    const button =
        document.getElementById(
            'upvoteButton'
        );

    if (!button || button.disabled) {
        return;
    }

    button.disabled = true;
    button.textContent =
        'Upvoting...';

    try {

        const response =
            await fetch(
                `/api/issues/${issueId}/upvote`,
                {
                    method: 'POST',

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            if (
                data.error &&
                data.error.includes(
                    'already upvoted'
                )
            ) {
                setUpvotedButton();
                return;
            }

            throw new Error(
                data.error ||
                'Unable to upvote'
            );
        }

        setUpvotedButton();

        showIssueMessage(
            'Issue upvoted successfully.',
            'success'
        );

        const count =
            document.getElementById(
                'upvoteCount'
            );

        if (count) {

            count.textContent =
                Number(
                    count.textContent
                ) + 1;
        }

    } catch (error) {

        console.error(error);

        button.disabled = false;
        button.textContent =
            '👍 Upvote';

        showIssueMessage(
            error.message ||
            'Unable to upvote.',
            'error'
        );
    }
}


// =========================
// LOAD COMMENTS
// =========================

async function loadComments() {

    try {

        const response =
            await fetch(
                `/api/issues/${issueId}/comments`
            );

        if (!response.ok) {
            throw new Error(
                'Failed to load comments'
            );
        }

        const comments =
            await response.json();

        if (comments.length === 0) {

            commentsList.innerHTML = `
                <p class="no-comments">
                    No comments yet.
                    Be the first to comment.
                </p>
            `;

            return;
        }

        commentsList.innerHTML =
            comments.map(
                comment => {

                    const canDelete =
                        Number(
                            comment.user_id
                        ) === Number(user.id) ||
                        (
                            currentIssue &&
                            Number(
                                currentIssue.user_id
                            ) === Number(user.id)
                        );

                    return `
                        <div
                            class="comment-card"
                            data-comment-id="${comment.id}">

                            <div
                                class="comment-header">

                                <strong>
                                    ${escapeHTML(
                                        comment.user_name ||
                                        'Citizen'
                                    )}
                                </strong>

                                <div
                                    style="
                                        display:flex;
                                        align-items:center;
                                        gap:8px;
                                    ">

                                    <small>
                                        ${formatDate(
                                            comment.created_at
                                        )}
                                    </small>

                                    ${
                                        canDelete
                                            ? `
                                                <button
                                                    type="button"
                                                    class="delete-comment-button"
                                                    data-comment-id="${comment.id}"
                                                    title="Delete comment">
                                                    🗑️
                                                </button>
                                            `
                                            : ''
                                    }

                                </div>

                            </div>

                            <p>
                                ${escapeHTML(
                                    comment.comment
                                )}
                            </p>

                        </div>
                    `;
                }
            ).join('');

        document
            .querySelectorAll(
                '.delete-comment-button'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {
                        deleteComment(
                            button.dataset.commentId,
                            button
                        );
                    }
                );
            });

    } catch (error) {

        console.error(error);

        commentsList.innerHTML = `
            <p>
                Unable to load comments.
            </p>
        `;
    }
}


// =========================
// ADD COMMENT
// =========================

commentForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();

        const comment =
            commentInput.value.trim();

        if (!comment) {

            showCommentMessage(
                'Please write a comment.',
                'error'
            );

            return;
        }

        const button =
            commentForm.querySelector(
                'button[type="submit"]'
            );

        button.disabled = true;
        button.textContent =
            'Adding...';

        try {

            const response =
                await fetch(
                    `/api/issues/${issueId}/comments`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            comment
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    'Unable to add comment.'
                );
            }

            commentInput.value = '';

            showCommentMessage(
                'Comment added successfully.',
                'success'
            );

            await loadComments();

        } catch (error) {

            console.error(error);

            showCommentMessage(
                error.message ||
                'Unable to add comment.',
                'error'
            );

        } finally {

            button.disabled = false;
            button.textContent =
                'Add Comment';
        }
    }
);


// =========================
// DELETE COMMENT
// =========================

async function deleteComment(
    commentId,
    button
) {

    const confirmed =
        window.confirm(
            'Delete this comment?'
        );

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    button.textContent = '...';

    try {

        const response =
            await fetch(
                `/api/issues/${issueId}/comments/${commentId}`,
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

            throw new Error(
                data.error ||
                'Unable to delete comment.'
            );
        }

        showCommentMessage(
            'Comment deleted.',
            'success'
        );

        await loadComments();

    } catch (error) {

        console.error(error);

        button.disabled = false;
        button.textContent = '🗑️';

        showCommentMessage(
            error.message ||
            'Unable to delete comment.',
            'error'
        );
    }
}


// =========================
// EDIT ISSUE
// =========================

async function editIssue() {

    if (!currentIssue) {
        return;
    }

    const title =
        window.prompt(
            'Issue Title:',
            currentIssue.title
        );

    if (title === null) {
        return;
    }

    const description =
        window.prompt(
            'Description:',
            currentIssue.description || ''
        );

    if (description === null) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/issues/${issueId}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        category:
                            currentIssue.category,

                        title:
                            title.trim(),

                        description:
                            description.trim(),

                        severity:
                            currentIssue.severity,

                        address:
                            currentIssue.address
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Unable to update issue.'
            );
        }

        showIssueMessage(
            'Issue updated successfully.',
            'success'
        );

        loadIssue();

    } catch (error) {

        console.error(error);

        showIssueMessage(
            error.message ||
            'Unable to update issue.',
            'error'
        );
    }
}


// =========================
// MARK RESOLVED
// =========================

async function markResolved() {

    try {

        const response =
            await fetch(
                `/api/issues/${issueId}/status`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        status: 'RESOLVED'
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Unable to mark issue resolved.'
            );
        }

        showIssueMessage(
            'Issue marked as resolved.',
            'success'
        );

        loadIssue();

    } catch (error) {

        console.error(error);

        showIssueMessage(
            error.message ||
            'Unable to update issue.',
            'error'
        );
    }
}


// =========================
// DELETE ISSUE
// =========================

async function deleteIssue() {

    const confirmed =
        window.confirm(
            'Delete this issue? This cannot be undone.'
        );

    if (!confirmed) {
        return;
    }

    const button =
        document.getElementById(
            'deleteIssueButton'
        );

    button.disabled = true;
    button.textContent =
        'Deleting...';

    try {

        const response =
            await fetch(
                `/api/issues/${issueId}`,
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

            throw new Error(
                data.error ||
                'Unable to delete issue.'
            );
        }

        window.location.href =
            '/my-reports.html';

    } catch (error) {

        console.error(error);

        button.disabled = false;
        button.textContent =
            '🗑️ Delete';

        showIssueMessage(
            error.message ||
            'Unable to delete issue.',
            'error'
        );
    }
}


// =========================
// ADMIN STATUS & DELETE
// =========================

async function adminChangeStatus(status, button) {
    const originalText = button ? button.textContent : '';
    if (button) {
        button.disabled = true;
        button.textContent = 'Updating...';
    }

    try {
        const response = await fetch(`/api/admin/issues/${issueId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update status');
        }

        const label = status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        showIssueMessage(`✓ Status changed to ${label}.`, 'success');
        await loadIssue();
    } catch (error) {
        console.error('Admin status change error:', error);
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
        showIssueMessage(error.message || 'Unable to update status.', 'error');
    }
}

async function adminDeleteIssue() {
    if (!confirm('Are you sure you want to permanently delete this report as Administrator?')) {
        return;
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

        alert('Issue deleted successfully.');
        window.location.href = '/admin.html';
    } catch (error) {
        showIssueMessage(error.message || 'Failed to delete issue.', 'error');
    }
}


// =========================
// MESSAGES
// =========================

function showIssueMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            'issueMessage'
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `page-message ${type}`;

    element.style.display =
        'block';

    setTimeout(() => {

        element.style.display =
            'none';

    }, 3500);
}


function showCommentMessage(
    message,
    type
) {

    let element =
        document.getElementById(
            'commentMessage'
        );

    if (!element) {

        element =
            document.createElement(
                'div'
            );

        element.id =
            'commentMessage';

        element.className =
            'page-message';

        commentForm.parentNode.insertBefore(
            element,
            commentForm
        );
    }

    element.textContent =
        message;

    element.className =
        `page-message ${type}`;

    element.style.display =
        'block';

    setTimeout(() => {

        element.style.display =
            'none';

    }, 3000);
}


// =========================
// HELPERS
// =========================

function formatDate(date) {

    if (!date) {
        return 'Unknown';
    }

    return new Date(
        date
    ).toLocaleString();
}


function escapeHTML(value) {

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