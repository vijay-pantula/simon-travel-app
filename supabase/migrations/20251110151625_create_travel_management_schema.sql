/*
  # Travel Management System - Initial Schema

  ## Overview
  Complete database schema for travel management system handling projects, consultants, 
  flight searches, bookings, notifications, and audit logs.

  ## New Tables

  ### 1. `projects`
  Core project information with client details and date ranges
  - `id` (uuid, primary key)
  - `client_name` (text) - Client company name
  - `start_date` (date) - Project start date
  - `end_date` (date) - Project end date
  - `status` (text) - active, completed, cancelled
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `project_rules`
  Routing, pricing, scheduling, and cabin preferences per project
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key) - Links to projects
  - `routing_preference` (text) - prefer_direct, allow_one_stop, etc
  - `allow_one_stop` (boolean)
  - `exclude_red_eyes` (boolean)
  - `max_connections` (integer)
  - `allowed_airports` (text[]) - Array of airport codes
  - `pricing_preference` (text) - cheapest, max_fare_cap, etc
  - `max_fare_cap` (numeric)
  - `baggage_included_only` (boolean)
  - `refundable_only` (boolean)
  - `advance_purchase_days` (integer)
  - `allowed_departure_start` (time)
  - `allowed_departure_end` (time)
  - `arrival_deadline` (time)
  - `blocked_days_of_week` (text[])
  - `cabin_class` (text) - economy, premium_economy, business, first
  - `preferred_carriers` (text[])
  - `blocked_carriers` (text[])
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `consultants`
  Consultant/traveler profiles with preferences and loyalty info
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `name` (text)
  - `email` (text, unique)
  - `home_location` (text)
  - `base_airport` (text) - Airport code
  - `passport_country` (text)
  - `date_of_birth` (date)
  - `loyalty_programs` (jsonb) - {carrier: number} pairs
  - `preferences` (jsonb) - Additional preferences
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `project_assignments`
  Links consultants to projects with travel dates
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `consultant_id` (uuid, foreign key)
  - `travel_from_location` (text)
  - `travel_to_location` (text)
  - `departure_date` (date)
  - `return_date` (date)
  - `status` (text) - pending, options_sent, selected, booked, cancelled
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `flight_searches`
  Search executions and parameters
  - `id` (uuid, primary key)
  - `assignment_id` (uuid, foreign key)
  - `search_params` (jsonb) - Full search parameters
  - `executed_at` (timestamptz)
  - `executed_by` (uuid) - User who triggered search

  ### 6. `flight_options`
  Individual flight options returned from searches
  - `id` (uuid, primary key)
  - `search_id` (uuid, foreign key)
  - `option_number` (integer) - 1, 2, or 3
  - `price` (numeric)
  - `currency` (text)
  - `cabin_class` (text)
  - `carrier` (text)
  - `carriers` (text[]) - All carriers if multi-airline
  - `layovers` (integer)
  - `total_duration_minutes` (integer)
  - `baggage_included` (boolean)
  - `refundable` (boolean)
  - `outbound_departure` (timestamptz)
  - `outbound_arrival` (timestamptz)
  - `return_departure` (timestamptz)
  - `return_arrival` (timestamptz)
  - `booking_url` (text)
  - `offer_id` (text)
  - `full_payload` (jsonb) - Complete API response
  - `created_at` (timestamptz)

  ### 7. `email_notifications`
  Email tracking and delivery status
  - `id` (uuid, primary key)
  - `assignment_id` (uuid, foreign key)
  - `consultant_id` (uuid, foreign key)
  - `recipient_email` (text)
  - `subject` (text)
  - `sent_at` (timestamptz)
  - `message_id` (text) - Provider message ID
  - `delivery_status` (text) - sent, delivered, bounced, failed
  - `opened_at` (timestamptz)
  - `flight_options_included` (uuid[]) - Array of flight_option IDs
  - `template_data` (jsonb)
  - `created_at` (timestamptz)

  ### 8. `consultant_actions`
  Consultant responses and selections
  - `id` (uuid, primary key)
  - `assignment_id` (uuid, foreign key)
  - `consultant_id` (uuid, foreign key)
  - `action_type` (text) - select, request_change, ask_support, acknowledge
  - `selected_option_id` (uuid) - Links to flight_options
  - `request_text` (text)
  - `reason` (text)
  - `modifiers` (jsonb)
  - `created_at` (timestamptz)

  ### 9. `support_tickets`
  Internal ticketing system
  - `id` (uuid, primary key)
  - `assignment_id` (uuid)
  - `consultant_id` (uuid, foreign key)
  - `title` (text)
  - `description` (text)
  - `status` (text) - open, in_progress, resolved, closed
  - `priority` (text) - low, medium, high, urgent
  - `assigned_to` (uuid) - Admin user
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `resolved_at` (timestamptz)

  ### 10. `ticket_comments`
  Comments and attachments for tickets
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `comment` (text)
  - `attachments` (jsonb) - Array of file references
  - `created_at` (timestamptz)

  ### 11. `audit_logs`
  Comprehensive activity tracking
  - `id` (uuid, primary key)
  - `project_id` (uuid)
  - `consultant_id` (uuid)
  - `assignment_id` (uuid)
  - `user_id` (uuid)
  - `action` (text) - search_executed, options_returned, email_sent, etc
  - `entity_type` (text) - project, consultant, flight, etc
  - `entity_id` (uuid)
  - `details` (jsonb) - Additional context
  - `created_at` (timestamptz)

  ### 12. `bookings`
  Final booking records (imported or via webhook)
  - `id` (uuid, primary key)
  - `assignment_id` (uuid, foreign key)
  - `selected_option_id` (uuid, foreign key)
  - `booking_reference` (text)
  - `confirmation_number` (text)
  - `booked_at` (timestamptz)
  - `booked_by` (uuid)
  - `final_price` (numeric)
  - `booking_details` (jsonb)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Consultants can only view their own data
  - Admins have full access
  - Support staff have limited access based on assignments
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project rules table
CREATE TABLE IF NOT EXISTS project_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  routing_preference text DEFAULT 'prefer_direct',
  allow_one_stop boolean DEFAULT true,
  exclude_red_eyes boolean DEFAULT true,
  max_connections integer DEFAULT 1,
  allowed_airports text[] DEFAULT '{}',
  pricing_preference text DEFAULT 'cheapest',
  max_fare_cap numeric,
  baggage_included_only boolean DEFAULT false,
  refundable_only boolean DEFAULT false,
  advance_purchase_days integer DEFAULT 14,
  allowed_departure_start time,
  allowed_departure_end time,
  arrival_deadline time,
  blocked_days_of_week text[] DEFAULT '{}',
  cabin_class text DEFAULT 'economy',
  preferred_carriers text[] DEFAULT '{}',
  blocked_carriers text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_rules ENABLE ROW LEVEL SECURITY;

-- Consultants table
CREATE TABLE IF NOT EXISTS consultants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  home_location text,
  base_airport text,
  passport_country text,
  date_of_birth date,
  loyalty_programs jsonb DEFAULT '{}',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;

-- Project assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  travel_from_location text NOT NULL,
  travel_to_location text NOT NULL,
  departure_date date NOT NULL,
  return_date date,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- Flight searches table
CREATE TABLE IF NOT EXISTS flight_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  search_params jsonb NOT NULL,
  executed_at timestamptz DEFAULT now(),
  executed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE flight_searches ENABLE ROW LEVEL SECURITY;

-- Flight options table
CREATE TABLE IF NOT EXISTS flight_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES flight_searches(id) ON DELETE CASCADE,
  option_number integer NOT NULL,
  price numeric NOT NULL,
  currency text DEFAULT 'USD',
  cabin_class text NOT NULL,
  carrier text NOT NULL,
  carriers text[] DEFAULT '{}',
  layovers integer DEFAULT 0,
  total_duration_minutes integer NOT NULL,
  baggage_included boolean DEFAULT false,
  refundable boolean DEFAULT false,
  outbound_departure timestamptz NOT NULL,
  outbound_arrival timestamptz NOT NULL,
  return_departure timestamptz,
  return_arrival timestamptz,
  booking_url text,
  offer_id text,
  full_payload jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flight_options ENABLE ROW LEVEL SECURITY;

-- Email notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  message_id text,
  delivery_status text DEFAULT 'sent',
  opened_at timestamptz,
  flight_options_included uuid[] DEFAULT '{}',
  template_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Consultant actions table
CREATE TABLE IF NOT EXISTS consultant_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  selected_option_id uuid REFERENCES flight_options(id),
  request_text text,
  reason text,
  modifiers jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultant_actions ENABLE ROW LEVEL SECURITY;

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES project_assignments(id) ON DELETE SET NULL,
  consultant_id uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Ticket comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  consultant_id uuid REFERENCES consultants(id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES project_assignments(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES flight_options(id),
  booking_reference text,
  confirmation_number text,
  booked_at timestamptz DEFAULT now(),
  booked_by uuid REFERENCES auth.users(id),
  final_price numeric,
  booking_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create admin role tracking table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Projects: Admins can do everything
DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
CREATE POLICY "Admins can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Project rules: Admins only
DROP POLICY IF EXISTS "Admins can manage project rules" ON project_rules;
CREATE POLICY "Admins can manage project rules"
  ON project_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Consultants: View own profile
DROP POLICY IF EXISTS "Consultants can view own profile" ON consultants;
CREATE POLICY "Consultants can view own profile"
  ON consultants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage consultants" ON consultants;
CREATE POLICY "Admins can manage consultants"
  ON consultants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Project assignments: Consultants see their own, admins see all
DROP POLICY IF EXISTS "Consultants can view own assignments" ON project_assignments;
CREATE POLICY "Consultants can view own assignments"
  ON project_assignments FOR SELECT
  TO authenticated
  USING (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage assignments" ON project_assignments;
CREATE POLICY "Admins can manage assignments"
  ON project_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Flight searches: View related to own assignments
DROP POLICY IF EXISTS "Users can view related flight searches" ON flight_searches;
CREATE POLICY "Users can view related flight searches"
  ON flight_searches FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT id FROM project_assignments
      WHERE consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert flight searches" ON flight_searches;
CREATE POLICY "Admins can insert flight searches"
  ON flight_searches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Flight options: View related to own assignments
DROP POLICY IF EXISTS "Users can view related flight options" ON flight_options;
CREATE POLICY "Users can view related flight options"
  ON flight_options FOR SELECT
  TO authenticated
  USING (
    search_id IN (
      SELECT id FROM flight_searches
      WHERE assignment_id IN (
        SELECT id FROM project_assignments
        WHERE consultant_id IN (
          SELECT id FROM consultants WHERE user_id = auth.uid()
        )
      )
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert flight options" ON flight_options;
CREATE POLICY "Admins can insert flight options"
  ON flight_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Email notifications: View own
DROP POLICY IF EXISTS "Users can view own notifications" ON email_notifications;
CREATE POLICY "Users can view own notifications"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert notifications" ON email_notifications;
CREATE POLICY "Admins can insert notifications"
  ON email_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Consultant actions: Users can create own actions
DROP POLICY IF EXISTS "Consultants can create own actions" ON consultant_actions;
CREATE POLICY "Consultants can create own actions"
  ON consultant_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view related actions" ON consultant_actions;
CREATE POLICY "Users can view related actions"
  ON consultant_actions FOR SELECT
  TO authenticated
  USING (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Support tickets: Users can manage own tickets
DROP POLICY IF EXISTS "Users can manage own tickets" ON support_tickets;
CREATE POLICY "Users can manage own tickets"
  ON support_tickets FOR ALL
  TO authenticated
  USING (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    ) OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Ticket comments
DROP POLICY IF EXISTS "Users can view related ticket comments" ON ticket_comments;
CREATE POLICY "Users can view related ticket comments"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      ) OR
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert ticket comments" ON ticket_comments;
CREATE POLICY "Users can insert ticket comments"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Audit logs: Admins only
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Bookings: View related to own assignments
DROP POLICY IF EXISTS "Users can view related bookings" ON bookings;
CREATE POLICY "Users can view related bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT id FROM project_assignments
      WHERE consultant_id IN (
        SELECT id FROM consultants WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- User roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_assignments_consultant ON project_assignments(consultant_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_flight_searches_assignment ON flight_searches(assignment_id);
CREATE INDEX IF NOT EXISTS idx_flight_options_search ON flight_options(search_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_consultant ON email_notifications(consultant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_consultant ON audit_logs(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultants_user ON consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);