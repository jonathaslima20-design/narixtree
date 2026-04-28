import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Campaign, CampaignRecipient } from './types';

export function useCampaignDetail(campaignId: string | undefined, userId: string | undefined) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const sendingRef = useRef(false);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();
    if (data) setCampaign(data as Campaign);
  }, [campaignId]);

  const fetchRecipients = useCallback(async () => {
    if (!campaignId) return;
    const { data } = await supabase
      .from('campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });
    if (data) setRecipients(data as CampaignRecipient[]);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
    fetchRecipients();
  }, [fetchCampaign, fetchRecipients]);

  // Realtime for campaign counter updates
  useEffect(() => {
    if (!campaignId) return;
    const channel = supabase
      .channel(`campaign-detail-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          setCampaign(payload.new as Campaign);
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_recipients',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRecipients((prev) => [...prev, payload.new as CampaignRecipient]);
          } else if (payload.eventType === 'UPDATE') {
            setRecipients((prev) =>
              prev.map((r) =>
                r.id === (payload.new as CampaignRecipient).id
                  ? (payload.new as CampaignRecipient)
                  : r,
              ),
            );
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [campaignId]);

  const startSending = useCallback(async (): Promise<string | null> => {
    if (!campaignId || !userId || sendingRef.current) return null;
    sendingRef.current = true;

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 10_000;
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/campaign-send`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const send = async (): Promise<Record<string, unknown>> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw Object.assign(new Error('Sessão expirada. Faça login novamente.'), { fatal: true });

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          apikey: anonKey,
        },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const msg = typeof json?.error === 'string' ? json.error : `Erro ${res.status}`;
          throw Object.assign(new Error(msg), { fatal: true });
        }
        if (json?.retryable === false) {
          const msg = typeof json?.error === 'string' ? json.error : `Erro ${res.status}`;
          throw Object.assign(new Error(msg), { fatal: true });
        }
        const msg = typeof json?.error === 'string' ? json.error : `Erro ${res.status}`;
        throw new Error(msg);
      }

      return json;
    };

    try {
      let consecutiveErrors = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data: fresh } = await supabase
          .from('campaigns')
          .select('status')
          .eq('id', campaignId)
          .maybeSingle();
        if (!fresh || fresh.status === 'paused' || fresh.status === 'cancelled') break;

        let result: Record<string, unknown>;
        try {
          result = await send();
          consecutiveErrors = 0;
        } catch (err) {
          if ((err as { fatal?: boolean }).fatal) {
            return err instanceof Error ? err.message : 'Erro ao enviar campanha';
          }
          consecutiveErrors++;
          if (consecutiveErrors >= MAX_RETRIES) {
            return err instanceof Error ? err.message : 'Erro ao enviar campanha';
          }
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }

        if (result.completed) break;

        const remaining = result.remaining as number;
        if (remaining === 0) break;

        if (result.break_reason === 'window') {
          await new Promise((r) => setTimeout(r, 60_000));
          continue;
        }

        if (result.retryable === false) break;
      }

      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Erro desconhecido ao enviar campanha';
    } finally {
      sendingRef.current = false;
      await fetchCampaign();
      await fetchRecipients();
    }
  }, [campaignId, userId, fetchCampaign, fetchRecipients]);

  return { campaign, recipients, loading, fetchCampaign, fetchRecipients, startSending };
}
