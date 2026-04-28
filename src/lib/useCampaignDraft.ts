import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

export interface CampaignDraftMedia {
  path: string;
  type: string;
  filename: string;
}

export interface CampaignDraftRow {
  id: string;
  user_id: string;
  payload: Record<string, unknown>;
  current_step: number;
  max_step_reached: number;
  media_path: string;
  media_type: string;
  media_filename: string;
  created_at: string;
  updated_at: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 800;

export function useCampaignDraft() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<CampaignDraftRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedAt = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('campaign_drafts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setDraft(data as CampaignDraftRow | null);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const persist = useCallback(
    async (
      payload: Record<string, unknown>,
      currentStep: number,
      maxStepReached: number,
      media: CampaignDraftMedia,
    ) => {
      if (!user?.id) return;
      setSaveStatus('saving');
      const { data, error } = await supabase
        .from('campaign_drafts')
        .upsert(
          {
            user_id: user.id,
            payload,
            current_step: currentStep,
            max_step_reached: maxStepReached,
            media_path: media.path,
            media_type: media.type,
            media_filename: media.filename,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select()
        .maybeSingle();
      if (error) {
        setSaveStatus('error');
        return;
      }
      if (data) setDraft(data as CampaignDraftRow);
      lastSavedAt.current = Date.now();
      setSaveStatus('saved');
    },
    [user?.id],
  );

  const saveDraft = useCallback(
    (
      payload: Record<string, unknown>,
      currentStep: number,
      maxStepReached: number,
      media: CampaignDraftMedia,
    ) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        persist(payload, currentStep, maxStepReached, media);
      }, SAVE_DEBOUNCE_MS);
    },
    [persist],
  );

  const clearDraft = useCallback(async () => {
    if (!user?.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await supabase.from('campaign_drafts').delete().eq('user_id', user.id);
    setDraft(null);
    setSaveStatus('idle');
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return { draft, loading, saveStatus, saveDraft, clearDraft, lastSavedAt: lastSavedAt.current };
}

export async function uploadDraftMedia(
  userId: string,
  file: File,
): Promise<CampaignDraftMedia | null> {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${userId}/drafts/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('campaign-media')
    .upload(path, file, { upsert: false });
  if (error) return null;
  return { path, type: file.type, filename: file.name };
}

export async function getDraftMediaSignedUrl(path: string): Promise<string> {
  if (!path) return '';
  const { data } = await supabase.storage
    .from('campaign-media')
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? '';
}

export async function deleteDraftMedia(path: string): Promise<void> {
  if (!path) return;
  await supabase.storage.from('campaign-media').remove([path]);
}
