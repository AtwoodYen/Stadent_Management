const express = require('express');
require('dotenv').config(); // 從 .env 檔案載入環境變數
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const sql = require('mssql'); // 確保這裡使用的是 mssql
const { body, query, validationResult } = require('express-validator');
const logger = require('./logger'); // 引入我們建立的 logger
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000; // 您可以選擇任何未被佔用的 port

// --- 中介軟體 (Middleware) ---
app.use(cors()); // 允許所有跨域請求
app.use(express.json()); // 解析傳入的 JSON 請求

// 新增：請求日誌中介軟體
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// --- 請求速率限制中介軟體 ---
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 分鐘
	max: 100, // 在一個 windowMs 時間內，限制每個 IP 最多 100 次請求
	standardHeaders: true, // 在回應的標頭中回傳速率限制資訊
	legacyHeaders: false, // 禁用舊的 'X-RateLimit-*' 標頭
    message: { error: '請求過於頻繁，請在 15 分鐘後再試！' } // 超出限制時回傳的訊息
});

// 將速率限制中介軟體應用到所有 /api/* 的路由上
app.use('/api', apiLimiter);

// --- 設定 Multer 用於檔案上傳 ---
// 如果 uploads 資料夾不存在，則建立它
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 將檔案儲存在 'uploads' 資料夾
    },
    filename: function (req, file, cb) {
        // 建立唯一的檔案名稱以避免覆蓋
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 資料庫連線設定 ---
// 請確保您的環境變數中有這些值，或直接填寫
// 現在從環境變數讀取，更安全！
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // 如果您的 SQL Server 需要 SSL，請設為 true
        trustServerCertificate: true // 在開發環境中，設為 true 以信任自我簽署的憑證
    }
};

let pool = new sql.ConnectionPool(dbConfig);

// --- API 路由 (Endpoints) ---

// 測試連線
app.get('/', (req, res) => {
    res.send('後端伺服器已啟動！');
});

// --- 認證 API 端點 ---

// JWT 密鑰 (在生產環境中應該從環境變數讀取)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// 中介軟體：驗證 JWT Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: '存取被拒絕，需要提供 Token' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token 無效或已過期' });
        }
        req.user = user;
        next();
    });
};

// 登入失敗追蹤 (在實際應用中應該使用資料庫或 Redis)
const loginAttempts = new Map();

// 清理過期的登入嘗試記錄
const cleanupExpiredAttempts = () => {
    const now = Date.now();
    for (const [username, data] of loginAttempts.entries()) {
        if (data.lockedUntil && now > data.lockedUntil) {
            loginAttempts.delete(username);
        }
    }
};

// 每10分鐘清理一次過期記錄
setInterval(cleanupExpiredAttempts, 10 * 60 * 1000);

// [POST] 用戶登入
app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: '請提供帳號和密碼' });
        }

        // 從資料庫查詢用戶（包含鎖定狀態）
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT id, username, password_hash, full_name, role, is_active, 
                       email_verified, is_locked, unlock_time
                FROM users 
                WHERE username = @username AND is_active = 1
            `);

        const user = result.recordset[0];

        // 檢查用戶是否存在
        if (!user) {
            return res.status(401).json({ message: '帳號或密碼錯誤' });
        }

        // 檢查帳號是否被鎖定且尚未到解鎖時間
        const now = new Date();
        if (user.is_locked && user.unlock_time && now < new Date(user.unlock_time)) {
            const remainingTime = Math.ceil((new Date(user.unlock_time) - now) / (1000 * 60));
            logger.warn(`Login attempt for locked account: ${username}`);
            return res.status(423).json({ 
                message: `帳號已被鎖定，請在 ${remainingTime} 分鐘後再試`,
                remainingMinutes: remainingTime
            });
        }

        // 如果帳號被鎖定但已過解鎖時間，自動解鎖
        if (user.is_locked && user.unlock_time && now >= new Date(user.unlock_time)) {
            await pool.request()
                .input('username', sql.NVarChar, username)
                .query(`
                    UPDATE users 
                    SET is_locked = 0, unlock_time = NULL 
                    WHERE username = @username
                `);
            logger.info(`Account auto-unlocked: ${username}`);
        }

        // 驗證密碼
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            // 檢查現有的記憶體失敗次數
            const attemptData = loginAttempts.get(username) || { count: 0, firstAttempt: Date.now() };
            attemptData.count += 1;
            attemptData.lastAttempt = Date.now();

            if (attemptData.count >= 3) {
                // 鎖定帳號 1 小時
                const unlockTime = new Date(Date.now() + (60 * 60 * 1000)); // 1小時後
                
                await pool.request()
                    .input('username', sql.NVarChar, username)
                    .input('unlockTime', sql.DateTime2, unlockTime)
                    .query(`
                        UPDATE users 
                        SET is_locked = 1, unlock_time = @unlockTime 
                        WHERE username = @username
                    `);

                // 清除記憶體中的失敗記錄
                loginAttempts.delete(username);
                
                logger.warn(`Account locked due to multiple failed attempts: ${username}`);
                return res.status(423).json({ 
                    message: '連續登入失敗 3 次，帳號已被鎖定 1 小時',
                    remainingMinutes: 60
                });
            } else {
                loginAttempts.set(username, attemptData);
                const remainingAttempts = 3 - attemptData.count;
                
                logger.warn(`Failed login attempt ${attemptData.count}/3 for user: ${username}`);
                return res.status(401).json({ 
                    message: `帳號或密碼錯誤 (剩餘嘗試次數: ${remainingAttempts})`,
                    remainingAttempts
                });
            }
        }

        // 登入成功，清除失敗記錄
        loginAttempts.delete(username);

        // 更新最後登入時間、登入次數，並確保帳號未鎖定
        await pool.request()
            .input('userId', sql.Int, user.id)
            .query(`
                UPDATE users 
                SET last_login = GETDATE(), 
                    login_count = login_count + 1,
                    is_locked = 0,
                    unlock_time = NULL
                WHERE id = @userId
            `);

        // 生成 JWT Token (設置為4小時過期，更安全)
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '4h' }
        );

        // 回傳用戶資訊和 Token (不包含密碼)
        const userInfo = {
            id: user.id,
            username: user.username,
            name: user.full_name,
            role: user.role,
            email_verified: user.email_verified
        };
        
        logger.info(`User ${username} logged in successfully`);
        res.json({
            message: '登入成功',
            token,
            user: userInfo
        });

    } catch (err) {
        logger.error(`Login error: ${err.message}`);
        next(err);
    }
});

// [POST] 驗證 Token
app.post('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ 
        message: 'Token 有效',
        user: req.user 
    });
});

// [POST] 用戶登出 (可選，主要是清除客戶端的 Token)
app.post('/api/auth/logout', (req, res) => {
    res.json({ message: '登出成功' });
});

// [GET] 檢查帳號鎖定狀態
app.get('/api/auth/lock-status/:username', async (req, res, next) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: '請提供帳號' });
        }

        // 從資料庫查詢用戶鎖定狀態
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT username, is_locked, unlock_time
                FROM users 
                WHERE username = @username AND is_active = 1
            `);

        const user = result.recordset[0];
        
        // 如果用戶不存在，返回未鎖定狀態
        if (!user) {
            return res.json({
                isLocked: false,
                remainingMinutes: 0,
                failedAttempts: 0
            });
        }

        const now = new Date();
        
        // 檢查是否被鎖定且尚未到解鎖時間
        if (user.is_locked && user.unlock_time && now < new Date(user.unlock_time)) {
            const remainingTime = Math.ceil((new Date(user.unlock_time) - now) / (1000 * 60));
            res.json({
                isLocked: true,
                remainingMinutes: remainingTime,
                unlockTime: user.unlock_time,
                failedAttempts: 3 // 已被鎖定表示已達到3次失敗
            });
        } else {
            // 如果帳號被標記為鎖定但已過解鎖時間，自動解鎖
            if (user.is_locked && user.unlock_time && now >= new Date(user.unlock_time)) {
                await pool.request()
                    .input('username', sql.NVarChar, username)
                    .query(`
                        UPDATE users 
                        SET is_locked = 0, unlock_time = NULL 
                        WHERE username = @username
                    `);
                logger.info(`Account auto-unlocked: ${username}`);
            }
            
            // 檢查記憶體中的失敗次數
            const attemptData = loginAttempts.get(username);
            
            res.json({
                isLocked: false,
                remainingMinutes: 0,
                failedAttempts: attemptData ? attemptData.count : 0
            });
        }
        
    } catch (err) {
        logger.error(`Check lock status error: ${err.message}`);
        next(err);
    }
});

