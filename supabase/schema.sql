

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "text",
    "session_id" "text",
    "step" "text",
    "reason_key" "text",
    "write_in" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."event_logs"."id" IS 'Primary key, default uuid()';



COMMENT ON COLUMN "public"."event_logs"."account_id" IS 'Matches config.account_id';



COMMENT ON COLUMN "public"."event_logs"."session_id" IS 'Unique per cancel session';



COMMENT ON COLUMN "public"."event_logs"."step" IS 'What step was taken';



COMMENT ON COLUMN "public"."event_logs"."reason_key" IS 'Cancel reason (e.g. reason_1)';



COMMENT ON COLUMN "public"."event_logs"."write_in" IS '	Optional manual entry';



CREATE TABLE IF NOT EXISTS "public"."configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "text" NOT NULL,
    "config_json" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "text" NOT NULL,
    "gateway" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "api_key" "text",
    "external_id" "text",
    "livemode" boolean DEFAULT false,
    "revoked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credentials_gateway_check" CHECK (("gateway" = ANY (ARRAY['stripe'::"text", 'paypal'::"text", 'braintree'::"text", 'recurly'::"text", 'pabbly'::"text"])))
);


ALTER TABLE "public"."credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."default_configs" (
    "tier" "text" NOT NULL,
    "config_json" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."default_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."default_configs" IS 'Default configs by tier';



CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "text",
    "type" "text",
    "source" "text",
    "message" "text",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."event_logs"
    ADD CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configs"
    ADD CONSTRAINT "configs_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."configs"
    ADD CONSTRAINT "configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."default_configs"
    ADD CONSTRAINT "default_configs_pkey" PRIMARY KEY ("tier");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "credentials_account_gateway_idx" ON "public"."credentials" USING "btree" ("account_id", "gateway");



CREATE INDEX "accounts_account_id_idx" ON "public"."accounts" USING "btree" ("account_id");



CREATE INDEX "accounts_domain_idx" ON "public"."accounts" USING "btree" ("domain");



ALTER TABLE "public"."event_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."default_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_anon" ON "public"."event_logs" FOR INSERT TO "anon" WITH CHECK (("account_id" IS NOT NULL));



CREATE POLICY "insert_anon" ON "public"."configs" FOR INSERT TO "anon" WITH CHECK (("account_id" IS NOT NULL));



CREATE POLICY "insert_anon" ON "public"."error_logs" FOR INSERT TO "anon" WITH CHECK (("account_id" IS NOT NULL));



CREATE POLICY "select_anon" ON "public"."configs" FOR SELECT TO "anon" USING (("account_id" IS NOT NULL));



CREATE POLICY "select_anon" ON "public"."default_configs" FOR SELECT TO "anon" USING (true);



CREATE POLICY "update_anon" ON "public"."configs" FOR UPDATE TO "anon" USING (("account_id" IS NOT NULL));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."event_logs" TO "anon";
GRANT ALL ON TABLE "public"."event_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."event_logs" TO "service_role";



GRANT ALL ON TABLE "public"."configs" TO "anon";
GRANT ALL ON TABLE "public"."configs" TO "authenticated";
GRANT ALL ON TABLE "public"."configs" TO "service_role";



GRANT ALL ON TABLE "public"."credentials" TO "anon";
GRANT ALL ON TABLE "public"."credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."credentials" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."default_configs" TO "anon";
GRANT ALL ON TABLE "public"."default_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."default_configs" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
