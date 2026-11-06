-- Profili impresa
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_impresa text NOT NULL DEFAULT '' CHECK (char_length(nome_impresa) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ogni impresa vede il proprio profilo" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Ogni impresa crea il proprio profilo" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Ogni impresa aggiorna il proprio profilo" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Interventi di pulizia
CREATE TABLE public.interventi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  appartamento text NOT NULL CHECK (char_length(trim(appartamento)) BETWEEN 1 AND 120),
  data date NOT NULL,
  prezzo numeric(10,2) NOT NULL DEFAULT 0 CHECK (prezzo >= 0),
  ore_previste numeric(8,2) NOT NULL DEFAULT 0 CHECK (ore_previste >= 0),
  costo_orario numeric(10,2) NOT NULL DEFAULT 0 CHECK (costo_orario >= 0),
  lavanderia_prevista numeric(10,2) NOT NULL DEFAULT 0 CHECK (lavanderia_prevista >= 0),
  materiali_previsti numeric(10,2) NOT NULL DEFAULT 0 CHECK (materiali_previsti >= 0),
  trasporto_previsto numeric(10,2) NOT NULL DEFAULT 0 CHECK (trasporto_previsto >= 0),
  altri_previsti numeric(10,2) NOT NULL DEFAULT 0 CHECK (altri_previsti >= 0),
  consuntivo_registrato boolean NOT NULL DEFAULT false,
  ore_effettive numeric(8,2) CHECK (ore_effettive IS NULL OR ore_effettive >= 0),
  costo_orario_effettivo numeric(10,2) CHECK (costo_orario_effettivo IS NULL OR costo_orario_effettivo >= 0),
  lavanderia_effettiva numeric(10,2) CHECK (lavanderia_effettiva IS NULL OR lavanderia_effettiva >= 0),
  materiali_effettivi numeric(10,2) CHECK (materiali_effettivi IS NULL OR materiali_effettivi >= 0),
  trasporto_effettivo numeric(10,2) CHECK (trasporto_effettivo IS NULL OR trasporto_effettivo >= 0),
  altri_effettivi numeric(10,2) CHECK (altri_effettivi IS NULL OR altri_effettivi >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX interventi_user_data_idx ON public.interventi (user_id, data DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interventi TO authenticated;
GRANT ALL ON public.interventi TO service_role;

ALTER TABLE public.interventi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ogni impresa vede i propri interventi" ON public.interventi
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Ogni impresa crea i propri interventi" ON public.interventi
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Ogni impresa modifica i propri interventi" ON public.interventi
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Ogni impresa elimina i propri interventi" ON public.interventi
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Aggiornamento automatico di updated_at
CREATE OR REPLACE FUNCTION public.imposta_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER interventi_updated_at BEFORE UPDATE ON public.interventi
  FOR EACH ROW EXECUTE FUNCTION public.imposta_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.imposta_updated_at();

-- Impedisce di spostare un intervento a un'altra impresa
CREATE OR REPLACE FUNCTION public.blocca_cambio_proprietario()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Non è possibile cambiare il proprietario di un intervento';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER interventi_blocca_proprietario BEFORE UPDATE ON public.interventi
  FOR EACH ROW EXECUTE FUNCTION public.blocca_cambio_proprietario();

-- Creazione automatica del profilo alla registrazione
CREATE OR REPLACE FUNCTION public.crea_profilo_impresa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_impresa)
  VALUES (
    NEW.id,
    left(coalesce(nullif(trim(NEW.raw_user_meta_data->>'nome_impresa'), ''), NEW.raw_user_meta_data->>'full_name', ''), 120)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crea_profilo_impresa() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.crea_profilo_impresa();