import { supabase } from './supabase';
import type { Region, RegionFormData } from '../types';

export async function getRegionsByCompany(companyId: string): Promise<Region[]> {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching regions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
}

export async function getRegionById(regionId: string): Promise<Region | null> {
  try {
    if (!regionId) {
      return null;
    }

    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('id', regionId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

    if (error) {
      console.error('Error fetching region:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching region:', error);
    return null;
  }
}

export async function createRegion(
  companyId: string,
  regionData: RegionFormData
): Promise<Region | null> {
  try {
    const { name, description } = regionData;
    const { data, error } = await supabase
      .from('regions')
      .insert({ company_id: companyId, name, description })
      .select()
      .single();

    if (error) {
      console.error('Error creating region:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating region:', error);
    return null;
  }
}

export async function updateRegion(
  regionId: string,
  regionData: RegionFormData
): Promise<Region | null> {
  try {
    const { name, description } = regionData;
    const { data, error } = await supabase
      .from('regions')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', regionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating region:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating region:', error);
    return null;
  }
}

export async function deleteRegion(regionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', regionId);

    if (error) {
      console.error('Error deleting region:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting region:', error);
    return false;
  }
}
