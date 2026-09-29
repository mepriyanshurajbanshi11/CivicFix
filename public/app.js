let authToken =
    localStorage.getItem('civic_token');

let currentUser =
    JSON.parse(
        localStorage.getItem('civic_user') || 'null'
    );


document.addEventListener(
    'DOMContentLoaded',
    () => {

        setupAuthButtons();
        checkLogin();

    }
);


function setupAuthButtons() {

    const showRegister =
        document.getElementById(
            'showRegister'
        );

    const showLogin =
        document.getElementById(
            'showLogin'
        );

    const forgotPasswordButton =
        document.getElementById(
            'forgotPasswordButton'
        );

    const backToLogin =
        document.getElementById(
            'backToLogin'
        );


    if (showRegister) {

        showRegister.addEventListener(
            'click',
            () => {

                document.getElementById(
                    'loginSection'
                ).style.display = 'none';

                document.getElementById(
                    'registerSection'
                ).style.display = 'block';

                document.getElementById(
                    'verificationSection'
                ).style.display = 'none';

                document.getElementById(
                    'forgotPasswordSection'
                ).style.display = 'none';

                clearMessages();

            }
        );

    }


    if (showLogin) {

        showLogin.addEventListener(
            'click',
            showLoginSection
        );

    }


    if (forgotPasswordButton) {

        forgotPasswordButton.addEventListener(
            'click',
            () => {

                const loginEmail =
                    document.getElementById(
                        'loginEmail'
                    ).value.trim();

                document.getElementById(
                    'loginSection'
                ).style.display = 'none';

                document.getElementById(
                    'registerSection'
                ).style.display = 'none';

                document.getElementById(
                    'verificationSection'
                ).style.display = 'none';

                document.getElementById(
                    'forgotPasswordSection'
                ).style.display = 'block';

                document.getElementById(
                    'forgotEmail'
                ).value = loginEmail;

                clearMessages();

            }
        );

    }


    if (backToLogin) {

        backToLogin.addEventListener(
            'click',
            showLoginSection
        );

    }


    const registerForm =
        document.getElementById(
            'registerForm'
        );

    if (registerForm) {

        registerForm.addEventListener(
            'submit',
            registerUser
        );

    }


    const loginForm =
        document.getElementById(
            'loginForm'
        );

    if (loginForm) {

        loginForm.addEventListener(
            'submit',
            loginUser
        );

    }


    const verificationForm =
        document.getElementById(
            'verificationForm'
        );

    if (verificationForm) {

        verificationForm.addEventListener(
            'submit',
            verifyEmail
        );

    }


    const forgotPasswordForm =
        document.getElementById(
            'forgotPasswordForm'
        );

    if (forgotPasswordForm) {

        forgotPasswordForm.addEventListener(
            'submit',
            sendForgotPasswordOTP
        );

    }


    const resetPasswordForm =
        document.getElementById(
            'resetPasswordForm'
        );

    if (resetPasswordForm) {

        resetPasswordForm.addEventListener(
            'submit',
            resetPassword
        );

    }

}


function showLoginSection() {

    document.getElementById(
        'loginSection'
    ).style.display = 'block';

    document.getElementById(
        'registerSection'
    ).style.display = 'none';

    document.getElementById(
        'verificationSection'
    ).style.display = 'none';

    document.getElementById(
        'forgotPasswordSection'
    ).style.display = 'none';

    document.getElementById(
        'resetPasswordSection'
    ).style.display = 'none';

    clearMessages();

}


function clearMessages() {

    const messages =
        document.querySelectorAll(
            '.message'
        );

    messages.forEach(
        message => {
            message.textContent = '';
        }
    );

}


async function registerUser(event) {

    event.preventDefault();

    const name =
        document.getElementById(
            'registerName'
        ).value.trim();

    const email =
        document.getElementById(
            'registerEmail'
        ).value.trim();

    const password =
        document.getElementById(
            'registerPassword'
        ).value;

    const message =
        document.getElementById(
            'registerMessage'
        );


    if (
        !name ||
        !email ||
        !password
    ) {

        message.textContent =
            'Please fill all fields.';

        return;

    }


    if (password.length < 6) {

        message.textContent =
            'Password must contain at least 6 characters.';

        return;

    }


    message.textContent =
        'Creating your account...';


    try {

        const response =
            await fetch(
                '/api/register',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            name,
                            email,
                            password
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.error ||
                'Registration failed.';

            return;

        }


        sessionStorage.setItem(
            'civic_verification_email',
            email
        );


        document.getElementById(
            'loginSection'
        ).style.display = 'none';

        document.getElementById(
            'registerSection'
        ).style.display = 'none';

        document.getElementById(
            'verificationSection'
        ).style.display = 'block';


        document.getElementById(
            'verificationMessage'
        ).textContent =
            'Enter the OTP sent to your Gmail address.';


    } catch (error) {

        console.error(error);

        message.textContent =
            'Cannot connect to the server. Make sure Node.js is running.';

    }

}


