require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const multer = require('multer');

const db = require('./db');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;


// =========================
// BASIC SETUP
// =========================

app.use(cors());
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);


// =========================
// UPLOADS
// =========================

const uploadsDir =
    path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(
        uploadsDir,
        { recursive: true }
    );
}

app.use(
    '/uploads',
    express.static(uploadsDir)
);


// =========================
// MULTER
// =========================

const storage =
    multer.diskStorage({

        destination: (req, file, cb) => {
            cb(null, uploadsDir);
        },

        filename: (req, file, cb) => {

            const extension =
                path.extname(
                    file.originalname
                );

            const filename =
                `${Date.now()}-${Math.round(
                    Math.random() * 1e9
                )}${extension}`;

            cb(
                null,
                filename
            );
        }

    });


const upload =
    multer({

        storage,

        limits: {
           fileSize:
             20 * 1024 * 1024
        },

        fileFilter:
            (req, file, cb) => {

                if (
                    file.mimetype.startsWith(
                        'image/'
                    )
                ) {
                    cb(null, true);
                } else {
                    cb(
                        new Error(
                            'Only image files are allowed'
                        )
                    );
                }

            }

    });


// =========================
// EMAIL
// =========================

const transporter =
    nodemailer.createTransport({

        service: 'gmail',

        auth: {
            user:
                process.env.EMAIL_USER,

            pass:
                process.env.EMAIL_PASSWORD
        }

    });


// =========================
// HELPERS
// =========================

function generateOTP() {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();

}


function getDistanceMeters(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const toRad =
        degrees =>
            degrees *
            Math.PI /
            180;

    const dLat =
        toRad(
            lat2 - lat1
        );

    const dLon =
        toRad(
            lon2 - lon1
        );

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(
            toRad(lat1)
        ) *
        Math.cos(
            toRad(lat2)
        ) *
        Math.sin(dLon / 2) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


function authenticate(
    req,
    res,
    next
) {

    const header =
        req.headers.authorization;

    const token =
        header &&
        header.split(' ')[1];

    if (!token) {

        return res.status(401).json({
            error:
                'Access token required'
        });

    }

    jwt.verify(
        token,
        JWT_SECRET,
        (err, user) => {

            if (err) {

                return res.status(403).json({
                    error:
                        'Invalid or expired token'
                });

            }

            req.user =
                user;

            next();

        }
    );

}


// =========================
// REGISTER
// =========================

app.post(
    '/api/register',
    async (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;

            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({
                    error:
                        'All fields are required'
                });

            }

            if (
                password.length < 6
            ) {

                return res.status(400).json({
                    error:
                        'Password must contain at least 6 characters'
                });

            }

            db.query(
                `SELECT
                    id,
                    name,
                    email_verified
                 FROM users
                 WHERE email = ?`,
                [email],
                async (
                    err,
                    results
                ) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            error:
                                'Database error'
                        });

                    }

                    if (
                        results.length > 0
                    ) {

                        if (
                            results[0]
                                .email_verified
                        ) {

                            return res.status(400).json({
                                error:
                                    'Email already registered'
                            });

                        }

                        const userId =
                            results[0].id;

                        const userName =
                            results[0].name ||
                            name;

                        const otp =
                            generateOTP();

                        const expiresAt =
                            new Date(
                                Date.now() +
                                10 * 60 * 1000
                            );

                        db.query(
                            `UPDATE
                                email_verifications
                             SET
                                otp = ?,
                                expires_at = ?,
                                verified = FALSE
                             WHERE
                                user_id = ?`,
                            [
                                otp,
                                expiresAt,
                                userId
                            ],
                            async updateErr => {

                                if (updateErr) {

                                    return res.status(500).json({
                                        error:
                                            'Failed to create OTP'
                                    });

                                }

                                await sendOTPEmail(
                                    email,
                                    userName,
                                    otp,
                                    res
                                );

                            }
                        );

                        return;
                    }


                    const hashedPassword =
                        await bcrypt.hash(
                            password,
                            10
                        );


                    db.query(
                        `INSERT INTO users
                        (
                            name,
                            email,
                            password,
                            role,
                            email_verified
                        )
                        VALUES
                        (?, ?, ?, 'CITIZEN', FALSE)`,
                        [
                            name,
                            email,
                            hashedPassword
                        ],
                        (
                            insertErr,
                            result
                        ) => {

                            if (insertErr) {

                                console.error(
                                    insertErr
                                );

                                return res.status(400).json({
                                    error:
                                        'Unable to create account'
                                });

                            }


                            const userId =
                                result.insertId;

                            const otp =
                                generateOTP();

                            const expiresAt =
                                new Date(
                                    Date.now() +
                                    10 * 60 * 1000
                                );


                            db.query(
                                `INSERT INTO
                                email_verifications
                                (
                                    user_id,
                                    otp,
                                    expires_at,
                                    verified
                                )
                                VALUES
                                (?, ?, ?, FALSE)`,
                                [
                                    userId,
                                    otp,
                                    expiresAt
                                ],
                                async otpErr => {

                                    if (otpErr) {

                                        console.error(
                                            otpErr
                                        );

                                        return res.status(500).json({
                                            error:
                                                'Failed to create verification code'
                                        });

                                    }

                                    await sendOTPEmail(
                                        email,
                                        name,
                                        otp,
                                        res
                                    );

                                }
                            );

                        }
                    );

                }
            );

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    'Registration failed'
            });

        }

    }
);


