// 全域變數
const API_BASE_URL = 'http://localhost:3000'; // 您的後端 API 網址
const API_KEY = 'S3cr3tK3y-f0r-My-Tut0r1ng-App-!@#$'; // 您的 API Key，必須與 .env 檔案中的一致
let currentDate = new Date();
let students = [];
let lessons = [];
let editingStudentId = null;
let editingLessonId = null;
let notificationTimeouts = []; // New: To store setTimeout IDs for notifications
let calendarView = 'month'; // 'month' or 'week'
let draggedLesson = null;

// 用於點擊拖曳建立課程的變數
let isCreatingLesson = false;
let creationDayElement = null;
let creationPreviewElement = null;
let creationStartDate = null;
let creationStartY = 0;

// References to UI elements for search and filter
let studentSearchInput;
let studentLocationFilter;
let studentStatusFilter; // New: Student status filter

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // Get references to new UI elements
    studentSearchInput = document.getElementById('studentSearchInput');
    studentLocationFilter = document.getElementById('studentLocationFilter');
    studentStatusFilter = document.getElementById('studentStatusFilter'); // New: Get reference

    // 從後端載入學生資料
    await loadStudentsFromServer();

    // 從後端載入課程資料
    await loadLessonsFromServer();

    populateLocationFilter(); // Populate filter dropdown initially
    setupEventListeners();
    renderStudentList(); // Render student list after filters are ready
    renderActiveView(); // New main render function
    updateStats();
    scheduleNotifications(); // 初始化時排程提醒
});

// 建立一個包含驗證和錯誤處理的 fetch 輔助函式
async function authenticatedFetch(url, options = {}) {
    const headers = {
        ...options.headers,
        'X-API-Key': API_KEY, // 在每個請求中加入 API Key
    };

    // 如果不是 FormData，才設定 Content-Type，瀏覽器會自動處理 FormData 的 Content-Type
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '無法解析的伺服器錯誤' }));
        // 專門處理驗證錯誤
        if (response.status === 400 && errorData.errors) {
            const errorMessages = errorData.errors.map(e => e.msg).join('\n');
            throw new Error(errorMessages);
        }
        // 處理其他伺服器錯誤
        throw new Error(errorData.error || `伺服器錯誤 (狀態: ${response.status})`);
    }

    // 處理像 DELETE 這樣沒有回傳內容的成功請求
    if (response.status === 204) {
        return;
    }

    return response.json();
}

// 從後端 API 載入學生資料
async function loadStudentsFromServer() {
    try {
        students = await authenticatedFetch(`${API_BASE_URL}/api/students`);
        showNotification('✅ 學生資料已從伺服器載入', 'success');
    } catch (error) {
        console.error('無法從伺服器載入學生資料:', error);
        showPersistentError(`無法載入學生資料: ${error.message}`);
        students = []; // 發生錯誤時，清空學生資料以避免問題
    }
}

// 從後端 API 載入課程資料
async function loadLessonsFromServer() {
    try {
        const data = await authenticatedFetch(`${API_BASE_URL}/api/lessons`);
        // 將從 DB 來的資料轉換為前端需要的格式
        lessons = data.map(lesson => ({
            id: lesson.id,
            studentId: lesson.student_id,
            date: new Date(lesson.lesson_date), // DB 的 DATE 格式需要轉換
            time: lesson.lesson_time.substring(0, 5), // DB 的 TIME 格式 'HH:mm:ss' -> 'HH:mm'
            duration: lesson.duration_minutes,
            type: lesson.lesson_type,
            status: lesson.status,
            notes: lesson.notes
        }));
    } catch (error) {
        console.error('無法從伺服器載入課程資料:', error);
        showPersistentError(`無法載入課程資料: ${error.message}`);
    }
}

function setupEventListeners() {
    // 學生表單提交
    document.getElementById('studentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveStudent();
    });

    // 課程表單提交
    document.getElementById('lessonForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveLesson();
    });

    // 關閉 modal 的點擊事件
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // 鍵盤快捷鍵
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });

    // 初始化通知權限
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // New: View switcher
    document.getElementById('viewSwitcher').addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        if (view && view !== calendarView) {
            calendarView = view;
            renderActiveView();
        }
    });
}

document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    studentSearchInput.value = '';
    studentLocationFilter.value = '';
    studentStatusFilter.value = 'active'; // Reset to default view
    renderStudentList();
});

