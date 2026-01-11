-- Create profiles table to store user display information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by authenticated users in the same org
CREATE POLICY "Users can view profiles of users in their org" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_organizations uo1
        JOIN public.user_organizations uo2 ON uo1.org_id = uo2.org_id
        WHERE uo1.user_id = auth.uid() AND uo2.user_id = profiles.user_id
    )
);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Executives can insert profiles (for inviting users)
CREATE POLICY "Executives can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_organizations uo
        WHERE uo.user_id = auth.uid()
        AND is_executive(auth.uid(), uo.org_id)
    )
);

-- Add trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add policies for executives to manage user_roles
DROP POLICY IF EXISTS "Executives can manage roles" ON public.user_roles;

CREATE POLICY "Users can view roles in their org" ON public.user_roles
FOR SELECT USING (
    user_belongs_to_org(auth.uid(), org_id)
);

CREATE POLICY "Executives can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (
    is_executive(auth.uid(), org_id)
);

CREATE POLICY "Executives can update roles" ON public.user_roles
FOR UPDATE USING (
    is_executive(auth.uid(), org_id)
);

CREATE POLICY "Executives can delete roles" ON public.user_roles
FOR DELETE USING (
    is_executive(auth.uid(), org_id)
);

-- Add policies for executives to manage user_organizations
CREATE POLICY "Users can view org memberships" ON public.user_organizations
FOR SELECT USING (
    user_belongs_to_org(auth.uid(), org_id)
);

CREATE POLICY "Executives can insert org memberships" ON public.user_organizations
FOR INSERT WITH CHECK (
    is_executive(auth.uid(), org_id)
);

CREATE POLICY "Executives can delete org memberships" ON public.user_organizations
FOR DELETE USING (
    is_executive(auth.uid(), org_id)
);

-- Add policy for executives to update client assignments
DROP POLICY IF EXISTS "Users can update clients in their org" ON public.clients;

CREATE POLICY "Executives can update client assignments" ON public.clients
FOR UPDATE USING (
    user_belongs_to_org(auth.uid(), org_id) AND
    is_executive(auth.uid(), org_id)
);