// =========================
// SEND OTP
// =========================

async function sendOTPEmail(
    email,
    name,
    otp,
    res
) {

    try {

        await transporter.sendMail({

            from:
                `"CivicFix" <${process.env.EMAIL_USER}>`,

            to:
                email,

            subject:
                'CivicFix Email Verification OTP',

            text:
`Hello ${name},

Your CivicFix verification code is:

${otp}

This OTP is valid for 10 minutes.

If you did not create a CivicFix account, you can ignore this email.

CivicFix`

        });


        console.log(
            `OTP sent to ${email}`
        );


        res.json({

            message:
                'OTP sent to your Gmail address',

            requiresVerification:
                true

        });

    } catch (error) {

        console.error(
            'Email error:',
            error
        );

        res.status(500).json({
            error:
                'Could not send verification email'
        });

    }

}


// =========================
// VERIFY EMAIL
// =========================

app.post(
    '/api/verify-email',
    (req, res) => {

        const {
            email,
            otp
        } = req.body;


        if (
            !email ||
            !otp
        ) {

            return res.status(400).json({
                error:
                    'Email and OTP are required'
            });

        }


        db.query(
            `SELECT
                users.id AS user_id,
                email_verifications.id
                    AS verification_id,
                email_verifications.otp,
                email_verifications.expires_at
             FROM users
             JOIN email_verifications
                ON users.id =
                   email_verifications.user_id
             WHERE users.email = ?
             AND email_verifications.verified = FALSE
             ORDER BY email_verifications.id DESC
             LIMIT 1`,
            [email],
            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Database error'
                    });

                }


                if (
                    results.length === 0
                ) {

                    return res.status(400).json({
                        error:
                            'Verification request not found'
                    });

                }


                const verification =
                    results[0];


                if (
                    new Date() >
                    new Date(
                        verification.expires_at
                    )
                ) {

                    return res.status(400).json({
                        error:
                            'OTP has expired'
                    });

                }


                if (
                    otp.toString() !==
                    verification.otp.toString()
                ) {

                    return res.status(400).json({
                        error:
                            'Invalid OTP'
                    });

                }


                db.query(
                    `UPDATE users
                     SET email_verified = TRUE
                     WHERE id = ?`,
                    [
                        verification.user_id
                    ],
                    userErr => {

                        if (userErr) {

                            return res.status(500).json({
                                error:
                                    'Failed to verify email'
                            });

                        }


                        db.query(
                            `UPDATE email_verifications
                             SET verified = TRUE
                             WHERE id = ?`,
                            [
                                verification.verification_id
                            ],
                            verifyErr => {

                                if (verifyErr) {

                                    return res.status(500).json({
                                        error:
                                            'Failed to complete verification'
                                    });

                                }


                                res.json({
                                    message:
                                        'Email verified successfully. You can now login.'
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);
// =========================
// FORGOT PASSWORD
// =========================

app.post(
    '/api/forgot-password',
    (req, res) => {

        const {
            email
        } = req.body;

        if (!email) {

            return res.status(400).json({
                error:
                    'Email is required'
            });

        }

        db.query(
            `SELECT
                id,
                name,
                email
             FROM users
             WHERE email = ?`,
            [email],
            async (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error:
                            'Database error'
                    });

                }

                if (
                    results.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            'No account found with this email'
                    });

                }

                const user =
                    results[0];

                const otp =
                    generateOTP();

                const expiresAt =
                    new Date(
                        Date.now() +
                        10 * 60 * 1000
                    );

                db.query(
                    `INSERT INTO
                    email_verifications
                    (
                        user_id,
                        otp,
                        expires_at,
                        verified
                    )
                    VALUES
                    (?, ?, ?, FALSE)`,
                    [
                        user.id,
                        `RESET:${otp}`,
                        expiresAt
                    ],
                    async insertErr => {

                        if (insertErr) {

                            console.error(
                                insertErr
                            );

                            return res.status(500).json({
                                error:
                                    'Failed to create reset OTP'
                            });

                        }

                        try {

                            await transporter.sendMail({

                                from:
                                    `"CivicFix" <${process.env.EMAIL_USER}>`,

                                to:
                                    user.email,

                                subject:
                                    'CivicFix Password Reset OTP',

                                text:
`Hello ${user.name},

Your CivicFix password reset OTP is:

${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, you can ignore this email.

CivicFix`

                            });

                            res.json({

                                message:
                                    'Password reset OTP sent to your email'

                            });

                        } catch (emailError) {

                            console.error(
                                'Email error:',
                                emailError
                            );

                            res.status(500).json({
                                error:
                                    'Could not send password reset email'
                            });

                        }

                    }
                );

            }
        );

    }
);


