const express = require('express');								// 引入 express 模組
require('dotenv').config(); 											// 從 .env 檔案載入環境變數
const path = require('path');											// 引入 path 模組
const fs = require('fs');													// 引入 fs 模組
const multer = require('multer');									// 引入 multer 模組
const rateLimit = require('express-rate-limit');	// 引入 express-rate-limit 模組
const { body, query, validationResult } = require('express-validator');	// 引入 express-validator 模組
const cors = require('cors');											// 引入 cors 模組
const jwt = require('jsonwebtoken');							// 引入 jsonwebtoken 模組
const bcrypt = require('bcrypt');									// 引入 bcrypt 模組
const logger = require('./logger'); 							// 引入我們建立的 logger

const app = express();
const PORT = process.env.PORT || 3000; // 您可以選擇任何未被佔用的 port

// --- 中介軟體 (Middleware) ---
app.use(cors()); 					// 允許所有跨域請求
app.use(express.json()); 	// 解析傳入的 JSON 請求

// 新增：請求日誌中介軟體（只記錄重要請求）
app.use((req, res, next) => {
    // 只記錄非靜態資源的重要請求
    if (!req.originalUrl.startsWith('/uploads/') && !req.originalUrl.includes('.')) {
        logger.info(`${req.method} ${req.originalUrl}`);
    }
    next();
});

// --- 請求速率限制中介軟體 ---
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 分鐘
	max: 1000, // 暫時增加到 1000 次請求以解決登入問題
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
	pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
	options: {
			encrypt: true, // 如果您的 SQL Server 需要 SSL，請設為 true
			trustServerCertificate: true, // 在開發環境中，設為 true 以信任自我簽署的憑證
			enableArithAbort: true, // 啟用算術中止
			enableNumericRoundAbort: false // 禁用數值捨入中止
	}
};

const sql = require('mssql'); // 確保這裡使用的是 mssql
let pool;   // 連接池
let server; // HTTP Server 參考


// --- API 路由 (Endpoints) ---

// 測試連線
app.get('/', (req, res) => {
    res.send('後端伺服器已啟動！');
});

// ==========================================================================================================
// 用戶登入/認證 API
// ==========================================================================================================

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
        
        // 登入成功
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
                // 帳號自動解鎖
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

// [POST] 驗證管理員密碼（需要認證）
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

// [POST] 驗證管理員密碼（不需要認證，用於刪除確認）
app.post('/api/auth/validate-admin', async (req, res, next) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: '請提供密碼' });
        }
        
        // 從資料庫查詢管理員用戶
        const result = await pool.request()
            .input('username', sql.NVarChar, 'admin')
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
        logger.error(`Admin password validation error: ${err.message}`);
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
        
        // 管理員手動解鎖帳號
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


// ==========================================================================================================
// 學生管理 API 端點
// ==========================================================================================================

