-- Index voor "tijd sinds laatste slaap" (meest recente einde per gezin + kind).
-- Idempotent; veilig om opnieuw uit te voeren.
create index if not exists slapen_gezin_kind_einde_idx
  on public.slapen (gezin_id, kind_id, einde desc);