// New event listeners for search and filter
studentSearchInput.addEventListener('input', renderStudentList); // Re-render on search input change
studentLocationFilter.addEventListener('change', renderStudentList); // Re-render on location filter change
studentStatusFilter.addEventListener('change', renderStudentList); // New: Re-render on status filter change

function updateViewSwitcherUI() {
    const buttons = document.querySelectorAll('#viewSwitcher .btn');
    buttons.forEach(button => {
        // We use a different class for the active state to avoid conflict with the green 'btn-secondary'
        if (button.dataset.view === calendarView) {
            button.style.background = 'linear-gradient(45deg, #2b6cb0, #2c5282)';
        } else {
            button.style.background = 'linear-gradient(45deg, #4299e1, #3182ce)';
        }
    });
}

function renderActiveView() {
    updateViewSwitcherUI();
    if (calendarView === 'month') {
        renderMonthView();
    } else if (calendarView === 'week') {
        renderWeekView();
    } else if (calendarView === 'today') {
        renderTodayView();
    }
}

function renderMonthView() {
    const calendar = document.getElementById('calendar');
    const title = document.getElementById('calendarTitle');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    title.textContent = `${year}年 ${month + 1}月`;
    
    calendar.innerHTML = '';
    calendar.style.gridTemplateColumns = 'repeat(7, 1fr)'; // 恢復月視圖的網格
    calendar.style.gridTemplateRows = ''; // Reset grid rows
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day calendar-day-header'; // 使用新的 CSS class
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = createDayElement(date);
        
        if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        calendar.appendChild(dayElement);
    }
}

function createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }

    dayElement.innerHTML = `
        <div class="day-number">${date.getDate()}</div>
        <div class="lessons-container"></div>
    `;

    // 移除舊的 click 事件，改用 mousedown 來處理點擊和拖曳
    dayElement.addEventListener('mousedown', (e) => {
        // 只有在點擊空白處時才開始建立課程
        if (e.target.classList.contains('lessons-container') || e.target.classList.contains('day-number')) {
            startLessonCreation(e, dayElement, date);
        }
    });

    // 渲染已有的課程
    const dayLessons = lessons.filter(lesson => lesson.date.toDateString() === date.toDateString());
    dayLessons.forEach(lesson => {
        const lessonElement = createLessonElement(lesson);
        dayElement.querySelector('.lessons-container').appendChild(lessonElement);
    });

    return dayElement;
}

const PIXELS_PER_MINUTE_GRID = 1; // 在時間格線視圖中，每分鐘對應 1px (30px / 30min)
const PIXELS_PER_MINUTE = 1.5; // 每分鐘對應的高度 (px)
let resizingLessonElement = null;
let initialLessonHeight = 0;
let initialMouseY = 0;

function createLessonElement(lesson) {
    const student = students.find(s => s.id === lesson.studentId);
    const lessonElement = document.createElement('div');
    lessonElement.className = `lesson ${lesson.type} ${lesson.status}`;
    lessonElement.draggable = true;
    lessonElement.dataset.lessonId = lesson.id;
    
    // 根據課程時長設定初始高度 (例如：每分鐘 1.5px)
    lessonElement.style.height = `${lesson.duration * (calendarView === 'month' ? PIXELS_PER_MINUTE : PIXELS_PER_MINUTE_GRID)}px`;

    lessonElement.innerHTML = `
        <span class="lesson-time">${lesson.time}</span>
        <span class="lesson-student">${student ? student.name : '未知學生'}</span>
        <div class="lesson-resize-handle"></div>
    `;
    
    lessonElement.addEventListener('dragstart', handleDragStart);
    lessonElement.addEventListener('click', (e) => {
        e.stopPropagation();
        editLesson(lesson.id);
    });

    // 為調整大小的把手新增事件
    const resizeHandle = lessonElement.querySelector('.lesson-resize-handle');
    resizeHandle.addEventListener('mousedown', (e) => {
        startResize(e, lessonElement);
    });
    
    return lessonElement;
}

