-- ============================================
-- SUPABASE SETUP FOR MEDICAL POS SYSTEM
-- ============================================
-- Run these SQL commands in your Supabase SQL editor
-- to create the required database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  strength TEXT,
  quantity INTEGER DEFAULT 0,
  cost_price DECIMAL(10, 2) DEFAULT 0,
  sale_price DECIMAL(10, 2) DEFAULT 0,
  expiry DATE,
  reorder_level INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  customer_name TEXT,
  is_credit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id),
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read medicines"
  ON medicines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert data
CREATE POLICY "Allow authenticated users to insert medicines"
  ON medicines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert refunds"
  ON refunds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update data
CREATE POLICY "Allow authenticated users to update medicines"
  ON medicines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete data
CREATE POLICY "Allow authenticated users to delete medicines"
  ON medicines FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for better performance
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_expiry ON medicines(expiry);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_refunds_sale_id ON refunds(sale_id);
CREATE INDEX idx_expenses_date ON expenses(date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON medicines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- USER ROLES & APPROVAL SYSTEM
-- ============================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'pending');

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'user')
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(current_setting('app.current_user_id', true), 'admin'));

CREATE POLICY "System can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(current_setting('app.current_user_id', true), 'admin'))
  WITH CHECK (public.has_role(current_setting('app.current_user_id', true), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(current_setting('app.current_user_id', true), 'admin'));

-- Index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Now configure your .env file with:
-- VITE_SUPABASE_URL=your_supabase_project_url
-- VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
