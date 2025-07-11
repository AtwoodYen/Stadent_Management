const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkCourseProgress() {
  try {
    await sql.connect(config);
    console.log('資料庫連線成功！');

    // 檢查班別程度能力資料 (student_class_type_abilities 與 class_types 關聯)
    console.log('=== 班別程度能力資料 ===');
    const classAbilitiesResult = await sql.query(`
      SELECT TOP 10
        sca.id,
        sca.student_id,
        s.chinese_name as student_name,
        sca.class_type,
        ct.class_name,
        ct.class_code,
        sca.ability_level,
        sca.assessment_date,
        sca.is_active
      FROM student_class_type_abilities sca
      INNER JOIN students s ON sca.student_id = s.id
      LEFT JOIN class_types ct ON sca.class_type = ct.class_code
      WHERE sca.is_active = 1
      ORDER BY sca.student_id, ct.class_name
    `);

    console.log('班別程度能力資料:');
    console.table(classAbilitiesResult.recordset);

    // 檢查 class_types 資料表
    console.log('=== class_types 資料表 ===');
    const classTypesResult = await sql.query(`
      SELECT class_code, class_name, description, sort_order, is_active
      FROM class_types
      WHERE is_active = 1
      ORDER BY sort_order, class_name
    `);

    console.log('class_types 資料:');
    console.table(classTypesResult.recordset);

    // 檢查課程進度資料 (student_course_progress 與 courses 關聯)
    console.log('=== 課程進度資料 ===');
    const courseProgressResult = await sql.query(`
      SELECT TOP 10
        scp.id,
        scp.student_id,
        s.chinese_name as student_name,
        scp.course_id,
        c.name as course_name,
        c.category,
        scp.ability_level,
        scp.progress_percentage,
        scp.is_active
      FROM student_course_progress scp
      INNER JOIN students s ON scp.student_id = s.id
      INNER JOIN courses c ON scp.course_id = c.id
      WHERE scp.is_active = 1
      ORDER BY scp.student_id, c.name
    `);

    console.log('課程進度資料:');
    console.table(courseProgressResult.recordset);

    // 檢查 courses 資料表
    console.log('=== courses 資料表 ===');
    const coursesResult = await sql.query(`
      SELECT id, name, category, level, is_active
      FROM courses
      WHERE is_active = 1
      ORDER BY name
    `);

    console.log('courses 資料:');
    console.table(coursesResult.recordset);

    // 檢查是否有無效的關聯
    console.log('=== 檢查無效關聯 ===');
    
    // 檢查無效的 class_type 關聯
    const invalidClassTypes = await sql.query(`
      SELECT DISTINCT sca.class_type
      FROM student_class_type_abilities sca
      LEFT JOIN class_types ct ON sca.class_type = ct.class_code
      WHERE ct.class_code IS NULL AND sca.is_active = 1
    `);

    if (invalidClassTypes.recordset.length > 0) {
      console.log('無效的 class_type 關聯:');
      console.table(invalidClassTypes.recordset);
    } else {
      console.log('所有 class_type 關聯都有效');
    }

    // 檢查無效的 course_id 關聯
    const invalidCourseIds = await sql.query(`
      SELECT DISTINCT scp.course_id
      FROM student_course_progress scp
      LEFT JOIN courses c ON scp.course_id = c.id
      WHERE c.id IS NULL AND scp.is_active = 1
    `);

    if (invalidCourseIds.recordset.length > 0) {
      console.log('無效的 course_id 關聯:');
      console.table(invalidCourseIds.recordset);
    } else {
      console.log('所有 course_id 關聯都有效');
    }

    // 檢查 id=0 的課程是否被使用
    console.log('=== 檢查 id=0 課程使用情況 ===');
    const courseZeroUsage = await sql.query(`
      SELECT COUNT(*) as usage_count
      FROM student_course_progress
      WHERE course_id = 0 AND is_active = 1
    `);

    console.log(`id=0 課程被使用次數: ${courseZeroUsage.recordset[0].usage_count}`);

    if (courseZeroUsage.recordset[0].usage_count > 0) {
      console.log('警告: id=0 課程正在被使用，不能直接刪除');
    } else {
      console.log('id=0 課程未被使用，可以安全刪除');
      
      // 刪除 id=0 的課程
      const deleteResult = await sql.query(`
        DELETE FROM courses WHERE id = 0
      `);
      console.log('已刪除 id=0 的課程');
    }

  } catch (err) {
    console.error('錯誤:', err);
  } finally {
    await sql.close();
  }
}

checkCourseProgress(); 