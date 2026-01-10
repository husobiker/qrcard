import {supabase} from './supabase';
import type {Task, TaskStatus, TaskPriority} from '../types';

export interface TaskFormData {
  employee_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
}

export async function getTasks(
  companyId?: string,
  employeeId?: string,
): Promise<Task[]> {
  try {
    let query = supabase.from('tasks').select('*').order('created_at', {ascending: false});

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const {data, error} = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
}

export async function createTask(
  companyId: string,
  taskData: TaskFormData,
): Promise<Task | null> {
  try {
    const {data: session} = await supabase.auth.getSession();
    const assignedBy = session?.session?.user?.id || '';

    const {data, error} = await supabase
      .from('tasks')
      .insert({
        company_id: companyId,
        employee_id: taskData.employee_id,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
        assigned_by: assignedBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
}

export async function updateTask(
  taskId: string,
  taskData: Partial<TaskFormData>,
): Promise<Task | null> {
  try {
    const updateData: any = {...taskData};
    if (taskData.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const {data, error} = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating task:', error);
    return null;
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('tasks').delete().eq('id', taskId);
    return !error;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
}

