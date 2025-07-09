// 學生 class_type 能力管理 service

export interface StudentClassTypeAbility {
  id: number;
  student_id: number;
  student_name: string;
  class_type: string;
  class_type_name: string;
  ability_level: string;
  assessment_date: string;
  notes?: string;
}

export interface CreateStudentClassTypeAbility {
  student_id: number;
  class_type: string;
  ability_level: string;
  assessment_date?: string;
  notes?: string;
}

export interface UpdateStudentClassTypeAbility {
  ability_level: string;
  assessment_date: string;
  notes?: string;
}

// 查詢學生 class_type 能力
export async function fetchStudentClassTypeAbilities(params: { student_id?: number|string, class_type?: string } = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(`/api/student-class-type-abilities${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('查詢失敗');
  return res.json() as Promise<StudentClassTypeAbility[]>;
}

// 新增學生 class_type 能力
export async function createStudentClassTypeAbility(data: CreateStudentClassTypeAbility) {
  const res = await fetch('/api/student-class-type-abilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('新增失敗');
  return res.json() as Promise<StudentClassTypeAbility>;
}

// 更新學生 class_type 能力
export async function updateStudentClassTypeAbility(id: number, data: UpdateStudentClassTypeAbility) {
  const res = await fetch(`/api/student-class-type-abilities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('更新失敗');
  return res.json() as Promise<StudentClassTypeAbility>;
}

// 刪除學生 class_type 能力
export async function deleteStudentClassTypeAbility(id: number) {
  const res = await fetch(`/api/student-class-type-abilities/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('刪除失敗');
} 