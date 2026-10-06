-- Le superuser « postgres » ne sert qu'à l'init.
-- L'application se connecte avec « nizios », qui n'est pas superuser :
-- FORCE ROW LEVEL SECURITY s'applique alors vraiment.
CREATE USER nizios WITH PASSWORD 'nizios' NOSUPERUSER NOBYPASSRLS LOGIN;
GRANT ALL PRIVILEGES ON DATABASE nizios TO nizios;
ALTER DATABASE nizios OWNER TO nizios;
GRANT ALL ON SCHEMA public TO nizios;
ALTER SCHEMA public OWNER TO nizios;
