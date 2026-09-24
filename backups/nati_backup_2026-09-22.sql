--
-- PostgreSQL database dump
--

\restrict JZgxphupAYUFRAgngRbNBSXsTDa3g9ikOgb00XWCBT2z6eM24GluFfUtilnMlRz

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

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

--
-- Name: JobStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."JobStatus" AS ENUM (
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_FOR_PARTS',
    'READY_FOR_PICKUP',
    'COMPLETED',
    'NOT_REPAIRABLE',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."JobStatus" OWNER TO postgres;

--
-- Name: MovementType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MovementType" AS ENUM (
    'SALE',
    'REPAIR_USAGE',
    'PURCHASE',
    'ADJUSTMENT',
    'RETURN',
    'INITIAL_STOCK'
);


ALTER TYPE public."MovementType" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'BANK_TRANSFER',
    'MOBILE_MONEY',
    'CREDIT',
    'OTHER'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'UNPAID',
    'PARTIALLY_PAID',
    'PAID'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."Priority" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'OWNER',
    'CASHIER',
    'TECHNICIAN'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: ActivityLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ActivityLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    module text NOT NULL,
    "recordId" text,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ActivityLog" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Customer" OWNER TO postgres;

--
-- Name: Expense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    amount numeric(10,2) NOT NULL,
    "employeeId" text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text,
    "receiptUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Expense" OWNER TO postgres;

--
-- Name: InventoryMovement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InventoryMovement" (
    id text NOT NULL,
    "productId" text NOT NULL,
    type public."MovementType" NOT NULL,
    quantity integer NOT NULL,
    "referenceId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL,
    "supplierId" text
);


ALTER TABLE public."InventoryMovement" OWNER TO postgres;

--
-- Name: Job; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Job" (
    id text NOT NULL,
    "jobNumber" text NOT NULL,
    "customerId" text NOT NULL,
    "technicianId" text,
    "createdById" text NOT NULL,
    "deviceType" text NOT NULL,
    "deviceModel" text,
    "serialNumber" text,
    problem text NOT NULL,
    diagnosis text,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    status public."JobStatus" DEFAULT 'PENDING'::public."JobStatus" NOT NULL,
    "laborCharge" numeric(10,2) DEFAULT 0 NOT NULL,
    "partsCharge" numeric(10,2) DEFAULT 0 NOT NULL,
    "additionalCharge" numeric(10,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    "paidAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "remainingAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod",
    notes text,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Job" OWNER TO postgres;

--
-- Name: JobItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."JobItem" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "productId" text,
    name text NOT NULL,
    quantity integer NOT NULL,
    "unitCost" numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."JobItem" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "paymentNumber" text NOT NULL,
    "customerId" text,
    "saleId" text,
    "jobId" text,
    "receivedById" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    method public."PaymentMethod" NOT NULL,
    reference text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    barcode text,
    "categoryId" text,
    "supplierId" text,
    "purchasePrice" numeric(10,2) DEFAULT 0 NOT NULL,
    "sellingPrice" numeric(10,2) DEFAULT 0 NOT NULL,
    "currentStock" integer DEFAULT 0 NOT NULL,
    "minimumStock" integer DEFAULT 0 NOT NULL,
    unit text DEFAULT 'pcs'::text NOT NULL,
    image text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: Sale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sale" (
    id text NOT NULL,
    "invoiceNumber" text NOT NULL,
    "customerId" text,
    "cashierId" text NOT NULL,
    status public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    tax numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    "paidAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "remainingAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "paymentMethod" public."PaymentMethod",
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Sale" OWNER TO postgres;

--
-- Name: SaleItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SaleItem" (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL
);


ALTER TABLE public."SaleItem" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Supplier" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Supplier" OWNER TO postgres;

--
-- Name: SyncQueue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SyncQueue" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    action text NOT NULL,
    data jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "lastError" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "syncedAt" timestamp(3) without time zone
);


ALTER TABLE public."SyncQueue" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text NOT NULL,
    role public."Role" DEFAULT 'TECHNICIAN'::public."Role" NOT NULL,
    phone text,
    address text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO postgres;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: ActivityLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ActivityLog" (id, "userId", action, module, "recordId", details, "createdAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, description, "createdAt", "updatedAt") FROM stdin;
