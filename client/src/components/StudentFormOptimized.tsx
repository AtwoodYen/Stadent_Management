import React, { useState, useEffect } from 'react';
import '../styles/improved-student-form.css';

interface Student {
  id?: number;
  chinese_name: string;
  english_name: string;
  student_phone: string;
  student_email: string;
  student_line: string;
  father_name: string;
  father_phone: string;
  father_line: string;
  mother_name: string;
  mother_phone: string;
  mother_line: string;
  school: string;
  grade: string;
  gender: string;
  level_type: string;
  class_type: string;
  notes: string;
}

interface ClassType {
  class_code: string;
  class_name: string;
  description: string;
  sort_order: number;
}

interface StudentFormOptimizedProps {
  student: Student | null;
  onSave: (data: Partial<Student>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const StudentFormOptimized: React.FC<StudentFormOptimizedProps> = ({
  student,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    chinese_name: '',
    english_name: '',
    student_phone: '',
    student_email: '',
    student_line: '',
    father_name: '',
    father_phone: '',
    father_line: '',
    mother_name: '',
    mother_phone: '',
    mother_line: '',
    school: '',
    grade: '',
    gender: '',
    level_type: '',
    class_type: '',
    notes: ''
  });

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);

  // 載入班別資料
  useEffect(() => {
    const fetchClassTypes = async () => {
      try {
        const response = await fetch('/api/class-types');
        if (response.ok) {
          const data = await response.json();
          setClassTypes(data);
        } else {
          console.error('無法載入班別資料');
        }
      } catch (error) {
        console.error('載入班別資料時發生錯誤:', error);
      }
    };

    fetchClassTypes();
  }, []);

  useEffect(() => {
    if (student) {
      setFormData({
        chinese_name: student.chinese_name || '',
        english_name: student.english_name || '',
        student_phone: student.student_phone || '',
        student_email: student.student_email || '',
        student_line: student.student_line || '',
        father_name: student.father_name || '',
        father_phone: student.father_phone || '',
        father_line: student.father_line || '',
        mother_name: student.mother_name || '',
        mother_phone: student.mother_phone || '',
        mother_line: student.mother_line || '',
        school: student.school || '',
        grade: student.grade || '',
        gender: student.gender || '',
        level_type: student.level_type || '',
        class_type: student.class_type || '',
        notes: student.notes || ''
      });
    }
  }, [student]);

  const handleChange = (field: keyof Student, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證必填欄位
    if (!formData.chinese_name?.trim()) {
      alert('請填寫中文姓名');
      return;
    }
    

    
    if (!formData.school?.trim()) {
      alert('請選擇學校');
      return;
    }
    
    if (!formData.grade?.trim()) {
      alert('請選擇年級');
      return;
    }
    
    if (!formData.gender?.trim()) {
      alert('請選擇性別');
      return;
    }
    
    if (!formData.class_type?.trim()) {
      alert('請選擇班別');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form className={`student-form ${isLoading ? 'loading' : ''}`} onSubmit={handleSubmit}>
      
      {/* 基本資料區域 */}
      <div className="section-title">
        基本資料
      </div>
      
      {/* 基本資料：所有欄位在同一行 */}
      <div className="form-row basic-info-row">
        <div className="form-field">
          <label>
            中文姓名<span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.chinese_name}
            onChange={(e) => handleChange('chinese_name', e.target.value)}
            required
            placeholder="請輸入中文姓名"
          />
        </div>
        
        <div className="form-field">
          <label>英文姓名</label>
          <input
            type="text"
            value={formData.english_name}
            onChange={(e) => handleChange('english_name', e.target.value)}
            placeholder="請輸入英文姓名"
          />
        </div>
        
        <div className="form-field">
          <label>
            學校<span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.school}
            onChange={(e) => handleChange('school', e.target.value)}
            required
            placeholder="請輸入學校名稱"
          />
        </div>
        
        <div className="form-field">
          <label>
            年級<span className="required">*</span>
          </label>
          <select
            value={formData.grade}
            onChange={(e) => handleChange('grade', e.target.value)}
            required
          >
            <option value="">年級</option>
            <option value="高一">高一</option>
            <option value="高二">高二</option>
            <option value="高三">高三</option>
          </select>
        </div>
        