function handleDragStart(e) {
    draggedLesson = e.target;
    e.dataTransfer.setData('text/plain', e.target.dataset.lessonId);
    e.target.style.opacity = '0.5';
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

async function handleDrop(e, newDate) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (draggedLesson) {
        const lessonId = parseInt(draggedLesson.dataset.lessonId, 10);
        const originalLesson = lessons.find(l => l.id === lessonId);
        
        if (originalLesson) {
            const updatedLessonData = {
                ...originalLesson,
                date: newDate,
                status: 'rescheduled'
            };

            try {
                await updateLessonOnServer(lessonId, updatedLessonData);
                // Update local data
                const index = lessons.findIndex(l => l.id === lessonId);
                if (index !== -1) {
                    lessons[index] = updatedLessonData;
                }

                renderActiveView();
                updateStats();
                
                showNotification(`✅ 已將課程調至 ${newDate.getMonth() + 1}月${newDate.getDate()}日`, 'success');
            } catch (error) {
                showNotification(`❌ 調動課程失敗: ${error.message}`, 'error');
                renderActiveView(); // 如果失敗，重新渲染以恢復原狀
            }
        }
        
        draggedLesson.style.opacity = '1';
        draggedLesson = null;
    }
}

function startResize(e, lessonElement) {
    e.preventDefault();
    e.stopPropagation();

    resizingLessonElement = lessonElement;
    initialLessonHeight = lessonElement.offsetHeight;
    initialMouseY = e.clientY;

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
}

function doResize(e) {
    if (!resizingLessonElement) return;

    const dy = e.clientY - initialMouseY;
    let newHeight = initialLessonHeight + dy;
    
    // 設定最小高度，例如 30px (代表 20 分鐘)
    if (newHeight < 30) newHeight = 30;

    resizingLessonElement.style.height = `${newHeight}px`;
}

async function stopResize() {
    if (!resizingLessonElement) return;

    const lessonId = parseInt(resizingLessonElement.dataset.lessonId, 10);
    const lesson = lessons.find(l => l.id === lessonId);
    const newHeight = resizingLessonElement.offsetHeight;
    // 將高度轉換回分鐘 (四捨五入到最接近的 5 分鐘)
    const newDuration = Math.round((newHeight / (calendarView === 'month' ? PIXELS_PER_MINUTE : PIXELS_PER_MINUTE_GRID)) / 5) * 5;

    if (lesson && lesson.duration !== newDuration) {
        lesson.duration = newDuration;
        try {
            await updateLessonOnServer(lessonId, lesson);
            showNotification(`✅ 課程時長已更新為 ${newDuration} 分鐘`, 'success');
        } catch (error) {
            showNotification(`❌ 更新課程時長失敗: ${error.message}`, 'error');
            resizingLessonElement.style.height = `${initialLessonHeight}px`; // 如果失敗，恢復原狀
        }
    }

    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    resizingLessonElement = null;
}

// --- 點擊拖曳建立課程的相關函式 ---

function startLessonCreation(e, dayElement, date) {
    e.preventDefault();
    isCreatingLesson = true;
    creationDayElement = dayElement;
    creationStartDate = date;
    
    const lessonsContainer = dayElement.querySelector('.lessons-container');
    const rect = lessonsContainer.getBoundingClientRect();
    creationStartY = e.clientY - rect.top;

    // 確保起始 Y 座標不會是負數
    if (creationStartY < 0) creationStartY = 0;

    creationPreviewElement = document.createElement('div');
    creationPreviewElement.className = 'lesson-preview';
    creationPreviewElement.style.top = `${creationStartY}px`;
    creationPreviewElement.style.height = '0px';
    lessonsContainer.appendChild(creationPreviewElement);

    document.addEventListener('mousemove', doLessonCreation);
    document.addEventListener('mouseup', stopLessonCreation);
}

function doLessonCreation(e) {
    if (!isCreatingLesson) return;
    
    const lessonsContainer = creationDayElement.querySelector('.lessons-container');
    const rect = lessonsContainer.getBoundingClientRect();
    let currentY = e.clientY - rect.top;
    
    let newHeight = currentY - creationStartY;
    
    if (newHeight >= 0) {
        creationPreviewElement.style.height = `${newHeight}px`;
    }
}

