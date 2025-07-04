// 程度顏色系統
// 從淺到深的底色區分不同等級

export interface LevelColorConfig {
  backgroundColor: string;
  color: string;
  borderColor?: string;
}

export const getLevelColors = (level: string): LevelColorConfig => {
  switch (level) {
    case '新手':
      return {
        backgroundColor: '#e8f5e8', // 最淺的綠色
        color: '#2e7d32', // 深綠色
        borderColor: '#4caf50'
      };
    case '入門':
      return {
        backgroundColor: '#e3f2fd', // 淺藍色
        color: '#1565c0', // 深藍色
        borderColor: '#2196f3'
      };
    case '進階':
      return {
        backgroundColor: '#fff3e0', // 淺橙色
        color: '#ef6c00', // 深橙色
        borderColor: '#ff9800'
      };
    case '高階':
      return {
        backgroundColor: '#fce4ec', // 淺粉色
        color: '#c2185b', // 深粉色
        borderColor: '#e91e63'
      };
    case '精英':
      return {
        backgroundColor: '#f3e5f5', // 淺紫色
        color: '#7b1fa2', // 深紫色
        borderColor: '#9c27b0'
      };
    // 舊程度等級的對應（向後相容）
    case '初級':
      return {
        backgroundColor: '#e8f5e8', // 對應新手
        color: '#2e7d32',
        borderColor: '#4caf50'
      };
    case '中級':
      return {
        backgroundColor: '#e3f2fd', // 對應入門
        color: '#1565c0',
        borderColor: '#2196f3'
      };
    case '高級':
      return {
        backgroundColor: '#d32f2f', // 紅色背景
        color: '#ffffff', // 白色文字
        borderColor: '#d32f2f'
      };
    default:
      return {
        backgroundColor: '#f5f5f5', // 預設灰色
        color: '#757575',
        borderColor: '#bdbdbd'
      };
  }
};

// 獲取程度等級的排序值
export const getLevelOrder = (level: string): number => {
  const levelOrder: { [key: string]: number } = {
    '新手': 1,
    '入門': 2,
    '進階': 3,
    '高階': 4,
    '精英': 5,
    // 舊程度等級的對應
    '初級': 1,
    '中級': 2
  };
  return levelOrder[level] || 0;
};

// 獲取所有程度等級
export const getAllLevels = (): string[] => {
  return ['新手', '入門', '進階', '高階', '精英'];
};

// 獲取舊程度等級（向後相容）
export const getOldLevels = (): string[] => {
  return ['初級', '中級', '進階'];
}; 