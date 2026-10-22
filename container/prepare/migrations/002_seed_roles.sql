-- 002: seed 3 role ma code tim theo ten (RoleRepository.findByName).
--
-- Volume / database moi co bang role RONG (schema.sql chi tao bang), khi do
-- findByName tra ve null va dang ky (AccountServiceImpl) / tao admin
-- (AdminAccountServiceImpl) khong co role de gan.
-- Cot name khong co unique constraint nen kiem tra ton tai theo ten, va ON CONFLICT
-- theo id de khong de len role da co. Chay lai nhieu lan an toan.

INSERT INTO role (id, name)
SELECT v.id, v.name
FROM (VALUES (1, 'ADMIN'), (2, 'USER'), (3, 'SUPER_ADMIN')) AS v(id, name)
WHERE NOT EXISTS (SELECT 1 FROM role r WHERE r.name = v.name)
ON CONFLICT (id) DO NOTHING;
