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

async function testServerPool() {
    try {
        console.log('測試伺服器連線池...');
        
        // 模擬伺服器的連線池初始化
        console.log('1. 初始化連線池...');
        let pool = await sql.connect(dbConfig);
        console.log('✓ 連線池初始化成功');
        
        // 測試查詢
        console.log('2. 測試查詢...');
        const result = await pool.request()
            .query(`
                SELECT id, name, category, description
                FROM courses 
                WHERE is_active = 1
                ORDER BY name
            `);
        console.log(`✓ 查詢成功，找到 ${result.recordset.length} 筆記錄`);
        
        // 關閉連線池
        console.log('3. 關閉連線池...');
        await pool.close();
        console.log('✓ 連線池關閉成功');
        
        // 再次初始化連線池（模擬伺服器重啟）
        console.log('4. 重新初始化連線池...');
        pool = await sql.connect(dbConfig);
        console.log('✓ 重新初始化成功');
        
        // 再次測試查詢
        console.log('5. 再次測試查詢...');
        const result2 = await pool.request()
            .query(`
                SELECT id, name, category, description
                FROM courses 
                WHERE is_active = 1
                ORDER BY name
            `);
        console.log(`✓ 再次查詢成功，找到 ${result2.recordset.length} 筆記錄`);
        
        await pool.close();
        console.log('✓ 測試完成');
        
    } catch (err) {
        console.error('❌ 測試失敗:', err);
        console.error('錯誤詳情:', {
            message: err.message,
            code: err.code,
            state: err.state,
            stack: err.stack
        });
    }
}

testServerPool(); 