cmu854sol0001totwapu6y246	Screens	\N	2026-09-19 08:43:51.475	2026-09-19 08:43:51.475
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Customer" (id, name, phone, email, address, notes, "createdAt", "updatedAt") FROM stdin;
cmu78w2e60000torvqx32e5ja	xy	0911564512	\N	\N	\N	2026-09-18 17:41:16.444	2026-09-18 17:41:16.444
cmu87xiep0000to0d159qfven	Zema	0945678456	\N	\N	\N	2026-09-19 10:02:10.403	2026-09-19 10:02:10.403
cmu88qfp90003to0dz94koqsg	zemas	44565454	\N	\N	\N	2026-09-19 10:24:39.931	2026-09-19 10:24:39.931
cmu8afxpk000cto0d7nq29guv	nifta	4578945	\N	\N	\N	2026-09-19 11:12:29.287	2026-09-19 11:12:29.287
cmu8mm08g0002to8b8utqyvlc	Zema	094576845	\N	\N	\N	2026-09-19 16:53:07.889	2026-09-19 16:53:07.889
cmu8nlf0t000bto8bq6zd6cp6	new	7845462	\N	\N	\N	2026-09-19 17:20:40.013	2026-09-19 17:20:40.013
cmu8ppfrk0000tova2ydapdyc	news	45612345	\N	\N	\N	2026-09-19 18:19:46.83	2026-09-19 18:19:46.83
cmu8q42k90007tova0yfrdh2x	tyyty	09451263	\N	\N	\N	2026-09-19 18:31:09.556	2026-09-19 18:31:09.556
cmu8r8s9r000gtova80g03usi	vbnm	456789	\N	\N	\N	2026-09-19 19:02:49.12	2026-09-19 19:02:49.12
cmua4zyqn0000tobzvwvlf7gf	hjkl	875298653	\N	\N	\N	2026-09-20 18:15:38.39	2026-09-20 18:15:38.39
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Expense" (id, name, category, amount, "employeeId", date, description, "receiptUrl", "createdAt", "updatedAt") FROM stdin;
cmu85ouog0006totw2u5faqxu	Office rent	Rent	25000.00	cmu6x9hq40000tobdapa0wj4k	2026-09-19 09:00:00	for 2 months	\N	2026-09-19 08:59:27.176	2026-09-19 08:59:27.176
cmu85q28n0008totwle8jw2mz	internet	Internet	2000.00	cmu6x9hq40000tobdapa0wj4k	2026-10-21 09:00:00	fiber	\N	2026-09-19 09:00:23.639	2026-09-19 09:00:23.639
\.


--
-- Data for Name: InventoryMovement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InventoryMovement" (id, "productId", type, quantity, "referenceId", notes, "createdAt", "createdBy", "supplierId") FROM stdin;
cmu86mgx9000etotw8ptvj2ll	cmu854wiy0004totwyhllvbf2	SALE	-5	cmu86mgpp000atotwmchf0hqi	Sale INV-09935340	2026-09-19 09:25:35.661	cmu6x9hq40000tobdapa0wj4k	\N
cmu8ug4xd0009toq9uvq7jmu4	cmu79151b0007torvwtmhi7hf	SALE	-4	cmu8ug4ub0005toq9hedbfyew	Sale INV-49950660	2026-09-19 20:32:30.962	cmu6x9hq50001tobdd1swpb4o	\N
\.


