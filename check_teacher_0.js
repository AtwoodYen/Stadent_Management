// 檢查ID為0的師資記錄
const sql = require('mssql');

const config = {
    server: '104.199.210.184',
    database: 'Student_Management',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    authentication: {
        type: 'ntlm',
        options: {
            domain: '',
            userName: 'd2_db',
            password: 'mfwtj-k4pwc'
        }
    }
};

async function checkTeacher0() {
    try {
        console.log('嘗試連接資料庫...');
        const pool = await sql.connect(config);
        console.log('資料庫連接成功！');
        
        // 1. 查詢ID為0的師資記錄
        console.log('\n=== 查詢ID為0的師資記錄 ===');
        const result1 = await pool.request()
            .query('SELECT * FROM teachers WHERE id = 0');
            
        if (result1.recordset.length > 0) {
            console.log('找到ID為0的師資：');
            console.table(result1.recordset);
        } else {
            console.log('❌ 沒有找到ID為0的師資記錄');
        }
        
        // 2. 查詢所有使用 atwood.yen.gun@gmail.com 的師資
        console.log('\n=== 查詢使用 atwood.yen.gun@gmail.com 的師資 ===');
        const result2 = await pool.request()
            .query("SELECT id, name, email FROM teachers WHERE email = 'atwood.yen.gun@gmail.com'");
            
        if (result2.recordset.length > 0) {
            console.log('使用此email的師資：');
            console.table(result2.recordset);
        } else {
            console.log('✅ 沒有師資使用此email');
        }
        
        // 3. 檢查所有師資的email唯一性
        console.log('\n=== 檢查email重複情況 ===');
        const result3 = await pool.request()
            .query(`
                SELECT email, COUNT(*) as count 
                FROM teachers 
                GROUP BY email 
                HAVING COUNT(*) > 1
            `);
            
        if (result3.recordset.length > 0) {
            console.log('發現重複的email：');
            console.table(result3.recordset);
        } else {
            console.log('✅ 沒有重複的email');
        }
        
        // 4. 測試UPDATE操作（但不實際執行）
        console.log('\n=== 測試UPDATE語句 ===');
        try {
            await pool.request()
                .query("SELECT COUNT(*) as count FROM teachers WHERE id = 0");
            console.log('✅ 可以查詢ID為0的記錄');
        } catch (err) {
            console.log('❌ 查詢ID為0時發生錯誤:', err.message);
        }
        
        await pool.close();
        console.log('\n檢查完成！');
        
    } catch (err) {
        console.error('❌ 檢查失敗:', err.message);
    }
}

checkTeacher0(); 