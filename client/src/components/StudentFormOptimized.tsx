import React, { useState, useEffect } from 'react';
import '../styles/improved-student-form.css';
import { Autocomplete, TextField } from '@mui/material';
import CustomAlert from './CustomAlert';

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
  enrollment_status: string;
  notes: string;
  class_schedule_type?: string; // 新增
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
    enrollment_status: '進行中',
    notes: '',
    class_schedule_type: '常態班' // 新增
  });

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [schools, setSchools] = useState<string[]>([]);

  // 自定義 Alert 狀態
  const [customAlert, setCustomAlert] = useState({
    open: false,
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    title: ''
  });

  // 顯示自定義 Alert 的函數
  const showAlert = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', title?: string) => {
    setCustomAlert({
      open: true,
      message,
      type,
      title: title || ''
    });
  };

  const closeAlert = () => {
    setCustomAlert(prev => ({ ...prev, open: false }));
  };

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

  // 載入學校資料
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/students/schools');
        if (response.ok) {
          const data = await response.json();
          setSchools(data);
        } else {
          console.error('無法載入學校資料');
        }
      } catch (error) {
        console.error('載入學校資料時發生錯誤:', error);
      }
    };

    fetchSchools();
  }, []);

  useEffect(() => {
    if (student) {
      // 編輯現有學生
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
        enrollment_status: student.enrollment_status || '進行中',
        notes: student.notes || '',
        class_schedule_type: student.class_schedule_type || '常態班' // 新增
      });
    } else {
      // 新增學生，重置表單資料
      setFormData({
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
        enrollment_status: '進行中',
        notes: '',
        class_schedule_type: '常態班' // 新增
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
      showAlert('請填寫中文姓名', 'warning');
      return;
    }
    
    if (!formData.student_email?.trim()) {
      showAlert('請填寫學生信箱', 'warning');
      return;
    }
    
    if (!formData.school?.trim()) {
      showAlert('請選擇學校', 'warning');
      return;
    }
    
    if (!formData.grade?.trim()) {
      showAlert('請選擇年級', 'warning');
      return;
    }
    
    if (!formData.gender?.trim()) {
      showAlert('請選擇性別', 'warning');
      return;
    }
    
    if (!formData.class_type?.trim()) {
      showAlert('請選擇班別', 'warning');
      return;
    }
    
    onSave(formData);
  };

  return (
    <>
      <form className={`student-form ${isLoading ? 'loading' : ''}`} onSubmit={handleSubmit}>
        
        {/* 基本資料區域 */}
        <div className="section-title">
          基本資料
        </div>
        
        {/* 基本資料：第一行 */}
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
            <Autocomplete
              options={schools}
              value={formData.school}
              onChange={(event, newValue) => handleChange('school', newValue || '')}
              onInputChange={(event, newInputValue) => {
                // 如果輸入的值不在選項中，也更新表單資料
                if (!schools.includes(newInputValue)) {
                  handleChange('school', newInputValue);
                }
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="請輸入或選擇學校"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              )}
              sx={{
                '& .MuiAutocomplete-input': {
                  padding: '8px 12px !important'
                }
              }}
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
              <optgroup label="小學">
                <option value="小一">小一</option>
                <option value="小二">小二</option>
                <option value="小三">小三</option>
                <option value="小四">小四</option>
                <option value="小五">小五</option>
                <option value="小六">小六</option>
              </optgroup>
              <optgroup label="國中">
                <option value="國一">國一</option>
                <option value="國二">國二</option>
                <option value="國三">國三</option>
              </optgroup>
              <optgroup label="高中">
                <option value="高一">高一</option>
                <option value="高二">高二</option>
                <option value="高三">高三</option>
              </optgroup>
              <optgroup label="大學">
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
              </optgroup>
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
        </div>

        {/* 基本資料：第二行 */}
        <div className="form-row basic-info-row" style={{ marginTop: '10px' }}>
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
          
          <div className="form-field" style={{ marginLeft: '30px' }}>
            <label>就讀狀態</label>
            <select
              value={formData.enrollment_status}
              onChange={(e) => handleChange('enrollment_status', e.target.value)}
            >
              <option value="進行中">進行中</option>
              <option value="暫停中">暫停中</option>
              <option value="已畢業">已畢業</option>
            </select>
          </div>

          <div className="form-field" style={{ marginLeft: '80px' }}>
            <label htmlFor="class_schedule_type">班級排程類型<span className="required">*</span></label>
            <TextField
              select
              id="class_schedule_type"
              value={formData.class_schedule_type || '常態班'}
              onChange={(e) => handleChange('class_schedule_type', e.target.value)}
              required
              size="small"
              sx={{
                width: '160%',
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                  fontSize: '14px'
                }
              }}
            >
              <option value="常態班">常態班</option>
              <option value="短期班">短期班</option>
            </TextField>
          </div>
        </div>

        {/* 聯絡資訊與備註並排區域 */}
        <div className="contact-notes-container" style={{ marginTop: '20px' }}>
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
                <label>
                  學生信箱<span className="required">*</span>
                </label>
                <input
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => handleChange('student_email', e.target.value)}
                  required
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
                <label>備註</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="請輸入備註資訊"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 按鈕區域 */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? '儲存中...' : (student ? '更新' : '新增')}
          </button>
        </div>
      </form>

      {/* 自定義 Alert 組件 */}
      <CustomAlert
        open={customAlert.open}
        onClose={closeAlert}
        message={customAlert.message}
        type={customAlert.type}
        title={customAlert.title}
      />
    </>
  );
};

export default StudentFormOptimized; 