--
-- Data for Name: Job; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Job" (id, "jobNumber", "customerId", "technicianId", "createdById", "deviceType", "deviceModel", "serialNumber", problem, diagnosis, priority, status, "laborCharge", "partsCharge", "additionalCharge", discount, total, "paidAmount", "remainingAmount", "paymentStatus", "paymentMethod", notes, "startedAt", "completedAt", "createdAt", "updatedAt") FROM stdin;
cmu78w2iq0002torvq4jy6ht6	JOB-276578	cmu78w2e60000torvqx32e5ja	cmu6x9hq50002tobdjsfsp806	cmu6x9hq50001tobdd1swpb4o	Phone	samsung	\N	screen replacement		URGENT	DELIVERED	500.00	0.00	0.00	0.00	500.00	986.00	0.00	PAID	CASH	\N	2026-09-18 20:23:16.48	\N	2026-09-18 17:41:16.609	2026-09-18 20:29:18.084
cmu87xig70002to0dkvvbstu1	JOB-12130466	cmu87xiep0000to0d159qfven	\N	cmu6x9hq40000tobdapa0wj4k	Samsung	s24+	7789445612354	Screen damaged	\N	HIGH	PENDING	0.00	0.00	0.00	0.00	0.00	0.00	0.00	UNPAID	\N	\N	\N	\N	2026-09-19 10:02:10.471	2026-09-19 10:02:10.471
cmu8mh95v0001to8bbi8fq9a7	JOB-36566088	cmu88qfp90003to0dz94koqsg	\N	cmu6x9hq50001tobdd1swpb4o	smartphone	a24	7845654	screen damaged	\N	URGENT	PENDING	0.00	0.00	0.00	0.00	0.00	0.00	0.00	UNPAID	\N	\N	\N	\N	2026-09-19 16:49:26.095	2026-09-19 16:49:26.095
cmu8mm0960004to8bc7s3m5ww	JOB-787898	cmu8mm08g0002to8b8utqyvlc	cmu6x9hq50002tobdjsfsp806	cmu6x9hq50002tobdjsfsp806	Phone	Samsung A24	784512963	Screen damaged severely		URGENT	DELIVERED	7500.00	0.00	0.00	0.00	7500.00	150000.00	0.00	PAID	CASH	\N	2026-09-19 17:17:31.176	\N	2026-09-19 16:53:07.913	2026-09-19 17:18:45.511
cmu8nlf1r000dto8bhqq07rdi	JOB-440030	cmu8nlf0t000bto8bq6zd6cp6	cmu6x9hq50002tobdjsfsp806	cmu6x9hq50002tobdjsfsp806	Phone	a24	794532	screen		URGENT	DELIVERED	750.00	0.00	0.00	0.00	750.00	750.00	0.00	PAID	CASH	\N	2026-09-19 17:21:17.709	\N	2026-09-19 17:20:40.046	2026-09-19 17:21:47.347
cmu8q42n30009tovac7nhnqlg	JOB-669638	cmu8q42k90007tova0yfrdh2x	cmu8ma52k0000to54xjico9ch	cmu8ma52k0000to54xjico9ch	Desktop	aa	\N	cpu		URGENT	DELIVERED	24981.00	0.00	0.00	0.00	24981.00	25019.00	0.00	PAID	CASH	\N	2026-09-19 18:57:28.16	\N	2026-09-19 18:31:09.661	2026-09-19 18:58:33.122
cmu89s6u7000bto0dmoxu32s4	JOB-15241353	cmu87xiep0000to0d159qfven	\N	cmu6x9hq50001tobdd1swpb4o	sasmn	s24	7895215	screen damaged	\N	URGENT	DELIVERED	0.00	0.00	0.00	0.00	1500.00	1500.00	0.00	PAID	CASH	\N	\N	\N	2026-09-19 10:54:01.37	2026-09-19 20:11:02.351
cmu8tsww40001toq9teljb3su	JOB-48867224	cmu8mm08g0002to8b8utqyvlc	\N	cmu6x9hq50001tobdd1swpb4o	hp	s24	784512369	screen	\N	URGENT	DELIVERED	0.00	0.00	0.00	0.00	2000.00	2000.00	0.00	PAID	BANK_TRANSFER	\N	\N	\N	2026-09-19 20:14:27.431	2026-09-19 20:20:53.348
cmu8r8sb3000itovamhxp220r	JOB-569129	cmu8r8s9r000gtova80g03usi	cmu8ma52k0000to54xjico9ch	cmu8ma52k0000to54xjico9ch	Phone	hp	\N	screen		MEDIUM	DELIVERED	7500.00	0.00	0.00	0.00	7500.00	15000.00	0.00	PAID	CASH	\N	2026-09-19 19:03:11.1	\N	2026-09-19 19:02:49.164	2026-09-19 20:49:37.814
cmu8ppfsy0002tovas66gbi6k	JOB-986866	cmu8ppfrk0000tova2ydapdyc	cmu8ma52k0000to54xjico9ch	cmu8ma52k0000to54xjico9ch	Laptop	hp	784512369	keyboard		MEDIUM	DELIVERED	2000.00	0.00	0.00	0.00	2000.00	4000.00	0.00	PAID	CASH	\N	2026-09-19 18:21:31.289	\N	2026-09-19 18:19:46.88	2026-09-19 20:49:52.048
cmu88qfqf0005to0d0x99y9ny	JOB-479955	cmu88qfp90003to0dz94koqsg	cmu6x9hq50002tobdjsfsp806	cmu6x9hq50002tobdjsfsp806	Phone	a24	\N	screen		URGENT	DELIVERED	7500.00	0.00	0.00	0.00	7500.00	15000.00	0.00	PAID	MOBILE_MONEY	\N	2026-09-19 10:25:01.557	\N	2026-09-19 10:24:39.974	2026-09-19 20:50:00.106
cmua4zyzr0002tobzbkolpcf2	JOB-138519	cmua4zyqn0000tobzvwvlf7gf	cmu8ma52k0000to54xjico9ch	cmu8ma52k0000to54xjico9ch	Tablet	a24	\N	screeem	\N	MEDIUM	ASSIGNED	7500.00	0.00	0.00	0.00	7500.00	0.00	7500.00	UNPAID	CASH	\N	\N	\N	2026-09-20 18:15:38.668	2026-09-20 18:15:38.668
\.


