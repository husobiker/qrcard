-- Allow employees to update their own appointments via RPC function
-- Since employees don't use Supabase auth, we need an RPC function

-- Create RPC function for employees to update appointment status
CREATE OR REPLACE FUNCTION update_appointment_status_by_employee(
  appointment_id UUID,
  employee_id_param UUID,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the appointment belongs to the employee
  IF NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE id = appointment_id
    AND employee_id = employee_id_param
  ) THEN
    RETURN FALSE;
  END IF;

  -- Update the appointment status
  UPDATE appointments
  SET status = new_status,
      updated_at = NOW()
  WHERE id = appointment_id
    AND employee_id = employee_id_param;

  RETURN TRUE;
END;
$$;

