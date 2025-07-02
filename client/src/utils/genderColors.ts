// 性別顏色系統
// 女生用淺紅底，男生用淺藍底

export interface GenderColorConfig {
  backgroundColor: string;
  color: string;
  borderColor?: string;
}

export const getGenderColors = (gender: string): GenderColorConfig => {
  switch (gender) {
    case '女':
      return {
        backgroundColor: '#fce4ec', // 淺紅色
        color: '#c2185b', // 深紅色
        borderColor: '#e91e63'
      };
    case '男':
      return {
        backgroundColor: '#e3f2fd', // 淺藍色
        color: '#1565c0', // 深藍色
        borderColor: '#2196f3'
      };
    default:
      return {
        backgroundColor: '#f5f5f5', // 預設灰色
        color: '#757575',
        borderColor: '#bdbdbd'
      };
  }
};

// 獲取性別的排序值
export const getGenderOrder = (gender: string): number => {
  const genderOrder: { [key: string]: number } = {
    '女': 1,
    '男': 2
  };
  return genderOrder[gender] || 0;
};

// 獲取所有性別選項
export const getAllGenders = (): string[] => {
  return ['女', '男'];
}; 