        <div className="form-field">
          <label>
            性別<span className="required">*</span>
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            required
          >
            <option value="">選</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        
        <div className="form-field">
          <label>程度</label>
          <select
            value={formData.level_type}
            onChange={(e) => handleChange('level_type', e.target.value)}
          >
            <option value="">請選擇</option>
                            <option value="新手">新手</option>
                <option value="入門">入門</option>
                <option value="進階">進階</option>
                <option value="高階">高階</option>
                <option value="精英">精英</option>
          </select>
        </div>
        
        <div className="form-field">
          <label>
            班別<span className="required">*</span>
          </label>
          <select
            value={formData.class_type}
            onChange={(e) => handleChange('class_type', e.target.value)}
            required
          >
            <option value="">請選擇</option>
            {classTypes.map((classType) => (
              <option key={classType.class_code} value={classType.class_code}>
                {classType.class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 聯絡資訊與備註並排區域 */}
      <div className="contact-notes-container">
        {/* 聯絡資訊區域 */}
        <div className="contact-section">
          <div className="section-title">
            聯絡資訊
          </div>

          {/* 學生聯絡方式 */}
          <div className="form-row contact-row">
            <div className="form-field">
              <label>學生電話</label>
              <input
                type="tel"
                value={formData.student_phone}
                onChange={(e) => handleChange('student_phone', e.target.value)}
                placeholder="請輸入電話號碼"
              />
            </div>
            
            <div className="form-field">
              <label>學生信箱</label>
              <input
                type="email"
                value={formData.student_email}
                onChange={(e) => handleChange('student_email', e.target.value)}
                placeholder="請輸入電子信箱"
              />
            </div>
            
            <div className="form-field">
              <label>學生Line</label>
              <input
                type="text"
                value={formData.student_line}
                onChange={(e) => handleChange('student_line', e.target.value)}
                placeholder="請輸入Line ID"
              />
            </div>
          </div>

          {/* 父親聯絡方式 */}
          <div className="form-row contact-row">
            <div className="form-field">
              <label>父親姓名</label>
              <input
                type="text"
                value={formData.father_name}
                onChange={(e) => handleChange('father_name', e.target.value)}
                placeholder="請輸入父親姓名"
              />
            </div>
            
            <div className="form-field">
              <label>父親電話</label>
              <input
                type="tel"
                value={formData.father_phone}
                onChange={(e) => handleChange('father_phone', e.target.value)}
                placeholder="請輸入電話號碼"
              />
            </div>
            
            <div className="form-field">
              <label>父親Line</label>
              <input
                type="text"
                value={formData.father_line}
                onChange={(e) => handleChange('father_line', e.target.value)}
                placeholder="請輸入Line ID"
              />
            </div>
          </div>

          {/* 母親聯絡方式 */}
          <div className="form-row contact-row">
            <div className="form-field">
              <label>母親姓名</label>
              <input
                type="text"
                value={formData.mother_name}
                onChange={(e) => handleChange('mother_name', e.target.value)}
                placeholder="請輸入母親姓名"
              />
            </div>
            
            <div className="form-field">
              <label>母親電話</label>
              <input
                type="tel"
                value={formData.mother_phone}
                onChange={(e) => handleChange('mother_phone', e.target.value)}
                placeholder="請輸入電話號碼"
              />
            </div>
            
            <div className="form-field">
              <label>母親Line</label>
              <input
                type="text"
                value={formData.mother_line}
                onChange={(e) => handleChange('mother_line', e.target.value)}
                placeholder="請輸入Line ID"
              />
            </div>
          </div>
        </div>

        {/* 備註區域 */}
        <div className="notes-section">
          <div className="section-title">
            備註
          </div>
          
          <div className="form-row notes-row">
            <div className="form-field">
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="請輸入備註內容..."
                rows={8}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 按鈕區域 */}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? '儲存中...' : '儲存'}
        </button>
      </div>
    </form>
  );
};

export default StudentFormOptimized; 