import React, { useState } from 'react';
import '../styles/tutoring.css';

const TutorManagerPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'月' | '週' | '日'>('月');
  
  // 根據當前視圖返回導航按鈕文字
  const getNavigationText = () => {
    switch (currentView) {
      case '月':
        return { prev: '前一月', next: '下一月' };
      case '週':
        return { prev: '上一週', next: '下一週' };
      case '日':
        return { prev: '前一天', next: '下一天' };
      default:
        return { prev: '上一頁', next: '下一頁' };
    }
  };
  
  const navText = getNavigationText();

  return (
    <>
      {/* 載入失敗覆蓋層 */}
      <div id="app-overlay" className="app-overlay">
        <div>
          <h1>⚠️ 應用程式載入失敗</h1>
          <p>請檢查您的網路連線或後端伺服器狀態，然後重新整理頁面。</p>
        </div>
      </div>

      {/* 主要容器 */}
      <div className="container">        

        {/* ---------- 內容區 ---------- */}
        <div className="main-content">
          {/* 側邊欄 */}
          <div className="sidebar">
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-number">3</div>
                <div className="stat-label">學生</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">畢業生</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">8</div>
                <div className="stat-label">本週課程</div>
              </div>
            </div>

            <div className="student-list">
              <h3>📋 學生管理</h3>
              <div id="studentList">
                {/* 示範三位學生 */}
                {[
                  { name: '王小明', email: 'ming@example.com', phone: '0912-345-678' },
                  { name: '李小華', email: 'hua@example.com', phone: '0923-456-789' },
                  { name: '張小美', email: 'mei@example.com', phone: '0934-567-890' }
                ].map((s) => (
                  <div key={s.email} className="student-item">
                    <div className="student-item-details">
                      <div className="student-name">{s.name}</div>
                      <div className="student-info">{s.email}</div>
                      <div className="student-info">{s.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn" style={{ marginTop: 10 }}>➕ 新增學生</button>
            </div>
          </div>

          {/* 日曆區域 */}
          <div className="calendar-section">
            <div className="calendar-header">
              <div className="calendar-nav">
                <button className="btn">‹ {navText.prev}</button>
                <div className="calendar-title">2025年 6月</div>
                <button className="btn">{navText.next} ›</button>
              </div>
              <div className="calendar-controls">
                <div className="btn-group" id="viewSwitcher">
                  <button 
                    className={`btn ${currentView === '月' ? 'btn-active' : ''}`}
                    onClick={() => setCurrentView('月')}
                  >
                    月
                  </button>
                  <button 
                    className={`btn ${currentView === '週' ? 'btn-active' : ''}`}
                    onClick={() => setCurrentView('週')}
                  >
                    週
                  </button>
                  <button 
                    className={`btn ${currentView === '日' ? 'btn-active' : ''}`}
                    onClick={() => setCurrentView('日')}
                  >
                    日
                  </button>
                </div>
                <button className="btn btn-secondary" style={{ marginLeft: 10 }}>今天</button>
                <button className="btn" style={{ marginLeft: 10 }}>➕ 新增課程</button>
              </div>
            </div>

            {/* 靜態月視圖表頭 + 空白網格 */}
            <div className="calendar month-view">
              {['日','一','二','三','四','五','六'].map((d) => (
                <div key={d} className="day-header">{d}</div>
              ))}
              {/* 42 個空格 (6 週)  */}
              {Array.from({ length: 42 }, (_, idx) => (
                <div key={idx} className="day">
                  <span className="date">{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorManagerPage; 