--
-- Data for Name: JobItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."JobItem" (id, "jobId", "productId", name, quantity, "unitCost", total, "createdAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", title, message, type, read, "createdAt") FROM stdin;
cmu78w2l10006torvu41cfwuu	cmu6x9hq50002tobdjsfsp806	New Job Assigned	Job JOB-276578 has been assigned to you	JOB_ASSIGNED	f	2026-09-18 17:41:16.693
cmu88qfs20009to0d4xdbfmft	cmu6x9hq50002tobdjsfsp806	New Job Assigned	Job JOB-479955 has been assigned to you	JOB_ASSIGNED	f	2026-09-19 10:24:40.034
cmu8mm0ah0008to8brbqwgctm	cmu6x9hq50002tobdjsfsp806	New Job Assigned	Job JOB-787898 has been assigned to you	JOB_ASSIGNED	f	2026-09-19 16:53:07.961
cmu8nlf2b000hto8bzg9gk9ln	cmu6x9hq50002tobdjsfsp806	New Job Assigned	Job JOB-440030 has been assigned to you	JOB_ASSIGNED	f	2026-09-19 17:20:40.067
cmu8ppfub0006tova363pd8ae	cmu8ma52k0000to54xjico9ch	New Job Assigned	Job JOB-986866 has been assigned to you	JOB_ASSIGNED	f	2026-09-19 18:19:46.931
cmu8q42qy000dtova2m3pyjob	cmu8ma52k0000to54xjico9ch	New Job Assigned	Job JOB-669638 has been assigned to you	JOB_ASSIGNED	f	2026-09-19 18:31:09.802
cmu8r8set000mtovaqu7oz6wo	cmu8ma52k0000to54xjico9ch	New Job Assigned	Job JOB-569129 has been assigned to you	JOB_ASSIGNED	f	2026-09-19 19:02:49.3
cmua502580004tobz3nw92u2d	cmu8ma52k0000to54xjico9ch	New Job Assigned	Job JOB-138519 has been assigned to you	JOB_ASSIGNED	f	2026-09-20 18:15:42.747
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "paymentNumber", "customerId", "saleId", "jobId", "receivedById", amount, method, reference, notes, "createdAt") FROM stdin;
cmu78w2kb0004torvskcwub3g	PAY-53276665	cmu78w2e60000torvqx32e5ja	\N	cmu78w2iq0002torvq4jy6ht6	cmu6x9hq50001tobdd1swpb4o	486.00	CASH	\N	\N	2026-09-18 17:41:16.667
cmu7ew5960001toufbplhdqsu	PAY-63357814	cmu78w2e60000torvqx32e5ja	\N	cmu78w2iq0002torvq4jy6ht6	cmu6x9hq50002tobdjsfsp806	500.00	CASH	\N	\N	2026-09-18 20:29:17.816
cmu86mgxr000gtotwziqqibnw	PAY-09935677	cmu78w2e60000torvqx32e5ja	cmu86mgpp000atotwmchf0hqi	\N	cmu6x9hq40000tobdapa0wj4k	50000.00	BANK_TRANSFER	\N	\N	2026-09-19 09:25:35.679
cmu88qfrb0007to0djng4qigt	PAY-13480003	cmu88qfp90003to0dz94koqsg	\N	cmu88qfqf0005to0d0x99y9ny	cmu6x9hq50002tobdjsfsp806	7500.00	CASH	\N	\N	2026-09-19 10:24:40.007
cmu8mm09j0006to8bxba2zi7s	PAY-36787925	cmu8mm08g0002to8b8utqyvlc	\N	cmu8mm0960004to8bc7s3m5ww	cmu6x9hq50002tobdjsfsp806	75000.00	CASH	\N	\N	2026-09-19 16:53:07.928
cmu8niyae000ato8b4uqy4gb1	PAY-38324981	cmu8mm08g0002to8b8utqyvlc	\N	cmu8mm0960004to8bc7s3m5ww	cmu6x9hq50001tobdd1swpb4o	75000.00	CASH	\N	\N	2026-09-19 17:18:45.003
cmu8nlf23000fto8bmyp3ajbu	PAY-38440055	cmu8nlf0t000bto8bq6zd6cp6	\N	cmu8nlf1r000dto8bhqq07rdi	cmu6x9hq50002tobdjsfsp806	50.00	CASH	\N	\N	2026-09-19 17:20:40.059
cmu8nmuyx000jto8bdrmhupr3	PAY-38507335	cmu8nlf0t000bto8bq6zd6cp6	\N	cmu8nlf1r000dto8bhqq07rdi	cmu6x9hq50001tobdd1swpb4o	700.00	CASH	\N	\N	2026-09-19 17:21:47.337
cmu8ppftu0004tova7lahibje	PAY-41986913	cmu8ppfrk0000tova2ydapdyc	\N	cmu8ppfsy0002tovas66gbi6k	cmu8ma52k0000to54xjico9ch	2000.00	BANK_TRANSFER	\N	\N	2026-09-19 18:19:46.914
cmu8q42pm000btovag9z1re9l	PAY-42669751	cmu8q42k90007tova0yfrdh2x	\N	cmu8q42n30009tovac7nhnqlg	cmu8ma52k0000to54xjico9ch	25000.00	MOBILE_MONEY	\N	\N	2026-09-19 18:31:09.754
cmu8r3alh000ftovafhcfqkyw	PAY-44312799	cmu8q42k90007tova0yfrdh2x	\N	cmu8q42n30009tovac7nhnqlg	cmu6x9hq50001tobdd1swpb4o	19.00	CASH	\N	\N	2026-09-19 18:58:32.804
cmu8r8sbs000ktova0ks43kic	PAY-44569191	cmu8r8s9r000gtova80g03usi	\N	cmu8r8sb3000itovamhxp220r	cmu8ma52k0000to54xjico9ch	7500.00	CASH	\N	\N	2026-09-19 19:02:49.193
cmu8toikr000otovaqswzyvc4	PAY-48662264	cmu87xiep0000to0d159qfven	\N	cmu89s6u7000bto0dmoxu32s4	cmu6x9hq50001tobdd1swpb4o	1500.00	CASH	\N	\N	2026-09-19 20:11:02.268
cmu8u16mr0003toq9lk30m4o8	PAY-49253329	cmu8mm08g0002to8b8utqyvlc	\N	cmu8tsww40001toq9teljb3su	cmu6x9hq50001tobdd1swpb4o	2000.00	BANK_TRANSFER	\N	\N	2026-09-19 20:20:53.331
cmu8ug50y000btoq9vr8wk9ex	PAY-49951036	\N	cmu8ug4ub0005toq9hedbfyew	\N	cmu6x9hq50001tobdd1swpb4o	315940.00	BANK_TRANSFER	\N	\N	2026-09-19 20:32:31.039
cmu8v258i000dtoq9nd8gcrsr	PAY-50977791	cmu8r8s9r000gtova80g03usi	\N	cmu8r8sb3000itovamhxp220r	cmu6x9hq40000tobdapa0wj4k	7500.00	CASH	\N	\N	2026-09-19 20:49:37.793
cmu8v2g82000ftoq9y9vwwmht	PAY-50992032	cmu8ppfrk0000tova2ydapdyc	\N	cmu8ppfsy0002tovas66gbi6k	cmu6x9hq40000tobdapa0wj4k	2000.00	CASH	\N	\N	2026-09-19 20:49:52.034
cmu8v2mg1000htoq9p0lei9k1	PAY-51000095	cmu88qfp90003to0dz94koqsg	\N	cmu88qfqf0005to0d0x99y9ny	cmu6x9hq40000tobdapa0wj4k	7500.00	MOBILE_MONEY	\N	\N	2026-09-19 20:50:00.097
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, sku, barcode, "categoryId", "supplierId", "purchasePrice", "sellingPrice", "currentStock", "minimumStock", unit, image, description, "isActive", "createdAt", "updatedAt") FROM stdin;
cmu82l2j20000totw0vdbuucz	samsung	scr-899-98	\N	\N	\N	78522.00	100000.00	0	2	pcs	\N	\N	t	2026-09-19 07:32:31.883	2026-09-19 08:27:56.973
cmu854wiy0004totwyhllvbf2	iphone	scr-556-544	\N	cmu854sol0001totwapu6y246	cmu854st40002totwilpjv12v	8000.00	10000.00	0	0	pcs	\N	screen	t	2026-09-19 08:43:56.457	2026-09-19 09:25:35.631
cmu79151b0007torvwtmhi7hf	iphone	scr-9990-000	\N	\N	\N	45666.00	78985.00	2	2	pcs	\N	\N	t	2026-09-18 17:45:13.087	2026-09-19 20:34:43.383
\.