// =========================
// RESET PASSWORD
// =========================

app.post(
    '/api/reset-password',
    async (req, res) => {

        const {
            email,
            otp,
            newPassword
        } = req.body;

        if (
            !email ||
            !otp ||
            !newPassword
        ) {

            return res.status(400).json({
                error:
                    'Email, OTP and new password are required'
            });

        }

        if (
            newPassword.length < 6
        ) {

            return res.status(400).json({
                error:
                    'Password must contain at least 6 characters'
            });

        }

        db.query(
            `SELECT
                users.id AS user_id,
                email_verifications.id
                    AS verification_id,
                email_verifications.otp,
                email_verifications.expires_at
             FROM users
             JOIN email_verifications
                ON users.id =
                   email_verifications.user_id
             WHERE users.email = ?
             AND email_verifications.verified = FALSE
             AND email_verifications.otp LIKE 'RESET:%'
             ORDER BY email_verifications.id DESC
             LIMIT 1`,
            [email],
            async (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error:
                            'Database error'
                    });

                }

                if (
                    results.length === 0
                ) {

                    return res.status(400).json({
                        error:
                            'Password reset request not found'
                    });

                }

                const reset =
                    results[0];

                if (
                    new Date() >
                    new Date(
                        reset.expires_at
                    )
                ) {

                    return res.status(400).json({
                        error:
                            'OTP has expired'
                    });

                }

                const storedOTP =
                    reset.otp.replace(
                        'RESET:',
                        ''
                    );

                if (
                    otp.toString() !==
                    storedOTP.toString()
                ) {

                    return res.status(400).json({
                        error:
                            'Invalid OTP'
                    });

                }

                try {

                    const hashedPassword =
                        await bcrypt.hash(
                            newPassword,
                            10
                        );

                    db.query(
                        `UPDATE users
                         SET password = ?
                         WHERE id = ?`,
                        [
                            hashedPassword,
                            reset.user_id
                        ],
                        (updateErr) => {

                            if (updateErr) {

                                console.error(
                                    updateErr
                                );

                                return res.status(500).json({
                                    error:
                                        'Failed to update password'
                                });

                            }

                            db.query(
                                `UPDATE email_verifications
                                 SET verified = TRUE
                                 WHERE id = ?`,
                                [
                                    reset.verification_id
                                ],
                                verifyErr => {

                                    if (verifyErr) {

                                        console.error(
                                            verifyErr
                                        );

                                        return res.status(500).json({
                                            error:
                                                'Failed to complete password reset'
                                        });

                                    }

                                    res.json({

                                        message:
                                            'Password reset successfully. You can now login.'

                                    });

                                }
                            );

                        }
                    );

                } catch (error) {

                    console.error(error);

                    res.status(500).json({
                        error:
                            'Failed to reset password'
                    });

                }

            }
        );

    }
);