function stopLessonCreation(e) {
    if (!isCreatingLesson) return;

    const finalHeight = creationPreviewElement.offsetHeight;
    
    document.removeEventListener('mousemove', doLessonCreation);
    document.removeEventListener('mouseup', stopLessonCreation);
    isCreatingLesson = false;
    creationPreviewElement.remove(); // 移除預覽元素

    // 如果拖曳距離太短 (小於 15px)，視為一般點擊，只帶入日期
    if (finalHeight < 15) {
        showAddLessonModal(creationStartDate);
        return;
    }

    // 計算開始時間和時長
    const startPixel = parseFloat(creationPreviewElement.style.top);
    const startTotalMinutes = Math.round(startPixel / (calendarView === 'month' ? PIXELS_PER_MINUTE : PIXELS_PER_MINUTE_GRID) / 15) * 15;
    const duration = Math.round(finalHeight / (calendarView === 'month' ? PIXELS_PER_MINUTE : PIXELS_PER_MINUTE_GRID) / 15) * 15;
    const startTime = `${Math.floor(startTotalMinutes / 60).toString().padStart(2, '0')}:${(startTotalMinutes % 60).toString().padStart(2, '0')}`;

    showAddLessonModal(creationStartDate, startTime, duration);
}

// Modified renderStudentList to include search and filter logic
function renderStudentList() {
    const studentList = document.getElementById('studentList');
    const lessonStudentSelect = document.getElementById('lessonStudent');
    
    studentList.innerHTML = ''; // Clear current list
    lessonStudentSelect.innerHTML = '<option value="">請選擇學生</option>'; // Clear current options

    const searchTerm = studentSearchInput.value.toLowerCase();
    const filterLocation = studentLocationFilter.value.toLowerCase();
    const filterStatus = studentStatusFilter.value; // 'active', 'graduated', 'all'

    const filteredStudents = students.filter(student => {
        const matchesName = student.name.toLowerCase().includes(searchTerm);
        const matchesLocation = filterLocation === '' || (student.location && student.location.toLowerCase().includes(filterLocation));
        const matchesStatus = filterStatus === 'all' || student.status === filterStatus;

        return matchesName && matchesLocation && matchesStatus;
    });
    
    filteredStudents.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        if (student.status === 'graduated') {
            studentItem.classList.add('graduated-student');
        }

        const avatarUrl = student.avatar_url ? `${API_BASE_URL}${student.avatar_url}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff`; // 使用預設圖示服務
        const actionButtonText = student.status === 'active' ? '標記為畢業生' : '永久刪除';
        const actionButtonClass = student.status === 'active' ? 'btn-danger' : 'btn-danger-permanent'; // Add a new class for permanent delete button if needed for styling

        studentItem.innerHTML = `
            <img src="${avatarUrl}" alt="${student.name} 的大頭貼" class="student-avatar">
            <div class="student-item-details">
                <div class="student-name">${student.name}</div>
                <div class="student-info">📧 ${student.email || '未設定'}</div>
                <div class="student-info">📱 ${student.phone || '未設定'}</div>
            </div>
            <div class="student-actions" style="text-align: right;">
                 <button class="btn ${actionButtonClass} btn-sm student-action-btn" data-student-id="${student.id}">
                     🗑️ ${actionButtonText}
                 </button>
            </div>
        `;
        
        studentItem.addEventListener('click', () => editStudent(student.id));
        studentList.appendChild(studentItem);
        
        // Only add active students to the lesson student select dropdown
        if (student.status === 'active') {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            lessonStudentSelect.appendChild(option);
        }
    });

    // Add event listeners for the new action buttons (archive/delete)
    document.querySelectorAll('.student-action-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering editStudent when clicking the button
            const studentId = parseInt(e.currentTarget.dataset.studentId);
            const student = students.find(s => s.id === studentId);

            if (student) {
                if (student.status === 'active') {
                    markStudentAsGraduated(studentId);
                } else if (student.status === 'graduated') {
                    permanentlyDeleteStudent(studentId);
                }
            }
        });
    });
}

function updateStats() {
    const activeStudents = students.filter(s => s.status === 'active').length;
    const graduatedStudents = students.filter(s => s.status === 'graduated').length;

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weeklyLessons = lessons.filter(lesson => {
        // Only count lessons for active students and not cancelled
        const student = students.find(s => s.id === lesson.studentId);
        return lesson.date >= weekStart && lesson.date <= weekEnd && lesson.status !== 'cancelled' && student && student.status === 'active';
    }).length;
    
    document.getElementById('totalStudents').textContent = activeStudents; // Now shows active students
    document.getElementById('graduatedStudents').textContent = graduatedStudents; // New stat
    document.getElementById('weeklyLessons').textContent = weeklyLessons;
}

