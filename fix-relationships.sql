-- posts 테이블의 user_id가 user_profiles를 참조하도록 외래 키 추가
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

ALTER TABLE posts
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(id) 
ON DELETE CASCADE;

-- comments 테이블의 user_id가 user_profiles를 참조하도록 외래 키 추가
ALTER TABLE comments
DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE comments
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(id) 
ON DELETE CASCADE;

-- payments 테이블의 user_id가 user_profiles를 참조하도록 외래 키 추가
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE payments
ADD CONSTRAINT payments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(id) 
ON DELETE CASCADE;