// [READ] 取得所有學生資料
app.get('/api/students', async (req, res, next) => {
    try {
        const { school, grade, level_type, gender, class_type, enrollment_status, class_schedule_type } = req.query;
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
        if (enrollment_status) {
            query += ' AND enrollment_status = @enrollment_status';
            request.input('enrollment_status', sql.NVarChar, enrollment_status);
        }
        if (class_schedule_type) {
            query += ' AND class_schedule_type = @class_schedule_type';
            request.input('class_schedule_type', sql.NVarChar, class_schedule_type);
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

// [GET] 在學生管理中取得學校列表(用於下拉選單)
app.get('/api/students/schools', async (req, res, next) => {
    try {
        const result = await pool.request().query('SELECT DISTINCT school FROM students WHERE is_active = 1 ORDER BY school');
        res.json(result.recordset.map(row => row.school));
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
	body('grade').notEmpty().withMessage('年級為必填').isIn(['小一', '小二', '小三', '小四', '小五', '小六', '國一', '國二', '國三', '高一', '高二', '高三', '大一', '大二', '大三', '大四']).withMessage('無效的年級'),
	body('gender').isIn(['男', '女']).withMessage('無效的性別'),
	body('level_type').isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的程度'),
	body('class_type').notEmpty().withMessage('班別為必填'),
	body('student_email').notEmpty().withMessage('學生電子信箱為必填').isEmail().withMessage('無效的學生電子信箱格式'),
	body('father_email').optional().isEmail().withMessage('無效的父親電子信箱格式'),
	body('mother_email').optional().isEmail().withMessage('無效的母親電子信箱格式'),
	body('enrollment_status').optional().isIn(['進行中', '已畢業', '暫停中']).withMessage('無效的就讀狀態'),
	body('class_schedule_type').optional().isIn(['常態班', '短期班']).withMessage('無效的班級排程類型'),
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
							school, grade, gender, level_type, class_type, enrollment_status, notes, class_schedule_type
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
							.input('enrollment_status', sql.NVarChar, enrollment_status || '進行中')
							.input('notes', sql.NVarChar, notes || null)
							.input('class_schedule_type', sql.NVarChar, class_schedule_type || '常態班')
							.query(`
									INSERT INTO students (
											chinese_name, english_name, student_phone, student_email, student_line,
											father_name, father_phone, father_line,
											mother_name, mother_phone, mother_line,
											school, grade, gender, level_type, class_type, enrollment_status, notes, class_schedule_type
									) 
									VALUES (
											@chinese_name, @english_name, @student_phone, @student_email, @student_line,
											@father_name, @father_phone, @father_line,
											@mother_name, @mother_phone, @mother_line,
											@school, @grade, @gender, @level_type, @class_type, @enrollment_status, @notes, @class_schedule_type
									);
									SELECT * FROM students WHERE id = SCOPE_IDENTITY() AND is_active = 1;
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
	body('grade').notEmpty().withMessage('年級為必填').isIn(['小一', '小二', '小三', '小四', '小五', '小六', '國一', '國二', '國三', '高一', '高二', '高三', '大一', '大二', '大三', '大四']).withMessage('無效的年級'),
	body('gender').isIn(['男', '女']).withMessage('無效的性別'),
	body('level_type').isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的程度'),
	body('class_type').notEmpty().withMessage('班別為必填'),
	body('student_email').notEmpty().withMessage('學生電子信箱為必填').isEmail().withMessage('無效的學生電子信箱格式'),
	body('enrollment_status').optional().isIn(['進行中', '已畢業', '暫停中']).withMessage('無效的就讀狀態'),
	body('class_schedule_type').optional().isIn(['常態班', '短期班']).withMessage('無效的班級排程類型'),
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
							school, grade, gender, level_type, class_type, enrollment_status, notes, class_schedule_type
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
							.input('enrollment_status', sql.NVarChar, enrollment_status || '進行中')
							.input('notes', sql.NVarChar, notes || null)
							.input('class_schedule_type', sql.NVarChar, class_schedule_type || '常態班')
							.query(`
									UPDATE students 
									SET chinese_name = @chinese_name, english_name = @english_name, 
											student_phone = @student_phone, student_email = @student_email, student_line = @student_line,
											father_name = @father_name, father_phone = @father_phone, father_line = @father_line,
											mother_name = @mother_name, mother_phone = @mother_phone, mother_line = @mother_line,
											school = @school, grade = @grade, gender = @gender, 
											level_type = @level_type, class_type = @class_type, enrollment_status = @enrollment_status, notes = @notes, class_schedule_type = @class_schedule_type, updated_at = GETDATE()
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

			// 使用事務來確保資料一致性
			const transaction = new sql.Transaction(pool);
			await transaction.begin();

			try {
				// 先設定 SET 選項
				await transaction.request().query('SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;');

				const result = await transaction.request()
						.input('id', sql.Int, id)
						.query('UPDATE students SET is_active = 0, updated_at = GETDATE() WHERE id = @id AND is_active = 1');

				if (result.rowsAffected[0] === 0) {
					await transaction.rollback();
						return res.status(404).json({ error: 'Student not found or already deleted' });
				}

				await transaction.commit();
				res.status(204).send();
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	} catch (err) {
		console.error('Delete student error:', err);
		next(err);
	}
});

// [API] 查詢學生課程能力進度
app.get('/api/student-course-progress', async (req, res, next) => {
	try {
			const { student_id, course_id } = req.query;
			let query = `
					SELECT 
							scp.id,
							scp.student_id,
							s.chinese_name AS student_name,
							scp.course_id,
							c.name AS course_name,
							scp.ability_level,
							scp.progress_percentage,
							scp.last_updated,
							scp.notes
					FROM student_course_progress AS scp
      		INNER JOIN students AS s ON scp.student_id = s.id
      		INNER JOIN courses AS c ON scp.course_id = c.id
      		WHERE scp.is_active = 1
			`;

			// 預備 SQL Request
			const request = (await pool).request();

			// 依有無帶參數決定是否加條件
			if (student_id)
			{
				query += ' AND scp.student_id = @student_id';
				request.input('student_id', sql.Int, Number(student_id));
			}
			if (course_id)
			{
				query += ' AND scp.course_id = @course_id';
				request.input('course_id', sql.Int, Number(course_id));
			}

			query += ' ORDER BY scp.last_updated DESC';

			/* === 2. 執行查詢 === */
			const result = await request.query(query);

			/* === 3. 回傳結果 === */
			res.json(result.recordset);
	} catch (err) {
			next(err);
	}
});

// =====================================================
// 學生課程(大分類)學習程度管理 API
// =====================================================

// [GET] 取得學生的班別程度能力
app.get('/api/students/:studentId/class-abilities', async (req, res, next) => {
	try {
			const { studentId } = req.params;
			
			const result = await pool.request()
					.input('studentId', sql.Int, studentId)
					.query(`
							SELECT 
									sca.id,
									sca.student_id,
									sca.class_type,
									sca.ability_level,
									sca.assessment_date,
									sca.assessor_id,
									sca.notes,
									sca.created_at,
									sca.updated_at
							FROM student_class_type_abilities sca
							WHERE sca.student_id = @studentId AND sca.is_active = 1
							ORDER BY sca.class_type
					`);
					
			res.json(result.recordset);
	} catch (err) {
			next(err);
	}
});

// [POST] 新增學生的班別程度能力
app.post(
	'/api/students/:studentId/class-abilities',
	body('class_type').optional(),
	body('ability_level').isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的程度'),
	body('assessment_date').optional().isISO8601().withMessage('評估日期格式無效'),
	async (req, res, next) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
			}

			try {
					const { studentId } = req.params;
					const { class_type, ability_level, assessment_date, notes } = req.body;
					
					console.log('收到的新增班別程度請求:', {
							studentId,
							class_type,
							ability_level,
							assessment_date,
							notes
					});
					
					// 根據班別名稱或代碼取得班別代碼
					let classCode = class_type;
					if (class_type && class_type !== '' && class_type !== '請選擇班別') {
							console.log('查詢班別代碼，輸入值:', class_type);
							
							const classTypeResult = await pool.request()
									.input('classType', sql.NVarChar, class_type)
									.query(`
											SELECT class_code FROM class_types 
											WHERE (class_name = @classType OR class_code = @classType) AND is_active = 1
									`);
							
							console.log('查詢結果:', classTypeResult.recordset);
							
							if (classTypeResult.recordset.length === 0) {
									console.log('找不到對應的班別記錄');
									return res.status(400).json({ error: '無效的班別名稱或代碼' });
							}
							classCode = classTypeResult.recordset[0].class_code;
							console.log('找到的班別代碼:', classCode);
					} else {
							// 如果班別為空，設為 null
							classCode = null;
							console.log('班別為空，設為 null');
					}
					
					// 檢查是否已存在相同的班別（只有當班別不為空時才檢查）
					if (classCode) {
							const existingCheck = await pool.request()
									.input('studentId', sql.Int, studentId)
									.input('classCode', sql.NVarChar, classCode)
									.query(`
											SELECT id FROM student_class_type_abilities 
											WHERE student_id = @studentId AND class_type = @classCode AND is_active = 1
									`);
									
							if (existingCheck.recordset.length > 0) {
									return res.status(400).json({ error: '該學生在此班別已有程度記錄' });
							}
					}
					
					const result = await pool.request()
							.input('studentId', sql.Int, studentId)
							.input('classCode', sql.NVarChar, classCode)
							.input('abilityLevel', sql.NVarChar, ability_level)
							.input('assessmentDate', sql.Date, assessment_date || new Date())
							.input('notes', sql.NVarChar, notes || null)
							.query(`
							INSERT INTO student_class_type_abilities (
									student_id, class_type, ability_level, assessment_date, notes
							) 
							VALUES (@studentId, @classCode, @abilityLevel, @assessmentDate, @notes);
							
							SELECT SCOPE_IDENTITY() as id;
					`);
					
					// 取得新插入的記錄ID
					const insertId = result.recordset[0]?.id;
					
					// 重新查詢插入的資料
					const insertedResult = await pool.request()
							.input('insertId', sql.Int, insertId)
							.query(`
									SELECT * FROM student_class_type_abilities 
									WHERE id = @insertId
							`);
							
					res.status(201).json(insertedResult.recordset[0]);
			} catch (err) {
					next(err);
			}
	}
);

// [DELETE] 刪除學生的班別程度能力
app.delete('/api/students/:studentId/class-abilities/:abilityId', async (req, res, next) => {
	try {
			const { studentId, abilityId } = req.params;
			
			const result = await pool.request()
					.input('studentId', sql.Int, studentId)
					.input('abilityId', sql.Int, abilityId)
					.query(`
							UPDATE student_class_type_abilities 
							SET is_active = 0, updated_at = GETDATE()
							WHERE id = @abilityId AND student_id = @studentId
					`);
					
			if (result.rowsAffected[0] === 0) {
					return res.status(404).json({ error: '找不到指定的程度記錄' });
			}
			
			res.json({ message: '程度記錄已刪除' });
	} catch (err) {
			next(err);
	}
});

// [PUT] 更新學生的班別程度能力
app.put(
	'/api/students/:studentId/class-abilities/:abilityId',
	body('class_type').optional(),
	body('ability_level').optional().isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的程度'),
	body('assessment_date').optional().isISO8601().withMessage('評估日期格式無效'),
	async (req, res, next) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
			}

			try {
					const { studentId, abilityId } = req.params;
					const updates = req.body;
					
					// 建立動態更新查詢
					let updateFields = [];
					const request = pool.request()
							.input('studentId', sql.Int, studentId)
							.input('abilityId', sql.Int, abilityId);
					
					if (updates.class_type !== undefined) {
							// 根據班別名稱或代碼取得班別代碼
							if (updates.class_type !== '請選擇班別') {
									const classTypeResult = await pool.request()
											.input('classType', sql.NVarChar, updates.class_type)
											.query(`
													SELECT class_code FROM class_types 
													WHERE (class_name = @classType OR class_code = @classType) AND is_active = 1
											`);
									
									if (classTypeResult.recordset.length === 0) {
											return res.status(400).json({ error: '無效的班別名稱或代碼' });
									}
									const classCode = classTypeResult.recordset[0].class_code;
									updateFields.push('class_type = @classCode');
									request.input('classCode', sql.NVarChar, classCode);
							}
					}
					
					if (updates.ability_level !== undefined) {
							updateFields.push('ability_level = @abilityLevel');
							request.input('abilityLevel', sql.NVarChar, updates.ability_level);
					}
					
					if (updates.assessment_date !== undefined) {
							updateFields.push('assessment_date = @assessmentDate');
							request.input('assessmentDate', sql.Date, updates.assessment_date);
					}
					
					if (updates.notes !== undefined) {
							updateFields.push('notes = @notes');
							request.input('notes', sql.NVarChar, updates.notes);
					}
					
					if (updateFields.length === 0) {
							return res.status(400).json({ error: '沒有提供要更新的欄位' });
					}
					
					updateFields.push('updated_at = GETDATE()');
					
					const result = await request.query(`
							UPDATE student_class_type_abilities 
							SET ${updateFields.join(', ')}
							WHERE id = @abilityId AND student_id = @studentId
					`);
					
					if (result.rowsAffected[0] === 0) {
							return res.status(404).json({ error: '找不到指定的程度記錄' });
					}
					
					// 重新查詢更新後的資料
					const updatedResult = await pool.request()
							.input('abilityId', sql.Int, abilityId)
							.query(`
									SELECT * FROM student_class_type_abilities 
									WHERE id = @abilityId
							`);
					
					if (updatedResult.recordset.length === 0) {
							return res.status(404).json({ error: '找不到指定的程度記錄' });
					}
					
					res.json(updatedResult.recordset[0]);
			} catch (err) {
					next(err);
			}
	}
);

// =====================================================
// 學生單一課程學習程度管理 API
// =====================================================

// [GET] 取得學生的單一課程進度
app.get('/api/students/:studentId/course-progress', async (req, res, next) => {
	try {
			const { studentId } = req.params;
			
			const result = await pool.request()
					.input('studentId', sql.Int, studentId)
					.query(`
							SELECT 
									scp.id,
									scp.student_id,
									scp.course_id,
									COALESCE(c.name, '') as course_name,
									scp.ability_level,
									scp.progress_percentage,
									scp.notes,
									scp.last_updated,
									scp.created_at,
									scp.updated_at
							FROM student_course_progress scp
							LEFT JOIN courses c ON scp.course_id = c.id
							WHERE scp.student_id = @studentId AND scp.is_active = 1
							ORDER BY COALESCE(c.name, '')
					`);
					
			res.json(result.recordset);
	} catch (err) {
			next(err);
	}
});

// [POST] 新增學生的單一課程進度
app.post(
	'/api/students/:studentId/course-progress',
	body('course_id').isInt({ min: 0 }).withMessage('課程ID必須為非負整數'),
	body('ability_level').isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的程度'),
	body('progress_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('進度百分比必須在0-100之間'),
	async (req, res, next) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
			}

			try {
					const { studentId } = req.params;
					const { course_id, ability_level, progress_percentage, notes } = req.body;
					
					// 如果 course_id 為 0，設為 null（表示未選擇課程）
					let actualCourseId = course_id;
					if (course_id === 0) {
							actualCourseId = null;
					}
					
					// 檢查是否已存在相同的課程（只有當課程ID不為空時才檢查）
					if (actualCourseId) {
							const existingCheck = await pool.request()
									.input('studentId', sql.Int, studentId)
									.input('courseId', sql.Int, actualCourseId)
									.query(`
											SELECT id FROM student_course_progress 
											WHERE student_id = @studentId AND course_id = @courseId AND is_active = 1
									`);
							
							if (existingCheck.recordset.length > 0) {
									return res.status(400).json({ error: '該學生在此課程已有進度記錄' });
							}
					}

					const request = pool.request()
							.input('studentId', sql.Int, studentId)
							.input('abilityLevel', sql.NVarChar, ability_level)
							.input('progressPercentage', sql.Decimal(5,2), progress_percentage || 0)
							.input('notes', sql.NVarChar, notes || null);

					let query;
					if (actualCourseId === null) {
							query = `
									INSERT INTO student_course_progress (
											student_id, course_id, ability_level, progress_percentage, notes
									) 
									VALUES (@studentId, NULL, @abilityLevel, @progressPercentage, @notes);
									SELECT SCOPE_IDENTITY() as id;
							`;
					} else {
							request.input('courseId', sql.Int, actualCourseId);
							query = `
									INSERT INTO student_course_progress (
											student_id, course_id, ability_level, progress_percentage, notes
									) 
									VALUES (@studentId, @courseId, @abilityLevel, @progressPercentage, @notes);
									SELECT SCOPE_IDENTITY() as id;
							`;
					}

					const result = await request.query(query);
					const newId = result.recordset[0].id;
					const newRecord = await pool.request()
							.input('id', sql.Int, newId)
							.query(`
									SELECT 
											scp.id, scp.student_id, scp.course_id, COALESCE(c.name, '') as course_name,
											scp.ability_level, scp.progress_percentage, scp.notes,
											scp.last_updated, scp.created_at, scp.updated_at
									FROM student_course_progress scp
									LEFT JOIN courses c ON scp.course_id = c.id
									WHERE scp.id = @id
							`);
					res.status(201).json(newRecord.recordset[0]);
			} catch (err) {
					next(err);
			}
	}
);

// [DELETE] 刪除學生的課程進度
app.delete('/api/students/:studentId/course-progress/:progressId', async (req, res, next) => {
	try {
			const { studentId, progressId } = req.params;
			
			const result = await pool.request()
					.input('studentId', sql.Int, studentId)
					.input('progressId', sql.Int, progressId)
					.query(`
							UPDATE student_course_progress 
							SET is_active = 0, updated_at = GETDATE()
							WHERE id = @progressId AND student_id = @studentId AND is_active = 1
					`);
					
			if (result.rowsAffected[0] === 0) {
					return res.status(404).json({ error: '找不到指定的進度記錄' });
			}
			
			res.json({ message: '進度記錄已刪除' });
	} catch (err) {
			console.error('Delete student course progress error:', err);
			next(err);
	}
});

// [PUT] 更新學生的單一課程進度
app.put(
	'/api/students/:studentId/course-progress/:progressId',
	body('course_id').optional().isInt({ min: 0 }).withMessage('課程ID必須為非負整數'),
	body('ability_level').optional().isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的程度'),
	body('progress_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('進度百分比必須在0-100之間'),
	async (req, res, next) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
			}

			try {
					const { studentId, progressId } = req.params;
					const updates = req.body;
					
					// 建立動態更新查詢
					let updateFields = [];
					const request = pool.request()
							.input('studentId', sql.Int, studentId)
							.input('progressId', sql.Int, progressId);
					
					if (updates.course_id !== undefined) {
							// 如果 course_id 為 0，設為 null
							const actualCourseId = updates.course_id === 0 ? null : updates.course_id;
							if (actualCourseId === null) {
									updateFields.push('course_id = NULL');
							} else {
									updateFields.push('course_id = @courseId');
									request.input('courseId', sql.Int, actualCourseId);
							}
					}
					
					if (updates.ability_level !== undefined) {
							updateFields.push('ability_level = @abilityLevel');
							request.input('abilityLevel', sql.NVarChar, updates.ability_level);
					}
					
					if (updates.progress_percentage !== undefined) {
							updateFields.push('progress_percentage = @progressPercentage');
							request.input('progressPercentage', sql.Decimal(5,2), updates.progress_percentage);
					}
					
					if (updates.notes !== undefined) {
							updateFields.push('notes = @notes');
							request.input('notes', sql.NVarChar, updates.notes);
					}
					
					if (updateFields.length === 0) {
							return res.status(400).json({ error: '沒有提供要更新的欄位' });
					}
					
					updateFields.push('updated_at = GETDATE()');
					
					const updateQuery = `
							UPDATE student_course_progress 
							SET ${updateFields.join(', ')}
							WHERE id = @progressId AND student_id = @studentId;
					`;
					await request.query(updateQuery);
					// 回傳最新資料
					const updatedRecord = await pool.request()
							.input('id', sql.Int, progressId)
							.query(`
									SELECT 
											scp.id, scp.student_id, scp.course_id, COALESCE(c.name, '') as course_name,
											scp.ability_level, scp.progress_percentage, scp.notes,
											scp.last_updated, scp.created_at, scp.updated_at
									FROM student_course_progress scp
									LEFT JOIN courses c ON scp.course_id = c.id
									WHERE scp.id = @id
							`);
					res.json(updatedRecord.recordset[0]);
			} catch (err) {
					next(err);
			}
	}
);


