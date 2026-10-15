#!/usr/bin/env python3
"""Apply the shared SENZ header, footer and head assets to every public page.

Run from the repository root after changing navigation or footer links:

    python3 tools/sync-chrome.py

Pages keep their own content. The header and footer live between marker comments
(<!-- sz:header --> … <!-- /sz:header -->), so the script is safe to run repeatedly.
music.html is excluded: it is a separate SENZ Music microsite with its own layout.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARTNER_APP = "https://partnership.senzpr.com/"  # DNS/TLS not verified from this repository.
EXCLUDE = {"music.html", "services.html", "digital-products.html"}  # redirect stubs stay minimal
NAV = [
    ("index.html", "Home"),
    ("solutions.html", "Solutions"),
    ("work.html", "Work &amp; Demos"),
    ("partners.html", "Partners"),
    ("about.html", "About"),
    ("contact.html", "Contact"),
]
# Pages that belong under a primary navigation item.
SECTION = {
    "services.html": "solutions.html",
    "strategic-communications-philippines.html": "solutions.html",
    "public-relations-philippines.html": "solutions.html",
    "website-strategy-philippines.html": "solutions.html",
    "brand-strategy-philippines.html": "solutions.html",
    "personal-branding-philippines.html": "solutions.html",
    "pageant-pr-philippines.html": "solutions.html",
    "digital-products.html": "work.html",
}

BRAND = (
    '<a class="sz-brand" href="index.html" aria-label="SENZ home">'
    '<img src="assets/senz-original-mark.png" width="282" height="360" alt="">'
    '<span class="sz-brand-name">SENZ<small>Strategic Communications &amp; Digital Solutions</small></span></a>'
)


def header(page: str) -> str:
    current = SECTION.get(page, page)
    links = "".join(
        f'<li><a href="{href}"{" aria-current=\"page\"" if href == current else ""}>{label}</a></li>'
        for href, label in NAV
    )
    return (
        "<!-- sz:header -->\n"
        '<a class="sz-skip" href="#main">Skip to content</a>\n'
        '<header class="sz-header"><div class="sz-header-row">' + BRAND +
        '<button class="sz-menu-button" type="button" aria-expanded="false" aria-controls="sz-nav">Menu</button>'
        '<nav class="sz-nav" id="sz-nav" aria-label="Main navigation"><ul class="sz-nav-links">' + links + '</ul>'
        '<a class="sz-cta" href="contact.html">Discuss Your Project</a></nav></div></header>\n'
        "<!-- /sz:header -->"
    )


FOOTER = (
    "<!-- sz:footer -->\n"
    '<footer class="sz-footer"><div class="sz-footer-grid">'
    "<div>" + BRAND +
    "<p>Strategic communications, digital products, and creative execution for businesses ready to move forward.</p>"
    "<p>Influence Through Clarity</p></div>"
    '<div><h2>For businesses</h2><ul><li><a href="solutions.html">Solutions</a></li><li><a href="work.html">Work &amp; Demos</a></li>'
    '<li><a href="contact.html">Discuss your project</a></li><li><a href="faq.html">FAQ</a></li><li><a href="answers.html">SENZ Answers</a></li></ul></div>'
    '<div><h2>For partners</h2><ul><li><a href="partners.html">Partner program</a></li><li><a href="contact.html?type=partner">Request partner access</a></li>'
    f'<li><a href="{PARTNER_APP}workspace">Partner sign-in</a></li></ul></div>'
    '<div><h2>Company</h2><ul><li><a href="about.html">About</a></li><li><a href="careers.html">Creative Network</a></li>'
    '<li><a href="mailto:info.senz.pr@gmail.com">info.senz.pr@gmail.com</a></li><li><a href="privacy.html">Privacy notice</a></li><li><a href="terms.html">Website terms</a></li></ul></div>'
    '</div><div class="sz-footer-base"><span>© 2026 SENZ Strategic Communications and Digital Solutions · BGC / Taguig, Philippines</span>'
    '<span><a href="https://www.instagram.com/senz.pr">Instagram</a> · <a href="https://www.facebook.com/share/1BM7Etwi9R/">Facebook</a> · <a href="https://www.tiktok.com/@senz.pr">TikTok</a></span></div></footer>\n'
    "<!-- /sz:footer -->"
)

HEAD_ASSETS = (
    "<!-- sz:head -->"
    "<script>document.documentElement.classList.add('js')</script>"
    '<link rel="stylesheet" href="components/senz-chrome.css?v=20261015">'
    "<!-- /sz:head -->"
)
SCRIPT = '<!-- sz:script --><script src="components/senz-nav.js?v=20261015" defer></script><!-- /sz:script -->'


def replace_block(html: str, name: str, block: str, fallback: str, anchor: str) -> str:
    marked = re.compile(rf"<!-- sz:{name} -->.*?<!-- /sz:{name} -->", re.S)
    if marked.search(html):
        return marked.sub(lambda _: block, html, count=1)
    legacy = re.compile(fallback, re.S)
    if legacy.search(html):
        return legacy.sub(lambda _: block, html, count=1)
    if anchor.startswith("<body"):
        return html.replace(anchor, anchor + "\n" + block, 1)
    return html.replace(anchor, block + "\n" + anchor, 1)


def apply(path: pathlib.Path) -> bool:
    html = path.read_text(encoding="utf-8")
    original = html
    body_tag = re.search(r"<body[^>]*>", html).group(0)
    html = replace_block(html, "header", header(path.name), r"<header\b.*?</header>", body_tag)
    html = replace_block(html, "footer", FOOTER, r"<footer\b.*?</footer>", "</body>")
    html = replace_block(html, "head", HEAD_ASSETS, r"(?!x)x", "</head>")
    html = replace_block(html, "script", SCRIPT, r"(?!x)x", "</body>")
    # Content pages need a main landmark target for the skip link.
    if 'id="main"' not in html:
        html = re.sub(r"<main(?![^>]*\bid=)", '<main id="main"', html, count=1)
    if html != original:
        path.write_text(html, encoding="utf-8")
        return True
    return False


if __name__ == "__main__":
    changed = [p.name for p in sorted(ROOT.glob("*.html")) if p.name not in EXCLUDE and apply(p)]
    print("updated:", ", ".join(changed) or "nothing")
