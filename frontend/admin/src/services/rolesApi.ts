import api from "../utils/axiosConfig";

export async function assignRoles(teacherId: string, roles: string[]) {
  const { data } = await api.post("/roles/assign", {
    teacher_id: teacherId,
    roles,
  });
  return data;
}
