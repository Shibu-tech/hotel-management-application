--
-- PostgreSQL database dump
--

\restrict sqisDO0unrDWYVoCds9eoQa4CVQAJes2faJrckXU6aSTnrwdSrmbePqzZ5oUUea

-- Dumped from database version 18.7 (a21afb5)
-- Dumped by pg_dump version 18.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: floors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.floors (
    id bigint NOT NULL,
    floor_number integer NOT NULL,
    name character varying(100) NOT NULL,
    wing character varying(80),
    hotel_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: floors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.floors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: floors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.floors_id_seq OWNED BY public.floors.id;


--
-- Name: hotels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hotels (
    id bigint NOT NULL,
    name character varying(120) NOT NULL,
    slug character varying(80) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: hotels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hotels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hotels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hotels_id_seq OWNED BY public.hotels.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id bigint NOT NULL,
    room_number character varying(40) NOT NULL,
    floor integer NOT NULL,
    type_tag character varying(40),
    type_full character varying(100),
    badge_status character varying(60),
    readiness character varying(60) DEFAULT 'READY'::character varying NOT NULL,
    occupied boolean DEFAULT false NOT NULL,
    vip boolean DEFAULT false NOT NULL,
    vip_tier character varying(60),
    dnd boolean DEFAULT false NOT NULL,
    cleaner_assigned character varying(120),
    cleaning_category character varying(60),
    duration character varying(60),
    pin character varying(20),
    folio_balance character varying(60),
    preferences character varying(255),
    guest_name character varying(120),
    guest_email character varying(160),
    guest_phone character varying(60),
    guests_count integer DEFAULT 1,
    check_in_date character varying(60),
    check_out_date character varying(60),
    booking_ref character varying(80),
    hotel_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rooms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying(160) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(120) NOT NULL,
    role character varying(40) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    hotel_id bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'GENERAL_MANAGER'::character varying, 'SUPERVISOR'::character varying, 'FRONT_DESK'::character varying, 'FULFILLER'::character varying, 'GUEST'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: floors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.floors ALTER COLUMN id SET DEFAULT nextval('public.floors_id_seq'::regclass);


--
-- Name: hotels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotels ALTER COLUMN id SET DEFAULT nextval('public.hotels_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: floors floors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_pkey PRIMARY KEY (id);


--
-- Name: hotels hotels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotels
    ADD CONSTRAINT hotels_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: floors uk_hotel_floor_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT uk_hotel_floor_number UNIQUE (hotel_id, floor_number);


--
-- Name: rooms uk_hotel_room_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT uk_hotel_room_number UNIQUE (hotel_id, room_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_floor_hotel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_floor_hotel ON public.floors USING btree (hotel_id);


--
-- Name: idx_hotel_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_hotel_slug ON public.hotels USING btree (slug);


--
-- Name: idx_room_hotel_floor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_hotel_floor ON public.rooms USING btree (hotel_id, floor);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_email ON public.users USING btree (email);


--
-- Name: idx_user_hotel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_hotel_id ON public.users USING btree (hotel_id);


--
-- Name: idx_user_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_role ON public.users USING btree (role);


--
-- Name: floors fk_floors_hotel; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT fk_floors_hotel FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- Name: rooms fk_rooms_hotel; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- Name: users fk_users_hotel; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_hotel FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict sqisDO0unrDWYVoCds9eoQa4CVQAJes2faJrckXU6aSTnrwdSrmbePqzZ5oUUea

