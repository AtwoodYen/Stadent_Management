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

// [READ] 取得所有學生資料
app.get('/api/students', async (req, res, next) => {
    try {
        const result = await pool.request().query('SELECT * FROM students ORDER BY name ASC');
        res.json(result.recordset);
    } catch (err) {
        next(err); // 將錯誤傳遞給集中錯誤處理器
    }
});

// [CREATE] 新增一位學生
app.post(
    '/api/students',
    // --- 驗證規則 ---
    body('name').trim().notEmpty().withMessage('學生姓名不得為空'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('請輸入有效的 Email 地址'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for POST /api/students: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { name, email, phone, location, platform, notes } = req.body;
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone)
                .input('location', sql.NVarChar, location)
                .input('platform', sql.NVarChar, platform)
                .input('notes', sql.NText, notes) // 使用 NText 對應 NVARCHAR(MAX)
                .input('status', sql.NVarChar, 'active')
                .query('INSERT INTO students (name, email, phone, location, platform, notes, status) OUTPUT inserted.* VALUES (@name, @email, @phone, @location, @platform, @notes, @status)');
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
    body('name').trim().notEmpty().withMessage('學生姓名不得為空'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('請輸入有效的 Email 地址'),
    body('status').isIn(['active', 'graduated']).withMessage('無效的學生狀態'),
    // --- 路由處理器 ---
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`Validation error for PUT /api/students/${req.params.id}: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { name, email, phone, location, platform, notes, status } = req.body;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone)
                .input('location', sql.NVarChar, location)
                .input('platform', sql.NVarChar, platform)
                .input('notes', sql.NText, notes)
                .input('status', sql.NVarChar, status)
                .query('UPDATE students SET name = @name, email = @email, phone = @phone, location = @location, platform = @platform, notes = @notes, status = @status WHERE id = @id; SELECT * FROM students WHERE id = @id;');
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            next(err);
        }
    }
);

// [UPDATE] 更新學生狀態 (例如：標記為畢業)
app.patch('/api/students/:id/status', async (req, res) => {
    try {
        const { id } = req.params; // 'active' (在校生) 或 'graduated' (畢業生)
        const { status } = req.body; // 'active' or 'graduated'

        if (!status || !['active', 'graduated'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status provided' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE students SET status = @status WHERE id = @id; SELECT * FROM students WHERE id = @id;');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

// [DELETE] 永久刪除一位學生
app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM students WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.status(204).send(); // 204 No Content: 成功刪除，沒有內容返回
    } catch (err) {
        next(err);
    }
});

// [CREATE/UPDATE] 上傳學生大頭貼
app.post('/api/students/:id/upload-avatar', upload.single('avatar'), async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: '沒有上傳檔案。' });
        }

        // 存在資料庫中的檔案路徑，例如：/uploads/avatar-162...jpg
        const avatarUrl = `/uploads/${req.file.filename}`;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('avatar_url', sql.NVarChar, avatarUrl)
            .query('UPDATE students SET avatar_url = @avatar_url WHERE id = @id; SELECT * FROM students WHERE id = @id;');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: '找不到學生' });
        }

        res.json(result.recordset[0]);
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

// --- 集中化的錯誤處理中介軟體 ---
// 注意：這個中介軟體必須放在所有 app.use() 和路由定義之後
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