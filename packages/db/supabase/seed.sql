-- 개발용 시드. 노션 "프로젝트 개요"의 메이저 브랜드 + 기본 카테고리.

insert into public.brands (name_ko, name_en, tier, sort_order) values
  ('디월트', 'DEWALT', 'major', 10),
  ('마키타', 'MAKITA', 'major', 20),
  ('보쉬', 'BOSCH', 'major', 30),
  ('밀워키', 'MILWAUKEE', 'major', 40),
  ('히타치', 'HIKOKI', 'major', 50),
  ('타지마', 'TAJIMA', 'major', 60),
  ('3M', '3M', 'major', 70)
on conflict do nothing;

with parents as (
  insert into public.categories (name, slug, sort_order) values
    ('전동공구', 'power-tools', 10),
    ('수공구', 'hand-tools', 20),
    ('측정공구', 'measuring', 30),
    ('소모품', 'consumables', 40)
  on conflict do nothing
  returning id, slug
)
insert into public.categories (parent_id, name, slug, sort_order)
select p.id, c.name, c.slug, c.sort_order from parents p join (values
  ('power-tools', '임팩 드라이버', 'impact-driver', 10),
  ('power-tools', '드릴', 'drill', 20),
  ('power-tools', '그라인더', 'grinder', 30),
  ('power-tools', '원형톱', 'circular-saw', 40),
  ('power-tools', '배터리', 'battery', 50),
  ('hand-tools', '망치', 'hammer', 10),
  ('hand-tools', '렌치', 'wrench', 20)
) as c(parent_slug, name, slug, sort_order) on c.parent_slug = p.slug
on conflict do nothing;