// =========================
// LOGIN
// =========================

app.post(
    '/api/login',
    (req, res) => {

        const {
            email,
            password
        } = req.body;


        if (
            !email ||
            !password
        ) {

            return res.status(400).json({
                error:
                    'Email and password are required'
            });

        }


        db.query(
            'SELECT * FROM users WHERE email = ?',
            [email],
            async (
                err,
                results
            ) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Database error'
                    });

                }


                if (
                    results.length === 0
                ) {

                    return res.status(400).json({
                        error:
                            'Invalid credentials'
                    });

                }


                const user =
                    results[0];


                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );


                if (!passwordMatch) {

                    return res.status(400).json({
                        error:
                            'Invalid credentials'
                    });

                }


                if (
                    user.role === 'CITIZEN' &&
                    !user.email_verified
                ) {

                    return res.status(403).json({
                        error:
                            'Please verify your email before logging in',

                        requiresVerification:
                            true
                    });

                }


                const token =
                    jwt.sign(
                        {
                            id:
                                user.id,

                            name:
                                user.name,

                            role:
                                user.role
                        },

                        JWT_SECRET,

                        {
                            expiresIn:
                                '7d'
                        }
                    );


                res.json({

                    token,

                    user: {

                        id:
                            user.id,

                        name:
                            user.name,

                        email:
                            user.email,

                        role:
                            user.role,

                        profile_photo:
                            user.profile_photo ||
                            null

                    }

                });

            }
        );

    }
);


// =========================
// CREATE ISSUE
// =========================

