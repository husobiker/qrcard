import { supabase } from './supabase';
import type { Role, RolePermission, RoleFormData } from '../types';

// Available pages for permissions
export const AVAILABLE_PAGES = [
  'Dashboard',
  'Employees',
  'Calendar',
  'Tasks',
  'CRM',
  'Goals',
  'Transactions',
  'Communications',
  'Commissions',
  'CallLogs',
  'Reports',
  'Vehicles',
  'Profile',
];

export async function getRolesByCompany(companyId: string): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

export async function getRoleById(roleId: string): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) {
      console.error('Error fetching role:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching role:', error);
    return null;
  }
}

export async function createRole(
  companyId: string,
  roleData: RoleFormData
): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .insert({
        company_id: companyId,
        name: roleData.name,
        description: roleData.description || null,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      return null;
    }

    // Create permissions if provided
    if (roleData.permissions && roleData.permissions.length > 0) {
      await updateRolePermissions(data.id, roleData.permissions);
    }

    return data;
  } catch (error) {
    console.error('Error creating role:', error);
    return null;
  }
}

export async function updateRole(
  roleId: string,
  roleData: RoleFormData
): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .update({
        name: roleData.name,
        description: roleData.description || null,
      } as any)
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return null;
    }

    // Update permissions if provided
    if (roleData.permissions && roleData.permissions.length > 0) {
      await updateRolePermissions(roleId, roleData.permissions);
    }

    return data;
  } catch (error) {
    console.error('Error updating role:', error);
    return null;
  }
}

export async function deleteRole(roleId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('roles').delete().eq('id', roleId);

    if (error) {
      console.error('Error deleting role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting role:', error);
    return false;
  }
}

export async function getRolePermissions(
  roleId: string
): Promise<RolePermission[]> {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .order('page_name', { ascending: true });

    if (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
}

export async function updateRolePermissions(
  roleId: string,
  permissions: RolePermission[]
): Promise<boolean> {
  try {
    // Delete existing permissions
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) {
      console.error('Error deleting existing permissions:', deleteError);
      return false;
    }

    // Insert new permissions
    if (permissions.length > 0) {
      const permissionsToInsert = permissions.map((perm) => ({
        role_id: roleId,
        page_name: perm.page_name,
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
      }));

      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(permissionsToInsert as any);

      if (insertError) {
        console.error('Error inserting permissions:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return false;
  }
}

export async function assignRoleToEmployee(
  employeeId: string,
  roleId: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('employees')
      .update({ role_id: roleId } as any)
      .eq('id', employeeId);

    if (error) {
      console.error('Error assigning role to employee:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error assigning role to employee:', error);
    return false;
  }
}

export async function getEmployeeRole(employeeId: string): Promise<Role | null> {
  try {
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('role_id')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee?.role_id) {
      return null;
    }

    return await getRoleById(employee.role_id);
  } catch (error) {
    console.error('Error fetching employee role:', error);
    return null;
  }
}
