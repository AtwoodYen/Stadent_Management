/**
 * 學制顏色系統
 * 使用同一色系（藍色系）但不同深淺來區分不同學制
 */

export interface EducationLevelColors {
  backgroundColor: string;
  color: string;
  borderColor: string;
}

export const getEducationLevelColors = (educationLevel: string): EducationLevelColors => {
  switch (educationLevel) {
    case '國小':
      return {
        backgroundColor: '#e3f2fd', // 最淺的藍色
        color: '#1565c0',           // 深藍色文字
        borderColor: '#1565c0'      // 深藍色邊框
      };
    case '國中':
      return {
        backgroundColor: '#bbdefb', // 淺藍色
        color: '#1976d2',           // 中深藍色文字
        borderColor: '#1976d2'      // 中深藍色邊框
      };
    case '高中':
      return {
        backgroundColor: '#90caf9', // 中藍色
        color: '#0d47a1',           // 深藍色文字
        borderColor: '#0d47a1'      // 深藍色邊框
      };
    case '大學':
      return {
        backgroundColor: '#64b5f6', // 較深藍色
        color: '#0d47a1',           // 深藍色文字
        borderColor: '#0d47a1'      // 深藍色邊框
      };
    case '在職':
      return {
        backgroundColor: '#42a5f5', // 最深的藍色
        color: '#ffffff',           // 白色文字
        borderColor: '#1976d2'      // 藍色邊框
      };
    default:
      return {
        backgroundColor: '#f5f5f5', // 預設灰色
        color: '#757575',           // 預設深灰色文字
        borderColor: '#e0e0e0'      // 預設淺灰色邊框
      };
  }
}; 