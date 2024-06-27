DROP FUNCTION if exists checkConversationBetweenTwoAccount;
CREATE OR REPLACE FUNCTION checkConversationBetweenTwoAccount(first_participant_id bigint, second_participant_id bigint)
RETURNS TABLE (id bigint,
			  name varchar,
			  created_at timestamp)
as $$
BEGIN
RETURN QUERY
select p.conversation_id as id, con.name as name, con.created_at
from (select p.conversation_id from participant p where p.account_id in (first_participant_id, second_participant_id) group by p.conversation_id having count(p.id) = 2) as c
         join participant p on c.conversation_id = p.conversation_id
         join conversation con on c.conversation_id = con.id and con.active = true
group by p.conversation_id, con.name, con.created_at
having count(p.conversation_id) = 2;
END;
$$
LANGUAGE plpgsql;

DROP FUNCTION if exists searchConversationByName;
CREATE OR REPLACE FUNCTION searchConversationByName(principalId bigint, keyword varchar)
RETURNS TABLE (id bigint,
			  name varchar,
			  created_at timestamp)
as $$
BEGIN
RETURN QUERY
select con.id as id, con.name as name, con.created_at
from (select p.conversation_id from participant p where p.account_id = principalId) as c
         join participant p on c.conversation_id = p.conversation_id
         join account a on p.account_id = a.id
         join conversation con on c.conversation_id = con.id and con.active = true
where lower(con.name) like keyword or a.username like keyword or a.full_name like keyword;
END;
$$
LANGUAGE plpgsql;