--
-- Data for Name: Sale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sale" (id, "invoiceNumber", "customerId", "cashierId", status, subtotal, discount, tax, total, "paidAmount", "remainingAmount", "paymentMethod", notes, "createdAt", "updatedAt") FROM stdin;
cmu86mgpp000atotwmchf0hqi	INV-09935340	cmu78w2e60000torvqx32e5ja	cmu6x9hq40000tobdapa0wj4k	PAID	50000.00	0.00	0.00	50000.00	50000.00	0.00	BANK_TRANSFER	\N	2026-09-19 09:25:35.38	2026-09-19 09:25:35.38
cmu8ug4ub0005toq9hedbfyew	INV-49950660	\N	cmu6x9hq50001tobdd1swpb4o	PAID	315940.00	0.00	0.00	315940.00	315940.00	0.00	BANK_TRANSFER	\N	2026-09-19 20:32:30.849	2026-09-19 20:32:30.849
\.


--
-- Data for Name: SaleItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SaleItem" (id, "saleId", "productId", quantity, "unitPrice", discount, total) FROM stdin;
cmu86mgu2000ctotwbigopm4z	cmu86mgpp000atotwmchf0hqi	cmu854wiy0004totwyhllvbf2	5	10000.00	0.00	50000.00
cmu8ug4w90007toq997v72e90	cmu8ug4ub0005toq9hedbfyew	cmu79151b0007torvwtmhi7hf	4	78985.00	0.00	315940.00
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Supplier" (id, name, phone, email, address, notes, "createdAt", "updatedAt") FROM stdin;
cmu854st40002totwilpjv12v	Bole parts ltd	\N	\N	\N	\N	2026-09-19 08:43:51.64	2026-09-19 08:43:51.64
\.


