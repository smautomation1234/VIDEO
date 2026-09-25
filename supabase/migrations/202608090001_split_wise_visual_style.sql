alter table public.projects
  drop constraint if exists projects_style_check;

alter table public.projects
  add constraint projects_style_check
  check (style in ('paper_motion', 'split_wise'));