// Populate the location filter dropdown with unique locations from students
function populateLocationFilter() {
    const currentSelection = studentLocationFilter.value; // Store current selection
    studentLocationFilter.innerHTML = '<option value="">所有地點</option>'; // Reset options

    const uniqueLocations = new Set();
    students.forEach(student => {
        if (student.location && student.location.trim() !== '') {
            uniqueLocations.add(student.location.trim());
        }
    });

    // Sort locations alphabetically and add to dropdown
    Array.from(uniqueLocations).sort().forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        studentLocationFilter.appendChild(option);
    });

    // Restore previous selection if it still exists
    if (currentSelection && Array.from(uniqueLocations).includes(currentSelection)) {
        studentLocationFilter.value = currentSelection;
    }
}

function showAddStudentModal() {
    editingStudentId = null;
    document.getElementById('studentModalTitle').textContent = '新增學生';
    document.getElementById('studentForm').reset();
    document.getElementById('studentModal').classList.add('active');
}

function editStudent(studentId) {
    editingStudentId = studentId;
    const student = students.find(s => s.id === studentId);
    
    if (student) {
        document.getElementById('studentModalTitle').textContent = '編輯學生';
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentLocation').value = student.location || '';
        document.getElementById('studentPlatform').value = student.platform || '';
        document.getElementById('studentNotes').value = student.notes || '';
        document.getElementById('studentStatus').value = student.status; // 載入學生目前的狀態
        document.getElementById('studentAvatar').value = ''; // 清除舊的檔案選擇
        document.getElementById('studentModal').classList.add('active');
    }
}

async function saveStudent() {
    const formData = {
        name: document.getElementById('studentName').value,
        email: document.getElementById('studentEmail').value,
        phone: document.getElementById('studentPhone').value,
        location: document.getElementById('studentLocation').value,
        platform: document.getElementById('studentPlatform').value,
        notes: document.getElementById('studentNotes').value,
        status: document.getElementById('studentStatus').value // 取得表單中的狀態值
    };

    const url = editingStudentId ? `${API_BASE_URL}/api/students/${editingStudentId}` : `${API_BASE_URL}/api/students`;
    const method = editingStudentId ? 'PUT' : 'POST';

    try {
        const savedStudent = await authenticatedFetch(url, { method, body: JSON.stringify(formData) });

        const studentIdToUpdate = editingStudentId || savedStudent.id;
        
        // --- New: Handle Avatar Upload ---
        const avatarInput = document.getElementById('studentAvatar');
        const avatarFile = avatarInput.files[0];

        if (avatarFile && studentIdToUpdate) {
            await uploadAvatar(studentIdToUpdate, avatarFile);
        }

        showNotification(`✅ 學生資料已儲存`, 'success');

        closeModal('studentModal');
        // 重新從伺服器載入資料以確保同步
        await loadStudentsFromServer();
        renderStudentList();
        updateStats();
        populateLocationFilter();

    } catch (error) {
        console.error('儲存學生失敗:', error);
        showPersistentError(`儲存學生失敗: ${error.message}`);
    }
}

async function uploadAvatar(studentId, file) {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
        await authenticatedFetch(`${API_BASE_URL}/api/students/${studentId}/upload-avatar`, { method: 'POST', body: formData });
        showNotification('✅ 大頭貼已更新', 'success');
    } catch (error) {
        console.error('大頭貼上傳失敗:', error);
        showPersistentError(`大頭貼上傳失敗: ${error.message}`);
    }
}

function showAddLessonModal(selectedDate = null, startTime = null, duration = null) {
    editingLessonId = null;
    document.getElementById('lessonModalTitle').textContent = '新增課程';
    document.getElementById('lessonForm').reset();
    
    if (selectedDate) {
        document.getElementById('lessonDate').value = selectedDate.toISOString().split('T')[0];
    }

    // 預填拖曳產生的時間和時長
    if (startTime) {
        document.getElementById('lessonTime').value = startTime;
    }

    if (duration) {
        document.getElementById('lessonDuration').value = duration;
    }
    
    document.getElementById('lessonModal').classList.add('active');
}

function editLesson(lessonId) {
    editingLessonId = lessonId;
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (lesson) {
        document.getElementById('lessonModalTitle').textContent = '編輯課程';
        document.getElementById('lessonStudent').value = lesson.studentId;
        document.getElementById('lessonDate').value = lesson.date.toISOString().split('T')[0];
        document.getElementById('lessonTime').value = lesson.time;
        document.getElementById('lessonDuration').value = lesson.duration;
        document.getElementById('lessonType').value = lesson.type;
        document.getElementById('lessonStatus').value = lesson.status;
        document.getElementById('lessonNotes').value = lesson.notes || '';
        document.getElementById('lessonModal').classList.add('active');
    }
}