--
-- Data for Name: SyncQueue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SyncQueue" (id, "entityType", "entityId", action, data, status, "retryCount", "lastError", "createdAt", "syncedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, "emailVerified", image, password, role, phone, address, "isActive", "createdAt", "updatedAt") FROM stdin;
cmu6x9hq40000tobdapa0wj4k	Test Owner	manager@nati.com	\N	\N	$2a$10$hVg3.7gRHpfZywC0f4HNguZv0wGA7dhscFSqP3CRiXqjTyRII9iXe	OWNER	\N	\N	t	2026-09-18 12:15:47.453	2026-09-18 12:15:47.453
cmu6x9hq50001tobdd1swpb4o	Test Cashier	cashier@nati.com	\N	\N	$2a$10$hVg3.7gRHpfZywC0f4HNguZv0wGA7dhscFSqP3CRiXqjTyRII9iXe	CASHIER	\N	\N	t	2026-09-18 12:15:47.453	2026-09-18 12:15:47.453
cmu6x9hq50002tobdjsfsp806	Test Technician	tech@nati.com	\N	\N	$2a$10$hVg3.7gRHpfZywC0f4HNguZv0wGA7dhscFSqP3CRiXqjTyRII9iXe	TECHNICIAN	\N	\N	t	2026-09-18 12:15:47.453	2026-09-18 12:15:47.453
cmu8ma52k0000to54xjico9ch	Dawit Solomon	dawit@nati.com	\N	\N	$2a$10$hVg3.7gRHpfZywC0f4HNguZv0wGA7dhscFSqP3CRiXqjTyRII9iXe	TECHNICIAN	+251 911 234 501	\N	t	2026-09-19 16:43:54.284	2026-09-19 16:43:54.284
cmu8ma58n0001to546z8n3j06	Sara Hailu	sara@nati.com	\N	\N	$2a$10$hVg3.7gRHpfZywC0f4HNguZv0wGA7dhscFSqP3CRiXqjTyRII9iXe	TECHNICIAN	+251 911 234 502	\N	t	2026-09-19 16:43:54.503	2026-09-19 16:43:54.503
cmu8ma59y0002to541n63if29	Yonas Bekele	yonas@nati.com	\N	\N	$2a$10$hVg3.7gRHpfZywC0f4HNguZv0wGA7dhscFSqP3CRiXqjTyRII9iXe	TECHNICIAN	+251 911 234 503	\N	t	2026-09-19 16:43:54.55	2026-09-19 16:43:54.55
cmu8ma5f60003to54cot8yzqy	Hanna Girma	hanna@nati.com	\N	\N	$2a$10$hVg3.7gRHpfZywC0f4HNguZv0wGA7dhscFSqP3CRiXqjTyRII9iXe	TECHNICIAN	+251 911 234 504	\N	t	2026-09-19 16:43:54.739	2026-09-19 16:43:54.739
cmu8ma5gb0004to54n0ic6uj9	Abel Tesfaye	abel@nati.com	\N	\N	$2a$10$hVg3.7gRHpfZywC0f4HNguZv0wGA7dhscFSqP3CRiXqjTyRII9iXe	TECHNICIAN	+251 911 234 505	\N	t	2026-09-19 16:43:54.779	2026-09-22 08:27:30.221
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: ActivityLog ActivityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: InventoryMovement InventoryMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryMovement"
    ADD CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY (id);