// ==========================================================================================================
// 班別(大項分類)管理 API 端點
// ==========================================================================================================

// [GET] 取得班別(大項分類)列表
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

// [GET] 取得班別(大項分類)統計
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


// ==========================================================================================================
// 單一課程管理 API 端點
// ==========================================================================================================

// [READ] 取得所有課程
app.get('/api/courses', async (req, res, next) => {
	try {
			const result = await pool.request().query(`
					SELECT * FROM courses 
					WHERE is_active = 1 
					ORDER BY 
							CASE 
									WHEN sort_order IS NOT NULL THEN 0 
									ELSE 1 
							END,
							sort_order,
							category, 
							level, 
							name
			`);
			res.json(result.recordset);
	} catch (err) {
			next(err);
	}
});

// [GET] 取得所有課程列表（用於下拉選單）
app.get('/api/courses/get_all_data', async (req, res, next) => {
	try {
			const result = await pool.request()
					.query(`
							SELECT id, name, category, description
							FROM courses 
							WHERE is_active = 1
							ORDER BY name
					`);
			res.json(result.recordset);
	} catch (err) {
			console.error('courses/get_all_data error:', err); // 新增詳細錯誤 log
			next(err);
	}
});

// [GET] 取得課程分類列表 (必須放在 :id 之前)
app.get('/api/courses/categories', async (req, res, next) => {
	try {
			const result = await pool.request().query('SELECT DISTINCT category FROM courses WHERE is_active = 1 ORDER BY category');
			const categories = result.recordset.map(row => row.category);
			res.json(categories);
	} catch (err) {
			logger.error('取得課程分類列表錯誤:', err);
			next(err);
	}
});