// [POST] 驗證管理員密碼
app.post('/api/auth/verify-admin', authenticateToken, async (req, res, next) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: '請提供密碼' });
        }
        
        // 檢查當前用戶是否為管理員
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '權限不足，僅限管理員操作' });
        }
        
        // 從資料庫查詢管理員用戶
        const result = await pool.request()
            .input('username', sql.NVarChar, req.user.username)
            .query(`
                SELECT id, username, password_hash, full_name, role
                FROM users 
                WHERE username = @username AND role = 'admin' AND is_active = 1
            `);

        const admin = result.recordset[0];
        
        if (!admin) {
            return res.status(403).json({ message: '找不到管理員帳號' });
        }

        // 驗證管理員密碼
        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: '管理員密碼錯誤' });
        }
        
        res.json({ message: '密碼驗證成功' });
        
    } catch (err) {
        logger.error(`Admin password verification error: ${err.message}`);
        next(err);
    }
});

// [POST] 解鎖用戶帳號 (管理員功能)
app.post('/api/auth/unlock-account', authenticateToken, async (req, res, next) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ message: '請提供要解鎖的帳號' });
        }
        
        // 檢查當前用戶是否為管理員
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '權限不足，僅限管理員操作' });
        }
        
        // 檢查目標用戶是否存在
        const userResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT id, username, is_locked, unlock_time
                FROM users 
                WHERE username = @username AND is_active = 1
            `);

        const targetUser = userResult.recordset[0];
        
        if (!targetUser) {
            return res.status(404).json({ message: '找不到指定的用戶' });
        }
        
        if (!targetUser.is_locked) {
            return res.status(400).json({ message: '該帳號目前未被鎖定' });
        }
        
        // 解鎖帳號
        await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                UPDATE users 
                SET is_locked = 0, unlock_time = NULL 
                WHERE username = @username
            `);
        
        // 清除記憶體中的失敗記錄
        loginAttempts.delete(username);
        
        logger.info(`Account manually unlocked by admin ${req.user.username}: ${username}`);
        res.json({ message: `帳號 ${username} 已成功解鎖` });
        
    } catch (err) {
        logger.error(`Account unlock error: ${err.message}`);
        next(err);
    }
});

// [GET] 取得所有被鎖定的帳號 (管理員功能)
app.get('/api/auth/locked-accounts', authenticateToken, async (req, res, next) => {
    try {
        // 檢查當前用戶是否為管理員
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '權限不足，僅限管理員操作' });
        }
        
        const result = await pool.request().query(`
            SELECT username, full_name, is_locked, unlock_time, 
                   CASE 
                       WHEN unlock_time IS NULL THEN '永久鎖定'
                       WHEN unlock_time <= GETDATE() THEN '已可解鎖'
                       ELSE CONCAT(DATEDIFF(MINUTE, GETDATE(), unlock_time), ' 分鐘後解鎖')
                   END as lock_status
            FROM users 
            WHERE is_locked = 1 AND is_active = 1
            ORDER BY unlock_time DESC
        `);
        
        res.json(result.recordset);
        
    } catch (err) {
        logger.error(`Get locked accounts error: ${err.message}`);
        next(err);
    }
});

// --- 學生管理 API 端點 ---