app.post(
    '/api/issues',
    authenticate,
    upload.single('image'),
    (req, res) => {

        const {
            category,
            title,
            description,
            severity,
            latitude,
            longitude,
            address
        } = req.body;


        const lat =
            parseFloat(latitude);

        const lon =
            parseFloat(longitude);


        if (
            !category ||
            !title ||
            isNaN(lat) ||
            isNaN(lon) ||
            !address
        ) {

            if (req.file) {

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }


            return res.status(400).json({
                error:
                    'Required issue information is missing'
            });

        }


        db.query(
            `SELECT *
             FROM issues
             WHERE category = ?
             AND status != 'RESOLVED'`,
            [category],
            (
                err,
                existingIssues
            ) => {

                if (err) {

                    if (req.file) {

                        fs.unlink(
                            req.file.path,
                            () => {}
                        );

                    }

                    return res.status(500).json({
                        error:
                            'Database check failed'
                    });

                }


                for (
                    const issue
                    of existingIssues
                ) {

                    const distance =
                        getDistanceMeters(
                            lat,
                            lon,
                            parseFloat(
                                issue.latitude
                            ),
                            parseFloat(
                                issue.longitude
                            )
                        );


                    if (
                        distance <= 50
                    ) {

                        if (req.file) {

                            fs.unlink(
                                req.file.path,
                                () => {}
                            );

                        }


                        db.query(
                            `UPDATE issues
                             SET upvote_count =
                                 upvote_count + 1
                             WHERE id = ?`,
                            [issue.id],
                            () => {

                                return res.json({

                                    merged:
                                        true,

                                    message:
                                        `A nearby ${category} was already reported (${Math.round(distance)}m away). Your report was added as an upvote.`,

                                    issueId:
                                        issue.id

                                });

                            }
                        );

                        return;

                    }

                }


                db.query(
                    `INSERT INTO issues
                    (
                        user_id,
                        category,
                        title,
                        description,
                        severity,
                        latitude,
                        longitude,
                        address
                    )
                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        req.user.id,
                        category,
                        title,
                        description || '',
                        severity || 'MEDIUM',
                        lat,
                        lon,
                        address
                    ],
                    (
                        insertErr,
                        result
                    ) => {

                        if (insertErr) {

                            if (req.file) {

                                fs.unlink(
                                    req.file.path,
                                    () => {}
                                );

                            }

                            console.error(
                                insertErr
                            );

                            return res.status(500).json({
                                error:
                                    'Failed to record issue'
                            });

                        }


                        const issueId =
                            result.insertId;


                        if (!req.file) {

                            return res.json({

                                merged:
                                    false,

                                message:
                                    'Civic issue reported successfully!',

                                issueId

                            });

                        }


                        const imagePath =
                            `/uploads/${req.file.filename}`;


                        db.query(
                            `INSERT INTO issue_images
                            (
                                issue_id,
                                image_path
                            )
                            VALUES (?, ?)`,
                            [
                                issueId,
                                imagePath
                            ],
                            imageErr => {

                                if (imageErr) {

                                    console.error(
                                        imageErr
                                    );

                                    return res.status(500).json({
                                        error:
                                            'Issue created but image could not be saved'
                                    });

                                }


                                res.json({

                                    merged:
                                        false,

                                    message:
                                        'Civic issue reported successfully!',

                                    issueId

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// =========================
// GET ALL ISSUES
// =========================

app.get(
    '/api/issues',
    (req, res) => {

        const {
            category,
            status
        } = req.query;


        let query =
            `SELECT
                issues.*,
                users.name AS reporter_name,
                (
                    SELECT image_path
                    FROM issue_images
                    WHERE issue_images.issue_id =
                          issues.id
                    ORDER BY issue_images.id ASC
                    LIMIT 1
                ) AS image_path
             FROM issues
             JOIN users
                ON issues.user_id = users.id
             WHERE 1 = 1`;


        const params = [];


        if (category) {

            query +=
                ` AND issues.category = ?`;

            params.push(
                category
            );

        }


        if (status) {

            query +=
                ` AND issues.status = ?`;

            params.push(
                status
            );

        }


        query +=
            ` ORDER BY
                issues.upvote_count DESC,
                issues.id DESC`;


        db.query(
            query,
            params,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to fetch issues'
                    });

                }


                res.json(rows);

            }
        );

    }
);


// =========================
// GET SINGLE ISSUE
// =========================

app.get(
    '/api/issues/:id',
    (req, res) => {

        db.query(
            `SELECT
                issues.*,
                users.name AS reporter_name,
                (
                    SELECT image_path
                    FROM issue_images
                    WHERE issue_images.issue_id =
                          issues.id
                    ORDER BY issue_images.id ASC
                    LIMIT 1
                ) AS image_path
             FROM issues
             JOIN users
                ON issues.user_id = users.id
             WHERE issues.id = ?`,
            [req.params.id],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to fetch issue'
                    });

                }


                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            'Issue not found'
                    });

                }


                res.json(
                    rows[0]
                );

            }
        );

    }
);


// =========================
// MY ISSUES
// =========================

app.get(
    '/api/my-issues',
    authenticate,
    (req, res) => {

        db.query(
            `SELECT
                issues.*,
                (
                    SELECT image_path
                    FROM issue_images
                    WHERE issue_images.issue_id =
                          issues.id
                    ORDER BY issue_images.id ASC
                    LIMIT 1
                ) AS image_path
             FROM issues
             WHERE user_id = ?
             ORDER BY id DESC`,
            [req.user.id],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to fetch your issues'
                    });

                }


                res.json(rows);

            }
        );

    }
);


// =========================
// EDIT OWN ISSUE
// =========================

app.put(
    '/api/issues/:id',
    authenticate,
    (req, res) => {

        const {
            category,
            title,
            description,
            severity,
            address
        } = req.body;


        db.query(
            `UPDATE issues
             SET
                category = ?,
                title = ?,
                description = ?,
                severity = ?,
                address = ?
             WHERE id = ?
             AND user_id = ?`,
            [
                category,
                title,
                description,
                severity,
                address,
                req.params.id,
                req.user.id
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to update issue'
                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        error:
                            'Issue not found or not owned by you'
                    });

                }


                res.json({
                    message:
                        'Issue updated successfully'
                });

            }
        );

    }
);


// =========================
// DELETE OWN ISSUE
// =========================

app.delete(
    '/api/issues/:id',
    authenticate,
    (req, res) => {

        db.query(
            `DELETE FROM issues
             WHERE id = ?
             AND user_id = ?`,
            [
                req.params.id,
                req.user.id
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to delete issue'
                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        error:
                            'Issue not found or not owned by you'
                    });

                }


                res.json({
                    message:
                        'Issue deleted successfully'
                });

            }
        );

    }
);


// =========================
// CITIZEN STATUS
// =========================

app.put(
    '/api/issues/:id/status',
    authenticate,
    (req, res) => {

        const {
            status
        } = req.body;


        const allowedStatuses = [
            'OPEN',
            'IN_PROGRESS',
            'RESOLVED'
        ];


        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return res.status(400).json({
                error:
                    'Invalid status'
            });

        }


        db.query(
            `UPDATE issues
             SET status = ?
             WHERE id = ?
             AND user_id = ?`,
            [
                status,
                req.params.id,
                req.user.id
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to update status'
                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        error:
                            'Issue not found or not owned by you'
                    });

                }


                res.json({
                    message:
                        `Status changed to ${status}`
                });

            }
        );

    }
);


// =========================
// UPVOTE
// =========================

app.post(
    '/api/issues/:id/upvote',
    authenticate,
    (req, res) => {

        db.query(
            `INSERT INTO issue_upvotes
            (
                issue_id,
                user_id
            )
            VALUES (?, ?)`,
            [
                req.params.id,
                req.user.id
            ],
            err => {

                if (err) {

                    if (
                        err.code ===
                        'ER_DUP_ENTRY'
                    ) {

                        return res.status(400).json({
                            error:
                                'You already upvoted this issue'
                        });

                    }


                    return res.status(500).json({
                        error:
                            'Failed to upvote'
                    });

                }


                db.query(
                    `UPDATE issues
                     SET upvote_count =
                         upvote_count + 1
                     WHERE id = ?`,
                    [req.params.id],
                    updateErr => {

                        if (updateErr) {

                            return res.status(500).json({
                                error:
                                    'Failed to update upvote count'
                            });

                        }


                        res.json({
                            message:
                                'Issue upvoted successfully'
                        });

                    }
                );

            }
        );

    }
);


// =========================
// CHECK UPVOTE
// =========================

app.get(
    '/api/issues/:id/upvote-status',
    authenticate,
    (req, res) => {

        db.query(
            `SELECT id
             FROM issue_upvotes
             WHERE issue_id = ?
             AND user_id = ?
             LIMIT 1`,
            [
                req.params.id,
                req.user.id
            ],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to check upvote status'
                    });

                }


                res.json({
                    upvoted:
                        rows.length > 0
                });

            }
        );

    }
);


// =========================
// GET COMMENTS
// =========================

app.get(
    '/api/issues/:issueId/comments',
    (req, res) => {

        db.query(
            `SELECT
                issue_comments.id,
                issue_comments.issue_id,
                issue_comments.user_id,
                issue_comments.comment,
                issue_comments.created_at,
                users.name AS user_name
             FROM issue_comments
             JOIN users
                ON issue_comments.user_id =
                   users.id
             WHERE issue_comments.issue_id = ?
             ORDER BY
                issue_comments.created_at ASC`,
            [
                req.params.issueId
            ],
            (err, rows) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        error:
                            'Failed to load comments'
                    });

                }


                res.json(rows);

            }
        );

    }
);


// =========================
// ADD COMMENT
// =========================

app.post(
    '/api/issues/:issueId/comments',
    authenticate,
    (req, res) => {

        const comment =
            String(
                req.body.comment || ''
            ).trim();


        if (!comment) {

            return res.status(400).json({
                error:
                    'Comment cannot be empty'
            });

        }


        if (
            comment.length > 500
        ) {

            return res.status(400).json({
                error:
                    'Comment is too long'
            });

        }


        db.query(
            `SELECT id
             FROM issues
             WHERE id = ?`,
            [
                req.params.issueId
            ],
            (
                issueErr,
                issues
            ) => {

                if (issueErr) {

                    return res.status(500).json({
                        error:
                            'Database error'
                    });

                }


                if (
                    issues.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            'Issue not found'
                    });

                }


                db.query(
                    `INSERT INTO issue_comments
                    (
                        issue_id,
                        user_id,
                        comment
                    )
                    VALUES (?, ?, ?)`,
                    [
                        req.params.issueId,
                        req.user.id,
                        comment
                    ],
                    (
                        err,
                        result
                    ) => {

                        if (err) {

                            console.error(
                                err
                            );

                            return res.status(500).json({
                                error:
                                    'Failed to add comment'
                            });

                        }


                        res.json({

                            message:
                                'Comment added successfully',

                            commentId:
                                result.insertId

                        });

                    }
                );

            }
        );

    }
);


// =========================
// DELETE COMMENT
// =========================

app.delete(
    '/api/issues/:issueId/comments/:commentId',
    authenticate,
    (req, res) => {

        db.query(
            `SELECT
                issue_comments.id,
                issue_comments.user_id
                    AS comment_user_id,
                issues.user_id
                    AS issue_owner_id
             FROM issue_comments
             JOIN issues
                ON issue_comments.issue_id =
                   issues.id
             WHERE issue_comments.id = ?
             AND issue_comments.issue_id = ?`,
            [
                req.params.commentId,
                req.params.issueId
            ],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Database error'
                    });

                }


                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({
                        error:
                            'Comment not found'
                    });

                }


                const comment =
                    rows[0];


                const isCommentAuthor =
                    Number(
                        comment.comment_user_id
                    ) ===
                    Number(
                        req.user.id
                    );


                const isIssueOwner =
                    Number(
                        comment.issue_owner_id
                    ) ===
                    Number(
                        req.user.id
                    );


                if (
                    !isCommentAuthor &&
                    !isIssueOwner
                ) {

                    return res.status(403).json({
                        error:
                            'Only the comment author or issue owner can delete this comment'
                    });

                }


                db.query(
                    `DELETE FROM issue_comments
                     WHERE id = ?
                     AND issue_id = ?`,
                    [
                        req.params.commentId,
                        req.params.issueId
                    ],
                    deleteErr => {

                        if (deleteErr) {

                            return res.status(500).json({
                                error:
                                    'Failed to delete comment'
                            });

                        }


                        res.json({
                            message:
                                'Comment deleted successfully'
                        });

                    }
                );

            }
        );

    }
);


// =========================
// ADMIN STATS
// =========================

app.get(
    '/api/admin/stats',
    authenticate,
    (req, res) => {

        if (
            req.user.role !== 'ADMIN'
        ) {

            return res.status(403).json({
                error:
                    'Admins only'
            });

        }


        db.query(
            `SELECT
                status,
                COUNT(*) AS count
             FROM issues
             GROUP BY status`,
            [],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to load statistics'
                    });

                }


                const stats = {

                    OPEN: 0,

                    IN_PROGRESS: 0,

                    RESOLVED: 0

                };


                rows.forEach(row => {

                    stats[row.status] =
                        row.count;

                });


                res.json(stats);

            }
        );

    }
);


// =========================
// ADMIN STATUS
// =========================

app.put(
    '/api/admin/issues/:id/status',
    authenticate,
    (req, res) => {

        if (
            req.user.role !== 'ADMIN'
        ) {

            return res.status(403).json({
                error:
                    'Admins only'
            });

        }


        const {
            status
        } = req.body;


        const allowedStatuses = [
            'OPEN',
            'IN_PROGRESS',
            'RESOLVED'
        ];


        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return res.status(400).json({
                error:
                    'Invalid status'
            });

        }


        db.query(
            `UPDATE issues
             SET status = ?
             WHERE id = ?`,
            [
                status,
                req.params.id
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error:
                            'Failed to update status'
                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        error:
                            'Issue not found'
                    });

                }


                res.json({
                    message:
                        `Status changed to ${status}`
                });

            }
        );

    }
);


// =========================
// UPDATE PROFILE
// =========================

app.put(
    '/api/profile',
    authenticate,
    upload.single('profilePhoto'),
    (req, res) => {

        const newName =
            String(
                req.body.name || ''
            ).trim();


        if (!newName) {

            if (req.file) {

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }

            return res.status(400).json({
                error:
                    'Name is required'
            });

        }


        if (
            newName.length < 2
        ) {

            if (req.file) {

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }

            return res.status(400).json({
                error:
                    'Name must contain at least 2 characters'
            });

        }


        if (
            newName.length > 100
        ) {

            if (req.file) {

                fs.unlink(
                    req.file.path,
                    () => {}
                );

            }

            return res.status(400).json({
                error:
                    'Name must be less than 100 characters'
            });

        }


        db.query(
            `SELECT
                profile_photo
             FROM users
             WHERE id = ?`,
            [
                req.user.id
            ],
            (
                selectErr,
                rows
            ) => {

                if (selectErr) {

                    if (req.file) {

                        fs.unlink(
                            req.file.path,
                            () => {}
                        );

                    }

                    return res.status(500).json({
                        error:
                            'Failed to load profile'
                    });

                }


                if (
                    rows.length === 0
                ) {

                    if (req.file) {

                        fs.unlink(
                            req.file.path,
                            () => {}
                        );

                    }

                    return res.status(404).json({
                        error:
                            'User not found'
                    });

                }


                const oldPhoto =
                    rows[0].profile_photo ||
                    null;


                let newPhoto =
                    oldPhoto;


                if (req.file) {

                    newPhoto =
                        `/uploads/${req.file.filename}`;

                }


                db.query(
                    `UPDATE users
                     SET
                        name = ?,
                        profile_photo = ?
                     WHERE id = ?`,
                    [
                        newName,
                        newPhoto,
                        req.user.id
                    ],
                    (
                        updateErr,
                        result
                    ) => {

                        if (updateErr) {

                            if (req.file) {

                                fs.unlink(
                                    req.file.path,
                                    () => {}
                                );

                            }

                            console.error(
                                updateErr
                            );

                            return res.status(500).json({
                                error:
                                    'Failed to update profile'
                            });

                        }


                        if (
                            result.affectedRows === 0
                        ) {

                            if (req.file) {

                                fs.unlink(
                                    req.file.path,
                                    () => {}
                                );

                            }

                            return res.status(404).json({
                                error:
                                    'User not found'
                            });

                        }


                        // Remove old photo after
                        // the new one is saved.
                        if (
                            req.file &&
                            oldPhoto
                        ) {

                            const oldFile =
                                path.join(
                                    __dirname,
                                    oldPhoto.replace(
                                        '/uploads/',
                                        'uploads/'
                                    )
                                );


                            if (
                                fs.existsSync(
                                    oldFile
                                )
                            ) {

                                fs.unlink(
                                    oldFile,
                                    () => {}
                                );

                            }

                        }


                        res.json({

                            message:
                                'Profile updated successfully',

                            user: {

                                id:
                                    req.user.id,

                                name:
                                    newName,

                                role:
                                    req.user.role,

                                profile_photo:
                                    newPhoto

                            }

                        });

                    }
                );

            }
        );

    }
);


// =========================
// MULTER ERRORS
// =========================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        if (
            err instanceof
            multer.MulterError
        ) {

            if (
                err.code ===
                'LIMIT_FILE_SIZE'
            ) {

                return res.status(400).json({
                    error:
                      'Image must be smaller than 20MB'
                });

            }


            return res.status(400).json({
                error:
                    err.message
            });

        }


        if (err) {

            return res.status(400).json({
                error:
                    err.message
            });

        }


        next();

    }
);


// =========================
// START SERVER
// =========================

app.listen(
    PORT,
    () => {

        console.log(
            `CivicFix running on http://localhost:${PORT}`
        );

        console.log(
            'Photo upload is enabled.'
        );

    }
);