// src/services/rolesApi.ts

import api from "../utils/axiosConfig";
import type { ApiResponse } from "../types";

export interface RoleWithPermissions {
  id: string;
  name: string;
  permissions: string[];
}

export interface RolesResponse {
  roles: RoleWithPermissions[];
  master_permissions: string[];
}

export interface CreateRoleResponse {
  created: Array<{ id: string; name: string }>;
  skipped: string[];
}

export async function fetchRolesAndPermissions(): Promise<RolesResponse> {
  const { data } = await api.get<ApiResponse<RolesResponse>>("/roles");
  return data.data as RolesResponse;
}

export async function createRole(roleName: string): Promise<void> {
  await api.post<ApiResponse<CreateRoleResponse>>("/roles", { roles: [roleName] });
}

export async function assignPermissionsToRole(
  roleName: string,
  permissions: string[]
): Promise<void> {
  await api.post("/roles/assign-permissions", {
    role_name: roleName,
    permissions,
  });
}