// Helper function to format lesson data for the backend
function formatLessonForServer(lessonData) {
    // Convert date to YYYY-MM-DD format
    const date = new Date(lessonData.date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return {
        student_id: lessonData.studentId,
        lesson_date: `${year}-${month}-${day}`,
        lesson_time: lessonData.time,
        duration_minutes: lessonData.duration,
        lesson_type: lessonData.type,
        status: lessonData.status,
        notes: lessonData.notes,
    };
}

// Helper function to update a lesson on the server
async function updateLessonOnServer(lessonId, lessonData) {
    const serverData = formatLessonForServer(lessonData);
    return await authenticatedFetch(`${API_BASE_URL}/api/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(serverData) });
}

async function saveLesson() {
    const lessonData = {
        studentId: parseInt(document.getElementById('lessonStudent').value, 10),
        date: new Date(document.getElementById('lessonDate').value),
        time: document.getElementById('lessonTime').value,
        duration: parseInt(document.getElementById('lessonDuration').value, 10),
        type: document.getElementById('lessonType').value,
        status: document.getElementById('lessonStatus').value,
        notes: document.getElementById('lessonNotes').value,
    };

    try {
        if (editingLessonId) {
            // 更新現有課程
            await updateLessonOnServer(editingLessonId, lessonData);
            showNotification('✅ 課程已更新', 'success');
        } else {
            // 新增課程
            const serverData = formatLessonForServer(lessonData);
            await authenticatedFetch(`${API_BASE_URL}/api/lessons`, { method: 'POST', body: JSON.stringify(serverData) });

            // 如果是重複課程，創建後續課程
            if (document.getElementById('isRecurring').checked) {
                await createRecurringLessons(lessonData);
            }
            showNotification('✅ 新課程已新增', 'success');
        }

        closeModal('lessonModal');
        await loadLessonsFromServer();
        renderActiveView();
        updateStats();
        scheduleNotifications();
    } catch (error) {
        console.error('儲存課程失敗:', error);
        showPersistentError(`儲存課程失敗: ${error.message}`);
    }
}

async function createRecurringLessons(baseLessonData) {
    const lessonPromises = [];
    for (let i = 1; i <= 8; i++) { // 創建未來8週的重複課程
        const recurringDate = new Date(baseLessonData.date);
        recurringDate.setDate(recurringDate.getDate() + (i * 7));
        const recurringLessonData = { ...baseLessonData, date: recurringDate };
        const serverData = formatLessonForServer(recurringLessonData);

        lessonPromises.push(authenticatedFetch(`${API_BASE_URL}/api/lessons`, { method: 'POST', body: JSON.stringify(serverData) }));
    }
    await Promise.all(lessonPromises);
    showNotification('✅ 已建立重複課程 (8週)', 'success');
}

async function deleteLesson(lessonId) {
    if (confirm('確定要刪除這個課程嗎？')) {
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/lessons/${lessonId}`, { method: 'DELETE' });
            // 從本地陣列移除
            lessons = lessons.filter(l => l.id !== lessonId);
            renderActiveView();
            updateStats();
            scheduleNotifications();
            showNotification('✅ 課程已刪除', 'success');
        } catch (error) {
            console.error('刪除課程失敗:', error);
            showPersistentError(`刪除課程失敗: ${error.message}`);
        }
    }
}

// New function to mark student as graduated
async function markStudentAsGraduated(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student && confirm(`確定要將學生 ${student.name} 標記為畢業生嗎？`)) {
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/students/${studentId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'graduated' }) });

            student.status = 'graduated';
            renderStudentList();
            updateStats();
            scheduleNotifications();
            showNotification(`✅ 學生 ${student.name} 已標記為畢業生`, 'success');
        } catch (error) {
            console.error('標記畢業生失敗:', error);
            showPersistentError(`標記畢業生失敗: ${error.message}`);
        }
    }
}

