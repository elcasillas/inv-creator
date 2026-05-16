UPDATE app_users
SET
  password_hash = 'pbkdf2_sha256$100000$ssc4/nIA+KcFZoCNH9fHEA==$JuzKxptcdMqSGJCy7qQ+sEou7K/uB/Qik/oRq4bwl+Q=',
  updated_at = '2026-05-16T00:00:00.000Z'
WHERE email = 'ed.casillas@gmail.com';
