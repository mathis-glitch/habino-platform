-- Conversations and messages for in-app chat

-- Conversations between a prospective buyer/renter and a property owner/agent
CREATE TABLE IF NOT EXISTS public.conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id   uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  participant_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- requester
  participant_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- agent / owner
  last_message  text,
  last_message_at timestamptz,
  unread_a      int NOT NULL DEFAULT 0, -- unread count for participant_a
  unread_b      int NOT NULL DEFAULT 0, -- unread count for participant_b
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_conversation UNIQUE (tenant_id, property_id, participant_a, participant_b)
);

CREATE INDEX IF NOT EXISTS conversations_participant_a_idx ON public.conversations (participant_a);
CREATE INDEX IF NOT EXISTS conversations_participant_b_idx ON public.conversations (participant_b);
CREATE INDEX IF NOT EXISTS conversations_tenant_id_idx    ON public.conversations (tenant_id);

-- Messages within a conversation
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            text NOT NULL,
  message_type    text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','system')),
  attachment_url  text,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx       ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx      ON public.messages (created_at DESC);

-- Auto-update conversations.updated_at and denormalize last_message
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message    = NEW.body,
    last_message_at = NEW.created_at,
    updated_at      = now(),
    -- increment unread for the other participant
    unread_a = CASE
      WHEN participant_b = NEW.sender_id THEN unread_a + 1
      ELSE unread_a
    END,
    unread_b = CASE
      WHEN participant_a = NEW.sender_id THEN unread_b + 1
      ELSE unread_b
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_update_conversation ON public.messages;
CREATE TRIGGER messages_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_participants_read" ON public.conversations
  FOR SELECT USING (
    participant_a = auth.uid() OR participant_b = auth.uid()
  );

CREATE POLICY "conversation_participants_insert" ON public.conversations
  FOR INSERT WITH CHECK (
    participant_a = auth.uid() OR participant_b = auth.uid()
  );

CREATE POLICY "conversation_participants_update" ON public.conversations
  FOR UPDATE USING (
    participant_a = auth.uid() OR participant_b = auth.uid()
  );

-- RLS: Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_participants_read" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

CREATE POLICY "message_sender_insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

CREATE POLICY "message_sender_update" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Enable Realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
