-- 0010 Let admin accounts be deleted.
-- admin_audit_logs.admin_id and reports.resolved_by referenced profiles with
-- the default NO ACTION, so deleting any admin who had ever acted failed.
-- Audit rows must outlive the admin, so the reference becomes nullable and
-- is cleared on delete. The details column keeps what was done.

alter table public.admin_audit_logs alter column admin_id drop not null;
alter table public.admin_audit_logs drop constraint if exists admin_audit_logs_admin_id_fkey;
alter table public.admin_audit_logs
  add constraint admin_audit_logs_admin_id_fkey
  foreign key (admin_id) references public.profiles (id) on delete set null;

alter table public.reports drop constraint if exists reports_resolved_by_fkey;
alter table public.reports
  add constraint reports_resolved_by_fkey
  foreign key (resolved_by) references public.profiles (id) on delete set null;
