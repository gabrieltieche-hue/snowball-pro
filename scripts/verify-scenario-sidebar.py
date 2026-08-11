#!/usr/bin/env python3
"""Vérification v6.4.1 : le « Scénario de rendement » vit dans la sidebar
(« Votre épargne ») et le héro ouvre la vue sans sélecteur."""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
errors = []


def check(label, cond, detail=""):
    status = "OK " if cond else "FAIL"
    print(f"[{status}] {label}" + (f" — {detail}" if detail else ""))
    if not cond:
        errors.append(label)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    console_errors = []
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    page.goto(f"{BASE}/#/app", wait_until="networkidle")
    page.wait_for_timeout(800)

    hero = page.get_by_label("Résultat principal de la projection")
    check("héro présent en premier dans l'onglet Projection", hero.count() == 1)

    # Le sélecteur n'est plus dans le main (l'onglet) : il est dans la sidebar.
    main = page.locator("main")
    check(
        "« Scénario de rendement » absent de l'onglet Projection (main)",
        main.get_by_text("Scénario de rendement").count() == 0,
    )
    sidebar = page.locator("aside")
    check(
        "« Scénario de rendement » présent dans la sidebar",
        sidebar.get_by_text("Scénario de rendement").count() >= 1,
    )

    # Les 3 scénarios avec leurs taux dans la section « Votre épargne ».
    section = page.get_by_text("Votre épargne", exact=True).locator("xpath=ancestor::*[contains(@class,'mb-5')][1]")
    for label, rate in [("Prudent", "5,99 %"), ("Central", "8,22 %"), ("Optimiste", "10,07 %")]:
        btn = section.get_by_role("button", name=label)
        check(f"scénario {label} présent avec {rate}/an", btn.count() == 1 and rate in btn.inner_text())

    check("scénario Central sélectionné par défaut", "Central" in section.inner_text())

    # Bandeau médiane visible au défaut (Central) puis disparition en Optimiste.
    note = "médiane historique"
    check("bandeau « médiane historique » visible (défaut Central)", note in sidebar.inner_text())

    hero_before = hero.inner_text()
    page.get_by_role("button", name="Optimiste").first.click()
    page.wait_for_timeout(600)
    hero_after = hero.inner_text()
    check("cliquer Optimiste change la projection", hero_before != hero_after)
    check("bandeau « médiane historique » masqué en Optimiste", note not in sidebar.inner_text())

    # Retour Central : bandeau restauré + résultat identique au départ.
    page.get_by_role("button", name="Central").first.click()
    page.wait_for_timeout(600)
    check("retour Central restaure le bandeau", note in sidebar.inner_text())
    check("retour Central restaure la projection", hero.inner_text() == hero_before)

    page.screenshot(path="/tmp/scenario-sidebar-desktop.png", full_page=False)

    # Mobile : pas de débordement horizontal.
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(500)
    overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    check("aucun débordement horizontal mobile (390 px)", not overflow)
    page.screenshot(path="/tmp/scenario-sidebar-mobile.png", full_page=False)

    check("zéro erreur console", len(console_errors) == 0, "; ".join(console_errors[:5]))
    browser.close()

print("\n" + ("✅ VÉRIFICATION OK" if not errors else f"❌ {len(errors)} ÉCHEC(S): {errors}"))
sys.exit(1 if errors else 0)
