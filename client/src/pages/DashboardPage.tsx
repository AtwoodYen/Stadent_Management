import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 範例數據，之後可以從 API 獲取
const dashboardData = {
  stats: [
    { title: '總學生數', value: 42, change: '+5%' },
    { title: '本月課程', value: 28, change: '+12%' },
    { title: '完成率', value: '92%', change: '+3%' },
    { title: '平均評分', value: '4.8', change: '+0.2' },
  ],
  weeklyData: [
    { name: '週一', 課程數: 4, 學生數: 6 },
    { name: '週二', 課程數: 3, 學生數: 5 },
    { name: '週三', 課程數: 5, 學生數: 8 },
    { name: '週四', 課程數: 4, 學生數: 6 },
    { name: '週五', 課程數: 6, 學生數: 9 },
    { name: '週六', 課程數: 8, 學生數: 12 },
    { name: '週日', 課程數: 2, 學生數: 3 },
  ],
};

const DashboardPage: React.FC = () => {
  console.log('DashboardPage 正在渲染');
  
  return (
    <>
      {/* 背景容器 - 確保背景延伸到內容高度 */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1
        }}
      />

      <Box>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          報表統計
        </Typography>
        
        {/* 統計卡片 */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
          gap={3}
          mb={4}
        >
          {dashboardData.stats.map((stat) => (
            <Paper key={stat.title} sx={{ p: 3 }}>
              <Typography color="textSecondary" gutterBottom>
                {stat.title}
              </Typography>
              <Box display="flex" alignItems="flex-end">
                <Typography component="span" variant="h4">
                  {stat.value}
                </Typography>
                <Typography color="success.main" sx={{ ml: 1, mb: 0.5 }}>
                  {stat.change}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* 圖表 */}
        <Box>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              每週課程統計
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={dashboardData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="課程數" fill="#667eea" name="課程數" />
                <Bar dataKey="學生數" fill="#764ba2" name="學生數" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default DashboardPage;