// [GET] 取得特定課程分類的課程數量
app.get('/api/courses/count', async (req, res, next) => {
	try {
			const { category } = req.query;
			
			if (!category) {
					return res.status(400).json({ error: '課程分類參數為必填' });
			}
			
			const result = await pool.request()
					.input('category', sql.NVarChar, category)
					.query('SELECT COUNT(*) as count FROM courses WHERE category = @category AND is_active = 1');
			
			res.json({ count: result.recordset[0].count });
	} catch (err) {
			logger.error('取得課程數量錯誤:', err);
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
	body('level').isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的難度等級'),
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
									INSERT INTO courses (name, category, level, duration_minutes, price, description, prerequisites, sort_order) 
									VALUES (@name, @category, @level, @duration_minutes, @price, @description, @prerequisites, 
												 (SELECT ISNULL(MAX(sort_order), 0) + 1 FROM courses WHERE is_active = 1));
									SELECT SCOPE_IDENTITY() as id;
							`);
					
					const newId = result.recordset[0].id;
					const newCourse = await pool.request()
							.input('id', sql.Int, newId)
							.query('SELECT * FROM courses WHERE id = @id');
					res.status(201).json(newCourse.recordset[0]);
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
	body('level').isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的難度等級'),
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

// [UPDATE] 更新課程排序順序
app.put('/api/courses/reorder', async (req, res, next) => {
	try {
			const { courses } = req.body;
			
			if (!Array.isArray(courses)) {
					return res.status(400).json({ error: '課程排序資料格式錯誤' });
			}

			// 開始交易
			const transaction = new sql.Transaction(pool);
			await transaction.begin();

			try {
					// 批次更新所有課程的排序順序
					for (const course of courses) {
							if (!course.id || typeof course.sort_order !== 'number') {
									throw new Error('課程資料格式錯誤');
							}

							await transaction.request()
									.input('id', sql.Int, course.id)
									.input('sort_order', sql.Int, course.sort_order)
									.query(`
											UPDATE courses 
											SET sort_order = @sort_order, updated_at = GETDATE()
											WHERE id = @id AND is_active = 1
									`);
					}

					// 提交交易
					await transaction.commit();
					
					logger.info(`課程排序已更新，共 ${courses.length} 筆課程`);
					res.json({ message: '課程排序已成功更新', updatedCount: courses.length });
					
			} catch (err) {
					// 回滾交易
					await transaction.rollback();
					throw err;
			}
			
	} catch (err) {
			logger.error(`更新課程排序失敗: ${err.message}`);
			res.status(500).json({ error: '更新課程排序失敗', details: err.message });
	}
});



// ==========================================================================================================
// 學生排課 API 端點 (lessons跟schedules似乎重複了)
// ==========================================================================================================

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
							.query(`
									INSERT INTO lessons (student_id, lesson_date, lesson_time, duration_minutes, lesson_type, status, notes) 
									VALUES (@student_id, @lesson_date, @lesson_time, @duration_minutes, @lesson_type, @status, @notes);
									SELECT SCOPE_IDENTITY() as id;
							`);
					
					const newId = result.recordset[0].id;
					const newLesson = await pool.request()
							.input('id', sql.Int, newId)
							.query('SELECT * FROM lessons WHERE id = @id');
					res.status(201).json(newLesson.recordset[0]);
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


// ==========================================================================================================
// 課表排程管理 API 端點
// ==========================================================================================================

// [READ] 取得所有課表
app.get('/api/schedules', async (req, res, next) => {
    try {
        logger.info('=== GET /api/schedules 開始 ===');
        logger.info(`請求參數: ${JSON.stringify(req.query)}`);
        
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
            logger.info(`添加學生ID過濾: ${student_id}`);
        }
        
        if (day_of_week) {
            query += ' AND ss.day_of_week = @day_of_week';
            request.input('day_of_week', sql.NVarChar, day_of_week);
            logger.info(`添加星期過濾: ${day_of_week}`);
        }
        
        query += ' ORDER BY ss.day_of_week, ss.start_time, s.chinese_name';
        
        logger.info(`執行SQL查詢: ${query}`);
        const result = await request.query(query);
        
        logger.info(`查詢結果筆數: ${result.recordset.length}`);
        
        // 詳細記錄每個課程的資料
        result.recordset.forEach((record, index) => {
            logger.info(`課程 ${index + 1}:`, {
                id: record.id,
                student_id: record.student_id,
                student_name: record.student_name,
                day_of_week: record.day_of_week,
                start_time: record.start_time,
                end_time: record.end_time,
                start_time_type: typeof record.start_time,
                end_time_type: typeof record.end_time,
                subject: record.subject
            });
        });
        
        // 特別檢查學生19的資料
        const student19Records = result.recordset.filter(r => r.student_id === 19);
        if (student19Records.length > 0) {
            logger.info('=== 學生19的課程資料 ===');
            student19Records.forEach((record, index) => {
                logger.info(`學生19課程 ${index + 1}:`, {
                    id: record.id,
                    day_of_week: record.day_of_week,
                    start_time: record.start_time,
                    end_time: record.end_time,
                    start_time_type: typeof record.start_time,
                    end_time_type: typeof record.end_time,
                    subject: record.subject
                });
            });
        }
        
        logger.info('=== GET /api/schedules 完成 ===');
        res.json(result.recordset);
    } catch (err) {
        logger.error(`GET /api/schedules 錯誤: ${err.message}`);
        logger.error(`錯誤堆疊: ${err.stack}`);
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
            
            // 加入詳細的調試日誌
            logger.info(`POST /api/schedules - 接收到的資料: ${JSON.stringify(req.body)}`);
            logger.info(`start_time 類型: ${typeof start_time}, 值: ${start_time}`);
            logger.info(`end_time 類型: ${typeof end_time}, 值: ${end_time}`);
            
            const result = await pool.request()
                .input('student_id', sql.Int, student_id)
                .input('day_of_week', sql.NVarChar, day_of_week)
                .input('start_time', sql.VarChar, start_time)
                .input('end_time', sql.VarChar, end_time || null)
                .input('subject', sql.NVarChar, course_name || null)
                .query(`
                    INSERT INTO student_schedules (
                        student_id, day_of_week, start_time, end_time, subject
                    ) 
                    VALUES (
                        @student_id, @day_of_week, @start_time, @end_time, @subject
                    );
                    SELECT SCOPE_IDENTITY() as id;
                `);
            
            const newId = result.recordset[0].id;
            const newSchedule = await pool.request()
                .input('id', sql.Int, newId)
                .query('SELECT * FROM student_schedules WHERE id = @id');
            res.status(201).json(newSchedule.recordset[0]);
        } catch (err) {
            logger.error(`POST /api/schedules 錯誤: ${err.message}`);
            logger.error(`錯誤堆疊: ${err.stack}`);
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
                .input('start_time', sql.VarChar, start_time)
                .input('end_time', sql.VarChar, end_time || null)
                .input('subject', sql.NVarChar, course_name || null)
                .query(`
                    UPDATE student_schedules 
                    SET student_id = @student_id, day_of_week = @day_of_week, 
                        start_time = @start_time, end_time = @end_time, 
                        subject = @subject, updated_at = GETDATE()
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

				// 使用事務來確保資料一致性
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

				try {
					// 先設定 SET 選項
					await transaction.request().query('SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;');

					// 執行軟刪除
					const result = await transaction.request()
            .input('id', sql.Int, id)
            .query('UPDATE student_schedules SET is_active = 0, updated_at = GETDATE() WHERE id = @id AND is_active = 1');

        if (result.rowsAffected[0] === 0) {
					await transaction.rollback();
					return res.status(404).json({ error: 'Schedule not found' });
        }

				await transaction.commit();
        res.status(204).send();
    } catch (err) {
			await transaction.rollback();
      throw err;
    }
	} catch (err) {
		console.error('Delete Schedule error:', err);
		next(err);
	}
});

// ==========================================================================================================
// 短期班排課 API
// ==========================================================================================================

// [READ] 取得短期班排課資料
app.get('/api/short-term-schedules', async (req, res, next) => {
	try {
			const { student_id, week_start_date, week_end_date, day_of_week, status } = req.query;
			let query = `
					SELECT 
							sts.*,
							s.chinese_name as student_name,
							s.school,
							s.grade,
							t.name as teacher_name
					FROM short_term_schedules sts
					LEFT JOIN students s ON sts.student_id = s.id
					LEFT JOIN teachers t ON sts.teacher_id = t.id
					WHERE s.is_active = 1
			`;
			const request = pool.request();
			
			if (student_id) {
					query += ' AND sts.student_id = @student_id';
					request.input('student_id', sql.Int, student_id);
			}
			if (week_start_date) {
					query += ' AND sts.week_start_date >= @week_start_date';
					request.input('week_start_date', sql.Date, week_start_date);
			}
			if (week_end_date) {
					query += ' AND sts.week_end_date <= @week_end_date';
					request.input('week_end_date', sql.Date, week_end_date);
			}
			if (day_of_week) {
					query += ' AND sts.day_of_week = @day_of_week';
					request.input('day_of_week', sql.Int, day_of_week);
			}
			if (status) {
					query += ' AND sts.status = @status';
					request.input('status', sql.NVarChar, status);
			}
			
			query += ' ORDER BY sts.week_start_date, sts.day_of_week, sts.time_slot';
			
			const result = await request.query(query);
			res.json(result.recordset);
	} catch (err) {
			next(err);
	}
});

// [READ] 取得指定學生的短期班排課
app.get('/api/short-term-schedules/student/:studentId', async (req, res, next) => {
	try {
			const { studentId } = req.params;
			const { week_start_date, week_end_date } = req.query;
			
			let query = `
					SELECT 
							sts.*,
							s.chinese_name as student_name,
							s.school,
							s.grade,
							t.name as teacher_name
					FROM short_term_schedules sts
					LEFT JOIN students s ON sts.student_id = s.id
					LEFT JOIN teachers t ON sts.teacher_id = t.id
					WHERE sts.student_id = @student_id AND s.is_active = 1
			`;
			const request = pool.request();
			request.input('student_id', sql.Int, studentId);
			
			if (week_start_date) {
					query += ' AND sts.week_start_date >= @week_start_date';
					request.input('week_start_date', sql.Date, week_start_date);
			}
			if (week_end_date) {
					query += ' AND sts.week_end_date <= @week_end_date';
					request.input('week_end_date', sql.Date, week_end_date);
			}
			
			query += ' ORDER BY sts.week_start_date, sts.day_of_week, sts.time_slot';
			
			const result = await request.query(query);
			res.json(result.recordset);
	} catch (err) {
			next(err);
	}
});

