-- =====================================================
-- 新增指定學校資料到資料庫
-- 創建日期: 2025-07-04
-- 說明: 新增海洋大學、康橋雙語、復興雙語等學校資料
-- =====================================================

-- 檢查並新增學校資料
-- 使用 MERGE 語法避免重複插入

-- 1. 海洋大學
MERGE INTO schools AS target
USING (SELECT 
    N'國立臺灣海洋大學' AS school_name,
    N'海洋大學' AS short_name,
    N'國立' AS school_type,
    N'基隆市' AS district,
    N'大學' AS education_level,
    N'02-2462-2192' AS phone,
    N'基隆市中正區北寧路2號' AS address,
    N'https://www.ntou.edu.tw' AS website,
    N'ntou@ntou.edu.tw' AS email,
    N'台灣唯一以海洋為特色的國立大學，位於基隆市' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 2. 康橋雙語學校
MERGE INTO schools AS target
USING (SELECT 
    N'康橋雙語學校' AS school_name,
    N'康橋' AS short_name,
    N'私立' AS school_type,
    N'新北市' AS district,
    N'高中' AS education_level,
    N'02-8195-8800' AS phone,
    N'新北市林口區文化一路一段100號' AS address,
    N'https://www.kcis.com.tw' AS website,
    N'info@kcis.com.tw' AS email,
    N'知名雙語學校，提供國際化教育課程' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 3. 復興雙語學校
MERGE INTO schools AS target
USING (SELECT 
    N'復興雙語學校' AS school_name,
    N'復興' AS short_name,
    N'私立' AS school_type,
    N'台北市' AS district,
    N'高中' AS education_level,
    N'02-2771-5859' AS phone,
    N'台北市大安區復興南路一段390號' AS address,
    N'https://www.fhjh.tp.edu.tw' AS website,
    N'fhjh@fhjh.tp.edu.tw' AS email,
    N'台北市知名雙語學校，提供優質國際教育' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 4. 稻江科技暨管理學院
MERGE INTO schools AS target
USING (SELECT 
    N'稻江科技暨管理學院' AS school_name,
    N'稻江' AS short_name,
    N'私立' AS school_type,
    N'嘉義縣' AS district,
    N'大學' AS education_level,
    N'05-362-2889' AS phone,
    N'嘉義縣朴子市學府路二段51號' AS address,
    N'https://www.toko.edu.tw' AS website,
    N'info@toko.edu.tw' AS email,
    N'位於嘉義縣的私立科技大學' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 5. 金華國中
MERGE INTO schools AS target
USING (SELECT 
    N'台北市立金華國民中學' AS school_name,
    N'金華國中' AS short_name,
    N'公立' AS school_type,
    N'大安區' AS district,
    N'國中' AS education_level,
    N'02-2391-7402' AS phone,
    N'台北市大安區新生南路二段32號' AS address,
    N'https://www.chwjh.tp.edu.tw' AS website,
    N'chwjh@chwjh.tp.edu.tw' AS email,
    N'台北市大安區知名國中，升學表現優異' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 6. 薇閣高中
MERGE INTO schools AS target
USING (SELECT 
    N'薇閣高級中學' AS school_name,
    N'薇閣' AS short_name,
    N'私立' AS school_type,
    N'台北市' AS district,
    N'高中' AS education_level,
    N'02-2891-1230' AS phone,
    N'台北市北投區珠海路50號' AS address,
    N'https://www.wghs.tp.edu.tw' AS website,
    N'wghs@wghs.tp.edu.tw' AS email,
    N'台北市知名私立高中，升學表現優異' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 7. 靜心高中
MERGE INTO schools AS target
USING (SELECT 
    N'靜心高級中學' AS school_name,
    N'靜心' AS short_name,
    N'私立' AS school_type,
    N'台北市' AS district,
    N'高中' AS education_level,
    N'02-2932-3118' AS phone,
    N'台北市文山區興隆路二段46號' AS address,
    N'https://www.chjhs.tp.edu.tw' AS website,
    N'chjhs@chjhs.tp.edu.tw' AS email,
    N'台北市文山區知名私立高中' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 8. 台北歐洲學校
MERGE INTO schools AS target
USING (SELECT 
    N'台北歐洲學校' AS school_name,
    N'台北歐洲學校' AS short_name,
    N'私立' AS school_type,
    N'台北市' AS district,
    N'高中' AS education_level,
    N'02-8145-9007' AS phone,
    N'台北市士林區文林路727號' AS address,
    N'https://www.taipeieuropeanschool.com' AS website,
    N'info@taipeieuropeanschool.com' AS email,
    N'提供歐洲教育體系的國際學校' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 9. 台北美國學校
MERGE INTO schools AS target
USING (SELECT 
    N'台北美國學校' AS school_name,
    N'台北美國學校' AS short_name,
    N'私立' AS school_type,
    N'台北市' AS district,
    N'高中' AS education_level,
    N'02-7750-9700' AS phone,
    N'台北市士林區中山北路六段800號' AS address,
    N'https://www.tas.edu.tw' AS website,
    N'info@tas.edu.tw' AS email,
    N'提供美式教育的國際學校' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 10. 中山國中
MERGE INTO schools AS target
USING (SELECT 
    N'台北市立中山國民中學' AS school_name,
    N'中山國中' AS short_name,
    N'公立' AS school_type,
    N'中山區' AS district,
    N'國中' AS education_level,
    N'02-2508-4050' AS phone,
    N'台北市中山區長安東路二段141號' AS address,
    N'https://www.csjh.tp.edu.tw' AS website,
    N'csjh@csjh.tp.edu.tw' AS email,
    N'台北市中山區知名國中' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 11. 澳洲墨爾本大學
MERGE INTO schools AS target
USING (SELECT 
    N'澳洲墨爾本大學' AS school_name,
    N'墨爾本大學' AS short_name,
    N'私立' AS school_type,
    N'海外' AS district,
    N'大學' AS education_level,
    N'+61-3-9035-5511' AS phone,
    N'澳洲維多利亞州墨爾本市' AS address,
    N'https://www.unimelb.edu.au' AS website,
    N'info@unimelb.edu.au' AS email,
    N'澳洲頂尖大學，世界排名前50名' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 12. 台北市立附小
MERGE INTO schools AS target
USING (SELECT 
    N'台北市立大學附設實驗國民小學' AS school_name,
    N'台北市立附小' AS short_name,
    N'公立' AS school_type,
    N'中正區' AS district,
    N'國小' AS education_level,
    N'02-2311-2345' AS phone,
    N'台北市中正區愛國西路1號' AS address,
    N'https://www.utaipei.edu.tw' AS website,
    N'utaipei@utaipei.edu.tw' AS email,
    N'台北市立大學附設實驗小學' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 13. 政大附中
MERGE INTO schools AS target
USING (SELECT 
    N'國立政治大學附屬高級中學' AS school_name,
    N'政大附中' AS short_name,
    N'國立' AS school_type,
    N'文山區' AS district,
    N'高中' AS education_level,
    N'02-8237-7500' AS phone,
    N'台北市文山區政大一街353號' AS address,
    N'https://www.ahs.nccu.edu.tw' AS website,
    N'ahs@ahs.nccu.edu.tw' AS email,
    N'國立政治大學附屬中學，升學表現優異' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 14. 華興中學
MERGE INTO schools AS target
USING (SELECT 
    N'華興高級中學' AS school_name,
    N'華興' AS short_name,
    N'私立' AS school_type,
    N'台北市' AS district,
    N'高中' AS education_level,
    N'02-2831-6800' AS phone,
    N'台北市士林區仰德大道一段101號' AS address,
    N'https://www.hhsh.tp.edu.tw' AS website,
    N'hhsh@hhsh.tp.edu.tw' AS email,
    N'台北市士林區知名私立高中' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 15. 延平高中
MERGE INTO schools AS target
USING (SELECT 
    N'延平高級中學' AS school_name,
    N'延平' AS short_name,
    N'私立' AS school_type,
    N'台北市' AS district,
    N'高中' AS education_level,
    N'02-2707-1478' AS phone,
    N'台北市大安區建國南路一段275號' AS address,
    N'https://www.yphs.tp.edu.tw' AS website,
    N'yphs@yphs.tp.edu.tw' AS email,
    N'台北市大安區知名私立高中，升學表現優異' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 16. 華江中學
MERGE INTO schools AS target
USING (SELECT 
    N'台北市立華江高級中學' AS school_name,
    N'華江中學' AS short_name,
    N'公立' AS school_type,
    N'萬華區' AS district,
    N'高中' AS education_level,
    N'02-2301-9946' AS phone,
    N'台北市萬華區西藏路213號' AS address,
    N'https://www.hcsh.tp.edu.tw' AS website,
    N'hcsh@hcsh.tp.edu.tw' AS email,
    N'台北市萬華區知名公立高中，升學表現優異' AS notes
) AS source
ON target.school_name = source.school_name
WHEN NOT MATCHED THEN
    INSERT (school_name, short_name, school_type, district, education_level, phone, address, website, email, notes)
    VALUES (source.school_name, source.short_name, source.school_type, source.district, source.education_level, source.phone, source.address, source.website, source.email, source.notes);

-- 顯示新增結果
PRINT N'=== 學校資料新增完成 ===';
PRINT N'已新增以下學校：';
PRINT N'1. 國立臺灣海洋大學';
PRINT N'2. 康橋雙語學校';
PRINT N'3. 復興雙語學校';
PRINT N'4. 稻江科技暨管理學院';
PRINT N'5. 台北市立金華國民中學';
PRINT N'6. 薇閣高級中學';
PRINT N'7. 靜心高級中學';
PRINT N'8. 台北歐洲學校';
PRINT N'9. 台北美國學校';
PRINT N'10. 台北市立中山國民中學';
PRINT N'11. 澳洲墨爾本大學';
PRINT N'12. 台北市立大學附設實驗國民小學';
PRINT N'13. 國立政治大學附屬高級中學';
PRINT N'14. 華興高級中學';
PRINT N'15. 延平高級中學';
PRINT N'16. 台北市立華江高級中學';

-- 查詢新增的學校資料
SELECT 
    school_name AS '學校全名',
    short_name AS '簡稱',
    school_type AS '性質',
    district AS '行政區',
    education_level AS '學制',
    phone AS '電話',
    our_student_count AS '我們的學生數'
FROM schools 
WHERE school_name IN (
    N'國立臺灣海洋大學',
    N'康橋雙語學校',
    N'復興雙語學校',
    N'稻江科技暨管理學院',
    N'台北市立金華國民中學',
    N'薇閣高級中學',
    N'靜心高級中學',
    N'台北歐洲學校',
    N'台北美國學校',
    N'台北市立中山國民中學',
    N'澳洲墨爾本大學',
    N'台北市立大學附設實驗國民小學',
    N'國立政治大學附屬高級中學',
    N'華興高級中學',
    N'延平高級中學',
    N'台北市立華江高級中學'
)
ORDER BY school_type, district, short_name;

PRINT N'=== 學校資料新增完成 ==='; 