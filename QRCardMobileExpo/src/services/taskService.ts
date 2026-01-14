import {supabase} from './supabase';
import type {Task, TaskStatus, TaskPriority} from '../types';
import * as FileSystem from 'expo-file-system/legacy';

export interface TaskFormData {
  employee_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  region_id?: string | null;
  checklist_items?: string[];
  checklist_completed?: string[];
  address?: string | null;
  attachments?: string[];
}

export async function getTasks(
  companyId?: string,
  employeeId?: string,
  regionId?: string,
): Promise<Task[]> {
  try {
    let query = supabase.from('tasks').select('*').order('created_at', {ascending: false});

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (regionId) {
      query = query.eq('region_id', regionId);
    }

    const {data, error} = await query;

    if (error) throw error;
    
    // Parse checklist items, attachments from JSON strings
    const tasks = (data || []).map((task: any) => {
      if (task.checklist_items && typeof task.checklist_items === 'string') {
        try {
          task.checklist_items = JSON.parse(task.checklist_items);
        } catch (e) {
          task.checklist_items = [];
        }
      }
      if (task.checklist_completed && typeof task.checklist_completed === 'string') {
        try {
          task.checklist_completed = JSON.parse(task.checklist_completed);
        } catch (e) {
          task.checklist_completed = [];
        }
      }
      if (task.attachments && typeof task.attachments === 'string') {
        try {
          task.attachments = JSON.parse(task.attachments);
        } catch (e) {
          task.attachments = [];
        }
      }
      // Ensure attachments is always an array
      if (!task.attachments || !Array.isArray(task.attachments)) {
        task.attachments = [];
      }
      return task;
    });
    
    return tasks;
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
    // assigned_by must be a valid auth.users id (NOT NULL constraint)
    // If no session, use company_id as fallback (company_id is also auth.users(id))
    const assignedBy = session?.session?.user?.id || companyId;

    // Get employee's region_id if not provided
    let regionId = taskData.region_id;
    if (!regionId || regionId === '') {
      const {data: employee} = await supabase
        .from('employees')
        .select('region_id')
        .eq('id', taskData.employee_id)
        .single();
      if (employee) {
        regionId = employee.region_id;
      }
    }

    // Ensure regionId is not empty string
    if (regionId === '') {
      regionId = null;
    }

    // First create the task without attachments to get the task ID
    const {data: newTask, error: createError} = await supabase
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
        region_id: regionId,
        checklist_items: taskData.checklist_items && taskData.checklist_items.length > 0 
          ? JSON.stringify(taskData.checklist_items) 
          : '[]',
        checklist_completed: taskData.checklist_completed && taskData.checklist_completed.length > 0
          ? JSON.stringify(taskData.checklist_completed)
          : '[]',
        address: taskData.address || null,
        attachments: [], // Will be updated after uploading
      })
      .select()
      .single();

    if (createError) throw createError;

    // Upload attachments to Supabase Storage if they are local URIs
    let uploadedAttachments: string[] = [];
    if (taskData.attachments && taskData.attachments.length > 0 && newTask) {
      for (const attachment of taskData.attachments) {
        // If it's a local URI (file://), upload it
        if (attachment.startsWith('file://') || attachment.startsWith('content://') || attachment.startsWith('ph://')) {
          const uploadedUrl = await uploadTaskAttachment(attachment, newTask.id, companyId);
          if (uploadedUrl) {
            uploadedAttachments.push(uploadedUrl);
          } else {
            console.warn('Failed to upload attachment:', attachment);
            // Keep the original URI as fallback
            uploadedAttachments.push(attachment);
          }
        } else {
          // Already a URL, keep it as is
          uploadedAttachments.push(attachment);
        }
      }

      // Update task with uploaded attachments
      if (uploadedAttachments.length > 0) {
        const {error: updateError} = await supabase
          .from('tasks')
          .update({ attachments: uploadedAttachments })
          .eq('id', newTask.id);
        
        if (updateError) {
          console.error('Error updating task with attachments:', updateError);
        } else {
          newTask.attachments = uploadedAttachments;
        }
      }
    }

    const {data, error} = { data: newTask, error: null };

    if (error) throw error;
    
    // Parse checklist items from JSON
    if (data.checklist_items && typeof data.checklist_items === 'string') {
      try {
        data.checklist_items = JSON.parse(data.checklist_items);
      } catch (e) {
        data.checklist_items = [];
      }
    }
    if (data.checklist_completed && typeof data.checklist_completed === 'string') {
      try {
        data.checklist_completed = JSON.parse(data.checklist_completed);
      } catch (e) {
        data.checklist_completed = [];
      }
    }
    
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
    // Remove employee_id from updateData if present (it shouldn't be updated)
    delete updateData.employee_id;
    if (taskData.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    // region_id can be updated if provided
    
    // Convert checklist arrays to JSON strings if they exist
    if (updateData.checklist_items !== undefined) {
      updateData.checklist_items = Array.isArray(updateData.checklist_items) 
        ? JSON.stringify(updateData.checklist_items) 
        : updateData.checklist_items;
    }
    if (updateData.checklist_completed !== undefined) {
      updateData.checklist_completed = Array.isArray(updateData.checklist_completed) 
        ? JSON.stringify(updateData.checklist_completed) 
        : updateData.checklist_completed;
    }

    // Upload new attachments if they are local URIs
    if (updateData.attachments && Array.isArray(updateData.attachments)) {
      const uploadedAttachments: string[] = [];
      
      // Get company_id from the task
      const {data: taskData} = await supabase
        .from('tasks')
        .select('company_id')
        .eq('id', taskId)
        .single();
      
      const companyId = taskData?.company_id;
      
      if (companyId) {
        for (const attachment of updateData.attachments) {
          // If it's a local URI, upload it
          if (attachment.startsWith('file://') || attachment.startsWith('content://') || attachment.startsWith('ph://')) {
            const uploadedUrl = await uploadTaskAttachment(attachment, taskId, companyId);
            if (uploadedUrl) {
              uploadedAttachments.push(uploadedUrl);
            } else {
              console.warn('Failed to upload attachment:', attachment);
              uploadedAttachments.push(attachment);
            }
          } else {
            // Already a URL, keep it as is
            uploadedAttachments.push(attachment);
          }
        }
        updateData.attachments = uploadedAttachments;
      }
    }

    const {data, error} = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    
    // Parse checklist items from JSON
    if (data.checklist_items && typeof data.checklist_items === 'string') {
      try {
        data.checklist_items = JSON.parse(data.checklist_items);
      } catch (e) {
        data.checklist_items = [];
      }
    }
    if (data.checklist_completed && typeof data.checklist_completed === 'string') {
      try {
        data.checklist_completed = JSON.parse(data.checklist_completed);
      } catch (e) {
        data.checklist_completed = [];
      }
    }
    
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


export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<boolean> {
  try {
    const updateData: any = {status};
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const {error} = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating task status:', error);
    return false;
  }
}

async function uploadTaskAttachment(uri: string, taskId: string, companyId: string): Promise<string | null> {
  try {
    console.log('Uploading attachment from URI:', uri);
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      console.error('File does not exist:', uri);
      return null;
    }
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    if (!base64) {
      console.error('Failed to read file as base64');
      return null;
    }
    
    // Convert base64 string to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Get file extension and determine content type
    const uriParts = uri.split('.');
    const fileExt = uriParts.length > 1 ? uriParts[uriParts.length - 1].split('?')[0].toLowerCase() : 'bin';
    const fileName = `${taskId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `task-attachments/${companyId}/${fileName}`;

    // Determine content type based on extension
    let contentType = 'application/octet-stream';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
      contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
    } else if (fileExt === 'pdf') {
      contentType = 'application/pdf';
    } else if (['doc', 'docx'].includes(fileExt)) {
      contentType = 'application/msword';
    } else if (['xls', 'xlsx'].includes(fileExt)) {
      contentType = 'application/vnd.ms-excel';
    }

    console.log('Uploading to path:', filePath, 'Content type:', contentType, 'Size:', bytes.length);

    // Upload to Supabase Storage
    const {error: uploadError} = await supabase.storage
      .from('company-assets')
      .upload(filePath, bytes, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType,
      });

    if (uploadError) {
      console.error('Error uploading task attachment:', uploadError);
      return null;
    }

    // Get public URL
    const {data: urlData} = supabase.storage.from('company-assets').getPublicUrl(filePath);
    
    let publicUrl: string | null = null;
    if (typeof urlData === 'string') {
      publicUrl = urlData;
    } else if (urlData && typeof urlData === 'object') {
      publicUrl = (urlData as any).publicUrl || null;
    }
    
    if (!publicUrl) {
      console.error('Failed to get public URL for task attachment. urlData:', urlData);
      return null;
    }
    
    console.log('Successfully uploaded attachment. URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading task attachment:', error);
    return null;
  }
}

export async function getTaskStats(
  companyId?: string,
  employeeId?: string,
): Promise<{
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}> {
  try {
    let query = supabase.from('tasks').select('status, due_date');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const {data, error} = await query;

    if (error) throw error;

    const tasks = data || [];
    const now = new Date();

    return {
      total: tasks.length,
      pending: tasks.filter((t: any) => t.status === 'pending').length,
      in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
      completed: tasks.filter((t: any) => t.status === 'completed').length,
      overdue: tasks.filter((t: any) => {
        if (!t.due_date || t.status === 'completed') return false;
        return new Date(t.due_date) < now;
      }).length,
    };
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    };
  }
}
