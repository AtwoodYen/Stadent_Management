const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'S3cr3tK3y-f0r-My-Tut0r1ng-App-!@#$'; // 您的 API Key

// 用於存放圖表實例，以便在更新前銷毀
let monthlyChart = null;
let typesChart = null;
let topStudentsChart = null;

async function authenticatedFetch(url, options = {}) {
    const headers = {
        ...options.headers,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '無法解析的伺服器錯誤' }));
        throw new Error(errorData.error || `HTTP 錯誤! 狀態: ${response.status}`);
    }
    return response.json();
}

async function loadDashboardData(startDate, endDate) {
    try {
        let url = `${API_BASE_URL}/api/stats/dashboard`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const stats = await authenticatedFetch(url);
        initMonthlyLessonsChart(stats.monthlyLessons);
        initLessonTypesChart(stats.lessonTypes);
        initTopStudentsChart(stats.topStudents);
    } catch (error) {
        console.error('無法載入儀表板數據:', error);
        alert('無法載入儀表板數據，請檢查後端伺服器是否正常運行。');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const startDateInput = document.getElementById('startDateFilter');
    const endDateInput = document.getElementById('endDateFilter');
    const filterBtn = document.getElementById('filterBtn');

    // 設定預設日期 (例如：本月)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];

    // 頁面載入時，使用預設日期進行初次載入
    loadDashboardData(startDateInput.value, endDateInput.value);

    // 為篩選按鈕新增點擊事件
    filterBtn.addEventListener('click', () => {
        loadDashboardData(startDateInput.value, endDateInput.value);
    });
});

function initMonthlyLessonsChart(data) {
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    const ctx = document.getElementById('monthlyLessonsChart').getContext('2d');
    const labels = data.map(item => item.month);
    const values = data.map(item => item.lesson_count);

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '課程數量',
                data: values,
                borderColor: 'rgba(66, 153, 225, 1)',
                backgroundColor: 'rgba(66, 153, 225, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initLessonTypesChart(data) {
    if (typesChart) {
        typesChart.destroy();
    }
    const ctx = document.getElementById('lessonTypesChart').getContext('2d');
    const labels = data.map(item => item.lesson_type === 'online' ? '線上課' : '實體課');
    const values = data.map(item => item.count);

    typesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: '課程類型',
                data: values,
                backgroundColor: [
                    'rgba(72, 187, 120, 0.8)',
                    'rgba(66, 153, 225, 0.8)',
                ],
                borderColor: [
                    'rgba(72, 187, 120, 1)',
                    'rgba(66, 153, 225, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
        }
    });
}

function initTopStudentsChart(data) {
    if (topStudentsChart) {
        topStudentsChart.destroy();
    }
    const ctx = document.getElementById('topStudentsChart').getContext('2d');
    const labels = data.map(item => item.name);
    const values = data.map(item => item.lesson_count);

    topStudentsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '上課次數',
                data: values,
                backgroundColor: 'rgba(237, 137, 54, 0.8)',
                borderColor: 'rgba(237, 137, 54, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // 讓長條圖變為水平，方便閱讀學生姓名
        }
    });
}