// [CREATE] 新增短期班排課
app.post('/api/short-term-schedules', async (req, res, next) => {
	try {
			const {
					student_id,
					week_start_date,
					week_end_date,
					day_of_week,
					time_slot,
					duration_minutes = 30,
					lesson_type,
					teacher_id,
					subject,
					classroom,
					notes
			} = req.body;

			// 驗證必填欄位
			if (!student_id || !week_start_date || !week_end_date || !day_of_week || !time_slot || !lesson_type) {
					return res.status(400).json({
							error: '缺少必填欄位',
							required: ['student_id', 'week_start_date', 'week_end_date', 'day_of_week', 'time_slot', 'lesson_type']
					});
			}

			// 驗證學生是否存在
			const studentCheck = await pool.request()
					.input('student_id', sql.Int, student_id)
					.query('SELECT id FROM students WHERE id = @student_id AND is_active = 1');
			
			if (studentCheck.recordset.length === 0) {
					return res.status(400).json({ error: '學生不存在或已停用' });
			}

			// 驗證老師是否存在（如果提供）
			if (teacher_id) {
					const teacherCheck = await pool.request()
							.input('teacher_id', sql.Int, teacher_id)
							.query('SELECT id FROM teachers WHERE id = @teacher_id AND is_active = 1');
					
					if (teacherCheck.recordset.length === 0) {
							return res.status(400).json({ error: '老師不存在或已停用' });
					}
			}

			// 檢查時間衝突
			const conflictCheck = await pool.request()
					.input('student_id', sql.Int, student_id)
					.input('week_start_date', sql.Date, week_start_date)
					.input('week_end_date', sql.Date, week_end_date)
					.input('day_of_week', sql.Int, day_of_week)
					.input('time_slot', sql.Time, time_slot)
					.query(`
							SELECT id FROM short_term_schedules 
							WHERE student_id = @student_id 
							AND week_start_date = @week_start_date 
							AND week_end_date = @week_end_date
							AND day_of_week = @day_of_week 
							AND time_slot = @time_slot
							AND status != 'cancelled'
					`);

			if (conflictCheck.recordset.length > 0) {
					return res.status(400).json({ error: '該時段已有排課，請選擇其他時段' });
			}

			// 新增排課
			const insertQuery = `
					INSERT INTO short_term_schedules (
							student_id, week_start_date, week_end_date, day_of_week, 
							time_slot, duration_minutes, lesson_type, teacher_id, 
							subject, classroom, notes
					) VALUES (
							@student_id, @week_start_date, @week_end_date, @day_of_week,
							@time_slot, @duration_minutes, @lesson_type, @teacher_id,
							@subject, @classroom, @notes
					);
					SELECT SCOPE_IDENTITY() as id;
			`;

			const result = await pool.request()
					.input('student_id', sql.Int, student_id)
					.input('week_start_date', sql.Date, week_start_date)
					.input('week_end_date', sql.Date, week_end_date)
					.input('day_of_week', sql.Int, day_of_week)
					.input('time_slot', sql.Time, time_slot)
					.input('duration_minutes', sql.Int, duration_minutes)
					.input('lesson_type', sql.NVarChar, lesson_type)
					.input('teacher_id', sql.Int, teacher_id)
					.input('subject', sql.NVarChar, subject)
					.input('classroom', sql.NVarChar, classroom)
					.input('notes', sql.NVarChar, notes)
					.query(insertQuery);

			const newId = result.recordset[0].id;
			
			// 回傳新增的資料
			const newSchedule = await pool.request()
					.input('id', sql.Int, newId)
					.query(`
							SELECT 
									sts.*,
									s.chinese_name as student_name,
									s.school,
									s.grade,
									t.name as teacher_name
							FROM short_term_schedules sts
							LEFT JOIN students s ON sts.student_id = s.id
							LEFT JOIN teachers t ON sts.teacher_id = t.id
							WHERE sts.id = @id
					`);

			res.status(201).json(newSchedule.recordset[0]);
	} catch (err) {
			next(err);
	}
});

// [UPDATE] 更新短期班排課
app.put('/api/short-term-schedules/:id', async (req, res, next) => {
	try {
			const { id } = req.params;
			const {
					week_start_date,
					week_end_date,
					day_of_week,
					time_slot,
					duration_minutes,
					lesson_type,
					teacher_id,
					subject,
					classroom,
					notes,
					status
			} = req.body;

			// 檢查排課是否存在
			const existingCheck = await pool.request()
					.input('id', sql.Int, id)
					.query('SELECT student_id FROM short_term_schedules WHERE id = @id');

			if (existingCheck.recordset.length === 0) {
					return res.status(404).json({ error: '排課不存在' });
			}

			const student_id = existingCheck.recordset[0].student_id;

			// 檢查時間衝突（排除自己）
			if (week_start_date && week_end_date && day_of_week && time_slot) {
					const conflictCheck = await pool.request()
							.input('id', sql.Int, id)
							.input('student_id', sql.Int, student_id)
							.input('week_start_date', sql.Date, week_start_date)
							.input('week_end_date', sql.Date, week_end_date)
							.input('day_of_week', sql.Int, day_of_week)
							.input('time_slot', sql.Time, time_slot)
							.query(`
									SELECT id FROM short_term_schedules 
									WHERE id != @id
									AND student_id = @student_id 
									AND week_start_date = @week_start_date 
									AND week_end_date = @week_end_date
									AND day_of_week = @day_of_week 
									AND time_slot = @time_slot
									AND status != 'cancelled'
							`);

					if (conflictCheck.recordset.length > 0) {
							return res.status(400).json({ error: '該時段已有排課，請選擇其他時段' });
					}
			}

			// 建立更新查詢
			let updateQuery = 'UPDATE short_term_schedules SET ';
			const request = pool.request();
			request.input('id', sql.Int, id);
			
			const updates = [];
			
			if (week_start_date !== undefined) {
					updates.push('week_start_date = @week_start_date');
					request.input('week_start_date', sql.Date, week_start_date);
			}
			if (week_end_date !== undefined) {
					updates.push('week_end_date = @week_end_date');
					request.input('week_end_date', sql.Date, week_end_date);
			}
			if (day_of_week !== undefined) {
					updates.push('day_of_week = @day_of_week');
					request.input('day_of_week', sql.Int, day_of_week);
			}
			if (time_slot !== undefined) {
					updates.push('time_slot = @time_slot');
					request.input('time_slot', sql.Time, time_slot);
			}
			if (duration_minutes !== undefined) {
					updates.push('duration_minutes = @duration_minutes');
					request.input('duration_minutes', sql.Int, duration_minutes);
			}
			if (lesson_type !== undefined) {
					updates.push('lesson_type = @lesson_type');
					request.input('lesson_type', sql.NVarChar, lesson_type);
			}
			if (teacher_id !== undefined) {
					updates.push('teacher_id = @teacher_id');
					request.input('teacher_id', sql.Int, teacher_id);
			}
			if (subject !== undefined) {
					updates.push('subject = @subject');
					request.input('subject', sql.NVarChar, subject);
			}
			if (classroom !== undefined) {
					updates.push('classroom = @classroom');
					request.input('classroom', sql.NVarChar, classroom);
			}
			if (notes !== undefined) {
					updates.push('notes = @notes');
					request.input('notes', sql.NVarChar, notes);
			}
			if (status !== undefined) {
					updates.push('status = @status');
					request.input('status', sql.NVarChar, status);
			}

			if (updates.length === 0) {
					return res.status(400).json({ error: '沒有提供要更新的欄位' });
			}

			updateQuery += updates.join(', ') + ' WHERE id = @id';
			await request.query(updateQuery);

			// 回傳更新後的資料
			const updatedSchedule = await pool.request()
					.input('id', sql.Int, id)
					.query(`
							SELECT 
									sts.*,
									s.chinese_name as student_name,
									s.school,
									s.grade,
									t.name as teacher_name
							FROM short_term_schedules sts
							LEFT JOIN students s ON sts.student_id = s.id
							LEFT JOIN teachers t ON sts.teacher_id = t.id
							WHERE sts.id = @id
					`);

			res.json(updatedSchedule.recordset[0]);
	} catch (err) {
			next(err);
	}
});

// [DELETE] 刪除短期班排課
app.delete('/api/short-term-schedules/:id', async (req, res, next) => {
	try {
			const { id } = req.params;

			// 檢查排課是否存在
			const existingCheck = await pool.request()
					.input('id', sql.Int, id)
					.query('SELECT id FROM short_term_schedules WHERE id = @id');

			if (existingCheck.recordset.length === 0) {
					return res.status(404).json({ error: '排課不存在' });
			}

			// 刪除排課
			await pool.request()
					.input('id', sql.Int, id)
					.query('DELETE FROM short_term_schedules WHERE id = @id');

			res.json({ message: '排課已刪除' });
	} catch (err) {
			next(err);
	}
});

