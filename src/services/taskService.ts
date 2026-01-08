import { supabase } from '@/supabase/client'
import type { Task, TaskFormData, TaskStatus } from '@/types'

export async function createTask(
  companyId: string,
  taskData: TaskFormData
): Promise<Task | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        company_id: companyId,
        employee_id: taskData.employee_id,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
        assigned_by: user.id,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating task:', error)
    return null
  }
}

export async function getTasks(companyId?: string, employeeId?: string): Promise<Task[]> {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching task:', error)
    return null
  }
}

export async function updateTask(
  taskId: string,
  taskData: Partial<TaskFormData>
): Promise<Task | null> {
  try {
    const updateData: any = {}
    
    if (taskData.title !== undefined) updateData.title = taskData.title
    if (taskData.description !== undefined) updateData.description = taskData.description || null
    if (taskData.status !== undefined) updateData.status = taskData.status
    if (taskData.priority !== undefined) updateData.priority = taskData.priority
    if (taskData.due_date !== undefined) updateData.due_date = taskData.due_date || null
    
    if (taskData.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (taskData.status && taskData.status !== 'completed') {
      updateData.completed_at = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData as any)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating task:', error)
    return null
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<boolean> {
  try {
    const updateData: any = { status }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData as any)
      .eq('id', taskId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating task status:', error)
    return false
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting task:', error)
    return false
  }
}

export async function getTaskStats(companyId?: string, employeeId?: string): Promise<{
  total: number
  pending: number
  in_progress: number
  completed: number
  overdue: number
}> {
  try {
    let query = supabase.from('tasks').select('status, due_date')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error

    const tasks = data || []
    const now = new Date()

    return {
      total: tasks.length,
      pending: tasks.filter((t: any) => t.status === 'pending').length,
      in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
      completed: tasks.filter((t: any) => t.status === 'completed').length,
      overdue: tasks.filter((t: any) => {
        if (!t.due_date || t.status === 'completed') return false
        return new Date(t.due_date) < now
      }).length,
    }
  } catch (error) {
    console.error('Error fetching task stats:', error)
    return {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    }
  }
}