--
-- Name: JobItem JobItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobItem"
    ADD CONSTRAINT "JobItem_pkey" PRIMARY KEY (id);


--
-- Name: Job Job_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: SaleItem SaleItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT "SaleItem_pkey" PRIMARY KEY (id);


--
-- Name: Sale Sale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: SyncQueue SyncQueue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SyncQueue"
    ADD CONSTRAINT "SyncQueue_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: ActivityLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActivityLog_createdAt_idx" ON public."ActivityLog" USING btree ("createdAt");


--
-- Name: ActivityLog_module_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActivityLog_module_idx" ON public."ActivityLog" USING btree (module);


--
-- Name: ActivityLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ActivityLog_userId_idx" ON public."ActivityLog" USING btree ("userId");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Customer_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customer_name_idx" ON public."Customer" USING btree (name);


--
-- Name: Customer_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customer_phone_idx" ON public."Customer" USING btree (phone);


--
-- Name: Expense_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Expense_category_idx" ON public."Expense" USING btree (category);


--
-- Name: Expense_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Expense_date_idx" ON public."Expense" USING btree (date);


--
-- Name: InventoryMovement_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InventoryMovement_createdAt_idx" ON public."InventoryMovement" USING btree ("createdAt");


--
-- Name: InventoryMovement_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InventoryMovement_productId_idx" ON public."InventoryMovement" USING btree ("productId");


