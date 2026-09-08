-- =============================================================================
-- DZ COLLECTION — 0005 · Rate limiting atômico
-- =============================================================================
-- Contagem no banco (e não em memória) porque a Vercel é serverless: cada
-- invocação é um processo novo, então contador em memória não protege nada.
--
-- A função é atômica: o INSERT ... ON CONFLICT DO UPDATE resolve corrida entre
-- requisições concorrentes sem transação explícita.
--
-- Chamada exclusivamente pelo backend privilegiado (secret key). A tabela não
-- tem grant para anon nem authenticated.
-- =============================================================================

create or replace function public.consume_rate_limit(
  p_bucket          text,
  p_identifier      text,
  p_max_attempts    integer,
  p_window_seconds  integer,
  p_max_block_seconds integer default 900
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_window_start timestamptz;
  v_attempts     integer;
  v_blocked_until timestamptz;
  v_backoff      integer;
begin
  if p_max_attempts < 1 or p_window_seconds < 1 then
    raise exception 'parâmetros inválidos de rate limit';
  end if;

  -- Janela fixa, alinhada para que a chave seja determinística.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.auth_rate_limits (bucket, identifier, window_start, attempts)
  values (p_bucket, left(p_identifier, 200), v_window_start, 1)
  on conflict (bucket, identifier, window_start) do update
    set attempts = public.auth_rate_limits.attempts + 1
  returning public.auth_rate_limits.attempts, public.auth_rate_limits.blocked_until
    into v_attempts, v_blocked_until;

  -- Ainda dentro de um bloqueio anterior.
  if v_blocked_until is not null and v_blocked_until > now() then
    return query select false, ceil(extract(epoch from (v_blocked_until - now())))::integer;
    return;
  end if;

  if v_attempts > p_max_attempts then
    -- Backoff progressivo: dobra a cada tentativa acima do limite, com teto.
    -- O teto existe para que um atacante NÃO consiga bloquear a conta da
    -- proprietária indefinidamente só mandando senha errada.
    v_backoff := least(
      p_max_block_seconds,
      p_window_seconds * power(2, least(v_attempts - p_max_attempts, 6))::integer
    );

    update public.auth_rate_limits
       set blocked_until = now() + make_interval(secs => v_backoff)
     where bucket = p_bucket
       and identifier = left(p_identifier, 200)
       and window_start = v_window_start;

    return query select false, v_backoff;
    return;
  end if;

  return query select true, 0;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer, integer) from public;
-- Sem grant para anon/authenticated: só a secret key (que ignora RLS e grants)
-- pode chamar. O rate limit não é acionável pelo cliente.

-- Limpeza de janelas antigas. Rodar por cron do Supabase (opcional).
create or replace function public.purge_rate_limits()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  delete from public.auth_rate_limits
  where window_start < now() - interval '24 hours'
    and (blocked_until is null or blocked_until < now());
$$;

revoke all on function public.purge_rate_limits() from public;
