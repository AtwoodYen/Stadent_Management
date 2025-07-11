require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function debugCoursesAPI() {
    try {
        console.log('開始診斷課程 API...');
        
        // 測試資料庫連線
        console.log('1. 測試資料庫連線...');
        const pool = await sql.connect(dbConfig);
        console.log('✓ 資料庫連線成功');
        
        // 測試課程查詢（與伺服器相同的查詢）
        console.log('2. 測試課程查詢...');
        const result = await pool.request()
            .query(`
                SELECT id, name, category, description
                FROM courses 
                WHERE is_active = 1
                ORDER BY name
            `);
        console.log(`✓ 課程查詢成功，找到 ${result.recordset.length} 筆記錄`);
        
        // 檢查是否有任何異常資料
        console.log('3. 檢查課程資料...');
        result.recordset.forEach((course, index) => {
            console.log(`   ${index + 1}. ID: ${course.id}, 名稱: ${course.name}, 分類: ${course.category}`);
            
            // 檢查是否有異常的 ID
            if (course.id === 0) {
                console.log(`   ⚠️  發現異常 ID=0 的課程: ${course.name}`);
            }
            
            // 檢查是否有 null 或空值
            if (!course.name || !course.category) {
                console.log(`   ⚠️  發現空值課程: ID=${course.id}, name=${course.name}, category=${course.category}`);
            }
        });
        
        // 測試 courses 表結構
        console.log('4. 檢查 courses 表結構...');
        const tableInfo = await pool.request()
            .query(`
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'courses'
                ORDER BY ORDINAL_POSITION
            `);
        
        console.log('✓ courses 表結構:');
        tableInfo.recordset.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? '可為空' : '不可為空'})`);
        });
        
        await pool.close();
        console.log('✓ 診斷完成');
        
    } catch (err) {
        console.error('❌ 診斷失敗:', err);
        console.error('錯誤詳情:', {
            message: err.message,
            code: err.code,
            state: err.state,
            stack: err.stack
        });
    }
}

debugCoursesAPI(); 