// [READ] 取得所有學生資料
app.get('/api/students', async (req, res, next) => {
    try {
        const { school, grade, level_type, gender, class_type } = req.query;
        let query = 'SELECT * FROM students WHERE is_active = 1';
        const request = pool.request();
        
        if (school) {
            query += ' AND school = @school';
            request.input('school', sql.NVarChar, school);
        }
        if (grade) {
            query += ' AND grade = @grade';
            request.input('grade', sql.NVarChar, grade);
        }
        if (level_type) {
            query += ' AND level_type = @level_type';
            request.input('level_type', sql.NVarChar, level_type);
        }
        if (gender) {
            query += ' AND gender = @gender';
            request.input('gender', sql.NVarChar, gender);
        }
        if (class_type) {
            query += ' AND class_type = @class_type';
            request.input('class_type', sql.NVarChar, class_type);
        }
        
        query += ' ORDER BY school, grade, class_type, chinese_name';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得學生統計資訊
app.get('/api/students/stats', async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total_students,
                SUM(CASE WHEN gender = N'男' THEN 1 ELSE 0 END) as male_students,
                SUM(CASE WHEN gender = N'女' THEN 1 ELSE 0 END) as female_students,
                school,
                COUNT(*) as school_count,
                grade,
                COUNT(*) as grade_count,
                level_type,
                COUNT(*) as level_count
            FROM students 
            WHERE is_active = 1
            GROUP BY ROLLUP(school), ROLLUP(grade), ROLLUP(level_type)
            ORDER BY school, grade, level_type
        `);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得學校列表
app.get('/api/students/schools', async (req, res, next) => {
    try {
        const result = await pool.request().query('SELECT DISTINCT school FROM students WHERE is_active = 1 ORDER BY school');
        res.json(result.recordset.map(row => row.school));
    } catch (err) {
        next(err);
    }
});

// [GET] 取得班別列表
app.get('/api/class-types', async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT class_code, class_name, description, sort_order 
            FROM class_types 
            WHERE is_active = 1 
            ORDER BY sort_order, class_name
        `);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得班別統計
app.get('/api/class-types/stats', async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                ct.class_code,
                ct.class_name,
                ct.description,
                COUNT(s.id) as student_count
            FROM class_types ct
            LEFT JOIN students s ON ct.class_code = s.class_type AND s.is_active = 1
            WHERE ct.is_active = 1
            GROUP BY ct.class_code, ct.class_name, ct.description, ct.sort_order
            ORDER BY ct.sort_order, ct.class_name
        `);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [READ] 取得單一學生
app.get('/api/students/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM students WHERE id = @id AND is_active = 1');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [CREATE] 新增一位學生
app.post(
    '/api/students',
    // --- 驗證規則 ---
    body('chinese_name').notEmpty().withMessage('中文姓名為必填'),
    body('english_name').optional(),
    body('school').notEmpty().withMessage('學校為必填'),
    body('grade').notEmpty().withMessage('年級為必填'),
    body('gender').isIn(['男', '女']).withMessage('無效的性別'),
    body('level_type').isIn(['初級', '中級', '進階']).withMessage('無效的程度'),
    body('class_type').notEmpty().withMessage('班別為必填'),
    body('student_email').optional().isEmail().withMessage('無效的學生電子信箱格式'),
    body('father_email').optional().isEmail().withMessage('無效的父親電子信箱格式'),
    body('mother_email').optional().isEmail().withMessage('無效的母親電子信箱格式'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for POST /api/students: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { 
                chinese_name, english_name, student_phone, student_email, student_line,
                father_name, father_phone, father_line,
                mother_name, mother_phone, mother_line,
                school, grade, gender, level_type, class_type, notes
            } = req.body;
            
            const result = await pool.request()
                .input('chinese_name', sql.NVarChar, chinese_name)
                .input('english_name', sql.NVarChar, english_name || null)
                .input('student_phone', sql.NVarChar, student_phone || null)
                .input('student_email', sql.NVarChar, student_email || null)
                .input('student_line', sql.NVarChar, student_line || null)
                .input('father_name', sql.NVarChar, father_name || null)
                .input('father_phone', sql.NVarChar, father_phone || null)
                .input('father_line', sql.NVarChar, father_line || null)
                .input('mother_name', sql.NVarChar, mother_name || null)
                .input('mother_phone', sql.NVarChar, mother_phone || null)
                .input('mother_line', sql.NVarChar, mother_line || null)
                .input('school', sql.NVarChar, school)
                .input('grade', sql.NVarChar, grade)
                .input('gender', sql.NVarChar, gender)
                .input('level_type', sql.NVarChar, level_type)
                .input('class_type', sql.NVarChar, class_type)
                .input('notes', sql.NVarChar, notes || null)
                .query(`
                    INSERT INTO students (
                        chinese_name, english_name, student_phone, student_email, student_line,
                        father_name, father_phone, father_line,
                        mother_name, mother_phone, mother_line,
                        school, grade, gender, level_type, class_type, notes
                    ) 
                    OUTPUT inserted.* 
                    VALUES (
                        @chinese_name, @english_name, @student_phone, @student_email, @student_line,
                        @father_name, @father_phone, @father_line,
                        @mother_name, @mother_phone, @mother_line,
                        @school, @grade, @gender, @level_type, @class_type, @notes
                    )
                `);
            res.status(201).json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [UPDATE] 更新一位學生的資料
app.put(
    '/api/students/:id',
    // --- 驗證規則 ---
    body('chinese_name').notEmpty().withMessage('中文姓名為必填'),
    body('english_name').optional(),
    body('school').notEmpty().withMessage('學校為必填'),
    body('grade').notEmpty().withMessage('年級為必填'),
    body('gender').isIn(['男', '女']).withMessage('無效的性別'),
    body('level_type').isIn(['初級', '中級', '進階']).withMessage('無效的程度'),
    body('class_type').notEmpty().withMessage('班別為必填'),
    body('student_email').optional().isEmail().withMessage('無效的學生電子信箱格式'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for PUT /api/students/${req.params.id}: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { 
                chinese_name, english_name, student_phone, student_email, student_line,
                father_name, father_phone, father_line,
                mother_name, mother_phone, mother_line,
                school, grade, gender, level_type, class_type, notes
            } = req.body;
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('chinese_name', sql.NVarChar, chinese_name)
                .input('english_name', sql.NVarChar, english_name || null)
                .input('student_phone', sql.NVarChar, student_phone || null)
                .input('student_email', sql.NVarChar, student_email || null)
                .input('student_line', sql.NVarChar, student_line || null)
                .input('father_name', sql.NVarChar, father_name || null)
                .input('father_phone', sql.NVarChar, father_phone || null)
                .input('father_line', sql.NVarChar, father_line || null)
                .input('mother_name', sql.NVarChar, mother_name || null)
                .input('mother_phone', sql.NVarChar, mother_phone || null)
                .input('mother_line', sql.NVarChar, mother_line || null)
                .input('school', sql.NVarChar, school)
                .input('grade', sql.NVarChar, grade)
                .input('gender', sql.NVarChar, gender)
                .input('level_type', sql.NVarChar, level_type)
                .input('class_type', sql.NVarChar, class_type)
                .input('notes', sql.NVarChar, notes || null)
                .query(`
                    UPDATE students 
                    SET chinese_name = @chinese_name, english_name = @english_name, 
                        student_phone = @student_phone, student_email = @student_email, student_line = @student_line,
                        father_name = @father_name, father_phone = @father_phone, father_line = @father_line,
                        mother_name = @mother_name, mother_phone = @mother_phone, mother_line = @mother_line,
                        school = @school, grade = @grade, gender = @gender, 
                        level_type = @level_type, class_type = @class_type, notes = @notes, updated_at = GETDATE()
                    WHERE id = @id AND is_active = 1;
                    SELECT * FROM students WHERE id = @id AND is_active = 1;
                `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [UPDATE] 更新學生狀態 (啟用/停用)
app.patch('/api/students/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'Invalid status provided' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('is_active', sql.Bit, is_active)
            .query('UPDATE students SET is_active = @is_active, updated_at = GETDATE() WHERE id = @id; SELECT * FROM students WHERE id = @id;');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [DELETE] 刪除一位學生 (軟刪除)
app.delete('/api/students/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE students SET is_active = 0, updated_at = GETDATE() WHERE id = @id AND is_active = 1');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// --- 學生課表管理 API 端點 ---

// [READ] 取得所有課表
app.get('/api/schedules', async (req, res, next) => {
    try {
        const { student_id, day_of_week, date_range } = req.query;
        let query = `
            SELECT 
                ss.*,
                s.chinese_name as student_name,
                s.english_name as student_english_name,
                s.school,
                s.grade,
                s.level_type
            FROM student_schedules ss
            INNER JOIN students s ON ss.student_id = s.id
            WHERE ss.is_active = 1 AND s.is_active = 1
        `;
        const request = pool.request();
        
        if (student_id) {
            query += ' AND ss.student_id = @student_id';
            request.input('student_id', sql.Int, student_id);
        }
        
        if (day_of_week) {
            query += ' AND ss.day_of_week = @day_of_week';
            request.input('day_of_week', sql.NVarChar, day_of_week);
        }
        
        query += ' ORDER BY ss.day_of_week, ss.start_time, s.chinese_name';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得特定日期範圍的課表（用於月曆顯示）
app.get('/api/schedules/calendar', async (req, res, next) => {
    try {
        const { start_date, end_date, view_type } = req.query;
        
                 // 基本課表查詢，包含學生資訊
         let query = `
             SELECT 
                 ss.id,
                 ss.student_id,
                 ss.day_of_week,
                                 ss.start_time,
                 ss.end_time,
                 ss.subject as course_name,
                 null as teacher_name,
                 s.chinese_name as student_name,
                 s.english_name as student_english_name,
                 s.school,
                 s.grade,
                 s.level_type,
                 s.class_type
             FROM student_schedules ss
             INNER JOIN students s ON ss.student_id = s.id
             WHERE ss.is_active = 1 AND s.is_active = 1
         `;
        
        const request = pool.request();
        
        // 根據視圖類型添加過濾條件
        if (view_type === 'day' && start_date) {
            // 日視圖：查詢特定日期對應的星期幾
            const date = new Date(start_date);
            const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            const dayOfWeek = dayNames[date.getDay()];
            
            query += ' AND ss.day_of_week = @day_of_week';
            request.input('day_of_week', sql.NVarChar, dayOfWeek);
        }
        
        query += ' ORDER BY ss.day_of_week, ss.start_time, s.chinese_name';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得課表統計資訊
app.get('/api/schedules/stats', async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total_schedules,
                COUNT(DISTINCT student_id) as students_with_schedules,
                day_of_week,
                COUNT(*) as schedules_per_day
            FROM student_schedules ss
            INNER JOIN students s ON ss.student_id = s.id
            WHERE ss.is_active = 1 AND s.is_active = 1
            GROUP BY ROLLUP(day_of_week)
            ORDER BY 
                CASE day_of_week 
                    WHEN '星期一' THEN 1 WHEN '星期二' THEN 2 WHEN '星期三' THEN 3 
                    WHEN '星期四' THEN 4 WHEN '星期五' THEN 5 WHEN '星期六' THEN 6 
                    WHEN '星期日' THEN 7 ELSE 8 
                END
        `);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [READ] 取得單一課表
app.get('/api/schedules/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    ss.*,
                    s.chinese_name as student_name,
                    s.english_name as student_english_name
                FROM student_schedules ss
                INNER JOIN students s ON ss.student_id = s.id
                WHERE ss.id = @id AND ss.is_active = 1
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Schedule not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [CREATE] 新增課表
app.post(
    '/api/schedules',
    // --- 驗證規則 ---
    body('student_id').isInt({ gt: 0 }).withMessage('必須選擇一位學生'),
    body('day_of_week').isIn(['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']).withMessage('無效的星期'),
    body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('無效的開始時間格式'),
    body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('無效的結束時間格式'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for POST /api/schedules: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { student_id, day_of_week, start_time, end_time, course_name, teacher_name } = req.body;
            
            const result = await pool.request()
                .input('student_id', sql.Int, student_id)
                .input('day_of_week', sql.NVarChar, day_of_week)
                .input('start_time', sql.Time, start_time)
                .input('end_time', sql.Time, end_time || null)
                .input('course_name', sql.NVarChar, course_name || null)
                .input('teacher_name', sql.NVarChar, teacher_name || null)
                .query(`
                    INSERT INTO student_schedules (
                        student_id, day_of_week, start_time, end_time, course_name, teacher_name
                    ) 
                    OUTPUT inserted.* 
                    VALUES (
                        @student_id, @day_of_week, @start_time, @end_time, @course_name, @teacher_name
                    )
                `);
            res.status(201).json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [UPDATE] 更新課表
app.put(
    '/api/schedules/:id',
    // --- 驗證規則 ---
    body('student_id').isInt({ gt: 0 }).withMessage('必須選擇一位學生'),
    body('day_of_week').isIn(['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']).withMessage('無效的星期'),
    body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('無效的開始時間格式'),
    body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('無效的結束時間格式'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for PUT /api/schedules/${req.params.id}: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { student_id, day_of_week, start_time, end_time, course_name, teacher_name } = req.body;
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('student_id', sql.Int, student_id)
                .input('day_of_week', sql.NVarChar, day_of_week)
                .input('start_time', sql.Time, start_time)
                .input('end_time', sql.Time, end_time || null)
                .input('course_name', sql.NVarChar, course_name || null)
                .input('teacher_name', sql.NVarChar, teacher_name || null)
                .query(`
                    UPDATE student_schedules 
                    SET student_id = @student_id, day_of_week = @day_of_week, 
                        start_time = @start_time, end_time = @end_time, 
                        course_name = @course_name, teacher_name = @teacher_name, updated_at = GETDATE()
                    WHERE id = @id AND is_active = 1;
                    SELECT * FROM student_schedules WHERE id = @id AND is_active = 1;
                `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Schedule not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [DELETE] 刪除課表 (軟刪除)
app.delete('/api/schedules/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE student_schedules SET is_active = 0, updated_at = GETDATE() WHERE id = @id AND is_active = 1');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Schedule not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// --- 儀表板統計 API 端點 ---
app.get(
    '/api/stats/dashboard',
    // 為可選的查詢參數增加驗證
    query('startDate').optional().isISO8601().withMessage('開始日期格式無效'),
    query('endDate').optional().isISO8601().withMessage('結束日期格式無效'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { startDate, endDate } = req.query;

            // 如果提供了日期，則建立 WHERE 條件，否則條件為真 (1=1)
            const dateFilter = startDate && endDate ? 'l.lesson_date BETWEEN @startDate AND @endDate' : '1=1';
            const dateFilterNoAlias = startDate && endDate ? 'lesson_date BETWEEN @startDate AND @endDate' : '1=1';

            // 1. 課程數量 (按月份分組)
            const monthlyLessonsQuery = `
                SELECT FORMAT(lesson_date, 'yyyy-MM') as month, COUNT(id) as lesson_count
                FROM lessons
                WHERE ${dateFilterNoAlias}
                GROUP BY FORMAT(lesson_date, 'yyyy-MM')
                ORDER BY month;
            `;

            // 2. 找出上課次數最多的前 5 位學生
            const topStudentsQuery = `
                SELECT TOP 5 s.name, COUNT(l.id) as lesson_count
                FROM lessons l
                JOIN students s ON l.student_id = s.id
                WHERE ${dateFilter} AND s.status = 'active'
                GROUP BY s.name
                ORDER BY lesson_count DESC;
            `;

            // 3. 課程類型分佈 (線上 vs 實體)
            const lessonTypeQuery = `SELECT l.lesson_type, COUNT(*) as count FROM lessons l WHERE ${dateFilter} GROUP BY l.lesson_type;`;

            const request = pool.request();
            if (startDate && endDate) {
                request.input('startDate', sql.Date, startDate);
                request.input('endDate', sql.Date, endDate);
            }

            const [monthlyResult, topStudentsResult, lessonTypeResult] = await Promise.all([ // 平行執行所有查詢以提升效率
                request.query(monthlyLessonsQuery),
                request.query(topStudentsQuery),
                request.query(lessonTypeQuery)
            ]);

            res.json({
                monthlyLessons: monthlyResult.recordset,
                topStudents: topStudentsResult.recordset,
                lessonTypes: lessonTypeResult.recordset
            });
        } catch (err) {
            next(err);
        }
    }
);

// --- 課程 API 端點 ---

// [READ] 取得所有課程
app.get('/api/lessons', async (req, res, next) => {
    try {
        const result = await pool.request().query('SELECT * FROM lessons ORDER BY lesson_date, lesson_time ASC');
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [CREATE] 新增一筆課程
app.post(
    '/api/lessons',
    // --- 驗證規則 ---
    body('student_id').isInt({ gt: 0 }).withMessage('必須選擇一位學生'),
    body('lesson_date').isISO8601().withMessage('請輸入有效的日期'),
    body('lesson_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('請輸入有效的時間格式 (HH:mm)'),
    body('duration_minutes').isInt({ gt: 0 }).withMessage('課程時長必須是正整數'),
    body('lesson_type').isIn(['physical', 'online']).withMessage('無效的課程類型'),
    body('status').isIn(['normal', 'rescheduled', 'cancelled', 'completed']).withMessage('無效的課程狀態'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for POST /api/lessons: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { student_id, lesson_date, lesson_time, duration_minutes, lesson_type, status, notes } = req.body;
            const result = await pool.request()
                .input('student_id', sql.Int, student_id)
                .input('lesson_date', sql.Date, lesson_date)
                .input('lesson_time', sql.Time, lesson_time)
                .input('duration_minutes', sql.Int, duration_minutes)
                .input('lesson_type', sql.NVarChar, lesson_type)
                .input('status', sql.NVarChar, status)
                .input('notes', sql.NText, notes)
                .query('INSERT INTO lessons (student_id, lesson_date, lesson_time, duration_minutes, lesson_type, status, notes) OUTPUT inserted.* VALUES (@student_id, @lesson_date, @lesson_time, @duration_minutes, @lesson_type, @status, @notes)');
            res.status(201).json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [UPDATE] 更新一筆現有課程
app.put(
    '/api/lessons/:id',
    // --- 驗證規則 ---
    body('student_id').isInt({ gt: 0 }).withMessage('必須選擇一位學生'),
    body('lesson_date').isISO8601().withMessage('請輸入有效的日期'),
    body('lesson_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('請輸入有效的時間格式 (HH:mm)'),
    body('duration_minutes').isInt({ gt: 0 }).withMessage('課程時長必須是正整數'),
    body('lesson_type').isIn(['physical', 'online']).withMessage('無效的課程類型'),
    body('status').isIn(['normal', 'rescheduled', 'cancelled', 'completed']).withMessage('無效的課程狀態'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for PUT /api/lessons/${req.params.id}: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { id } = req.params;
            const { student_id, lesson_date, lesson_time, duration_minutes, lesson_type, status, notes } = req.body;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('student_id', sql.Int, student_id)
                .input('lesson_date', sql.Date, lesson_date)
                .input('lesson_time', sql.Time, lesson_time)
                .input('duration_minutes', sql.Int, duration_minutes)
                .input('lesson_type', sql.NVarChar, lesson_type)
                .input('status', sql.NVarChar, status)
                .input('notes', sql.NText, notes)
                .query(`
                    UPDATE lessons 
                    SET student_id = @student_id, lesson_date = @lesson_date, lesson_time = @lesson_time, 
                        duration_minutes = @duration_minutes, lesson_type = @lesson_type, status = @status, notes = @notes
                    WHERE id = @id;
                    SELECT * FROM lessons WHERE id = @id;
                `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Lesson not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [DELETE] 刪除一筆課程
app.delete('/api/lessons/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM lessons WHERE id = @id');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// --- 課程管理 API 端點 ---

// [READ] 取得所有課程
app.get('/api/courses', async (req, res, next) => {
    try {
        const result = await pool.request().query('SELECT * FROM courses WHERE is_active = 1 ORDER BY category, level, name');
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得課程分類列表 (必須放在 /api/courses/:id 之前)
app.get('/api/courses/categories', async (req, res, next) => {
    try {
        console.log('=== 取得課程分類列表 ===');
        
        const result = await pool.request().query('SELECT DISTINCT category FROM courses WHERE is_active = 1 ORDER BY category');
        console.log('查詢結果筆數:', result.recordset.length);
        console.log('查詢結果:', result.recordset);
        
        const categories = result.recordset.map(row => row.category);
        console.log('返回的分類列表:', categories);
        
        res.json(categories);
    } catch (err) {
        console.error('取得課程分類列表錯誤:', err);
        next(err);
    }
});

// [READ] 取得單一課程
app.get('/api/courses/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM courses WHERE id = @id AND is_active = 1');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [CREATE] 新增一筆課程
app.post(
    '/api/courses',
    // --- 驗證規則 ---
    body('name').notEmpty().withMessage('課程名稱為必填'),
    body('category').notEmpty().withMessage('課程分類為必填'),
    body('level').isIn(['初級', '中級', '高級']).withMessage('無效的難度等級'),
    body('duration_minutes').isInt({ gt: 0 }).withMessage('課程時長必須是正整數'),
    body('price').isFloat({ min: 0 }).withMessage('價格必須是非負數'),
    body('description').optional(),
    body('prerequisites').optional(),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for POST /api/courses: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, category, level, duration_minutes, price, description, prerequisites } = req.body;
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('category', sql.NVarChar, category)
                .input('level', sql.NVarChar, level)
                .input('duration_minutes', sql.Int, duration_minutes)
                .input('price', sql.Decimal, price)
                .input('description', sql.NVarChar, description || '')
                .input('prerequisites', sql.NVarChar, prerequisites || '')
                .query(`
                    INSERT INTO courses (name, category, level, duration_minutes, price, description, prerequisites) 
                    OUTPUT inserted.* 
                    VALUES (@name, @category, @level, @duration_minutes, @price, @description, @prerequisites)
                `);
            res.status(201).json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [UPDATE] 更新一筆現有課程
app.put(
    '/api/courses/:id',
    // --- 驗證規則 ---
    body('name').notEmpty().withMessage('課程名稱為必填'),
    body('category').notEmpty().withMessage('課程分類為必填'),
    body('level').isIn(['初級', '中級', '高級']).withMessage('無效的難度等級'),
    body('duration_minutes').isInt({ gt: 0 }).withMessage('課程時長必須是正整數'),
    body('price').isFloat({ min: 0 }).withMessage('價格必須是非負數'),
    body('description').optional(),
    body('prerequisites').optional(),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for PUT /api/courses/${req.params.id}: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { id } = req.params;
            const { name, category, level, duration_minutes, price, description, prerequisites } = req.body;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('category', sql.NVarChar, category)
                .input('level', sql.NVarChar, level)
                .input('duration_minutes', sql.Int, duration_minutes)
                .input('price', sql.Decimal, price)
                .input('description', sql.NVarChar, description || '')
                .input('prerequisites', sql.NVarChar, prerequisites || '')
                .query(`
                    UPDATE courses 
                    SET name = @name, category = @category, level = @level, duration_minutes = @duration_minutes, 
                        price = @price, description = @description, prerequisites = @prerequisites, updated_at = GETDATE()
                    WHERE id = @id AND is_active = 1;
                    SELECT * FROM courses WHERE id = @id AND is_active = 1;
                `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Course not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [DELETE] 刪除一筆課程 (軟刪除)
app.delete('/api/courses/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE courses SET is_active = 0, updated_at = GETDATE() WHERE id = @id AND is_active = 1');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// --- 學校管理 API 端點 ---

// [READ] 取得所有學校
app.get('/api/schools', async (req, res, next) => {
    try {
        const { type, district, education_level } = req.query;
        let query = 'SELECT * FROM schools WHERE is_active = 1';
        const request = pool.request();
        
        if (type) {
            query += ' AND school_type = @type';
            request.input('type', sql.NVarChar, type);
        }
        if (district) {
            query += ' AND district = @district';
            request.input('district', sql.NVarChar, district);
        }
        if (education_level) {
            query += ' AND education_level = @education_level';
            request.input('education_level', sql.NVarChar, education_level);
        }
        
        query += ' ORDER BY district, school_type, short_name';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得學校統計資訊
app.get('/api/schools/stats', async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total_schools,
                SUM(CASE WHEN school_type = N'公立' THEN 1 ELSE 0 END) as public_schools,
                SUM(CASE WHEN school_type = N'國立' THEN 1 ELSE 0 END) as national_schools,
                SUM(CASE WHEN school_type = N'私立' THEN 1 ELSE 0 END) as private_schools,
                SUM(our_student_count) as total_our_students,
                district,
                COUNT(*) as district_count
            FROM schools 
            WHERE is_active = 1
            GROUP BY ROLLUP(district)
            ORDER BY district
        `);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得學校行政區列表
app.get('/api/schools/districts', async (req, res, next) => {
    try {
        const result = await pool.request().query('SELECT DISTINCT district FROM schools WHERE is_active = 1 ORDER BY district');
        res.json(result.recordset.map(row => row.district));
    } catch (err) {
        next(err);
    }
});

// [READ] 取得單一學校
app.get('/api/schools/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM schools WHERE id = @id AND is_active = 1');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'School not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [CREATE] 新增一所學校
app.post(
    '/api/schools',
    // --- 驗證規則 ---
    body('school_name').notEmpty().withMessage('學校全名為必填'),
    body('short_name').notEmpty().withMessage('學校簡稱為必填'),
    body('school_type').isIn(['公立', '國立', '私立']).withMessage('無效的學校性質'),
    body('district').notEmpty().withMessage('行政區為必填'),
    body('education_level').isIn(['國小', '國中', '高中', '高職', '大學']).withMessage('無效的學制'),
    body('phone').optional(),
    body('address').optional(),
    body('website').optional(),
    body('email').optional().isEmail().withMessage('無效的電子信箱格式'),
    body('notes').optional(),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for POST /api/schools: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { school_name, short_name, school_type, district, education_level, phone, address, website, email, notes } = req.body;
            const result = await pool.request()
                .input('school_name', sql.NVarChar, school_name)
                .input('short_name', sql.NVarChar, short_name)
                .input('school_type', sql.NVarChar, school_type)
                .input('district', sql.NVarChar, district)
                .input('education_level', sql.NVarChar, education_level)
                .input('phone', sql.NVarChar, phone || null)
                .input('address', sql.NVarChar, address || null)
                .input('website', sql.NVarChar, website || null)
                .input('email', sql.NVarChar, email || null)
                .input('notes', sql.NVarChar, notes || null)
                .query(`
                    INSERT INTO schools (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes) 
                    OUTPUT inserted.* 
                    VALUES (@school_name, @short_name, @school_type, @district, @education_level, @phone, @address, @website, @email, @notes)
                `);
            res.status(201).json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [UPDATE] 更新一所學校
app.put(
    '/api/schools/:id',
    // --- 驗證規則 ---
    body('school_name').notEmpty().withMessage('學校全名為必填'),
    body('short_name').notEmpty().withMessage('學校簡稱為必填'),
    body('school_type').isIn(['公立', '國立', '私立']).withMessage('無效的學校性質'),
    body('district').notEmpty().withMessage('行政區為必填'),
    body('education_level').isIn(['國小', '國中', '高中', '高職', '大學']).withMessage('無效的學制'),
    body('phone').optional(),
    body('address').optional(),
    body('website').optional(),
    body('email').optional().isEmail().withMessage('無效的電子信箱格式'),
    body('notes').optional(),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for PUT /api/schools/${req.params.id}: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { id } = req.params;
            const { school_name, short_name, school_type, district, education_level, phone, address, website, email, notes } = req.body;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('school_name', sql.NVarChar, school_name)
                .input('short_name', sql.NVarChar, short_name)
                .input('school_type', sql.NVarChar, school_type)
                .input('district', sql.NVarChar, district)
                .input('education_level', sql.NVarChar, education_level)
                .input('phone', sql.NVarChar, phone || null)
                .input('address', sql.NVarChar, address || null)
                .input('website', sql.NVarChar, website || null)
                .input('email', sql.NVarChar, email || null)
                .input('notes', sql.NVarChar, notes || null)
                .query(`
                    UPDATE schools 
                    SET school_name = @school_name, short_name = @short_name, school_type = @school_type, 
                        district = @district, education_level = @education_level, phone = @phone, 
                        address = @address, website = @website, email = @email, notes = @notes, updated_at = GETDATE()
                    WHERE id = @id AND is_active = 1;
                    SELECT * FROM schools WHERE id = @id AND is_active = 1;
                `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'School not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [DELETE] 刪除一所學校 (軟刪除)
app.delete('/api/schools/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE schools SET is_active = 0, updated_at = GETDATE() WHERE id = @id AND is_active = 1');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'School not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// --- 用戶管理 API 端點 ---

// [READ] 取得所有用戶資料
app.get('/api/users', async (req, res, next) => {
    try {
        const { role, is_active, department } = req.query;
        let query = 'SELECT id, username, email, full_name, role, is_active, phone, department, last_login, login_count, email_verified, created_at, updated_at FROM users WHERE 1=1';
        const request = pool.request();
        
        if (role) {
            query += ' AND role = @role';
            request.input('role', sql.NVarChar, role);
        }
        if (is_active !== undefined) {
            query += ' AND is_active = @is_active';
            request.input('is_active', sql.Bit, is_active === 'true' ? 1 : 0);
        }
        if (department) {
            query += ' AND department = @department';
            request.input('department', sql.NVarChar, department);
        }
        
        query += ' ORDER BY role, full_name';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得用戶統計資訊
app.get('/api/users/stats', async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
                SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_users,
                SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teacher_users,
                SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users,
                SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified_users
            FROM users
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得角色列表
app.get('/api/users/roles', async (req, res, next) => {
    try {
        const roles = [
            { value: 'admin', label: '系統管理員' },
            { value: 'manager', label: '管理者' },
            { value: 'teacher', label: '老師' },
            { value: 'user', label: '一般用戶' }
        ];
        res.json(roles);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得部門列表
app.get('/api/users/departments', async (req, res, next) => {
    try {
        const result = await pool.request().query('SELECT DISTINCT department FROM users WHERE department IS NOT NULL ORDER BY department');
        res.json(result.recordset.map(row => row.department));
    } catch (err) {
        next(err);
    }
});

// [READ] 取得單一用戶
app.get('/api/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id, username, email, full_name, role, is_active, phone, department, last_login, login_count, email_verified, created_at, updated_at FROM users WHERE id = @id');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [CREATE] 新增一位用戶
app.post(
    '/api/users',
    // --- 驗證規則 ---
    body('username').isLength({ min: 3 }).withMessage('用戶名稱至少需要3個字元'),
    body('email').isEmail().withMessage('無效的電子信箱格式'),
    body('full_name').notEmpty().withMessage('姓名為必填'),
    body('role').isIn(['admin', 'manager', 'teacher', 'user']).withMessage('無效的角色'),
    body('password').isLength({ min: 6 }).withMessage('密碼至少需要6個字元'),
    body('phone').optional(),
    body('department').optional(),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for POST /api/users: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, email, full_name, role, password, phone, department, is_active = true } = req.body;
            
            // 使用bcrypt加密密碼
            const bcrypt = require('bcrypt');
            const password_hash = await bcrypt.hash(password, 12);
            
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('password_hash', sql.NVarChar, password_hash)
                .input('full_name', sql.NVarChar, full_name)
                .input('role', sql.NVarChar, role)
                .input('is_active', sql.Bit, is_active)
                .input('phone', sql.NVarChar, phone || null)
                .input('department', sql.NVarChar, department || null)
                .query(`
                    INSERT INTO users (username, email, password_hash, full_name, role, is_active, phone, department, password_changed_at) 
                    OUTPUT inserted.id, inserted.username, inserted.email, inserted.full_name, inserted.role, inserted.is_active, inserted.phone, inserted.department, inserted.created_at, inserted.updated_at
                    VALUES (@username, @email, @password_hash, @full_name, @role, @is_active, @phone, @department, GETDATE())
                `);
            res.status(201).json(result.recordset[0]);
        } catch (err) {
            if (err.number === 2627) { // 唯一約束違反
                return res.status(400).json({ error: '用戶名稱或電子信箱已存在' });
            }
            next(err);
        }
    }
);

// [UPDATE] 更新一位用戶
app.put(
    '/api/users/:id',
    // --- 驗證規則 ---
    body('username').isLength({ min: 3 }).withMessage('用戶名稱至少需要3個字元'),
    body('email').isEmail().withMessage('無效的電子信箱格式'),
    body('full_name').notEmpty().withMessage('姓名為必填'),
    body('role').isIn(['admin', 'manager', 'teacher', 'user']).withMessage('無效的角色'),
    body('phone').optional(),
    body('department').optional(),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for PUT /api/users/${req.params.id}: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { username, email, full_name, role, phone, department, is_active } = req.body;
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('full_name', sql.NVarChar, full_name)
                .input('role', sql.NVarChar, role)
                .input('is_active', sql.Bit, is_active)
                .input('phone', sql.NVarChar, phone || null)
                .input('department', sql.NVarChar, department || null)
                .query(`
                    UPDATE users 
                    SET username = @username, email = @email, full_name = @full_name, 
                        role = @role, is_active = @is_active, phone = @phone, 
                        department = @department, updated_at = GETDATE()
                    WHERE id = @id;
                    SELECT id, username, email, full_name, role, is_active, phone, department, last_login, login_count, email_verified, created_at, updated_at 
                    FROM users WHERE id = @id;
                `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            if (err.number === 2627) { // 唯一約束違反
                return res.status(400).json({ error: '用戶名稱或電子信箱已存在' });
            }
            next(err);
        }
    }
);

// [UPDATE] 更新用戶密碼
app.put('/api/users/:id/password', 
    body('password').isLength({ min: 6 }).withMessage('密碼至少需要6個字元'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { password } = req.body;
            
            // 使用bcrypt加密密碼
            const bcrypt = require('bcrypt');
            const password_hash = await bcrypt.hash(password, 12);
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('password_hash', sql.NVarChar, password_hash)
                .query(`
                    UPDATE users 
                    SET password_hash = @password_hash, password_changed_at = GETDATE(), updated_at = GETDATE()
                    WHERE id = @id
                `);
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: '密碼更新成功' });
        } catch (err) {
            next(err);
        }
    }
);

// [UPDATE] 切換用戶狀態
app.patch('/api/users/:id/toggle-status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE users 
                SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = GETDATE()
                WHERE id = @id;
                SELECT id, username, email, full_name, role, is_active, phone, department, last_login, login_count, email_verified, created_at, updated_at 
                FROM users WHERE id = @id;
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [DELETE] 刪除一位用戶 (硬刪除，謹慎使用)
app.delete('/api/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // 防止刪除最後一個管理員
        const adminCheck = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT role FROM users WHERE id = @id;
                SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin' AND is_active = 1;
            `);
        
        if (adminCheck.recordsets[0].length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userRole = adminCheck.recordsets[0][0].role;
        const adminCount = adminCheck.recordsets[1][0].admin_count;
        
        if (userRole === 'admin' && adminCount <= 1) {
            return res.status(400).json({ error: '無法刪除最後一個管理員' });
        }
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM users WHERE id = @id');
            
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// --- 師資管理 API 端點 ---

// [READ] 取得所有師資資料
app.get('/api/teachers', async (req, res, next) => {
    try {
        const { specialty, status, min_rate, max_rate, min_experience, available_day } = req.query;
        let query = `
            SELECT 
                t.id, t.name, t.email, t.phone, t.available_days, 
                t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url,
                t.created_at, t.updated_at,
                ISNULL(STRING_AGG(tc.course_category, ', '), '') as course_categories,
                ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', '), '') as preferred_courses
            FROM teachers t 
            LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
            WHERE 1=1
        `;
        const request = pool.request();
        
        // 狀態篩選
        if (status !== undefined) {
            query += ' AND t.is_active = @status';
            request.input('status', sql.Bit, status === 'true' ? 1 : 0);
        }
        
        // 課程分類篩選
        if (specialty) {
            query += ` AND EXISTS (
                SELECT 1 FROM teacher_courses tc2 
                WHERE tc2.teacher_id = t.id 
                AND tc2.course_category = @specialty
            )`;
            request.input('specialty', sql.NVarChar, specialty);
        }
        
        // 時薪範圍篩選
        if (min_rate) {
            query += ' AND t.hourly_rate >= @min_rate';
            request.input('min_rate', sql.Int, min_rate);
        }
        if (max_rate) {
            query += ' AND t.hourly_rate <= @max_rate';
            request.input('max_rate', sql.Int, max_rate);
        }
        
        // 經驗年資篩選
        if (min_experience) {
            query += ' AND t.experience >= @min_experience';
            request.input('min_experience', sql.Int, min_experience);
        }
        
        // 可授課日篩選
        if (available_day) {
            query += ' AND t.available_days LIKE @available_day';
            request.input('available_day', sql.NVarChar, `%${available_day}%`);
        }
        
        // 移除預設排序，讓前端完全控制排序
        //         // 使用 sort_order 欄位進行排序
        query += ' GROUP BY t.id, t.name, t.email, t.phone, t.available_days, t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url, t.created_at, t.updated_at';
        query += ' ORDER BY ISNULL(t.sort_order, 999999), t.id ASC';
        
        const result = await request.query(query);
        
        // 解析 JSON 字串為陣列，並處理課程能力資料
        const teachers = result.recordset.map(teacher => ({
            ...teacher,
            availableDays: teacher.available_days ? JSON.parse(teacher.available_days) : [],
            courseCategories: teacher.course_categories && teacher.course_categories.trim() ? teacher.course_categories.split(', ') : [],
            preferredCourses: teacher.preferred_courses && teacher.preferred_courses.trim() ? teacher.preferred_courses.split(', ') : []
        }));
        
        res.json(teachers);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得師資統計資訊
app.get('/api/teachers/stats', async (req, res, next) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total_teachers,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_teachers,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_teachers,
                AVG(CAST(hourly_rate AS FLOAT)) as avg_hourly_rate,
                AVG(CAST(experience AS FLOAT)) as avg_experience,
                MIN(hourly_rate) as min_hourly_rate,
                MAX(hourly_rate) as max_hourly_rate
            FROM teachers
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得課程分類列表（用於師資篩選）
app.get('/api/teachers/course-categories', async (req, res, next) => {
    try {
        // 從 teacher_courses 表提取所有課程分類
        const result = await pool.request().query(`
            SELECT DISTINCT tc.course_category
            FROM teacher_courses tc
            INNER JOIN teachers t ON tc.teacher_id = t.id
            WHERE t.is_active = 1
            ORDER BY tc.course_category
        `);
        
        const categories = result.recordset.map(row => row.course_category);
        res.json(categories);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得可授課日列表
app.get('/api/teachers/available-days', async (req, res, next) => {
    try {
        const availableDays = [
            '週一', '週二', '週三', '週四', '週五', '週六', '週日'
        ];
        res.json(availableDays);
    } catch (err) {
        next(err);
    }
});

// [READ] 取得單一師資
app.get('/api/teachers/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    t.id, t.name, t.email, t.phone, t.available_days, 
                    t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url,
                    t.created_at, t.updated_at,
                    ISNULL(STRING_AGG(tc.course_category, ', '), '') as course_categories,
                    ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', '), '') as preferred_courses
                FROM teachers t 
                LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
                WHERE t.id = @id
                GROUP BY t.id, t.name, t.email, t.phone, t.available_days, t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url, t.created_at, t.updated_at
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        
        const teacher = result.recordset[0];
        // 解析 JSON 字串為陣列，並處理課程能力資料
        teacher.availableDays = teacher.available_days ? JSON.parse(teacher.available_days) : [];
        teacher.courseCategories = teacher.course_categories && teacher.course_categories.trim() ? teacher.course_categories.split(', ') : [];
        teacher.preferredCourses = teacher.preferred_courses && teacher.preferred_courses.trim() ? teacher.preferred_courses.split(', ') : [];
        
        res.json(teacher);
    } catch (err) {
        next(err);
    }
});

// [GET] 取得所有師資的課程能力（用於管理頁面）
app.get('/api/teacher-courses', async (req, res, next) => {
    try {
        console.log('=== 取得所有師資課程能力 ===');
        
        const result = await pool.request()
            .query(`
                SELECT 
                    tc.id,
                    tc.teacher_id,
                    t.name as teacher_name,
                    tc.course_category,
                    tc.max_level,
                    tc.is_preferred,
                    tc.created_at
                FROM teacher_courses tc
                INNER JOIN teachers t ON tc.teacher_id = t.id
                ORDER BY t.name, tc.is_preferred DESC, tc.course_category
            `);
            
        console.log('查詢結果筆數:', result.recordset.length);
        res.json(result.recordset);
        
    } catch (err) {
        console.error('取得所有師資課程能力錯誤:', err);
        next(err);
    }
});

// [GET] 取得師資的課程能力
app.get('/api/teachers/:id/courses', async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log('=== 師資課程能力查詢 DEBUG ===');
        console.log('師資 ID:', id);
        console.log('ID 類型:', typeof id);
        
        // 先檢查師資是否存在
        const teacherCheck = await pool.request()
            .input('teacherId', sql.Int, id)
            .query('SELECT id, name FROM teachers WHERE id = @teacherId');
            
        if (teacherCheck.recordset.length === 0) {
            console.log('師資不存在');
            return res.status(404).json({ error: '師資不存在' });
        }
        
        console.log('師資存在:', teacherCheck.recordset[0]);
        
        // 簡化的查詢語句
        const result = await pool.request()
            .input('teacherId', sql.Int, id)
            .query('SELECT * FROM teacher_courses WHERE teacher_id = @teacherId ORDER BY is_preferred DESC, course_category');
            
        console.log('查詢結果筆數:', result.recordset.length);
        console.log('查詢結果:', result.recordset);
        console.log('=========================');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('師資課程能力查詢錯誤:', err);
        console.error('錯誤詳細:', {
            message: err.message,
            number: err.number,
            state: err.state,
            severity: err.severity,
            stack: err.stack
        });
        next(err);
    }
});

// [CREATE] 新增一位師資
app.post(
    '/api/teachers',
    // --- 驗證規則 ---
    body('name').notEmpty().withMessage('師資姓名為必填'),
    body('email').isEmail().withMessage('無效的電子信箱格式'),
    body('phone').optional(),

    body('availableDays').isArray().withMessage('可授課日必須是陣列格式'),
    body('hourlyRate').isInt({ min: 0 }).withMessage('時薪必須是正整數'),
    body('experience').isInt({ min: 0 }).withMessage('經驗年資必須是正整數'),
    body('bio').optional(),
    body('isActive').isBoolean().withMessage('狀態必須是布林值'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for POST /api/teachers: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { name, email, phone, availableDays, hourlyRate, experience, bio, isActive } = req.body;
            
            // 檢查 email 是否已被其他老師使用
            const emailCheckResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT id FROM teachers WHERE email = @email');
                
            if (emailCheckResult.recordset.length > 0) {
                return res.status(400).json({ error: '此電子信箱已被其他老師使用#1' });
            }
            
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone || null)

                .input('available_days', sql.NVarChar, JSON.stringify(availableDays))
                .input('hourly_rate', sql.Int, hourlyRate)
                .input('experience', sql.Int, experience)
                .input('bio', sql.NVarChar, bio || null)
                .input('is_active', sql.Bit, isActive)
                .query(`
                    INSERT INTO teachers (name, email, phone, available_days, hourly_rate, experience, bio, is_active) 
                    OUTPUT inserted.*
                    VALUES (@name, @email, @phone, @available_days, @hourly_rate, @experience, @bio, @is_active)
                `);
            
            const teacher = result.recordset[0];
            // 解析 JSON 字串為陣列
            teacher.availableDays = teacher.available_days ? JSON.parse(teacher.available_days) : [];
            
            res.status(201).json(teacher);
        } catch (err) {
            if (err.number === 2627) { // 唯一約束違反
                return res.status(400).json({ error: '#2' });
            }
            next(err);
        }
    }
);

// [UPDATE] 更新一位師資
app.put(
    '/api/teachers/:id',
    // --- 驗證規則 ---
    body('name').notEmpty().withMessage('師資姓名為必填'),
    body('email').isEmail().withMessage('無效的電子信箱格式'),
    body('phone').optional(),

    body('availableDays').isArray().withMessage('可授課日必須是陣列格式'),
    body('hourlyRate').isInt({ min: 0 }).withMessage('時薪必須是正整數'),
    body('experience').isInt({ min: 0 }).withMessage('經驗年資必須是正整數'),
    body('bio').optional(),
    body('isActive').isBoolean().withMessage('狀態必須是布林值'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for PUT /api/teachers/${req.params.id}: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { name, email, phone, specialties, availableDays, hourlyRate, experience, bio, isActive } = req.body;
            
            // 調試：記錄實際收到的資料
            console.log('=== 師資更新調試資訊 ===');
            console.log('師資ID:', id);
            console.log('收到的email:', email);
            console.log('收到的姓名:', name);
            console.log('========================');
            
            // ID為0是合法的師資ID，不需要特殊處理
            console.log('正在更新師資ID:', id);
            
            // 檢查 email 是否已被其他老師使用（排除當前編輯的老師）
            console.log('檢查email衝突，排除ID:', id);
            const emailCheckResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('id', sql.Int, id)
                .query('SELECT id, name FROM teachers WHERE email = @email AND id != @id');
                
            console.log('email檢查結果:', emailCheckResult.recordset);
            
            if (emailCheckResult.recordset.length > 0) {
                const conflictTeacher = emailCheckResult.recordset[0];
                console.log('發現email衝突:', conflictTeacher);
                return res.status(400).json({ 
                    error: `此電子信箱已被其他老師使用：${conflictTeacher.name} (ID: ${conflictTeacher.id})` 
                });
            }
            
            console.log('準備執行UPDATE語句...');
            console.log('UPDATE參數:', { id, name, email, phone, hourlyRate, experience, isActive });
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone || null)
                .input('specialties', sql.NVarChar, JSON.stringify(specialties))
                .input('available_days', sql.NVarChar, JSON.stringify(availableDays))
                .input('hourly_rate', sql.Int, hourlyRate)
                .input('experience', sql.Int, experience)
                .input('bio', sql.NVarChar, bio || null)
                .input('is_active', sql.Bit, isActive)
                .query(`
                    UPDATE teachers 
                    SET name = @name, email = @email, phone = @phone, 
                        specialties = @specialties, available_days = @available_days,
                        hourly_rate = @hourly_rate, experience = @experience, 
                        bio = @bio, is_active = @is_active, updated_at = GETDATE()
                    WHERE id = @id;
                    SELECT * FROM teachers WHERE id = @id;
                `);
                
            console.log('UPDATE執行成功，影響行數:', result.rowsAffected);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Teacher not found' });
            }
            
            const teacher = result.recordset[0];
            // 解析 JSON 字串為陣列
            teacher.specialties = teacher.specialties ? JSON.parse(teacher.specialties) : [];
            teacher.availableDays = teacher.available_days ? JSON.parse(teacher.available_days) : [];
            
            res.json(teacher);
        } catch (err) {
            if (err.number === 2627) { // 唯一約束違反
                return res.status(400).json({ error: '此電子信箱已被其他老師使用#2' });
            }
            next(err);
        }
    }
);

// [UPDATE] 切換師資狀態
app.patch('/api/teachers/:id/toggle-status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE teachers 
                SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = GETDATE()
                WHERE id = @id;
                SELECT * FROM teachers WHERE id = @id;
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        
        const teacher = result.recordset[0];
        // 解析 JSON 字串為陣列
        teacher.specialties = teacher.specialties ? JSON.parse(teacher.specialties) : [];
        teacher.availableDays = teacher.available_days ? JSON.parse(teacher.available_days) : [];
        
        res.json(teacher);
    } catch (err) {
        next(err);
    }
});

// [UPDATE] 更新師資排序
app.patch('/api/teachers/reorder', async (req, res, next) => {
    try {
        const { teacherIds } = req.body;
        
        if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
            return res.status(400).json({ error: '請提供有效的師資 ID 陣列' });
        }
        
        // 使用事務來確保所有更新都成功
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // 批量更新排序值
            for (let i = 0; i < teacherIds.length; i++) {
                await transaction.request()
                    .input('id', sql.Int, teacherIds[i])
                    .input('sortOrder', sql.Int, i + 1)
                    .query('UPDATE teachers SET sort_order = @sortOrder WHERE id = @id');
            }
            
            await transaction.commit();
            
            res.json({ 
                message: '排序更新成功',
                updatedCount: teacherIds.length 
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        next(err);
    }
});

// [DELETE] 刪除一位師資 (軟刪除)
app.delete('/api/teachers/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE teachers SET is_active = 0, updated_at = GETDATE() WHERE id = @id AND is_active = 1');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// [CREATE] 新增師資課程能力
app.post(
    '/api/teachers/:id/courses',
    // --- 驗證規則 ---
    body('courseCategory').notEmpty().withMessage('課程分類為必填'),
    body('maxLevel').isIn(['初級', '中級', '高級']).withMessage('無效的課程難度'),
    body('isPreferred').isBoolean().withMessage('是否主力課程必須是布林值'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { courseCategory, maxLevel, isPreferred } = req.body;
            
            const result = await pool.request()
                .input('teacher_id', sql.Int, id)
                .input('course_category', sql.NVarChar, courseCategory)
                .input('max_level', sql.NVarChar, maxLevel)
                .input('is_preferred', sql.Bit, isPreferred)
                .query(`
                    INSERT INTO teacher_courses (teacher_id, course_category, max_level, is_preferred) 
                    OUTPUT inserted.*
                    VALUES (@teacher_id, @course_category, @max_level, @is_preferred)
                `);
            res.status(201).json(result.recordset[0]);
        } catch (err) {
            if (err.number === 2627) { // 唯一約束違反
                return res.status(400).json({ error: '該師資已有此課程分類的記錄' });
            }
            next(err);
        }
    }
);

// [UPDATE] 更新師資課程能力
app.put(
    '/api/teachers/:teacherId/courses/:courseId',
    // --- 驗證規則 ---
    body('courseCategory').notEmpty().withMessage('課程分類為必填'),
    body('maxLevel').isIn(['初級', '中級', '高級']).withMessage('無效的課程難度'),
    body('isPreferred').isBoolean().withMessage('是否主力課程必須是布林值'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { teacherId, courseId } = req.params;
            const { courseCategory, maxLevel, isPreferred } = req.body;
            
            const result = await pool.request()
                .input('id', sql.Int, courseId)
                .input('teacher_id', sql.Int, teacherId)
                .input('course_category', sql.NVarChar, courseCategory)
                .input('max_level', sql.NVarChar, maxLevel)
                .input('is_preferred', sql.Bit, isPreferred)
                .query(`
                    UPDATE teacher_courses 
                    SET course_category = @course_category, max_level = @max_level, 
                        is_preferred = @is_preferred
                    WHERE id = @id AND teacher_id = @teacher_id;
                    SELECT * FROM teacher_courses WHERE id = @id;
                `);
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Teacher course not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            if (err.number === 2627) { // 唯一約束違反
                return res.status(400).json({ error: '該師資已有此課程分類的記錄' });
            }
            next(err);
        }
    }
);

// [DELETE] 刪除師資課程能力
app.delete('/api/teachers/:teacherId/courses/:courseId', async (req, res, next) => {
    try {
        const { teacherId, courseId } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, courseId)
            .input('teacher_id', sql.Int, teacherId)
            .query('DELETE FROM teacher_courses WHERE id = @id AND teacher_id = @teacher_id');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Teacher course not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// --- 集中化的錯誤處理中介軟體 ---
app.use((err, req, res, next) => {
    // 使用 logger 記錄完整的錯誤資訊
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    
    // 只回傳通用的錯誤訊息給客戶端，避免洩漏實作細節
    res.status(500).json({
        error: '伺服器發生未預期的錯誤'
    });
});

// --- 啟動伺服器 ---
const startServer = async () => {
    try {
        await pool.connect();
        console.log('資料庫連線成功！');
        app.listen(port, () => {
            console.log(`後端伺服器正在 http://localhost:${port} 上運行`);
        });
    } catch (err) {
        console.error('資料庫連線失敗:', err);
        process.exit(1);
    }
};

startServer();

