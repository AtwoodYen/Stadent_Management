import React, { useEffect } from 'react';

interface DebugInfoProps {
  activeTab: string;
  activeStudents: any[];
  selectedStudents: any[];
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ 
  activeTab, 
  activeStudents, 
  selectedStudents 
}) => {
  // 組件掛載時記錄
  useEffect(() => {
    console.log('=== DebugInfo 組件已掛載 ===');
    console.log('activeTab:', activeTab);
    console.log('activeStudents:', activeStudents);
    console.log('selectedStudents:', selectedStudents);
    
    return () => {
      console.log('=== DebugInfo 組件將卸載 ===');
    };
  }, [activeTab, activeStudents, selectedStudents]);

  // 點擊處理函數
  const handleClick = (e: React.MouseEvent) => {
    console.log('=== 點擊事件觸發 ===');
    console.log('事件目標:', e.target);
    console.log('當前 activeTab:', activeTab);
    console.log('activeStudents 數量:', activeStudents.length);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        maxWidth: '300px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
      onClick={handleClick}
    >
      <h3 style={{ margin: '0 0 10px 0' }}>除錯資訊</h3>
      <div style={{ marginBottom: '5px' }}>當前頁籤: <strong>{activeTab}</strong></div>
      <div style={{ marginBottom: '5px' }}>學生數量: <strong>{activeStudents.length}</strong></div>
      <div style={{ marginBottom: '5px' }}>已選學生: <strong>{selectedStudents.length}</strong></div>
      <button 
        onClick={() => console.log('測試按鈕點擊')}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        測試按鈕
      </button>
    </div>
  );
};

export default DebugInfo;
