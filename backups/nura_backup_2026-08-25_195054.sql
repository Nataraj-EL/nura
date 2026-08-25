--
-- PostgreSQL database dump
--

\restrict tqNctiUiNu7MR3djvL85yFZAusMdxhc70cOTsLXLqiTSd3EaXw4Epo4qyEY4FQq

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO nura;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.notification_preferences (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    period_reminder_enabled boolean DEFAULT true NOT NULL,
    period_started_enabled boolean DEFAULT true NOT NULL,
    wellness_checkin_enabled boolean DEFAULT true NOT NULL,
    water_reminder_enabled boolean DEFAULT true NOT NULL,
    insight_available_enabled boolean DEFAULT true NOT NULL,
    scheduled_time time without time zone DEFAULT '20:00:00'::time without time zone NOT NULL,
    quiet_hours_start time without time zone,
    quiet_hours_end time without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO nura;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    category character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message character varying(500) NOT NULL,
    delivery_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    delivery_channel character varying(50) DEFAULT 'IN_APP'::character varying NOT NULL,
    next_delivery_time timestamp without time zone,
    read_at timestamp without time zone,
    expires_at timestamp without time zone,
    record_date date,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO nura;

--
-- Name: period_records; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.period_records (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.period_records OWNER TO nura;

--
-- Name: user_otps; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.user_otps (
    id uuid NOT NULL,
    phone_number character varying(30),
    hashed_otp character varying(100) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    consumed_at timestamp without time zone,
    attempt_count integer DEFAULT 0 NOT NULL,
    email character varying(255)
);


ALTER TABLE public.user_otps OWNER TO nura;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    age integer,
    typical_cycle_length integer,
    typical_period_duration integer,
    timezone character varying(50),
    onboarding_status character varying(30) NOT NULL,
    water_goal integer DEFAULT 2000
);


ALTER TABLE public.user_profiles OWNER TO nura;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.user_sessions (
    token character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO nura;

--
-- Name: users; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    phone_number character varying(30),
    status character varying(30) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    email character varying(255)
);


ALTER TABLE public.users OWNER TO nura;

--
-- Name: wellness_records; Type: TABLE; Schema: public; Owner: nura
--

CREATE TABLE public.wellness_records (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    record_date date NOT NULL,
    water_intake integer,
    mood character varying(50),
    energy_level integer,
    sleep_duration_minutes integer,
    symptoms jsonb,
    note character varying(1000),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.wellness_records OWNER TO nura;

--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init user schema	SQL	V1__init_user_schema.sql	-1521441931	nura	2026-08-23 14:23:15.656074	30	t
2	2	create period record schema	SQL	V2__create_period_record_schema.sql	-798448990	nura	2026-08-23 14:31:51.652429	17	t
3	3	create wellness record schema	SQL	V3__create_wellness_record_schema.sql	-534010352	nura	2026-08-23 14:43:37.991043	20	t
4	4	create notifications schema	SQL	V4__create_notifications_schema.sql	-1853990958	nura	2026-08-23 15:45:07.842422	38	t
5	5	add water goal to user profiles	SQL	V5__add_water_goal_to_user_profiles.sql	165705657	nura	2026-08-23 15:55:50.980155	9	t
6	6	auth email integration	SQL	V6__auth_email_integration.sql	218787909	nura	2026-08-23 23:18:29.883441	17	t
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.notification_preferences (id, user_id, period_reminder_enabled, period_started_enabled, wellness_checkin_enabled, water_reminder_enabled, insight_available_enabled, scheduled_time, quiet_hours_start, quiet_hours_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.notifications (id, user_id, category, title, message, delivery_status, delivery_channel, next_delivery_time, read_at, expires_at, record_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: period_records; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.period_records (id, user_id, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_otps; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.user_otps (id, phone_number, hashed_otp, created_at, expires_at, consumed_at, attempt_count, email) FROM stdin;
55904ff5-cba8-4a62-b9d3-6e09017c440f	\N	$2a$10$amnFH8veoSBZYF6qpg9xEOT5egFaYMnALqqJ1Z.X0.GV5Hxltcg.m	2026-08-24 06:55:18.047112	2026-08-24 07:00:18.047059	\N	0	natarajel.dev@gmail.com
be681cd2-2fd6-4737-9a5f-6a92968e8449	+918778380813	$2a$10$EZ771NBmpW8ILsP/L9K8Ael35DZmVTZKF8udMcYqRaaqHXYRE3dYm	2026-08-23 23:10:40.700746	2026-08-23 23:15:40.700715	\N	0	\N
1762c451-1348-4ce7-95c3-891dcab8c6c3	+918778380813	$2a$10$JW8Pdbs9u2s9lFhmk9TunOEaOnNWaZTnSQjllO/7QdbvWLgBpDMza	2026-08-23 23:05:48.394409	2026-08-23 23:10:40.575345	\N	0	\N
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.user_profiles (id, user_id, age, typical_cycle_length, typical_period_duration, timezone, onboarding_status, water_goal) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.user_sessions (token, user_id, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.users (id, phone_number, status, created_at, updated_at, email) FROM stdin;
\.


--
-- Data for Name: wellness_records; Type: TABLE DATA; Schema: public; Owner: nura
--

COPY public.wellness_records (id, user_id, record_date, water_intake, mood, energy_level, sleep_duration_minutes, symptoms, note, created_at, updated_at) FROM stdin;
\.


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: period_records period_records_pkey; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.period_records
    ADD CONSTRAINT period_records_pkey PRIMARY KEY (id);


--
-- Name: user_otps user_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.user_otps
    ADD CONSTRAINT user_otps_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wellness_records wellness_records_pkey; Type: CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.wellness_records
    ADD CONSTRAINT wellness_records_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: nura
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_notifications_dedup; Type: INDEX; Schema: public; Owner: nura
--

CREATE UNIQUE INDEX idx_notifications_dedup ON public.notifications USING btree (user_id, category, record_date) WHERE (record_date IS NOT NULL);


--
-- Name: idx_period_records_user_start; Type: INDEX; Schema: public; Owner: nura
--

CREATE INDEX idx_period_records_user_start ON public.period_records USING btree (user_id, start_date);


--
-- Name: idx_user_otps_phone; Type: INDEX; Schema: public; Owner: nura
--

CREATE INDEX idx_user_otps_phone ON public.user_otps USING btree (phone_number);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: nura
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone_number);


--
-- Name: idx_wellness_records_user_date; Type: INDEX; Schema: public; Owner: nura
--

CREATE UNIQUE INDEX idx_wellness_records_user_date ON public.wellness_records USING btree (user_id, record_date);


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: period_records period_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.period_records
    ADD CONSTRAINT period_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wellness_records wellness_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nura
--

ALTER TABLE ONLY public.wellness_records
    ADD CONSTRAINT wellness_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict tqNctiUiNu7MR3djvL85yFZAusMdxhc70cOTsLXLqiTSd3EaXw4Epo4qyEY4FQq

