"""Comprobacion estructural de las migraciones. NO es un Postgres.

Aqui no hay Docker ni psql, asi que el esquema no se ha ejecutado nunca. Esto
no lo sustituye: busca los fallos que mas veces rompen una migracion de
Supabase y que se ven leyendo el texto.

  1. RLS activado sin ninguna politica  -> la tabla queda negada para todos,
     incluido su dueno. Es el fallo mas facil de cometer y el mas silencioso.
  2. Politica o clave ajena contra una tabla que no existe.
  3. Nombre de politica repetido en la misma tabla (Postgres lo rechaza).
  4. security definer sin "set search_path"  -> agujero de escalada conocido.
  5. Tabla con user_id cuya politica no menciona auth.uid().
  6. Parentesis o comillas sin cerrar.

Sale con 1 si encuentra algo. Uso:
    python -I tools/check_schema.py supabase/migrations/*.sql
"""
import glob
import re
import sys

ALLOWED_EXTERNAL = {"auth.users", "users"}


def strip_sql(text):
    """Quita comentarios y cuerpos $$...$$ para no analizar plpgsql como DDL."""
    text = re.sub(r"--[^\n]*", "", text)
    bodies = re.findall(r"\$\$.*?\$\$", text, re.S)
    text = re.sub(r"\$\$.*?\$\$", " $BODY$ ", text, flags=re.S)
    return text, bodies


def main():
    paths = []
    for a in sys.argv[1:]:
        paths.extend(sorted(glob.glob(a)))
    if not paths:
        paths = sorted(glob.glob("supabase/migrations/*.sql"))
    if not paths:
        sys.exit("no encuentro migraciones")

    raw = ""
    for p in paths:
        with open(p, encoding="utf-8") as fh:
            raw += "\n" + fh.read()
    sql, bodies = strip_sql(raw)

    fallos = []

    tables = set(re.findall(r"create table (?:if not exists )?(\w+)", sql))
    rls = set(re.findall(r"alter table\s+(\w+)\s+enable row level security", sql))
    pols = re.findall(r"create policy (\w+) on (\w+)", sql)

    por_tabla = {}
    for name, table in pols:
        por_tabla.setdefault(table, []).append(name)

    for t in sorted(rls):
        if t not in por_tabla:
            fallos.append(f"{t}: RLS activado y SIN politicas -> nadie podra leerla")
    for t, names in por_tabla.items():
        if t not in tables:
            fallos.append(f"politica sobre tabla inexistente: {t}")
        if len(names) != len(set(names)):
            dup = [n for n in set(names) if names.count(n) > 1]
            fallos.append(f"{t}: nombre de politica repetido: {', '.join(dup)}")

    for ref in set(re.findall(r"references\s+([\w.]+)\s*\(", sql)):
        if ref not in tables and ref not in ALLOWED_EXTERNAL:
            fallos.append(f"clave ajena a tabla inexistente: {ref}")

    # security definer sin search_path fijado
    for m in re.finditer(r"create (?:or replace )?function\s+(\w+)[^;]*?language\s+\w+([^;]*?)as\s+\$BODY\$", sql, re.S | re.I):
        nombre, cabecera = m.group(1), m.group(2)
        if "security definer" in cabecera.lower() and "search_path" not in cabecera.lower():
            fallos.append(f"funcion {nombre}: security definer SIN set search_path")

    # tablas con user_id cuya politica no usa auth.uid()
    for t in sorted(tables):
        cuerpo = re.search(r"create table (?:if not exists )?" + t + r"\s*\((.*?)\n\);", sql, re.S)
        if not cuerpo or "user_id" not in cuerpo.group(1):
            continue
        texto_pols = " ".join(
            m.group(0)
            for m in re.finditer(r"create policy \w+ on " + t + r"\b.*?;", sql, re.S)
        )
        if texto_pols and "auth.uid()" not in texto_pols:
            fallos.append(f"{t}: tiene user_id pero su politica no menciona auth.uid()")

    if sql.count("(") != sql.count(")"):
        fallos.append(f"parentesis descuadrados: {sql.count('(')} abren, {sql.count(')')} cierran")
    if (raw.count("'") - raw.count("''") * 2) % 2 != 0:
        fallos.append("comillas simples impares: puede haber una cadena sin cerrar")

    print(f"ficheros: {len(paths)} | tablas: {len(tables)} | politicas: {len(pols)} "
          f"| funciones con cuerpo: {len(bodies)}")
    if fallos:
        print(f"PROBLEMAS: {len(fallos)}")
        for f in fallos:
            print("  -", f)
        sys.exit(1)
    print("sin problemas estructurales")
    print("OJO: esto NO es un Postgres. La prueba de verdad es 'supabase db push'.")


if __name__ == "__main__":
    main()
