-- liquibase formatted sql

-- changeset hungdoan:1652461938453-1
CREATE TABLE "role" ("id" BIGINT NOT NULL, "name" VARCHAR(255) NOT NULL, CONSTRAINT "role_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-2
CREATE TABLE "account" ("id" BIGINT NOT NULL, "active" BOOLEAN NOT NULL, "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL, "last_modified_at" TIMESTAMP WITHOUT TIME ZONE, "bio" VARCHAR(200), "email" VARCHAR(255) NOT NULL, "full_name" VARCHAR(255) NOT NULL, "password" VARCHAR(255) NOT NULL, "refresh_token" VARCHAR(255), "token_expired_date" TIMESTAMP WITHOUT TIME ZONE, "username" VARCHAR(255) NOT NULL, "verification_expired_date" TIMESTAMP WITHOUT TIME ZONE, "verification_token" VARCHAR(255), "created_by_account_id" BIGINT, "last_modified_by_account_id" BIGINT, "role_id" BIGINT, "account_status" VARCHAR(255), CONSTRAINT "account_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-3
CREATE TABLE "participant" ("id" BIGINT NOT NULL, "account_id" BIGINT NOT NULL, "conversation_id" BIGINT NOT NULL, CONSTRAINT "participant_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-4
CREATE TABLE "following" ("id" BIGINT NOT NULL, "from_account" BIGINT, "to_account" BIGINT, CONSTRAINT "following_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-5
CREATE TABLE "liking" ("id" BIGINT NOT NULL, "account_id" BIGINT, "post_id" BIGINT, CONSTRAINT "liking_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-6
ALTER TABLE "role" ADD CONSTRAINT "uk_8sewwnpamngi6b1dwaa88askk" UNIQUE ("name");

-- changeset hungdoan:1652461938453-7
ALTER TABLE "account" ADD CONSTRAINT "uk_bofba73mkw4ghli0ycc3bj9o0" UNIQUE ("verification_token");

-- changeset hungdoan:1652461938453-8
ALTER TABLE "account" ADD CONSTRAINT "uk_fq38m74jok70uh8462s27xkl2" UNIQUE ("refresh_token");

-- changeset hungdoan:1652461938453-9
ALTER TABLE "account" ADD CONSTRAINT "uk_gex1lmaqpg0ir5g1f5eftyaa1" UNIQUE ("username");

-- changeset hungdoan:1652461938453-10
ALTER TABLE "account" ADD CONSTRAINT "uk_q0uja26qgu1atulenwup9rxyr" UNIQUE ("email");

-- changeset hungdoan:1652461938453-11
ALTER TABLE "participant" ADD CONSTRAINT "ukfh7tjbx3f45m1s5wg2f9hog4i" UNIQUE ("conversation_id", "account_id");

-- changeset hungdoan:1652461938453-12
ALTER TABLE "following" ADD CONSTRAINT "uniquefollowingcomposition" UNIQUE ("from_account", "to_account");

-- changeset hungdoan:1652461938453-13
ALTER TABLE "liking" ADD CONSTRAINT "uniquelikecomposition" UNIQUE ("account_id", "post_id");

-- changeset hungdoan:1652461938453-14
CREATE SEQUENCE  IF NOT EXISTS "account_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-15
CREATE SEQUENCE  IF NOT EXISTS "attachment_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-16
CREATE SEQUENCE  IF NOT EXISTS "comment_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-17
CREATE SEQUENCE  IF NOT EXISTS "conversation_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-18
CREATE SEQUENCE  IF NOT EXISTS "following_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-19
CREATE SEQUENCE  IF NOT EXISTS "liking_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-20
CREATE SEQUENCE  IF NOT EXISTS "message_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-21
CREATE SEQUENCE  IF NOT EXISTS "participant_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-22
CREATE SEQUENCE  IF NOT EXISTS "post_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-23
CREATE SEQUENCE  IF NOT EXISTS "role_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

CREATE SEQUENCE IF NOT EXISTS "setting_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;

-- changeset hungdoan:1652461938453-24
CREATE TABLE "attachment" ("id" BIGINT NOT NULL, "actual_name" VARCHAR(255), "timestamp" TIMESTAMP WITHOUT TIME ZONE, "unique_name" VARCHAR(255), "url" VARCHAR(255), "post_id" BIGINT, "profile_id" BIGINT, CONSTRAINT "attachment_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-25
CREATE TABLE "comment" ("id" BIGINT NOT NULL, "active" BOOLEAN NOT NULL, "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL, "last_modified_at" TIMESTAMP WITHOUT TIME ZONE, "content" VARCHAR(1500), "created_by_account_id" BIGINT, "last_modified_by_account_id" BIGINT, "parent_comment_id" BIGINT, "post_id" BIGINT, CONSTRAINT "comment_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-26
CREATE TABLE "conversation" ("id" BIGINT NOT NULL, "active" BOOLEAN NOT NULL, "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL, "last_modified_at" TIMESTAMP WITHOUT TIME ZONE, "name" VARCHAR(255) NOT NULL, "created_by_account_id" BIGINT, "last_modified_by_account_id" BIGINT, CONSTRAINT "conversation_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-27
CREATE TABLE "message" ("id" BIGINT NOT NULL, "content" VARCHAR(1000) NOT NULL, "status" INTEGER, "test" VARCHAR(255), "timestamp" date NOT NULL, "recipient_id" BIGINT, "sender_id" BIGINT, CONSTRAINT "message_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-28
CREATE TABLE "post" ("id" BIGINT NOT NULL, "active" BOOLEAN NOT NULL, "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL, "last_modified_at" TIMESTAMP WITHOUT TIME ZONE, "caption" VARCHAR(1500) NOT NULL, "privacy" INTEGER, "created_by_account_id" BIGINT, "last_modified_by_account_id" BIGINT, CONSTRAINT "post_pkey" PRIMARY KEY ("id"));

CREATE TABLE "setting" ("id" BIGINT NOT NULL, "account_id" BIGINT NOT NULL, "type" VARCHAR(255) NOT NULL, "value" VARCHAR(255) NOT NULL, CONSTRAINT "setting_pkey" PRIMARY KEY ("id"));

-- changeset hungdoan:1652461938453-29
ALTER TABLE "message" ADD CONSTRAINT "fk2a3ajdqt4au2cns4ko5m5qiil" FOREIGN KEY ("recipient_id") REFERENCES "conversation" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-30
ALTER TABLE "comment" ADD CONSTRAINT "fk3t7fjgecq0kfs5r4ppcrj6ccd" FOREIGN KEY ("last_modified_by_account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-31
ALTER TABLE "attachment" ADD CONSTRAINT "fk57nlwn59e1o3uor5njjmukiar" FOREIGN KEY ("post_id") REFERENCES "post" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-32
ALTER TABLE "message" ADD CONSTRAINT "fk5k0olkd82xhjehyhuy44pqi4c" FOREIGN KEY ("sender_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-33
ALTER TABLE "post" ADD CONSTRAINT "fk9qpv9547pu2gxgulwhgw9vat1" FOREIGN KEY ("created_by_account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-34
ALTER TABLE "liking" ADD CONSTRAINT "fkakklq2jnjsjfma8ufgh45xurl" FOREIGN KEY ("post_id") REFERENCES "post" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-35
ALTER TABLE "account" ADD CONSTRAINT "fkbi1pm96c3w5wrvw6slhkyamk" FOREIGN KEY ("created_by_account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-36
ALTER TABLE "account" ADD CONSTRAINT "fkd4vb66o896tay3yy52oqxr9w0" FOREIGN KEY ("role_id") REFERENCES "role" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-37
ALTER TABLE "conversation" ADD CONSTRAINT "fkfpeljvfrq565cq1m37trcjvh" FOREIGN KEY ("created_by_account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-38
ALTER TABLE "comment" ADD CONSTRAINT "fkgryfrfg2a7t7gyirh91i14wnt" FOREIGN KEY ("created_by_account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-39
ALTER TABLE "conversation" ADD CONSTRAINT "fkh621kc15wrj10hxgrpn3gnc05" FOREIGN KEY ("last_modified_by_account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-40
ALTER TABLE "account" ADD CONSTRAINT "fkhj3uic340kxt2munplswc1kir" FOREIGN KEY ("last_modified_by_account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-41
ALTER TABLE "comment" ADD CONSTRAINT "fkhvh0e2ybgg16bpu229a5teje7" FOREIGN KEY ("parent_comment_id") REFERENCES "comment" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-42
ALTER TABLE "attachment" ADD CONSTRAINT "fkivbysvdk76g59xkjthd8kl698" FOREIGN KEY ("profile_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-43
ALTER TABLE "following" ADD CONSTRAINT "fkja85dl2kso64lyif593vh5twx" FOREIGN KEY ("to_account") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-44
ALTER TABLE "following" ADD CONSTRAINT "fkkc4em2rvkeku33chmopnxpp3b" FOREIGN KEY ("from_account") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-45
ALTER TABLE "liking" ADD CONSTRAINT "fkmyyh5u34brpn49tsam9eovuhj" FOREIGN KEY ("account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-46
ALTER TABLE "participant" ADD CONSTRAINT "fkptbndmpwose49o6u9d8x9aj9u" FOREIGN KEY ("account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-47
ALTER TABLE "post" ADD CONSTRAINT "fkr1eijd8s3w1nquadw31orl88o" FOREIGN KEY ("last_modified_by_account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-48
ALTER TABLE "comment" ADD CONSTRAINT "fks1slvnkuemjsq2kj4h3vhx7i1" FOREIGN KEY ("post_id") REFERENCES "post" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

-- changeset hungdoan:1652461938453-49
ALTER TABLE "participant" ADD CONSTRAINT "fksiftd56p4vnlfthffmf07xhng" FOREIGN KEY ("conversation_id") REFERENCES "conversation" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "setting" ADD CONSTRAINT "fkptbndmpwose49o6u9d8x9aj9j" FOREIGN KEY ("account_id") REFERENCES "account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;

--ALTER TABLE "account" ADD COLUMN "account_status" VARCHAR(255) NOT NULL;
