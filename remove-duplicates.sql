-- 1. 중복 패키지 제거 (ROW_NUMBER를 사용하여 각 이름별로 가장 먼저 생성된 하나만 남김)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) as rn
  FROM point_packages
)
DELETE FROM point_packages
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. 향후 중복 방지를 위해 name 컬럼에 유니크 제약조건 추가
ALTER TABLE point_packages 
ADD CONSTRAINT point_packages_name_key UNIQUE (name);
