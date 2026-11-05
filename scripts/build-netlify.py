#!/usr/bin/env python3
"""Build Kizuna using only Python/Node standard libraries; no secrets or DB writes.

The editable application is in dist/ and src/. The media archives are expanded
into public/, the ONLY directory published on Netlify. The advanced original
build toolchain is retained separately in maintenance-originale.zip.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
import zipfile
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'dist'
OUTPUT = ROOT / 'public'
MEDIA = ROOT / 'medias'


def site_origin() -> str:
    """Use the production URL even in deploy previews (PKCE stays same-origin)."""
    value = (os.environ.get('KIZUNA_SITE_URL') or os.environ.get('URL') or '').strip()
    if not value:
        return ''
    url = urlsplit(value)
    if (url.scheme != 'https' or not url.hostname or url.username or url.password
            or url.path not in ('', '/') or url.query or url.fragment):
        raise ValueError('KIZUNA_SITE_URL / URL doit etre une origine HTTPS, sans chemin : https://nom.netlify.app')
    return f'{url.scheme}://{url.netloc}'


def extract_media() -> int:
    manifest = json.loads((MEDIA / 'manifest.json').read_text(encoding='utf-8'))
    if manifest.get('format') != 1:
        raise ValueError('Format de medias non reconnu.')
    seen: set[str] = set()
    for pack in manifest['packs']:
        name = pack['file']
        if Path(name).name != name or not re.fullmatch(r'medias-\d{2}\.zip', name):
            raise ValueError('Nom de lot invalide.')
        archive = MEDIA / name
        if not archive.is_file():
            raise FileNotFoundError(f'Il manque medias/{name}. Ajouter tous les lots sur GitHub.')
        if hashlib.sha256(archive.read_bytes()).hexdigest() != pack['sha256']:
            raise ValueError(f'{name} est incomplet ou a change. Remettre le lot original ou actualiser son SHA-256 dans manifest.json.')
        count = 0
        with zipfile.ZipFile(archive) as z:
            for entry in z.infolist():
                if entry.is_dir():
                    continue
                member = PurePosixPath(entry.filename)
                if (member.is_absolute() or '..' in member.parts or '\\' in entry.filename
                        or not member.parts or member.parts[0] != 'assets'
                        or stat.S_ISLNK(entry.external_attr >> 16)):
                    raise ValueError(f'Chemin de media non autorise : {entry.filename}')
                if entry.filename in seen or entry.file_size > 50 * 1024 * 1024:
                    raise ValueError(f'Media duplique ou trop volumineux : {entry.filename}')
                seen.add(entry.filename)
                destination = OUTPUT.joinpath(*member.parts)
                destination.parent.mkdir(parents=True, exist_ok=True)
                # Reading to EOF verifies ZIP CRCs as well as the pack SHA-256.
                with z.open(entry) as source, destination.open('wb') as target:
                    shutil.copyfileobj(source, target)
                count += 1
        if count != pack['files']:
            raise ValueError(f'Nombre de fichiers incorrect dans {name}.')
        print(f'  {name}: {count} fichiers', flush=True)
    if len(seen) != manifest['asset_count']:
        raise ValueError('Le nombre total de medias est incorrect.')
    return len(seen)


class PageReferences(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        attribute = 'src' if tag in ('script', 'img', 'audio', 'video', 'source') else 'href' if tag == 'link' else None
        if attribute and data.get(attribute):
            self.references.append(data[attribute])


def check_reference(reference: str, parent: Path) -> str | None:
    url = urlsplit(reference.strip())
    if url.scheme or url.netloc or not url.path:
        return None
    path = unquote(url.path)
    target = (OUTPUT / path.lstrip('/')) if path.startswith('/') else (parent / path)
    if not target.resolve().is_relative_to(OUTPUT.resolve()) or not target.is_file():
        return reference
    return None


def validate_output() -> int:
    page = OUTPUT / 'index.html'
    if not page.is_file():
        raise FileNotFoundError('dist/index.html est absent. Le contenu du ZIP doit etre a la racine du depot.')
    parser = PageReferences()
    parser.feed(page.read_text(encoding='utf-8'))
    missing = [ref for ref in parser.references if check_reference(ref, OUTPUT)]
    for css in OUTPUT.rglob('*.css'):
        for match in re.finditer(r'url\(\s*([\'"]?)(.*?)\1\s*\)', css.read_text(encoding='utf-8'), re.I):
            ref = match.group(2)
            if check_reference(ref, css.parent):
                missing.append(str(css.relative_to(OUTPUT)) + ' -> ' + ref)
    if missing:
        raise FileNotFoundError('Fichiers locaux manquants :\n' + '\n'.join(sorted(set(missing))[:30]))
    return sum(p.is_file() for p in OUTPUT.rglob('*'))


def main() -> None:
    if not SOURCE.is_dir():
        raise FileNotFoundError('Le dossier dist/ est absent.')
    for path in SOURCE.rglob('*'):
        if path.is_symlink():
            raise ValueError('Les liens symboliques ne sont pas admis dans dist/.')
    origin = site_origin()
    for script in ('sync-game-bridge.mjs', 'sync-feature-views.mjs'):
        subprocess.run(['node', str(ROOT / 'scripts' / script)], cwd=ROOT, check=True)
    if OUTPUT.exists():
        if OUTPUT.is_symlink():
            raise ValueError('public/ ne doit pas etre un lien symbolique.')
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    print('Reconstruction des medias...', flush=True)
    assets = extract_media()
    # Explicit editable media in dist/assets/ override archived copies.
    shutil.copytree(SOURCE, OUTPUT, dirs_exist_ok=True)
    config_file = OUTPUT / 'kizuna-config.js'
    content = config_file.read_text(encoding='utf-8')
    replacement = 'const configuredOrigin = ' + json.dumps(origin) + '; // KIZUNA_NETLIFY_ORIGIN'
    content, changed = re.subn(r'const configuredOrigin = .*?; // KIZUNA_NETLIFY_ORIGIN', lambda _: replacement, content)
    if changed != 1:
        raise ValueError('Marqueur de configuration Netlify introuvable dans dist/kizuna-config.js.')
    config_file.write_text(content, encoding='utf-8')
    files = validate_output()
    print(f'Build termine : {files} fichiers publies, dont {assets} medias archives.', flush=True)
    print('Dossier a publier : public', flush=True)
    print('Aucune base de donnees ni fonction distante n\'a ete modifiee.', flush=True)
    if origin:
        print(f'Connexion Discord : autoriser {origin}/?auth=discord dans Supabase.', flush=True)
        print('Configurer aussi KIZUNA_ALLOWED_ORIGINS et publier les fonctions Supabase adaptees (voir README).', flush=True)
    else:
        print('Sans URL de production : le navigateur utilise sa propre origine.', flush=True)


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, zipfile.BadZipFile, subprocess.CalledProcessError) as exc:
        print(f'ECHEC DU BUILD : {exc}', file=sys.stderr)
        sys.exit(1)
