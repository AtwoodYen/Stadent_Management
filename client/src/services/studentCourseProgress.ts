// 學生課程能力進度查詢 service
export async function fetchStudentCourseProgress(params: { student_id?: number|string, course_id?: number|string } = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(`/api/student-course-progress${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('查詢失敗');
  return res.json();
} 