// [READ] 取得可用的時段列表
app.get('/api/short-term-schedules/time-slots', async (req, res, next) => {
	try {
			const timeSlots = [
					{ time_slot: '09:00:00', display_time: '09:00' },
					{ time_slot: '09:30:00', display_time: '09:30' },
					{ time_slot: '10:00:00', display_time: '10:00' },
					{ time_slot: '10:30:00', display_time: '10:30' },
					{ time_slot: '11:00:00', display_time: '11:00' },
					{ time_slot: '11:30:00', display_time: '11:30' },
					{ time_slot: '12:00:00', display_time: '12:00' },
					{ time_slot: '12:30:00', display_time: '12:30' },
					{ time_slot: '13:00:00', display_time: '13:00' },
					{ time_slot: '13:30:00', display_time: '13:30' },
					{ time_slot: '14:00:00', display_time: '14:00' },
					{ time_slot: '14:30:00', display_time: '14:30' },
					{ time_slot: '15:00:00', display_time: '15:00' },
					{ time_slot: '15:30:00', display_time: '15:30' },
					{ time_slot: '16:00:00', display_time: '16:00' },
					{ time_slot: '16:30:00', display_time: '16:30' },
					{ time_slot: '17:00:00', display_time: '17:00' },
					{ time_slot: '17:30:00', display_time: '17:30' },
					{ time_slot: '18:00:00', display_time: '18:00' },
					{ time_slot: '18:30:00', display_time: '18:30' },
					{ time_slot: '19:00:00', display_time: '19:00' },
					{ time_slot: '19:30:00', display_time: '19:30' },
					{ time_slot: '20:00:00', display_time: '20:00' },
					{ time_slot: '20:30:00', display_time: '20:30' },
					{ time_slot: '21:00:00', display_time: '21:00' }
			];
			
			res.json(timeSlots);
	} catch (err) {
			next(err);
	}
});


// ==========================================================================================================
// 學校管理 API 端點
// ==========================================================================================================

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
							(SELECT COUNT(*) FROM students WHERE is_active = 1) as total_our_students,
							district,
							COUNT(*) as district_count
					FROM schools 
					WHERE is_active = 1
					GROUP BY ROLLUP(district)
					ORDER BY CASE WHEN district IS NULL THEN 1 ELSE 0 END, district
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
									VALUES (@school_name, @short_name, @school_type, @district, @education_level, @phone, @address, @website, @email, @notes);
									SELECT SCOPE_IDENTITY() as id;
							`);
					
					const newId = result.recordset[0].id;
					const newSchool = await pool.request()
							.input('id', sql.Int, newId)
							.query('SELECT * FROM schools WHERE id = @id');
					res.status(201).json(newSchool.recordset[0]);
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


// ==========================================================================================================
// 教師管理 API 端點
// ==========================================================================================================

// [READ] 取得所有師資資料
app.get('/api/teachers', async (req, res, next) => {
	try {
			const { specialty, status, min_rate, max_rate, min_experience, available_day } = req.query;
			let query = `
					SELECT 
							t.id, t.name, t.email, t.phone, t.available_days, 
							t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url,
							t.created_at, t.updated_at, t.sort_order,
							ISNULL(STRING_AGG(cc.category_name, ', '), '') as course_categories,
							ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN cc.category_name END, ', '), '') as preferred_courses
					FROM teachers t 
					LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
					LEFT JOIN courses_categories cc ON tc.category_id = cc.id
					WHERE t.is_deleted = 0
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
							INNER JOIN courses_categories cc2 ON tc2.category_id = cc2.id
							WHERE tc2.teacher_id = t.id 
							AND cc2.category_name = @specialty
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
			query += ' GROUP BY t.id, t.name, t.email, t.phone, t.available_days, t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url, t.created_at, t.updated_at, t.sort_order';
			query += ' ORDER BY ISNULL(t.sort_order, 999999), t.id ASC';
			
			const result = await request.query(query);
			
			// 師資列表查詢結果
			
			// 解析 JSON 字串為陣列，並處理課程能力資料
			const teachers = result.recordset.map(teacher => {
					const courseCategories = teacher.course_categories && teacher.course_categories.trim() ? teacher.course_categories.split(', ') : [];
					const preferredCourses = teacher.preferred_courses && teacher.preferred_courses.trim() ? teacher.preferred_courses.split(', ') : [];
					
					// 解析師資課程能力資料
					
					return {
							...teacher,
							availableDays: teacher.available_days ? JSON.parse(teacher.available_days) : [],
							courseCategories,
							preferredCourses
					};
			});
			
			// 師資列表查詢完成
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
					WHERE is_deleted = 0
			`);
			res.json(result.recordset[0]);
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

// [GET] 取得課程分類列表（用於師資篩選）
app.get('/api/teachers/course-categories', async (req, res, next) => {
	try {
			// 從 courses_categories 表提取所有啟用的課程分類
			const result = await pool.request().query(`
					SELECT cc.category_name
					FROM courses_categories cc
					WHERE cc.is_active = 1
					ORDER BY cc.sort_order, cc.category_name
			`);
			
			const categories = result.recordset.map(row => row.category_name);
			res.json(categories);
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
									t.created_at, t.updated_at, t.sort_order,
									ISNULL(STRING_AGG(cc.category_name, ', '), '') as course_categories,
									ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN cc.category_name END, ', '), '') as preferred_courses
							FROM teachers t 
							LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
							LEFT JOIN courses_categories cc ON tc.category_id = cc.id
							WHERE t.id = @id AND t.is_deleted = 0
							GROUP BY t.id, t.name, t.email, t.phone, t.available_days, t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url, t.created_at, t.updated_at, t.sort_order
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
					
					// 檢查 email 是否已被其他老師使用（只檢查未刪除的師資）
					const emailCheckResult = await pool.request()
							.input('email', sql.NVarChar, email)
							.query('SELECT id FROM teachers WHERE email = @email AND is_deleted = 0');
							
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
									VALUES (@name, @email, @phone, @available_days, @hourly_rate, @experience, @bio, @is_active);
									SELECT SCOPE_IDENTITY() as id;
							`);
					
					const newId = result.recordset[0].id;
					const newTeacher = await pool.request()
							.input('id', sql.Int, newId)
							.query('SELECT * FROM teachers WHERE id = @id');
					
					const teacher = newTeacher.recordset[0];
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
					const { name, email, phone, availableDays, hourlyRate, experience, bio, isActive } = req.body;
					
					// 檢查 email 是否已被其他老師使用（排除當前編輯的老師）
					const emailCheckResult = await pool.request()
							.input('email', sql.NVarChar, email)
							.input('id', sql.Int, id)
							.query('SELECT id, name FROM teachers WHERE email = @email AND id != @id AND is_deleted = 0');
							
					if (emailCheckResult.recordset.length > 0) {
							const conflictTeacher = emailCheckResult.recordset[0];
							return res.status(400).json({ 
									error: `此電子信箱已被其他老師使用：${conflictTeacher.name} (ID: ${conflictTeacher.id})` 
							});
					}
					
					// 執行更新
					
					const result = await pool.request()
							.input('id', sql.Int, id)
							.input('name', sql.NVarChar, name)
							.input('email', sql.NVarChar, email)
							.input('phone', sql.NVarChar, phone || null)
							.input('available_days', sql.NVarChar, JSON.stringify(availableDays))
							.input('hourly_rate', sql.Int, hourlyRate)
							.input('experience', sql.Int, experience)
							.input('bio', sql.NVarChar, bio || null)
							.input('is_active', sql.Bit, isActive)
							.query(`
									UPDATE teachers 
									SET name = @name, email = @email, phone = @phone, 
											available_days = @available_days,
											hourly_rate = @hourly_rate, experience = @experience, 
											bio = @bio, is_active = @is_active, updated_at = GETDATE()
									WHERE id = @id;
									SELECT * FROM teachers WHERE id = @id;
							`);
							
					// 更新成功
					if (result.recordset.length === 0) {
							return res.status(404).json({ error: 'Teacher not found' });
					}
					
					const teacher = result.recordset[0];
					// 解析 JSON 字串為陣列
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
			teacher.availableDays = teacher.available_days ? JSON.parse(teacher.available_days) : [];
			
			res.json(teacher);
	} catch (err) {
			next(err);
	}
});