// New function for permanent deletion of graduated students
async function permanentlyDeleteStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student && confirm(`確定要永久刪除學生 ${student.name} 嗎？此操作不可逆，相關課程也會被刪除。`)) {
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/students/${studentId}`, { method: 'DELETE' });
            // 學生刪除後，後端會自動刪除關聯課程 (ON DELETE CASCADE)
            // 我們只需要重新從伺服器載入學生和課程資料即可
            await loadStudentsFromServer();
            await loadLessonsFromServer();

            renderStudentList();
            renderActiveView();
            updateStats();
            populateLocationFilter();
            scheduleNotifications();
            showNotification(`✅ 學生 ${student.name} 已永久刪除`, 'success');
        } catch (error) {
            console.error('永久刪除學生失敗:', error);
            showPersistentError(`永久刪除學生失敗: ${error.message}`);
        }
    }
}

function scheduleNotifications() {
    // 清除所有舊的通知排程
    notificationTimeouts.forEach(id => clearTimeout(id));
    notificationTimeouts = [];

    const now = new Date();
    const upcomingLessons = lessons.filter(lesson => {
        const lessonDateTime = new Date(lesson.date);
        const [hours, minutes] = lesson.time.split(':');
        lessonDateTime.setHours(parseInt(hours), parseInt(minutes));
        // 只為在校生的正常課程排程
        const student = students.find(s => s.id === lesson.studentId);
        return lessonDateTime > now && lesson.status !== 'cancelled' && student && student.status === 'active';
    });

    upcomingLessons.forEach(lesson => {
        const student = students.find(s => s.id === lesson.studentId);
        if (!student) return;

        const lessonDateTime = new Date(lesson.date);
        const [hours, minutes] = lesson.time.split(':');
        lessonDateTime.setHours(parseInt(hours), parseInt(minutes));

        // 計算提醒時間
        const reminders = [
            { time: new Date(lessonDateTime.getTime() - 24 * 60 * 60 * 1000), label: '明天' },
            { time: new Date(lessonDateTime.getTime() - 60 * 60 * 1000), label: '1小時後' },
            { time: new Date(lessonDateTime.getTime() - 30 * 60 * 1000), label: '30分鐘後' },
            { time: new Date(lessonDateTime.getTime() - 10 * 60 * 1000), label: '10分鐘後' }
        ];

        reminders.forEach(reminder => {
            if (reminder.time > now) {
                const timeoutId = setTimeout(() => {
                    showLessonReminder(lesson, student, reminder.label);
                }, reminder.time.getTime() - now.getTime());
                // 儲存 timeout ID 以便後續清除
                notificationTimeouts.push(timeoutId);
            }
        });
    });
}

function showLessonReminder(lesson, student, timeLabel) {
    const typeText = lesson.type === 'online' ? '線上課程' : '實體課程';
    const message = `${timeLabel}有${typeText}：${student.name} - ${lesson.time}`;
    
    // 網站推播通知
    if (document.getElementById('webNotif').checked) {
        showNotification(message, 'info', 10000);
    }
    
    // 模擬 Email 和 Line 通知（實際應用中需要後端支援）
    if (document.getElementById('emailNotif').checked) {
        console.log(`Email 通知: ${message}`);
    }
    
    if (document.getElementById('lineNotif').checked) {
        console.log(`Line 通知: ${message}`);
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Add icons for better distinction
    let icon = '';
    switch (type) {
        case 'success':
            icon = '✅ ';
            break;
        case 'error':
            icon = '❌ ';
            break;
        case 'info':
        default:
            icon = 'ℹ️ ';
            break;
    }

    notification.textContent = icon + message;
    document.body.appendChild(notification);

    // Trigger the show animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10); // Small delay to ensure transition is applied

    // Hide and remove the notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500); // Match transition duration
    }, duration);
}

function showPersistentError(message) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    
    const text = document.createElement('span');
    text.textContent = `❌ ${message}`;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', '關閉錯誤訊息');
    closeButton.onclick = () => {
        errorDiv.remove();
    };
    
    errorDiv.appendChild(text);
    errorDiv.appendChild(closeButton);
    errorContainer.appendChild(errorDiv);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function navigateCalendar(direction) { // direction is -1 for previous, 1 for next
    if (calendarView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + direction);
    } else if (calendarView === 'week') {
        currentDate.setDate(currentDate.getDate() + (7 * direction));
    } else if (calendarView === 'today') {
        currentDate.setDate(currentDate.getDate() + direction);
    }
    renderActiveView();
}

function goToToday() {
    currentDate = new Date();
    renderActiveView();
}

function renderTimeGridView(dates) {
    const calendar = document.getElementById('calendar');
    const title = document.getElementById('calendarTitle');
    calendar.innerHTML = '';
    calendar.style.gridTemplateColumns = '60px 1fr'; // 時間軸 + 日期網格
    calendar.style.gridTemplateRows = 'auto 1fr'; // 標頭 + 內容

    // 1. 建立日期標頭
    const headerContainer = document.createElement('div'); // 佔位格
    calendar.appendChild(headerContainer);

    const daysHeaderContainer = document.createElement('div');
    daysHeaderContainer.className = 'time-grid-days';
    daysHeaderContainer.style.gridTemplateColumns = `repeat(${dates.length}, 1fr)`;
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    dates.forEach(date => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.innerHTML = `${weekdays[date.getDay()]} <span class="day-number">${date.getDate()}</span>`;
        if (date.toDateString() === new Date().toDateString()) {
            dayHeader.classList.add('today');
        }
        daysHeaderContainer.appendChild(dayHeader);
    });
    calendar.appendChild(daysHeaderContainer);

    // 2. 建立時間軸
    const timeAxis = document.createElement('div');
    timeAxis.className = 'time-axis';
    for (let i = 0; i < 24; i++) {
        const hourSlot = document.createElement('div');
        hourSlot.className = 'time-slot';
        hourSlot.textContent = `${i.toString().padStart(2, '0')}:00`;
        timeAxis.appendChild(hourSlot);

        const halfHourSlot = document.createElement('div');
        halfHourSlot.className = 'time-slot';
        timeAxis.appendChild(halfHourSlot);
    }
    calendar.appendChild(timeAxis);

    // 3. 建立日期內容網格
    const daysContentContainer = document.createElement('div');
    daysContentContainer.className = 'time-grid-days';
    daysContentContainer.style.gridTemplateColumns = `repeat(${dates.length}, 1fr)`;
    dates.forEach(date => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'time-grid-day-column';

        const dayLessons = lessons.filter(l => l.date.toDateString() === date.toDateString());
        const laidOutLessons = layoutDayLessons(dayLessons);

        laidOutLessons.forEach(lesson => {
            const lessonElement = createLessonElement(lesson);
            const [startHour, startMinute] = lesson.time.split(':').map(Number);
            const topPosition = (startHour * 60 + startMinute) * PIXELS_PER_MINUTE_GRID;

            lessonElement.style.top = `${topPosition}px`;
            lessonElement.style.height = `${lesson.duration * PIXELS_PER_MINUTE_GRID}px`;
            lessonElement.style.left = `${lesson.left}%`;
            lessonElement.style.width = `${lesson.width}%`;
            
            dayColumn.appendChild(lessonElement);
        });
        daysContentContainer.appendChild(dayColumn);
    });
    calendar.appendChild(daysContentContainer);
}

function layoutDayLessons(dayLessons) {
    if (!dayLessons || dayLessons.length === 0) return [];

    const events = dayLessons.map(lesson => {
        const [startHour, startMinute] = lesson.time.split(':').map(Number);
        const start = startHour * 60 + startMinute;
        const end = start + lesson.duration;
        return { ...lesson, start, end };
    }).sort((a, b) => a.start - b.start);

    for (const event of events) {
        let col = 0;
        let maxCol = -1;
        // 找出所有與當前事件重疊的事件
        const overlappingEvents = events.filter(e => e !== event && e.start < event.end && e.end > event.start);
        
        // 找出一個可用的欄位
        while (overlappingEvents.some(e => e.col === col)) {
            col++;
        }
        event.col = col;
        maxCol = Math.max(maxCol, ...overlappingEvents.map(e => e.col || 0), col);
        event.numColumns = maxCol + 1;
    }

    for (const event of events) {
        event.width = 100 / event.numColumns;
        event.left = event.col * event.width;
    }

    return events;
}

function renderWeekView() {
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(firstDayOfWeek);
        date.setDate(date.getDate() + i);
        return date;
    });
    const lastDayOfWeek = weekDates[6];
    const title = document.getElementById('calendarTitle');
    title.textContent = `${firstDayOfWeek.getFullYear()}年${firstDayOfWeek.getMonth() + 1}月${firstDayOfWeek.getDate()}日 - ${lastDayOfWeek.getFullYear()}年${lastDayOfWeek.getMonth() + 1}月${lastDayOfWeek.getDate()}日`;
    renderTimeGridView(weekDates);
}

function renderTodayView() {
    const today = new Date();
    currentDate = today; // 確保 currentDate 是今天
    const title = document.getElementById('calendarTitle');
    title.textContent = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日`;
    renderTimeGridView([today]);
}