--
-- Name: InventoryMovement_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InventoryMovement_type_idx" ON public."InventoryMovement" USING btree (type);


--
-- Name: JobItem_jobId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "JobItem_jobId_idx" ON public."JobItem" USING btree ("jobId");


--
-- Name: JobItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "JobItem_productId_idx" ON public."JobItem" USING btree ("productId");


--
-- Name: Job_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Job_createdAt_idx" ON public."Job" USING btree ("createdAt");


--
-- Name: Job_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Job_customerId_idx" ON public."Job" USING btree ("customerId");


--
-- Name: Job_jobNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Job_jobNumber_idx" ON public."Job" USING btree ("jobNumber");


--
-- Name: Job_jobNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Job_jobNumber_key" ON public."Job" USING btree ("jobNumber");


--
-- Name: Job_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Job_status_idx" ON public."Job" USING btree (status);


--
-- Name: Job_technicianId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Job_technicianId_idx" ON public."Job" USING btree ("technicianId");


--
-- Name: Notification_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_read_idx" ON public."Notification" USING btree (read);


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: Payment_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_createdAt_idx" ON public."Payment" USING btree ("createdAt");


--
-- Name: Payment_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_customerId_idx" ON public."Payment" USING btree ("customerId");


--
-- Name: Payment_jobId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_jobId_idx" ON public."Payment" USING btree ("jobId");


--
-- Name: Payment_paymentNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_paymentNumber_idx" ON public."Payment" USING btree ("paymentNumber");


--
-- Name: Payment_paymentNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON public."Payment" USING btree ("paymentNumber");


--
-- Name: Payment_saleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_saleId_idx" ON public."Payment" USING btree ("saleId");


--
-- Name: Product_barcode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_barcode_idx" ON public."Product" USING btree (barcode);


--
-- Name: Product_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_name_idx" ON public."Product" USING btree (name);


--
-- Name: Product_sku_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_sku_idx" ON public."Product" USING btree (sku);


--
-- Name: Product_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_sku_key" ON public."Product" USING btree (sku);


--
-- Name: SaleItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaleItem_productId_idx" ON public."SaleItem" USING btree ("productId");


--
-- Name: SaleItem_saleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaleItem_saleId_idx" ON public."SaleItem" USING btree ("saleId");


--
-- Name: Sale_cashierId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_cashierId_idx" ON public."Sale" USING btree ("cashierId");


--
-- Name: Sale_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_createdAt_idx" ON public."Sale" USING btree ("createdAt");


--
-- Name: Sale_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_customerId_idx" ON public."Sale" USING btree ("customerId");


--
-- Name: Sale_invoiceNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_invoiceNumber_idx" ON public."Sale" USING btree ("invoiceNumber");


--
-- Name: Sale_invoiceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON public."Sale" USING btree ("invoiceNumber");


--
-- Name: Sale_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_status_idx" ON public."Sale" USING btree (status);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Supplier_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Supplier_name_idx" ON public."Supplier" USING btree (name);


--
-- Name: SyncQueue_entityType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SyncQueue_entityType_idx" ON public."SyncQueue" USING btree ("entityType");


--
-- Name: SyncQueue_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SyncQueue_status_idx" ON public."SyncQueue" USING btree (status);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ActivityLog ActivityLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Expense Expense_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryMovement InventoryMovement_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryMovement"
    ADD CONSTRAINT "InventoryMovement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryMovement InventoryMovement_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryMovement"
    ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryMovement InventoryMovement_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryMovement"
    ADD CONSTRAINT "InventoryMovement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: JobItem JobItem_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobItem"
    ADD CONSTRAINT "JobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Job"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobItem JobItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobItem"
    ADD CONSTRAINT "JobItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Job Job_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Job Job_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Job Job_technicianId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Job"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_receivedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public."Sale"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SaleItem SaleItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SaleItem SaleItem_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public."Sale"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sale Sale_cashierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sale Sale_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict JZgxphupAYUFRAgngRbNBSXsTDa3g9ikOgb00XWCBT2z6eM24GluFfUtilnMlRz