// [DELETE] 刪除一位師資 (軟刪除)
app.delete('/api/teachers/:id', async (req, res, next) => {
	try {
			const { id } = req.params;
			
			// 先檢查師資是否存在且未刪除
			const checkResult = await pool.request()
					.input('id', sql.Int, id)
					.query('SELECT id, name, is_active, is_deleted FROM teachers WHERE id = @id');
					
			if (checkResult.recordset.length === 0) {
					return res.status(404).json({ error: 'Teacher not found' });
			}
			
			const teacher = checkResult.recordset[0];
			
			// 檢查是否已經被軟刪除
			if (teacher.is_deleted) {
					return res.status(400).json({ error: 'Teacher is already deleted' });
			}
			
			// 執行軟刪除（設定 is_deleted = 1 和 is_active = 0）
			const result = await pool.request()
					.input('id', sql.Int, id)
					.query('UPDATE teachers SET is_deleted = 1, is_active = 0, updated_at = GETDATE() WHERE id = @id');
					
			if (result.rowsAffected[0] === 0) {
					return res.status(500).json({ error: 'Delete operation failed' });
			}
			
			res.status(204).send();
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




// ==========================================================================================================
// 師資單一課程能力管理 API 端點
// ==========================================================================================================

// [GET] 取得所有師資的單一課程能力（用於管理頁面）
app.get('/api/teacher-courses', async (req, res, next) => {
	try {
			// 取得所有師資課程能力
			
			const result = await pool.request()
					.query(`
							SELECT 
									tc.id,
									tc.teacher_id,
									t.name as teacher_name,
									tc.course_category,
									tc.max_level,
									tc.is_preferred,
									tc.sort_order,
									tc.created_at
							FROM teacher_courses tc
							INNER JOIN teachers t ON tc.teacher_id = t.id
							WHERE t.is_deleted = 0
							ORDER BY t.name, tc.sort_order, tc.is_preferred DESC, tc.course_category
					`);
					
			// 查詢完成
			res.json(result.recordset);
			
	} catch (err) {
			logger.error('取得所有師資課程能力錯誤:', err);
			next(err);
	}
});

// [GET] 取得師資的單一課程能力
app.get('/api/teachers/:id/courses', async (req, res, next) => {
	try {
			const { id } = req.params;
			// 師資課程能力查詢
			
			// 先檢查師資是否存在且未刪除
			const teacherCheck = await pool.request()
					.input('teacherId', sql.Int, id)
					.query('SELECT id, name FROM teachers WHERE id = @teacherId AND is_deleted = 0');
					
			if (teacherCheck.recordset.length === 0) {
					return res.status(404).json({ error: '師資不存在' });
			}
			
			// 簡化的查詢語句
			const result = await pool.request()
					.input('teacherId', sql.Int, id)
					.query(`
							SELECT 
									tc.id,
									tc.teacher_id,
									tc.course_category,
									tc.max_level,
									tc.is_preferred,
									tc.sort_order,
									tc.created_at
							FROM teacher_courses tc
							WHERE tc.teacher_id = @teacherId 
							ORDER BY tc.sort_order, tc.is_preferred DESC, tc.course_category
					`);
					
			// 查詢完成
			
			res.json(result.recordset);
	} catch (err) {
			logger.error('師資課程能力查詢錯誤:', err);
			next(err);
	}
});

// [GET] 取得特定師資的大分類課程能力
app.get('/api/teachers/:id/class_types', async (req, res, next) => {
	try {
			const { id } = req.params;
			const result = await pool.request()
					.input('id', sql.Int, id)
					.query(`
							SELECT 
									tc.id,
									tc.teacher_id,
									cc.category_name as course_category,
									tc.max_level,
									tc.is_preferred,
									tc.sort_order,
									tc.created_at
							FROM teacher_class_types tc
							INNER JOIN courses_categories cc ON tc.category_id = cc.id
							WHERE tc.teacher_id = @id
							ORDER BY tc.sort_order, tc.is_preferred DESC, cc.category_name
					`);
			res.json(result.recordset);
	} catch (err) {
			next(err);
	}
});

// [CREATE] 新增師資單一課程能力
app.post(
	'/api/teachers/:id/courses',
	// --- 驗證規則 ---
	body('courseCategory').notEmpty().withMessage('課程分類為必填'),
	body('maxLevel').isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的課程難度'),
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
					
					// 調試：記錄接收到的資料
					logger.info(`新增師資課程能力 - 師資ID: ${id}, 課程分類: ${courseCategory}, 難度: ${maxLevel}, 主力: ${isPreferred}`);
					
					// 驗證必要欄位
					if (!courseCategory || !maxLevel) {
							return res.status(400).json({ error: '課程分類和難度為必填欄位' });
					}
					
					// 先查詢課程分類的 ID
					const categoryResult = await pool.request()
							.input('category_name', sql.NVarChar, courseCategory)
							.query('SELECT id FROM courses_categories WHERE category_name = @category_name');
					
					if (categoryResult.recordset.length === 0) {
							return res.status(400).json({ error: '指定的課程分類不存在' });
					}
					
					const categoryId = categoryResult.recordset[0].id;
					
					const result = await pool.request()
							.input('teacher_id', sql.Int, id)
							.input('course_category', sql.NVarChar, courseCategory)
							.input('category_id', sql.Int, categoryId)
							.input('max_level', sql.NVarChar, maxLevel)
							.input('is_preferred', sql.Bit, isPreferred)
							.query(`
									INSERT INTO teacher_courses (teacher_id, course_category, category_id, max_level, is_preferred) 
									VALUES (@teacher_id, @course_category, @category_id, @max_level, @is_preferred);
									SELECT SCOPE_IDENTITY() as id;
							`);
					
					const newId = result.recordset[0].id;
					const newTeacherCourse = await pool.request()
							.input('id', sql.Int, newId)
							.query('SELECT * FROM teacher_courses WHERE id = @id');
					res.status(201).json(newTeacherCourse.recordset[0]);
			} catch (err) {
					if (err.number === 2627) { // 唯一約束違反
							return res.status(400).json({ error: '該師資已有此課程分類的記錄' });
					}
					next(err);
			}
	}
);

// [UPDATE] 更新師資單一課程能力
app.put(
	'/api/teachers/:teacherId/courses/:courseId',
	// --- 驗證規則 ---
	body('courseCategory').notEmpty().withMessage('課程分類為必填'),
	body('maxLevel').isIn(['新手', '入門', '中階', '高階', '精英']).withMessage('無效的課程難度'),
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
					
					// 先查詢課程分類的 ID
					const categoryResult = await pool.request()
							.input('category_name', sql.NVarChar, courseCategory)
							.query('SELECT id FROM courses_categories WHERE category_name = @category_name');
					
					if (categoryResult.recordset.length === 0) {
							return res.status(400).json({ error: '指定的課程分類不存在' });
					}
					
					const categoryId = categoryResult.recordset[0].id;
					
					const req = pool.request();
					req.input('courseId',   sql.Int,        courseId);
					req.input('teacherId',  sql.Int,        teacherId);
					req.input('categoryId', sql.Int,        categoryId);
					req.input('courseCat',  sql.NVarChar,   courseCategory);
					req.input('maxLevel',   sql.NVarChar,   maxLevel);
					req.input('isPref',     sql.Bit,        isPreferred);
					const result = await req.query(`
									UPDATE teacher_courses 
									SET course_category = @courseCat, 
											category_id = @categoryId, 
											max_level = @maxLevel, 
											is_preferred = @isPref
									WHERE id = @courseId AND teacher_id = @teacherId;
									SELECT * FROM teacher_courses WHERE id = @courseId;
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



// [DELETE] 刪除師資單一課程能力
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

// [PATCH] 更新師資單一課程能力的排序
app.patch('/api/teachers/:teacherId/courses/:courseId/sort', async (req, res, next) => {
	try {
			const { teacherId, courseId } = req.params;
			const { sort_order } = req.body;
			
			if (typeof sort_order !== 'number') {
					return res.status(400).json({ error: '排序值必須是數字' });
			}
			
			const req = pool.request();
			req.input('teacherId', sql.Int, teacherId);
			req.input('courseId',  sql.Int, courseId);
			req.input('sortOrder', sql.Int, sort_order);
			const result = await req.query(`
				UPDATE teacher_courses
				SET 	sort_order = @sortOrder,
					    updated_at = GETDATE()	
				WHERE teacher_id = @teacherId AND id = @courseId;
				`);
				
			if (result.rowsAffected[0] === 0) {
					return res.status(404).json({ error: '課程能力不存在' });
			}
			
			res.json({ message: '排序更新成功' });
	} catch (err) {
			next(err);
	}
});

// [POST] 重新排序師資的單一課程能力
app.post('/api/teachers/:teacherId/courses/reorder', async (req, res, next) => {
	try {
			const { teacherId } = req.params;
			
			const result = await pool.request()
				.input('teacherId', sql.Int, teacherId)
			  .execute('sp_reorder_teacher_courses');
					
			res.json({ message: '課程能力重新排序成功' });
	} catch (err) {
			next(err);
	}
});

// ==========================================================================================================
// 課程分類(所有的課程，但不一定有開課) API 端點
// ==========================================================================================================

// [GET] 取得所有課程分類（用於管理頁面）
app.get('/api/course-categories', async (req, res, next) => {
	try {
			const result = await pool.request().query(`
					SELECT 
							cc.id,
							cc.category_code,
							cc.category_name,
							cc.description,
							cc.is_active,
							cc.sort_order,
							vcm.course_count,
							vcm.teacher_count,
							vcm.student_count
					FROM courses_categories cc
					LEFT JOIN view_course_categories_management vcm ON cc.id = vcm.id
					ORDER BY cc.sort_order, cc.category_name
			`);
			res.json(result.recordset);
	} catch (err) {
			next(err);
	}
});

// [GET] 取得單一課程分類
app.get('/api/course-categories/:id', async (req, res, next) => {
	try {
			const { id } = req.params;
			const result = await pool.request()
					.input('id', sql.Int, id)
					.query(`
							SELECT 
									cc.id,
									cc.category_code,
									cc.category_name,
									cc.description,
									cc.is_active,
									cc.sort_order
							FROM courses_categories cc
							WHERE cc.id = @id
					`);
			
			if (result.recordset.length === 0) {
					return res.status(404).json({ error: 'Course category not found' });
			}
			
			res.json(result.recordset[0]);
	} catch (err) {
			next(err);
	}
});

// [POST] 新增課程分類
app.post('/api/course-categories', async (req, res, next) => {
	try {
			const { category_name, description, sort_order, is_active } = req.body;
			
			// 檢查課程分類是否已存在
			const existingResult = await pool.request()
					.input('category_name', sql.NVarChar, category_name)
					.query('SELECT id FROM courses_categories WHERE category_name = @category_name');
			
			if (existingResult.recordset.length > 0) {
					return res.status(400).json({ error: '課程分類名稱已存在' });
			}
			
			// 生成分類代碼
			const category_code = category_name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
			
			const result = await pool.request()
					.input('category_code', sql.NVarChar, category_code)
					.input('category_name', sql.NVarChar, category_name)
					.input('description', sql.NVarChar, description || '')
					.input('sort_order', sql.Int, sort_order || 0)
					.input('is_active', sql.Bit, is_active !== false)
					.query(`
							INSERT INTO courses_categories (category_code, category_name, description, sort_order, is_active)
							VALUES (@category_code, @category_name, @description, @sort_order, @is_active);
							SELECT SCOPE_IDENTITY() as id;
					`);
			
			const newId = result.recordset[0].id;
			const newCategory = await pool.request()
					.input('id', sql.Int, newId)
					.query('SELECT * FROM courses_categories WHERE id = @id');
			
			res.status(201).json(newCategory.recordset[0]);
	} catch (err) {
			next(err);
	}
});

// [PUT] 更新課程分類
app.put('/api/course-categories/:id', async (req, res, next) => {
	try {
			const { id } = req.params;
			const { category_name, description, sort_order, is_active } = req.body;
			
			// 檢查課程分類是否存在
			const existingResult = await pool.request()
					.input('id', sql.Int, id)
					.query('SELECT category_name FROM courses_categories WHERE id = @id');
			
			if (existingResult.recordset.length === 0) {
					return res.status(404).json({ error: 'Course category not found' });
			}
			
			// 如果修改了名稱，檢查新名稱是否與其他分類衝突
			if (category_name && category_name !== existingResult.recordset[0].category_name) {
					const conflictResult = await pool.request()
							.input('category_name', sql.NVarChar, category_name)
							.input('id', sql.Int, id)
							.query('SELECT id FROM courses_categories WHERE category_name = @category_name AND id != @id');
					
					if (conflictResult.recordset.length > 0) {
							return res.status(400).json({ error: '課程分類名稱已存在' });
					}
			}
			
			const result = await pool.request()
					.input('id', sql.Int, id)
					.input('category_name', sql.NVarChar, category_name)
					.input('description', sql.NVarChar, description || '')
					.input('sort_order', sql.Int, sort_order)
					.input('is_active', sql.Bit, is_active)
					.query(`
							UPDATE courses_categories 
							SET category_name = @category_name, description = @description, 
									sort_order = @sort_order, is_active = @is_active, updated_at = GETDATE()
							WHERE id = @id;
							SELECT * FROM courses_categories WHERE id = @id;
					`);
			
			res.json(result.recordset[0]);
	} catch (err) {
			next(err);
	}
});

// [PATCH] 切換課程分類啟用狀態
app.patch('/api/course-categories/:id/toggle', async (req, res, next) => {
	try {
			const { id } = req.params;
			const { is_active } = req.body;
			
			const result = await pool.request()
					.input('id', sql.Int, id)
					.input('is_active', sql.Bit, is_active)
					.query(`
							UPDATE courses_categories 
							SET is_active = @is_active, updated_at = GETDATE()
							WHERE id = @id;
							SELECT * FROM courses_categories WHERE id = @id;
					`);
			
			if (result.recordset.length === 0) {
					return res.status(404).json({ error: 'Course category not found' });
			}
			
			res.json(result.recordset[0]);
	} catch (err) {
			next(err);
	}
});

// [DELETE] 刪除課程分類
app.delete('/api/course-categories/:id', async (req, res, next) => {
	try {
			const { id } = req.params;
			
			// 檢查是否有師資或課程使用此分類
			const usageResult = await pool.request()
					.input('id', sql.Int, id)
					.query(`
							SELECT 
									(SELECT COUNT(*) FROM teacher_courses WHERE category_id = @id) as teacher_count,
									(SELECT COUNT(*) FROM courses WHERE category_id = @id) as course_count
					`);
			
			const { teacher_count, course_count } = usageResult.recordset[0];
			
			if (teacher_count > 0 || course_count > 0) {
					return res.status(400).json({ 
							error: '無法刪除課程分類，因為還有師資或課程在使用此分類',
							teacher_count,
							course_count
					});
			}
			
			const result = await pool.request()
					.input('id', sql.Int, id)
					.query('DELETE FROM courses_categories WHERE id = @id');
			
			if (result.rowsAffected[0] === 0) {
					return res.status(404).json({ error: 'Course category not found' });
			}
			
			res.status(204).send();
	} catch (err) {
			next(err);
	}
});


// ==========================================================================================================
// 統計報表 API 端點
// ==========================================================================================================

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
						const hasDate = !!startDate && !!endDate;

						// 組共用的 WHERE 片段
            const dateFilter = hasDate ? 'l.lesson_date BETWEEN @startDate AND @endDate' : '1=1';
            const dateFilterNoAlias = hasDate ? 'lesson_date BETWEEN @startDate AND @endDate' : '1=1';

            // 1. 課程數量 (按月份分組)
            const sqlMonthly = `
                SELECT FORMAT(lesson_date, 'yyyy-MM') as month, COUNT(id) as lesson_count
                FROM lessons
                WHERE ${dateFilterNoAlias}
                GROUP BY FORMAT(lesson_date, 'yyyy-MM')
                ORDER BY month;
            `;

            // 2. 找出上課次數最多的前 5 位學生
            const sqlTopStudents = `
                SELECT TOP 5 s.name, COUNT(l.id) as lesson_count
                FROM lessons l
                JOIN students s ON l.student_id = s.id
                WHERE ${dateFilter} AND s.status = 'active'
                GROUP BY s.name
                ORDER BY lesson_count DESC;
            `;

            // 3. 課程類型分佈 (線上 vs 實體)
            const sqlTypeDist = `SELECT l.lesson_type, COUNT(*) as count FROM lessons l WHERE ${dateFilter} GROUP BY l.lesson_type;`;

						// ---------- 工具：給 Request 加日期參數 ----------
						const addDate = (r) => {
							if (hasDate) {
								r.input('startDate', sql.Date, startDate);
								r.input('endDate',   sql.Date, endDate);
							}
							return r;
						};

						// ---------- 平行查詢 ----------
						const [monthlyRes, topStuRes, typeRes] = await Promise.all([
							addDate(pool.request()).query(sqlMonthly),
							addDate(pool.request()).query(sqlTopStudents),
							addDate(pool.request()).query(sqlTypeDist)
						]);

						res.json({
							monthlyLessons: monthlyRes.recordset,
							topStudents:    topStuRes.recordset,
							lessonTypes:    typeRes.recordset
						});
        } catch (err) {
            next(err);
        }
    }
);


// ==========================================================================================================
// 用戶管理 API 端點
// ==========================================================================================================

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
                    VALUES (@username, @email, @password_hash, @full_name, @role, @is_active, @phone, @department, GETDATE());
                    SELECT SCOPE_IDENTITY() as id;
                `);
            
            const newId = result.recordset[0].id;
            const newUser = await pool.request()
                .input('id', sql.Int, newId)
                .query(`
                    SELECT id, username, email, full_name, role, is_active, phone, department, created_at, updated_at 
                    FROM users WHERE id = @id
                `);
            res.status(201).json(newUser.recordset[0]);
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
		// 1.先 new ConnectionPool，才能掛事件；直接 sql.connect(...) 會拿不到 'connect' event
		pool = new sql.ConnectionPool(dbConfig);
		pool.on('error', err => logger.error('Connection pool error:', err));

		// 2.真的去連線；await 之後才算 pool 建立完成。
		await pool.connect();
		logger.info('資料庫連線成功！');

		// 3.只跑一次的 Session 設定（失敗不致命）
    try {
      await pool.request().batch(`SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;`);
    } catch (err) {
      logger.warn('初始化 SET 指令失敗（將以 dbConfig.options 為準）', err);
    }

		// 也把 pool-level error 記下來，避免 silent crash
    pool.on('error', (err) => {
      logger.error('Connection pool error', err);
    });
		
		// 4.啟動 HTTP 伺服器
		server = app.listen(PORT, () => {
			logger.info(`後端伺服器正在 http://localhost:${PORT} 上運行`);
		});
		
		// 優雅關閉
		const graceful = async () => {
      logger.info('Shutting down HTTP server & DB pool…');
			if (server) {
      	await new Promise(res => server.close(res));   // 停止接受新請求
			}
      await pool.close();    // 關閉連線池
      process.exit(0);
    };
    process.on('SIGINT', graceful);
    process.on('SIGTERM', graceful);
	} catch (err) {
		logger.error('資料庫連線失敗:', err);
		process.exit(1);
	}
};

// 確保應用程式關閉時正確關閉連接池
process.on('SIGINT', async () => {
	console.log('Closing database connection...');
	await pool.close();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	console.log('Closing database connection...');
	await pool.close();
	process.exit(0);
});

// 啟動伺服器
startServer();