async function verifyEmail(event) {

    event.preventDefault();


    const otp =
        document.getElementById(
            'otp'
        ).value.trim();


    const email =
        sessionStorage.getItem(
            'civic_verification_email'
        );


    const message =
        document.getElementById(
            'verificationMessage'
        );


    if (!email) {

        message.textContent =
            'Verification email not found. Please register again.';

        return;

    }


    if (!otp) {

        message.textContent =
            'Please enter the OTP.';

        return;

    }


    message.textContent =
        'Verifying...';


    try {

        const response =
            await fetch(
                '/api/verify-email',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email,
                            otp
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.error ||
                'Verification failed.';

            return;

        }


        sessionStorage.removeItem(
            'civic_verification_email'
        );


        alert(
            data.message ||
            'Email verified successfully. You can now login.'
        );


        showLoginSection();


        document.getElementById(
            'loginEmail'
        ).value = email;


        document.getElementById(
            'otp'
        ).value = '';


    } catch (error) {

        console.error(error);

        message.textContent =
            'Cannot connect to the server.';

    }

}


async function loginUser(event) {

    event.preventDefault();


    const email =
        document.getElementById(
            'loginEmail'
        ).value.trim();


    const password =
        document.getElementById(
            'loginPassword'
        ).value;


    const message =
        document.getElementById(
            'loginMessage'
        );


    if (!email || !password) {

        message.textContent =
            'Please enter email and password.';

        return;

    }


    message.textContent =
        'Logging in...';


    try {

        const response =
            await fetch(
                '/api/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email,
                            password
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.error ||
                'Login failed.';

            return;

        }


        localStorage.setItem(
            'civic_token',
            data.token
        );


        localStorage.setItem(
            'civic_user',
            JSON.stringify(
                data.user
            )
        );


        authToken =
            data.token;

        currentUser =
            data.user;


        window.location.href =
            '/dashboard.html';


    } catch (error) {

        console.error(error);

        message.textContent =
            'Cannot connect to the server.';

    }

}


async function sendForgotPasswordOTP(event) {

    event.preventDefault();


    const email =
        document.getElementById(
            'forgotEmail'
        ).value.trim();


    const message =
        document.getElementById(
            'forgotPasswordMessage'
        );


    if (!email) {

        message.textContent =
            'Please enter your Gmail address.';

        return;

    }


    message.textContent =
        'Sending OTP...';


    try {

        const response =
            await fetch(
                '/api/forgot-password',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.error ||
                'Could not send OTP.';

            return;

        }


        sessionStorage.setItem(
            'civic_reset_email',
            email
        );


        message.textContent =
            'OTP sent to your Gmail.';


        document.getElementById(
            'resetPasswordSection'
        ).style.display = 'block';


    } catch (error) {

        console.error(error);

        message.textContent =
            'Cannot connect to the server.';

    }

}


async function resetPassword(event) {

    event.preventDefault();


    const email =
        sessionStorage.getItem(
            'civic_reset_email'
        );


    const otp =
        document.getElementById(
            'resetOtp'
        ).value.trim();


    const newPassword =
        document.getElementById(
            'newPassword'
        ).value;


    const confirmPassword =
        document.getElementById(
            'confirmPassword'
        ).value;


    const message =
        document.getElementById(
            'resetPasswordMessage'
        );


    if (!email) {

        message.textContent =
            'Reset request not found. Please start again.';

        return;

    }


    if (!otp) {

        message.textContent =
            'Please enter the OTP.';

        return;

    }


    if (newPassword.length < 6) {

        message.textContent =
            'Password must contain at least 6 characters.';

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        message.textContent =
            'Passwords do not match.';

        return;

    }


    message.textContent =
        'Resetting password...';


    try {

        const response =
            await fetch(
                '/api/reset-password',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email,
                            otp,
                            newPassword
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.error ||
                'Password reset failed.';

            return;

        }


        sessionStorage.removeItem(
            'civic_reset_email'
        );


        alert(
            data.message ||
            'Password reset successfully.'
        );


        document.getElementById(
            'forgotPasswordForm'
        ).reset();


        document.getElementById(
            'resetPasswordForm'
        ).reset();


        showLoginSection();


        document.getElementById(
            'loginEmail'
        ).value = email;


    } catch (error) {

        console.error(error);

        message.textContent =
            'Cannot connect to the server.';

    }

}


function checkLogin() {
    // Login page does not need anything else.
}