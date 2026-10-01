CREATE TYPE public.app_role AS ENUM ('admin', 'branch');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  logo_url text,
  upi_id text NOT NULL DEFAULT '',
  username text NOT NULL UNIQUE,
  user_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_branch_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.branches WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "admin all branches" ON public.branches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branch reads self" ON public.branches FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  price numeric NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Stylist',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  number integer NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL DEFAULT '',
  staff_id uuid,
  staff_name text NOT NULL DEFAULT '—',
  lines jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  UNIQUE (branch_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items, public.staff, public.bills TO authenticated;
GRANT ALL ON public.items, public.staff, public.bills TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branch or admin" ON public.items FOR ALL TO authenticated
  USING (branch_id = public.my_branch_id() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (branch_id = public.my_branch_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branch or admin" ON public.staff FOR ALL TO authenticated
  USING (branch_id = public.my_branch_id() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (branch_id = public.my_branch_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branch or admin" ON public.bills FOR ALL TO authenticated
  USING (branch_id = public.my_branch_id() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (branch_id = public.my_branch_id() OR public.has_role(auth.uid(), 'admin'));