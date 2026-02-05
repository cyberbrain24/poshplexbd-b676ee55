
-- Instagram API Configuration table
CREATE TABLE public.instagram_apis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  facebook_app_id TEXT NOT NULL,
  facebook_app_secret TEXT NOT NULL,
  access_token TEXT NOT NULL,
  page_id TEXT,
  page_name TEXT,
  instagram_account_id TEXT,
  instagram_username TEXT,
  webhook_url TEXT,
  webhook_verify_token TEXT,
  permissions_status JSONB DEFAULT '{"instagram_manage_messages": false, "instagram_manage_comments": false, "pages_manage_metadata": false}'::jsonb,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'disconnected',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger to ensure only one active Instagram API
CREATE OR REPLACE FUNCTION public.ensure_single_active_instagram_api()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.instagram_apis SET is_active = false WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_instagram_api_trigger
BEFORE INSERT OR UPDATE ON public.instagram_apis
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_active_instagram_api();

-- Instagram Automations (Comment-to-DM, Story Mention)
CREATE TABLE public.instagram_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  automation_type TEXT NOT NULL DEFAULT 'comment_to_dm', -- 'comment_to_dm', 'story_mention'
  post_filter TEXT DEFAULT 'all', -- 'all', 'specific'
  post_urls TEXT[], -- specific post URLs if post_filter = 'specific'
  trigger_keywords TEXT[], -- keywords to trigger automation
  public_reply_variations TEXT[], -- random public comment replies
  dm_message TEXT,
  dm_button_text TEXT,
  dm_button_url TEXT,
  delay_minutes INTEGER DEFAULT 0, -- delay before sending (for story mentions)
  cooldown_hours INTEGER DEFAULT 24, -- don't message same user within this period
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Instagram Ice Breakers (Chat Menu Buttons)
CREATE TABLE public.instagram_ice_breakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  button_text TEXT NOT NULL,
  auto_reply_text TEXT,
  auto_reply_image_url TEXT,
  auto_reply_link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Instagram Campaigns (Broadcast Marketing)
CREATE TABLE public.instagram_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message_body TEXT NOT NULL,
  image_url TEXT,
  quick_replies JSONB DEFAULT '[]'::jsonb, -- [{text: "View Website", payload: "..."}, ...]
  filters JSONB DEFAULT '{}'::jsonb,
  recipient_count INTEGER DEFAULT 0,
  active_window_only BOOLEAN DEFAULT true, -- 24h rule enforcement
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'completed', 'paused'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Instagram Campaign Logs
CREATE TABLE public.instagram_campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.instagram_campaigns(id) ON DELETE SET NULL,
  automation_id UUID REFERENCES public.instagram_automations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  instagram_user_id TEXT,
  instagram_username TEXT,
  trigger_type TEXT, -- 'campaign', 'comment', 'story_mention', 'ice_breaker'
  message_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed', 'blocked'
  error_message TEXT,
  link_clicked BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Instagram Conversations (Inbox)
CREATE TABLE public.instagram_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT,
  instagram_profile_pic TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_interaction_at TIMESTAMP WITH TIME ZONE, -- for 24h rule
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'archived'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instagram_user_id)
);

-- Instagram Messages
CREATE TABLE public.instagram_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.instagram_conversations(id) ON DELETE CASCADE,
  message_id TEXT, -- Meta message ID
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'quick_reply', 'ice_breaker'
  content TEXT,
  media_url TEXT,
  quick_reply_payload TEXT,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Instagram Analytics (for tracking DM conversions)
CREATE TABLE public.instagram_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID REFERENCES public.instagram_campaign_logs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'link_click', 'dm_open', 'reply_received'
  event_data JSONB,
  event_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.instagram_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_ice_breakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instagram_apis
CREATE POLICY "Anyone can view instagram_apis" ON public.instagram_apis FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instagram_apis" ON public.instagram_apis FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instagram_apis" ON public.instagram_apis FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instagram_apis" ON public.instagram_apis FOR DELETE USING (true);

-- RLS Policies for instagram_automations
CREATE POLICY "Anyone can view instagram_automations" ON public.instagram_automations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instagram_automations" ON public.instagram_automations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instagram_automations" ON public.instagram_automations FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instagram_automations" ON public.instagram_automations FOR DELETE USING (true);

-- RLS Policies for instagram_ice_breakers
CREATE POLICY "Anyone can view instagram_ice_breakers" ON public.instagram_ice_breakers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instagram_ice_breakers" ON public.instagram_ice_breakers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instagram_ice_breakers" ON public.instagram_ice_breakers FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instagram_ice_breakers" ON public.instagram_ice_breakers FOR DELETE USING (true);

-- RLS Policies for instagram_campaigns
CREATE POLICY "Anyone can view instagram_campaigns" ON public.instagram_campaigns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instagram_campaigns" ON public.instagram_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instagram_campaigns" ON public.instagram_campaigns FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instagram_campaigns" ON public.instagram_campaigns FOR DELETE USING (true);

-- RLS Policies for instagram_campaign_logs
CREATE POLICY "Anyone can view instagram_campaign_logs" ON public.instagram_campaign_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instagram_campaign_logs" ON public.instagram_campaign_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instagram_campaign_logs" ON public.instagram_campaign_logs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instagram_campaign_logs" ON public.instagram_campaign_logs FOR DELETE USING (true);

-- RLS Policies for instagram_conversations
CREATE POLICY "Anyone can view instagram_conversations" ON public.instagram_conversations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instagram_conversations" ON public.instagram_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instagram_conversations" ON public.instagram_conversations FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instagram_conversations" ON public.instagram_conversations FOR DELETE USING (true);

-- RLS Policies for instagram_messages
CREATE POLICY "Anyone can view instagram_messages" ON public.instagram_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instagram_messages" ON public.instagram_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instagram_messages" ON public.instagram_messages FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instagram_messages" ON public.instagram_messages FOR DELETE USING (true);

-- RLS Policies for instagram_analytics
CREATE POLICY "Anyone can view instagram_analytics" ON public.instagram_analytics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert instagram_analytics" ON public.instagram_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update instagram_analytics" ON public.instagram_analytics FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete instagram_analytics" ON public.instagram_analytics FOR DELETE USING (true);

-- Updated at triggers
CREATE TRIGGER update_instagram_apis_updated_at BEFORE UPDATE ON public.instagram_apis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_instagram_automations_updated_at BEFORE UPDATE ON public.instagram_automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_instagram_ice_breakers_updated_at BEFORE UPDATE ON public.instagram_ice_breakers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_instagram_campaigns_updated_at BEFORE UPDATE ON public.instagram_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_instagram_conversations_updated_at BEFORE UPDATE ON public.instagram_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
